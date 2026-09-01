const TAG = "[SoundRecord]";

export function logSoundRecord(
  message: string,
  data?: Record<string, unknown>
): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(TAG, message, data);
  } else {
    console.log(TAG, message);
  }
}

export { logSoundRenderCount, soundPerfRender } from "./soundPerf";
