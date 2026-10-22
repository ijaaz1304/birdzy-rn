/**
 * Development-only performance probes for the sound identify flow.
 * Enable: globalThis.__SOUND_PERF__ = true
 * Report: globalThis.__SOUND_PERF_REPORT__()
 * Reset:  globalThis.__SOUND_PERF_RESET__()
 */

const TAG = "[SoundPerf]";

type TimingBucket = {
  count: number;
  totalMs: number;
  maxMs: number;
};

const renderCounts = new Map<string, number>();
const timings = new Map<string, TimingBucket>();

let cropGestureActive = false;
let cropGestureLiveSpectrogramRenders = 0;
let cropGestureCropContentRenders = 0;
let cropGestureOverlayRenders = 0;
let cropGestureFrames = 0;

type SoundPerfGlobal = {
  __SOUND_PERF__?: boolean;
  __SOUND_PERF_REPORT__?: () => void;
  __SOUND_PERF_RESET__?: () => void;
};

export function isSoundPerfEnabled(): boolean {
  return __DEV__ && Boolean((globalThis as SoundPerfGlobal).__SOUND_PERF__);
}

export function soundPerfNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

export function soundPerfRender(component: string): void {
  if (!isSoundPerfEnabled()) return;
  renderCounts.set(component, (renderCounts.get(component) ?? 0) + 1);
  if (!cropGestureActive) return;
  if (component === "LiveSpectrogramView") {
    cropGestureLiveSpectrogramRenders += 1;
  }
  if (component === "SoundRecordingCropContent") {
    cropGestureCropContentRenders += 1;
  }
  if (component === "LiveSpectrogramCropOverlay") {
    cropGestureOverlayRenders += 1;
  }
}

export function soundPerfRecordTiming(label: string, durationMs: number): void {
  if (!isSoundPerfEnabled() || durationMs < 0) return;
  const bucket = timings.get(label) ?? { count: 0, totalMs: 0, maxMs: 0 };
  bucket.count += 1;
  bucket.totalMs += durationMs;
  bucket.maxMs = Math.max(bucket.maxMs, durationMs);
  timings.set(label, bucket);
}

export function soundPerfMeasure<T>(label: string, fn: () => T): T {
  if (!isSoundPerfEnabled()) return fn();
  const start = soundPerfNow();
  const result = fn();
  soundPerfRecordTiming(label, soundPerfNow() - start);
  return result;
}

export function soundPerfReset(): void {
  if (!__DEV__ || !isSoundPerfEnabled()) return;
  renderCounts.clear();
  timings.clear();
  cropGestureActive = false;
  cropGestureLiveSpectrogramRenders = 0;
  cropGestureCropContentRenders = 0;
  cropGestureOverlayRenders = 0;
  cropGestureFrames = 0;
  console.log(`${TAG} counters reset`);
}

function renderCount(name: string): number {
  return renderCounts.get(name) ?? 0;
}

function logRenderCount(name: string): void {
  console.log(`${TAG}\n${name} renders: ${renderCount(name)}`);
}

function logTiming(label: string): void {
  const bucket = timings.get(label);
  if (!bucket || bucket.count === 0) {
    console.log(`${TAG}\n${label} avg: n/a\n${label} max: n/a`);
    return;
  }
  const avg = bucket.totalMs / bucket.count;
  console.log(
    `${TAG}\n${label} avg: ${avg.toFixed(2)} ms\n${label} max: ${bucket.maxMs.toFixed(2)} ms`
  );
}

export function soundPerfBeginCropGesture(): void {
  if (!isSoundPerfEnabled()) return;
  cropGestureActive = true;
  cropGestureLiveSpectrogramRenders = 0;
  cropGestureCropContentRenders = 0;
  cropGestureOverlayRenders = 0;
  cropGestureFrames = 0;
}

export function soundPerfCropGestureFrame(): void {
  if (!isSoundPerfEnabled() || !cropGestureActive) return;
  cropGestureFrames += 1;
}

export function soundPerfEndCropGesture(): void {
  if (!isSoundPerfEnabled()) return;
  cropGestureActive = false;
  console.log(`${TAG}\nCrop gesture frames: ${cropGestureFrames}`);
  console.log(
    `${TAG}\nCrop gesture LiveSpectrogramView renders: ${cropGestureLiveSpectrogramRenders}`
  );
  console.log(
    `${TAG}\nCrop gesture SoundRecordingCropContent renders: ${cropGestureCropContentRenders}`
  );
  console.log(
    `${TAG}\nCrop gesture LiveSpectrogramCropOverlay renders: ${cropGestureOverlayRenders}`
  );
}

export function soundPerfReport(): void {
  if (!__DEV__) return;
  console.log(`${TAG}\n--- Sound Identify Performance Report ---`);

  logRenderCount("SoundIdentifyScreen");
  logRenderCount("RecordingTimer");
  logRenderCount("RecordingControls");
  logRenderCount("RecordingNoiseStatus");
  logRenderCount("RecordingSpectrogramPanel");
  logRenderCount("LiveSpectrogramView");
  logRenderCount("SoundRecordingCropContent");

  logTiming("PcmDecode");
  logTiming("SpectrogramProcessing");
  logTiming("FFT");
  logTiming("Mel");
  logTiming("Subscription");
  logTiming("BitmapRender");
  logTiming("Snapshot");
  logTiming("WavFinalization");

  console.log(`${TAG}\n--- End Report ---`);
}

if (__DEV__) {
  const g = globalThis as SoundPerfGlobal;
  g.__SOUND_PERF_REPORT__ = soundPerfReport;
  g.__SOUND_PERF_RESET__ = soundPerfReset;
}

/** @deprecated Use soundPerfRender — kept for existing call sites. */
export function logSoundRenderCount(component: string): void {
  soundPerfRender(component);
}
