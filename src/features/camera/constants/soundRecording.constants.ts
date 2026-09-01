import { Platform } from "react-native";
import { SOUND_CROP_DURATIONS } from "../utils/soundCrop";

/** Shortest crop window — also the minimum usable recording length for identification. */
export const MIN_SOUND_RECORDING_SECONDS = SOUND_CROP_DURATIONS[0];

export const MAX_SOUND_RECORDING_SECONDS = 60;

/** UI refresh rate for spectrogram columns (~15 fps on iOS, ~10 on Android). */
export const SPECTROGRAM_UI_FPS = 15;
export const SPECTROGRAM_UI_FPS_ANDROID = 10;

/** Max visualization PCM chunks queued before dropping oldest (never drops recording PCM). */
export const MAX_PENDING_SPECTROGRAM_CHUNKS = 6;
export const MAX_PENDING_SPECTROGRAM_CHUNKS_ANDROID = 4;

/** Max milliseconds of FFT/mel work per visualization drain tick. */
export const SPECTROGRAM_VIZ_BUDGET_MS = 8;
export const SPECTROGRAM_VIZ_BUDGET_MS_ANDROID = 6;

/** Mel columns retained in the rolling spectrogram buffer. */
export const SPECTROGRAM_MAX_COLUMNS = 200;

/** SVG render budget — one rect per column × band (keep product modest on device). */
export const SPECTROGRAM_DISPLAY_MAX_COLUMNS = 120;
export const SPECTROGRAM_DISPLAY_MIN_COLUMN_PX = 2;
export const SPECTROGRAM_DISPLAY_MEL_BANDS = 36;

/** Timer ticks once per second for stable 1, 2, 3… display. */
export const RECORDING_TIMER_INTERVAL_MS = 1000;

/** dBFS above which the recording UI shows the background-noise hint. */
export const NOISE_HINT_DB_THRESHOLD = -12;

export function formatMinRecordingLengthMessage(seconds = MIN_SOUND_RECORDING_SECONDS): string {
  return `Please record at least ${seconds} seconds`;
}

export function meetsMinRecordingDuration(elapsedSec: number): boolean {
  return elapsedSec >= MIN_SOUND_RECORDING_SECONDS;
}

export function maxPendingSpectrogramChunks(): number {
  return Platform.OS === "android"
    ? MAX_PENDING_SPECTROGRAM_CHUNKS_ANDROID
    : MAX_PENDING_SPECTROGRAM_CHUNKS;
}

export function spectrogramVizBudgetMs(): number {
  return Platform.OS === "android"
    ? SPECTROGRAM_VIZ_BUDGET_MS_ANDROID
    : SPECTROGRAM_VIZ_BUDGET_MS;
}
