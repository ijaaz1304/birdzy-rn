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

const MAX_RECORDING_SECONDS = 30;

class SoundRecordingService {
  private recordingUri: string | null = null;
  private recordingStartedAt: number | null = null;

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

  async startRecording(): Promise<void> {
    const allowed = await this.ensureMicrophonePermission();
    if (!allowed) {
      throw new Error("Microphone permission is required to record bird sounds.");
    }

    const path = this.buildRecordingPath();
    const uri = Platform.OS === "ios" ? path : `file://${path}`;
    await AudioRecorderPlayer.startRecorder(uri);
    this.recordingUri = uri;
    this.recordingStartedAt = Date.now();
  }

  async stopRecording(): Promise<string> {
    const result = await AudioRecorderPlayer.stopRecorder();
    AudioRecorderPlayer.removeRecordBackListener();

    const uri = result || this.recordingUri;
    this.recordingUri = null;
    this.recordingStartedAt = null;

    if (!uri) {
      throw new Error("No recording available.");
    }

    const normalized = uri.startsWith("file://") ? uri : `file://${uri}`;
    return normalized;
  }

  /** Auto-stop when max duration reached; returns uri. */
  async stopRecordingIfOverLimit(): Promise<string | null> {
    if (!this.recordingStartedAt) return null;
    const elapsedSec = (Date.now() - this.recordingStartedAt) / 1000;
    if (elapsedSec < MAX_RECORDING_SECONDS) return null;
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

  mmss(seconds: number): string {
    return AudioRecorderPlayer.mmss(Math.max(0, Math.floor(seconds)));
  }
}

export const soundRecordingService = new SoundRecordingService();
