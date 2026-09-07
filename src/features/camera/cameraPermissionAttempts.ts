/**
 * Persisted count of native camera permission dialog presentations.
 *
 * Android: max 2 native prompts — see identifyCameraPermission.helpers.ts
 * iOS: effectively 1 native prompt (OS blocks re-prompt after deny)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SCREEN_STORAGE_KEYS } from "../../constants/storageConstants";

export const MAX_CAMERA_NATIVE_ATTEMPTS = 2;

export async function getCameraNativeAttemptCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(
      SCREEN_STORAGE_KEYS.CAMERA_PERMISSION_ATTEMPT_COUNT
    );
    const n = parseInt(raw ?? "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function incrementCameraNativeAttemptCount(): Promise<number> {
  const next = (await getCameraNativeAttemptCount()) + 1;
  await AsyncStorage.setItem(
    SCREEN_STORAGE_KEYS.CAMERA_PERMISSION_ATTEMPT_COUNT,
    String(next)
  );
  return next;
}

export async function resetCameraNativeAttemptCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      SCREEN_STORAGE_KEYS.CAMERA_PERMISSION_ATTEMPT_COUNT
    );
  } catch {
    // ignore
  }
}
