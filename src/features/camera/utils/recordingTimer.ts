import { MAX_SOUND_RECORDING_SECONDS } from "../constants/soundRecording.constants";

/** Authoritative elapsed seconds from wall-clock timestamps (excludes paused time). */
export function computeElapsedRecordingSeconds(params: {
  recordingStartedAt: number | null;
  pausedAt: number | null;
  pausedAccumMs: number;
  now?: number;
}): number {
  const { recordingStartedAt, pausedAt, pausedAccumMs, now = Date.now() } = params;
  if (!recordingStartedAt) return 0;
  const pausedNow = pausedAt ? now - pausedAt : 0;
  return Math.max(
    0,
    (now - recordingStartedAt - pausedAccumMs - pausedNow) / 1000
  );
}

export function isRecordingOverMaxDuration(
  elapsedSec: number,
  maxSec = MAX_SOUND_RECORDING_SECONDS
): boolean {
  return elapsedSec >= maxSec;
}
