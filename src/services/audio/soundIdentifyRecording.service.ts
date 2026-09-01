/**
 * Identify-by-sound recording with live PCM for dynamic spectrogram (no Expo).
 * Recording PCM is prioritized over visualization — spectrogram work is bounded and droppable.
 */

import { NativeModules, Platform } from "react-native";
import LiveAudioStream from "react-native-live-audio-fft";
import {
  checkMicrophonePermission,
  requestMicrophonePermission,
} from "../permissions";
import {
  LIVE_SPECTROGRAM_SAMPLE_RATE,
  LiveMelSpectrogramEngine,
  decodePcmFromBase64,
  pcmDbFromSum,
} from "../../features/camera/utils/liveMelSpectrogram";
import { writePcmChunksToWavFile } from "../../features/camera/utils/writePcmWav";
import { soundRecordingService } from "./soundRecording.service";
import {
  MAX_SOUND_RECORDING_SECONDS,
  NOISE_HINT_DB_THRESHOLD,
  SPECTROGRAM_MAX_COLUMNS,
  SPECTROGRAM_UI_FPS,
  SPECTROGRAM_UI_FPS_ANDROID,
  maxPendingSpectrogramChunks,
  spectrogramVizBudgetMs,
} from "../../features/camera/constants/soundRecording.constants";
import { computeElapsedRecordingSeconds } from "../../features/camera/utils/recordingTimer";
import { logSoundRecord } from "../../features/camera/utils/soundRecordLog";
import {
  isSoundPerfEnabled,
  soundPerfNow,
  soundPerfRecordTiming,
  soundPerfReset,
} from "../../features/camera/utils/soundPerf";

const STREAM_OPTIONS = {
  sampleRate: LIVE_SPECTROGRAM_SAMPLE_RATE,
  channels: 1 as const,
  bitsPerSample: 16 as const,
  bufferSize: 4096,
  audioSource: 1,
};

export type SpectrogramListener = (version: number) => void;
export type MeteringListener = (db: number) => void;

type NativePcmModule = {
  finalizeWav?: (fileName: string) => Promise<string>;
  getRecordedSampleCount?: () => Promise<number>;
  resetRecordingBuffer?: () => void;
};

function hasLivePcmModule(): boolean {
  return Boolean(NativeModules.RNLiveAudioStream);
}

function getNativePcmModule(): NativePcmModule | null {
  return (NativeModules.RNLiveAudioStream as NativePcmModule | undefined) ?? null;
}

