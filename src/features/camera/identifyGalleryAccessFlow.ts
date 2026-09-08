/**
 * Identify gallery access — resolve native photos permission before opening gallery.
 * Android API 33+: system photo picker, no READ_MEDIA prompt.
 * iOS: 1 native attempt max; Android legacy: 2 native attempts max.
 */

import { Platform } from "react-native";
import {
  checkStoragePermission,
  requestStoragePermission,
} from "../../services/permissions";
import {
  getGalleryNativeAttemptCount,
  getMaxGalleryNativeAttempts,
  incrementGalleryNativeAttemptCount,
  resetGalleryNativeAttemptCount,
} from "./galleryPermissionAttempts";

export type IdentifyGalleryAccessStatus =
  | "granted"
  | "needs_native_prompt"
  | "blocked"
  | "denied";

export type IdentifyGalleryAccessResult = {
  status: IdentifyGalleryAccessStatus;
};

/** True when identify gallery can use a system picker without broad library access. */
export function isIdentifyGalleryPermissionlessPicker(): boolean {
  if (Platform.OS === "ios") return true;
  return Platform.OS === "android" && Number(Platform.Version) >= 33;
}

export async function resolveIdentifyGalleryAccess(): Promise<IdentifyGalleryAccessResult> {
  if (isIdentifyGalleryPermissionlessPicker()) {
    return { status: "granted" };
  }

  const storage = await checkStoragePermission();
  if (storage.granted) {
    await resetGalleryNativeAttemptCount();
    return { status: "granted" };
  }

  const attempts = await getGalleryNativeAttemptCount();
  const maxAttempts = getMaxGalleryNativeAttempts();

  if (storage.blocked || attempts >= maxAttempts) {
    return { status: "blocked" };
  }

  return { status: "needs_native_prompt" };
}

/** Present native photos dialog once; updates persisted attempt count. */
export async function runIdentifyGalleryNativeRequest(): Promise<IdentifyGalleryAccessResult> {
  if (isIdentifyGalleryPermissionlessPicker()) {
    return { status: "granted" };
  }

  const result = await requestStoragePermission();

  if (result.granted) {
    await resetGalleryNativeAttemptCount();
    return { status: "granted" };
  }

  const attempts = await incrementGalleryNativeAttemptCount();
  const maxAttempts = getMaxGalleryNativeAttempts();

  if (result.blocked || attempts >= maxAttempts) {
    return { status: "blocked" };
  }

  return { status: "denied" };
}
