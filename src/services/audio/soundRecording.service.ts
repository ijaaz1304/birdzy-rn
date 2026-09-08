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

class SoundRecordingService {
  private recordingUri: string | null = null;
  private recordingStartedAt: number | null = null;
  private pausedAt: number | null = null;
  private pausedAccumMs = 0;

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

  async play(uri: string): Promise<void> {
    await AudioRecorderPlayer.startPlayer(uri);
  }

  async stopPlayback(): Promise<void> {
    await AudioRecorderPlayer.stopPlayer();
    AudioRecorderPlayer.removePlayBackListener();
    AudioRecorderPlayer.removePlaybackEndListener();
  }

  /** Read clip length without audible playback (volume 0, then stop). */
  async probeDurationSec(uri: string): Promise<number | undefined> {
    if (!uri?.trim()) return undefined;
    try {
      await this.stopPlayback();
      await AudioRecorderPlayer.setVolume(0);
      await AudioRecorderPlayer.startPlayer(uri);
      const durationSec = await new Promise<number | undefined>((resolve) => {
        let settled = false;
        const finish = async (value?: number) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          AudioRecorderPlayer.removePlayBackListener();
          try {
            await AudioRecorderPlayer.stopPlayer();
            await AudioRecorderPlayer.setVolume(1);
          } catch {
            // ignore cleanup errors
          }
          resolve(value);
        };
        const timeout = setTimeout(() => {
          void finish(undefined);
        }, 12_000);
        AudioRecorderPlayer.addPlayBackListener((meta) => {
          const raw = meta.duration;
          if (raw > 0) {
            const sec = raw > 1000 ? raw / 1000 : raw;
            void finish(sec);
          }
        });
      });
      return durationSec;
    } catch {
      try {
        await AudioRecorderPlayer.stopPlayer();
        await AudioRecorderPlayer.setVolume(1);
      } catch {
        // ignore cleanup errors
      }
      return undefined;
    }
  }

  mmss(seconds: number): string {
    return AudioRecorderPlayer.mmss(Math.max(0, Math.floor(seconds)));
  }
}

export const soundRecordingService = new SoundRecordingService();
