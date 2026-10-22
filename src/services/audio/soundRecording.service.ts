/**
 * Bird sound recording and playback for identify-sound and audio gallery.
 */

import { Platform } from "react-native";
import RNFS from "react-native-fs";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import {
  checkMicrophonePermission,
  requestMicrophonePermission,
} from "../permissions";

const MAX_RECORDING_SECONDS = 60;
const STOP_PLAYER_TIMEOUT_MS = 250;
const LOCAL_PROBE_TIMEOUT_MS = 2500;

function isLocalAudioUri(uri: string): boolean {
  return uri.startsWith("file://") || uri.startsWith("/");
}

function durationFromMeta(raw: number): number | undefined {
  if (!(raw > 0) || !Number.isFinite(raw)) return undefined;
  const sec = raw > 1000 ? raw / 1000 : raw;
  return sec > 0 ? sec : undefined;
}

class SoundRecordingService {
  private recordingUri: string | null = null;
  private recordingStartedAt: number | null = null;
  private pausedAt: number | null = null;
  private pausedAccumMs = 0;
  private playbackSession = 0;
  private playerHeld = false;
  private playbackEndHandler: (() => void) | undefined;
  private durationCache = new Map<string, number>();
  private durationListeners = new Set<(uri: string, sec: number) => void>();

  async ensureMicrophonePermission(): Promise<boolean> {
    const current = await checkMicrophonePermission();
    if (current.granted) return true;
    if (current.blocked) return false;
    const requested = await requestMicrophonePermission();
    return requested.granted;
  }

  private buildRecordingPath(): string {
    const ext = Platform.OS === "ios" ? "m4a" : "mp4";
    return `${RNFS.CachesDirectoryPath}/bird-sound-${Date.now()}.${ext}`;
  }

  /** MediaRecorder expects a raw path on Android, not a file:// URI. */
  private toRecordingUri(path: string): string {
    if (path.startsWith("file://")) return path;
    return Platform.OS === "android" ? `file://${path}` : path;
  }

  async startRecording(
    onMetering?: (db: number) => void
  ): Promise<void> {
    const allowed = await this.ensureMicrophonePermission();
    if (!allowed) {
      throw new Error("Microphone permission is required to record bird sounds.");
    }

    const path = this.buildRecordingPath();
    await AudioRecorderPlayer.startRecorder(path, undefined, true);
    this.recordingUri = this.toRecordingUri(path);
    this.recordingStartedAt = Date.now();
    this.pausedAt = null;
    this.pausedAccumMs = 0;
    AudioRecorderPlayer.addRecordBackListener((meta) => {
      const metering =
        typeof meta.currentMetering === "number" ? meta.currentMetering : 0;
      onMetering?.(metering);
    });
  }

  async pauseRecording(): Promise<void> {
    if (this.pausedAt) return;
    await AudioRecorderPlayer.pauseRecorder();
    this.pausedAt = Date.now();
  }

  async resumeRecording(): Promise<void> {
    if (!this.pausedAt) return;
    await AudioRecorderPlayer.resumeRecorder();
    this.pausedAccumMs += Date.now() - this.pausedAt;
    this.pausedAt = null;
  }

  elapsedRecordingSeconds(): number {
    if (!this.recordingStartedAt) return 0;
    const pausedNow = this.pausedAt ? Date.now() - this.pausedAt : 0;
    return Math.max(
      0,
      (Date.now() - this.recordingStartedAt - this.pausedAccumMs - pausedNow) /
        1000
    );
  }

  async stopRecording(): Promise<string> {
    const result = await AudioRecorderPlayer.stopRecorder();
    AudioRecorderPlayer.removeRecordBackListener();

    const uri = result || this.recordingUri;
    this.recordingUri = null;
    this.recordingStartedAt = null;
    this.pausedAt = null;
    this.pausedAccumMs = 0;

    if (!uri) {
      throw new Error("No recording available.");
    }

    const normalized = uri.startsWith("file://") ? uri : `file://${uri}`;
    return normalized;
  }

  /** Auto-stop when max duration reached; returns uri. */
  async stopRecordingIfOverLimit(): Promise<string | null> {
    if (!this.recordingStartedAt) return null;
    if (this.elapsedRecordingSeconds() < MAX_RECORDING_SECONDS) return null;
    return this.stopRecording();
  }

  get maxRecordingSeconds(): number {
    return MAX_RECORDING_SECONDS;
  }

  getCachedDurationSec(uri: string): number | undefined {
    return this.durationCache.get(uri);
  }

