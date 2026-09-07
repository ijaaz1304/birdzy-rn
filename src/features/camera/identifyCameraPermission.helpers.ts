/**
 * Platform rules for identify camera permission inline recovery.
 *
 * Android: native prompt up to 2× — 1st deny → Allow Access; 2nd deny → Go to Settings.
 * iOS: one native prompt — 1st deny → Go to Settings (no re-prompt).
 */

import { Platform } from "react-native";
import type { PermissionResult } from "../../services/permissions/permission.service";
import {
  MAX_CAMERA_NATIVE_ATTEMPTS,
} from "./cameraPermissionAttempts";
import type { CameraPermissionInlineVariant } from "./components/CameraPermissionInlineState";

const isIosPlatform = () => Platform.OS === "ios";

export function shouldRunNativeCameraPrompt(
  attempts: number,
  permission: Pick<PermissionResult, "blocked" | "canRequestAgain">
): boolean {
  if (isIosPlatform()) {
    return attempts < 1 && !permission.blocked && permission.canRequestAgain;
  }
  return attempts < MAX_CAMERA_NATIVE_ATTEMPTS && !permission.blocked;
}

export function resolveCameraPermissionInlineVariant(
  attempts: number,
  permission?: Pick<PermissionResult, "blocked" | "canRequestAgain">
): CameraPermissionInlineVariant | null {
  if (attempts < 1) {
    if (permission?.blocked || permission?.canRequestAgain === false) {
      return "goToSettings";
    }
    return null;
  }

  if (isIosPlatform()) {
    return "goToSettings";
  }

  if (attempts >= MAX_CAMERA_NATIVE_ATTEMPTS || permission?.blocked) {
    return "goToSettings";
  }

  return "allowAccess";
}
