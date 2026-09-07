/**
 * Identify camera permission orchestration.
 *
 * Android: native dialog at most twice. After 1st deny → inline Allow Access.
 * After 2 native denials → inline Go to Settings.
 *
 * iOS: one native dialog. After deny → inline Go to Settings (no re-prompt).
 */

import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  checkCameraPermission,
  openDeviceSettings,
  requestCameraPermission,
} from "../../services/permissions";
import {
  getCameraNativeAttemptCount,
  incrementCameraNativeAttemptCount,
  resetCameraNativeAttemptCount,
} from "./cameraPermissionAttempts";
import {
  resolveCameraPermissionInlineVariant,
  shouldRunNativeCameraPrompt,
} from "./identifyCameraPermission.helpers";
import type { CameraPermissionInlineVariant } from "./components/CameraPermissionInlineState";

export function useIdentifyCameraPermissionFlow(deviceAvailable: boolean) {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [cameraPermissionInline, setCameraPermissionInline] =
    useState<CameraPermissionInlineVariant | null>(null);
  const [isNativeDialogActive, setIsNativeDialogActive] = useState(false);
  const [cameraPermissionLoading, setCameraPermissionLoading] = useState(false);
  const entryFlowStartedRef = useRef(false);

  const applyGranted = useCallback(async () => {
    await resetCameraNativeAttemptCount();
    setHasPermission(true);
    setCameraPermissionInline(null);
  }, []);

  const showSettingsInline = useCallback(() => {
    setCameraPermissionInline("goToSettings");
  }, []);

  const showAllowAccessInline = useCallback(() => {
    setCameraPermissionInline("allowAccess");
  }, []);

  const applyDeniedInlineState = useCallback(
    (attempts: number, blocked: boolean, canRequestAgain?: boolean) => {
      const variant = resolveCameraPermissionInlineVariant(attempts, {
        blocked,
        canRequestAgain: canRequestAgain ?? true,
      });
      if (variant === "goToSettings") {
        showSettingsInline();
      } else if (variant === "allowAccess") {
        showAllowAccessInline();
      } else {
        if (Platform.OS === "ios") {
          showSettingsInline();
        } else {
          showAllowAccessInline();
        }
      }
    },
    [showAllowAccessInline, showSettingsInline]
  );

  const runNativeRequest = useCallback(async () => {
    setIsNativeDialogActive(true);
    try {
      const result = await requestCameraPermission();
      if (result.granted) {
        await applyGranted();
        return { granted: true as const, attempts: 0 };
      }

      const attempts = await incrementCameraNativeAttemptCount();
      setHasPermission(false);
      applyDeniedInlineState(attempts, result.blocked, result.canRequestAgain);

      return { granted: false as const, attempts };
    } finally {
      setIsNativeDialogActive(false);
    }
  }, [applyDeniedInlineState, applyGranted]);

  const syncPermissionFromOs = useCallback(async () => {
    const current = await checkCameraPermission();
    setPermissionChecked(true);

    if (current.granted) {
      await applyGranted();
      return;
    }

    setHasPermission(false);
    const attempts = await getCameraNativeAttemptCount();
    applyDeniedInlineState(attempts, current.blocked, current.canRequestAgain);
  }, [applyDeniedInlineState, applyGranted]);

  /** Run once per camera-screen focus when permission is missing. */
  const runEntryPermissionFlow = useCallback(async () => {
    if (!deviceAvailable) {
      await syncPermissionFromOs();
      return;
    }
    if (entryFlowStartedRef.current) {
      await syncPermissionFromOs();
      return;
    }
    entryFlowStartedRef.current = true;

    const current = await checkCameraPermission();
    setPermissionChecked(true);

    if (current.granted) {
      await applyGranted();
      return;
    }

    setHasPermission(false);
    const attempts = await getCameraNativeAttemptCount();

    if (!shouldRunNativeCameraPrompt(attempts, current)) {
      applyDeniedInlineState(attempts, current.blocked, current.canRequestAgain);
      return;
    }

    await runNativeRequest();
  }, [
    applyDeniedInlineState,
    applyGranted,
    deviceAvailable,
    runNativeRequest,
    syncPermissionFromOs,
  ]);

  const resetEntryFlow = useCallback(() => {
    entryFlowStartedRef.current = false;
  }, []);

  const handleCameraPermissionAction = useCallback(async () => {
    if (cameraPermissionInline === "goToSettings") {
      await openDeviceSettings();
      return;
    }

    const attempts = await getCameraNativeAttemptCount();
    const current = await checkCameraPermission();
    if (!shouldRunNativeCameraPrompt(attempts, current)) {
      showSettingsInline();
      return;
    }

    setCameraPermissionLoading(true);
    try {
      await runNativeRequest();
    } finally {
      setCameraPermissionLoading(false);
    }
  }, [
    cameraPermissionInline,
    runNativeRequest,
    showSettingsInline,
  ]);

  return {
    hasPermission,
    permissionChecked,
    cameraPermissionInline,
    isNativeDialogActive,
    cameraPermissionLoading,
    runEntryPermissionFlow,
    resetEntryFlow,
    syncPermissionFromOs,
    handleCameraPermissionAction,
  };
}