  subscribeDuration(
    listener: (uri: string, sec: number) => void
  ): () => void {
    this.durationListeners.add(listener);
    return () => {
      this.durationListeners.delete(listener);
    };
  }

  async play(
    uri: string,
    options?: { onEnd?: () => void }
  ): Promise<void> {
    const session = ++this.playbackSession;
    this.playbackEndHandler = options?.onEnd;
    try {
      await AudioRecorderPlayer.setVolume(1);
    } catch {
      // native volume restore is best-effort
    }
    if (this.playerHeld) {
      await this.releasePlayer();
    }
    if (session !== this.playbackSession) return;
    this.playerHeld = true;
    try {
      await AudioRecorderPlayer.startPlayer(uri);
    } catch (error) {
      if (session === this.playbackSession) this.playerHeld = false;
      throw error;
    }
    if (session !== this.playbackSession) return;
    this.attachPlaybackListeners(uri, session);
  }

  async stopPlayback(): Promise<void> {
    this.playbackSession += 1;
    this.playbackEndHandler = undefined;
    if (!this.playerHeld) {
      this.clearPlaybackListeners();
      return;
    }
    this.playerHeld = false;
    await this.releasePlayer();
  }

  /**
   * Local files only. Remote URLs used to occupy the shared player at volume 0
   * (up to 12s), which delayed tap-to-play.
   */
  async probeDurationSec(uri: string): Promise<number | undefined> {
    const trimmed = uri?.trim();
    if (!trimmed) return undefined;
    const cached = this.durationCache.get(trimmed);
    if (cached != null) return cached;
    if (!isLocalAudioUri(trimmed) || this.playerHeld) return undefined;

    const session = this.playbackSession;
    try {
      this.playerHeld = true;
      await AudioRecorderPlayer.setVolume(0);
      if (session !== this.playbackSession) return undefined;
      await AudioRecorderPlayer.startPlayer(trimmed);
      if (session !== this.playbackSession) return undefined;

      const durationSec = await new Promise<number | undefined>((resolve) => {
        let settled = false;
        const finish = (value?: number) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve(value);
        };
        const timeout = setTimeout(() => finish(undefined), LOCAL_PROBE_TIMEOUT_MS);
        AudioRecorderPlayer.addPlayBackListener((meta) => {
          const sec = durationFromMeta(meta.duration);
          if (sec != null) finish(sec);
        });
      });

      if (session !== this.playbackSession) return durationSec;
      this.clearPlaybackListeners();
      try {
        await AudioRecorderPlayer.stopPlayer();
        await AudioRecorderPlayer.setVolume(1);
      } catch {
        // ignore cleanup errors
      }
      this.playerHeld = false;
      if (durationSec != null) this.rememberDuration(trimmed, durationSec);
      return durationSec;
    } catch {
      if (session === this.playbackSession) {
        this.playerHeld = false;
        this.clearPlaybackListeners();
        try {
          await AudioRecorderPlayer.stopPlayer();
          await AudioRecorderPlayer.setVolume(1);
        } catch {
          // ignore cleanup errors
        }
      }
      return undefined;
    }
  }

  mmss(seconds: number): string {
    return AudioRecorderPlayer.mmss(Math.max(0, Math.floor(seconds)));
  }

  private rememberDuration(uri: string, sec: number) {
    this.durationCache.set(uri, sec);
    this.durationListeners.forEach((listener) => listener(uri, sec));
  }

  private attachPlaybackListeners(uri: string, session: number) {
    this.clearPlaybackListeners();
    AudioRecorderPlayer.addPlayBackListener((meta) => {
      if (session !== this.playbackSession) return;
      const sec = durationFromMeta(meta.duration);
      if (sec != null) this.rememberDuration(uri, sec);
    });
    AudioRecorderPlayer.addPlaybackEndListener(() => {
      if (session !== this.playbackSession) return;
      this.playerHeld = false;
      this.clearPlaybackListeners();
      const onEnd = this.playbackEndHandler;
      this.playbackEndHandler = undefined;
      onEnd?.();
    });
  }

  private clearPlaybackListeners() {
    AudioRecorderPlayer.removePlayBackListener();
    AudioRecorderPlayer.removePlaybackEndListener();
  }

  private async releasePlayer(): Promise<void> {
    this.clearPlaybackListeners();
    try {
      await Promise.race([
        AudioRecorderPlayer.stopPlayer(),
        new Promise<void>((resolve) =>
          setTimeout(resolve, STOP_PLAYER_TIMEOUT_MS)
        ),
      ]);
    } catch {
      // native stop can reject when nothing is playing
    }
  }
}

export const soundRecordingService = new SoundRecordingService();
