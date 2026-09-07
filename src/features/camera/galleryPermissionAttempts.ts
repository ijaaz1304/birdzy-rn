/**
 * Persisted count of native gallery/photos permission dialog presentations.
 * iOS: max 1 native prompt → then Settings path.
 * Android (< API 33): max 2 native prompts → then Settings path.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SCREEN_STORAGE_KEYS } from "../../constants/storageConstants";

export const MAX_GALLERY_NATIVE_ATTEMPTS_IOS = 1;
export const MAX_GALLERY_NATIVE_ATTEMPTS_ANDROID = 2;

export function getMaxGalleryNativeAttempts(): number {
  return Platform.OS === "ios"
    ? MAX_GALLERY_NATIVE_ATTEMPTS_IOS
    : MAX_GALLERY_NATIVE_ATTEMPTS_ANDROID;
}

export async function getGalleryNativeAttemptCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(
      SCREEN_STORAGE_KEYS.GALLERY_PERMISSION_ATTEMPT_COUNT
    );
    const n = parseInt(raw ?? "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function incrementGalleryNativeAttemptCount(): Promise<number> {
  const next = (await getGalleryNativeAttemptCount()) + 1;
  await AsyncStorage.setItem(
    SCREEN_STORAGE_KEYS.GALLERY_PERMISSION_ATTEMPT_COUNT,
    String(next)
  );
  return next;
}

export async function resetGalleryNativeAttemptCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      SCREEN_STORAGE_KEYS.GALLERY_PERMISSION_ATTEMPT_COUNT
    );
  } catch {
    // ignore
  }
}