function hasNativePcmWavFinalize(): boolean {
  const native = getNativePcmModule();
  return Boolean(native?.finalizeWav && native?.getRecordedSampleCount);
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

class SoundIdentifyRecordingService {
  private recordingStartedAt: number | null = null;
  private pausedAt: number | null = null;
  private pausedAccumMs = 0;
  /** Full recording chunks — iOS / fallback JS path only. */
  private pcmChunks: Int16Array[] = [];
  private spectrogramEngine = new LiveMelSpectrogramEngine(SPECTROGRAM_MAX_COLUMNS);
  private onSpectrogram: SpectrogramListener | null = null;
  private onMetering: MeteringListener | null = null;
  private isActive = false;
  private isPausedState = false;
  private usingFallbackRecorder = false;
  private usingNativePcmCapture = false;
  private lastSpectrogramEmitMs = 0;
  private pcmDataHandler: ((pcmDataBase64: string) => void) | null = null;
  private spectrogramSubscribers = new Set<SpectrogramListener>();
  private pcmChunkCount = 0;
  private totalPcmSamples = 0;
  private vizQueue: Int16Array[] = [];
  private vizDrainScheduled = false;
  private droppedVizChunks = 0;
  private decodeReuseBuffer: Int16Array | null = null;
  private lastMeteringEmitMs = 0;
  private lastMeteringDb = -160;
  private lastMeteringNoisy: boolean | null = null;
  private spectrogramVersion = 0;

  get maxRecordingSeconds(): number {
    return MAX_SOUND_RECORDING_SECONDS;
  }

  usesLiveSpectrogram(): boolean {
    return hasLivePcmModule() && !this.usingFallbackRecorder;
  }

  isFallbackRecorderActive(): boolean {
    return this.usingFallbackRecorder;
  }

  isSessionActive(): boolean {
    return this.isActive || this.recordingStartedAt !== null;
  }

  isPaused(): boolean {
    return this.isPausedState;
  }

  setMeteringListener(listener: MeteringListener | null): void {
    this.onMetering = listener;
  }

  private get spectrogramUiFps(): number {
    return Platform.OS === "android" ? SPECTROGRAM_UI_FPS_ANDROID : SPECTROGRAM_UI_FPS;
  }

  private get maxVizQueue(): number {
    return maxPendingSpectrogramChunks();
  }

  private get vizBudgetMs(): number {
    return spectrogramVizBudgetMs();
  }

  private enqueueVizPcm(pcm: Int16Array): void {
    this.vizQueue.push(pcm);
    while (this.vizQueue.length > this.maxVizQueue) {
      this.vizQueue.shift();
      this.droppedVizChunks += 1;
    }
    this.scheduleVizDrain();
  }

  private scheduleVizDrain(): void {
    if (this.vizDrainScheduled) return;
    this.vizDrainScheduled = true;
    setImmediate(() => {
      this.vizDrainScheduled = false;
      this.drainVizQueue();
    });
  }

  private drainVizQueue(): void {
    if (!this.isActive || this.isPausedState) {
      this.vizQueue.length = 0;
      return;
    }
    if (this.vizQueue.length === 0) return;

    const perf = isSoundPerfEnabled();
    const flushStart = perf ? soundPerfNow() : 0;
    const deadline = Date.now() + this.vizBudgetMs;

    while (this.vizQueue.length > 0 && Date.now() < deadline) {
      const pcm = this.vizQueue.shift();
      if (pcm) {
        this.spectrogramEngine.pushPcm(pcm);
      }
    }

    if (perf) {
      soundPerfRecordTiming("SpectrogramProcessing", soundPerfNow() - flushStart);
    }

    this.emitSpectrogramUpdate();

    if (this.vizQueue.length > 0) {
      this.scheduleVizDrain();
    }
  }

  private emitMetering(db: number): void {
    const noisy = db > NOISE_HINT_DB_THRESHOLD;
    if (this.lastMeteringNoisy === noisy) {
      return;
    }
    const now = Date.now();
    if (now - this.lastMeteringEmitMs < 250) {
      return;
    }
    this.lastMeteringEmitMs = now;
    this.lastMeteringDb = db;
    this.lastMeteringNoisy = noisy;
    this.onMetering?.(db);
  }

  getSpectrogramColumnsView(): number[][] {
    return this.spectrogramEngine.getColumnsView();
  }

  getSpectrogramVersion(): number {
    return this.spectrogramVersion;
  }

  subscribeSpectrogram(listener: SpectrogramListener): () => void {
    this.spectrogramSubscribers.add(listener);
    listener(this.spectrogramVersion);
    return () => {
      this.spectrogramSubscribers.delete(listener);
    };
  }

  getSpectrogramColumns(): number[][] {
    const perf = isSoundPerfEnabled();
    const start = perf ? soundPerfNow() : 0;
    const columns = this.spectrogramEngine.getColumnsSnapshot();
    if (perf) {
      soundPerfRecordTiming("Snapshot", soundPerfNow() - start);
    }
    return columns;
  }

  private emitSpectrogramUpdate(force = false): void {
    const subscribers = [
      this.onSpectrogram,
      ...this.spectrogramSubscribers,
    ].filter(Boolean) as SpectrogramListener[];
    if (subscribers.length === 0) return;

    const now = Date.now();
    const emitIntervalMs = 1000 / this.spectrogramUiFps;
    if (!force && now - this.lastSpectrogramEmitMs < emitIntervalMs) {
      return;
    }
    this.lastSpectrogramEmitMs = now;
    this.spectrogramVersion += 1;

    const perf = isSoundPerfEnabled();
    const emitStart = perf ? soundPerfNow() : 0;
    for (const listener of subscribers) {
      listener(this.spectrogramVersion);
    }
    if (perf) {
      soundPerfRecordTiming("Subscription", soundPerfNow() - emitStart);
    }
  }

  private attachPcmListener(): void {
    this.pcmDataHandler = (pcmDataBase64: string) => {
      if (!this.isActive || this.isPausedState) return;

      const perf = isSoundPerfEnabled();
      const decodeStart = perf ? soundPerfNow() : 0;
      const { pcmData, sum } = decodePcmFromBase64(
        pcmDataBase64,
        this.decodeReuseBuffer ?? undefined
      );
      if (
        this.decodeReuseBuffer == null ||
        this.decodeReuseBuffer.length < pcmData.length
      ) {
        this.decodeReuseBuffer = new Int16Array(pcmData.length);
      }
      const pcmCopy = pcmData.slice();

      if (!this.usingNativePcmCapture) {
        this.pcmChunks.push(pcmCopy);
        this.totalPcmSamples += pcmCopy.length;
      }

      this.pcmChunkCount += 1;
      this.enqueueVizPcm(pcmCopy);
      this.emitMetering(pcmDbFromSum(sum, pcmCopy.length));

      if (perf) {
        soundPerfRecordTiming("PcmDecode", soundPerfNow() - decodeStart);
      }

      if (this.pcmChunkCount === 1 || this.pcmChunkCount % 25 === 0) {
        logSoundRecord("pcm chunk", {
          chunk: this.pcmChunkCount,
          samples: pcmCopy.length,
          db: this.lastMeteringDb,
          totalSamples: this.totalPcmSamples,
          nativeCapture: this.usingNativePcmCapture,
          vizQueue: this.vizQueue.length,
          droppedViz: this.droppedVizChunks,
        });
      }
    };
    LiveAudioStream.on("data", this.pcmDataHandler);
    logSoundRecord("pcm listener attached", {
      nativeCapture: this.usingNativePcmCapture,
    });
  }

  private async startLivePcmStream(): Promise<void> {
    logSoundRecord("startLivePcmStream", {
      platform: Platform.OS,
      nativeCapture: this.usingNativePcmCapture,
      ...STREAM_OPTIONS,
    });
    LiveAudioStream.init(STREAM_OPTIONS);
    getNativePcmModule()?.resetRecordingBuffer?.();
    this.attachPcmListener();
    LiveAudioStream.start();
    this.emitSpectrogramUpdate(true);
  }

  async ensureMicrophonePermission(): Promise<boolean> {
    const current = await checkMicrophonePermission();
    if (current.granted) return true;
    if (current.blocked) return false;
    const requested = await requestMicrophonePermission();
    return requested.granted;
  }

  async startRecording(
    onMetering?: MeteringListener,
    onSpectrogram?: SpectrogramListener
  ): Promise<void> {
    const allowed = await this.ensureMicrophonePermission();
    if (!allowed) {
      throw new Error("Microphone permission is required to record bird sounds.");
    }

    if (onMetering != null) {
      this.onMetering = onMetering;
    }
    if (onSpectrogram != null) {
      this.onSpectrogram = onSpectrogram;
    }
    if (isSoundPerfEnabled()) {
      soundPerfReset();
    }

    this.pcmChunks = [];
    this.vizQueue.length = 0;
    this.droppedVizChunks = 0;
    this.spectrogramEngine.reset();
    this.recordingStartedAt = Date.now();
    this.pausedAt = null;
    this.pausedAccumMs = 0;
    this.isActive = true;
    this.isPausedState = false;
    this.usingFallbackRecorder = false;
    this.usingNativePcmCapture =
      Platform.OS === "android" && hasNativePcmWavFinalize();

    if (!hasLivePcmModule()) {
      this.usingFallbackRecorder = true;
      this.usingNativePcmCapture = false;
      logSoundRecord("startRecording fallback (no RNLiveAudioStream)", {
        platform: Platform.OS,
      });
      await soundRecordingService.startRecording(onMetering);
      return;
    }

    logSoundRecord("startRecording live PCM", {
      platform: Platform.OS,
      nativeCapture: this.usingNativePcmCapture,
    });
    this.pcmChunkCount = 0;
    this.totalPcmSamples = 0;
    try {
      await this.startLivePcmStream();
    } catch (error) {
      logSoundRecord("startRecording failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      await this.safeStopLiveStream();
      this.resetSessionState();
      throw error;
    }
  }

  private resetSessionState(): void {
    this.vizQueue.length = 0;
    this.vizDrainScheduled = false;
    this.droppedVizChunks = 0;
    this.totalPcmSamples = 0;
    this.lastMeteringEmitMs = 0;
    this.lastMeteringDb = -160;
    this.lastMeteringNoisy = null;
    this.spectrogramVersion = 0;
    this.recordingStartedAt = null;
    this.pausedAt = null;
    this.pausedAccumMs = 0;
    this.isActive = false;
    this.isPausedState = false;
    this.usingFallbackRecorder = false;
    this.usingNativePcmCapture = false;
    this.pcmChunks = [];
    this.onMetering = null;
    this.onSpectrogram = null;
    this.pcmDataHandler = null;
    this.pcmChunkCount = 0;
    getNativePcmModule()?.resetRecordingBuffer?.();
    logSoundRecord("session reset");
  }

  /** Stop native PCM capture without finalizing WAV (fast — keeps UI responsive). */
  async stopNativeCapture(): Promise<void> {
    if (this.usingFallbackRecorder) {
      return;
    }
    await this.safeStopLiveStream();
    this.isActive = false;
    this.isPausedState = false;
    this.vizQueue.length = 0;
    this.vizDrainScheduled = false;
  }

  private async safeStopLiveStream(): Promise<void> {
    try {
      await LiveAudioStream.stop();
    } catch {
      // stream may already be stopped after pause
    }
  }

  async pauseRecording(): Promise<void> {
    if (this.pausedAt || !this.isActive) return;
    logSoundRecord("pauseRecording", {
      fallback: this.usingFallbackRecorder,
      elapsedSec: this.elapsedRecordingSeconds(),
      pcmChunks: this.pcmChunkCount,
    });
    if (this.usingFallbackRecorder) {
      await soundRecordingService.pauseRecording();
      this.pausedAt = Date.now();
      return;
    }
    this.isPausedState = true;
    this.pausedAt = Date.now();
    this.vizQueue.length = 0;
    await LiveAudioStream.stop();
  }

  async resumeRecording(): Promise<void> {
    if (!this.pausedAt || !this.isActive) return;
    logSoundRecord("resumeRecording", {
      platform: Platform.OS,
      fallback: this.usingFallbackRecorder,
      androidReinit: Platform.OS === "android" && !this.usingFallbackRecorder,
    });
    if (this.usingFallbackRecorder) {
      await soundRecordingService.resumeRecording();
      this.pausedAccumMs += Date.now() - this.pausedAt;
      this.pausedAt = null;
      return;
    }
    this.pausedAccumMs += Date.now() - this.pausedAt;
    this.pausedAt = null;
    this.isPausedState = false;
    if (Platform.OS === "android") {
      await this.startLivePcmStream();
      return;
    }
    LiveAudioStream.start();
  }

  elapsedRecordingSeconds(): number {
    if (this.usingFallbackRecorder) {
      return soundRecordingService.elapsedRecordingSeconds();
    }
    return computeElapsedRecordingSeconds({
      recordingStartedAt: this.recordingStartedAt,
      pausedAt: this.pausedAt,
      pausedAccumMs: this.pausedAccumMs,
    });
  }

  /** Finalize WAV after native capture has stopped (may run off the hot path). */
  async finalizeRecordingFile(): Promise<string> {
    if (this.usingFallbackRecorder) {
      const uri = await soundRecordingService.stopRecording();
      this.resetSessionState();
      return uri;
    }

    if (this.usingNativePcmCapture) {
      const native = getNativePcmModule();
      const sampleCount = (await native?.getRecordedSampleCount?.()) ?? 0;
      if (sampleCount <= 0) {
        logSoundRecord("stopRecording failed — no PCM captured (native)");
        this.resetSessionState();
        throw new Error("No audio was captured. Please try recording again.");
      }
      this.totalPcmSamples = sampleCount;
      const fileName = `bird-sound-${Date.now()}.wav`;
      const uri = await native!.finalizeWav!(fileName);
      logSoundRecord("stopRecording done (native wav)", {
        uri,
        totalSamples: sampleCount,
        durationSec: Math.round(sampleCount / LIVE_SPECTROGRAM_SAMPLE_RATE),
        droppedViz: this.droppedVizChunks,
      });
      this.resetSessionState();
      return uri;
    }

    const totalSamples = this.totalPcmSamples;
    if (totalSamples <= 0) {
      logSoundRecord("stopRecording failed — no PCM captured");
      this.resetSessionState();
      throw new Error("No audio was captured. Please try recording again.");
    }

    const uri = await writePcmChunksToWavFile(
      this.pcmChunks,
      LIVE_SPECTROGRAM_SAMPLE_RATE,
      1,
      `bird-sound-${Date.now()}.wav`
    );

    logSoundRecord("stopRecording done", {
      uri,
      totalSamples,
      durationSec: Math.round(totalSamples / LIVE_SPECTROGRAM_SAMPLE_RATE),
      droppedViz: this.droppedVizChunks,
    });

    this.resetSessionState();
    return uri;
  }

  async stopRecording(): Promise<string> {
    if (!this.isSessionActive() && this.pcmChunks.length === 0 && !this.usingNativePcmCapture) {
      logSoundRecord("stopRecording skipped — idle");
      this.resetSessionState();
      throw new Error("No active recording session.");
    }

    logSoundRecord("stopRecording begin", {
      fallback: this.usingFallbackRecorder,
      nativeCapture: this.usingNativePcmCapture,
      pcmChunks: this.pcmChunkCount,
      elapsedSec: this.elapsedRecordingSeconds(),
    });

    await this.stopNativeCapture();
    return this.finalizeRecordingFile();
  }
}

export const soundIdentifyRecordingService = new SoundIdentifyRecordingService();
