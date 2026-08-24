/**
 * Single location permission flow used everywhere:
 * 1. Custom popup (caller shows UI)
 * 2. User taps Continue → dismiss custom → native OS prompt
 * 3. After 2 native denials (or OS blocked) → manage-settings popup
 */

import { InteractionManager, Platform } from "react-native";
import {
  checkLocationPermission,
  requestLocationPermission,
} from "./permission.service";
import {
  incrementLocationPermissionDenialCount,
  resetLocationPermissionDenialCount,
  shouldShowLocationManageSettingsPopup,
} from "./locationPermissionAttempts.service";
import { logLocation } from "../../utils/locationDebug";

export type LocationPermissionFlowResult = {
  granted: boolean;
  /** Show manage-settings popup (2 denials or OS blocked). */
  showManageSettings: boolean;
  /** First denial — caller may continue without location. */
  deniedOnce: boolean;
};

const CUSTOM_DISMISS_DELAY_MS = Platform.OS === "ios" ? 450 : 700;

/** Wait for the custom popup to fully dismiss before the native prompt. */
export async function afterCustomPopupDismiss(
  task: () => void | Promise<void>
): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          Promise.resolve(task()).finally(resolve);
        }, CUSTOM_DISMISS_DELAY_MS);
      });
    });
  });
}

/** Already granted, blocked, or 2+ denials → skip custom popup. */
export async function getLocationPermissionEntryAction(): Promise<
  "granted" | "manage_settings" | "show_custom"
> {
  const current = await checkLocationPermission();
  if (current.granted) return "granted";
  if (current.blocked) return "manage_settings";
  if (await shouldShowLocationManageSettingsPopup()) return "manage_settings";
  return "show_custom";
}

/** Native OS prompt only (no custom popup). Handles denial counting. */
export async function requestNativeLocationPermission(): Promise<LocationPermissionFlowResult> {
  const current = await checkLocationPermission();
  if (current.granted) {
    await resetLocationPermissionDenialCount();
    return { granted: true, showManageSettings: false, deniedOnce: false };
  }

  if (current.blocked) {
    return { granted: false, showManageSettings: true, deniedOnce: false };
  }

  logLocation("requestNativeLocationPermission: showing OS prompt");
  const result = await requestLocationPermission();

  if (result.granted) {
    await resetLocationPermissionDenialCount();
    return { granted: true, showManageSettings: false, deniedOnce: false };
  }

  const denialCount = await incrementLocationPermissionDenialCount();
  logLocation("requestNativeLocationPermission: denied", { denialCount });

  const showManageSettings = result.blocked || denialCount >= 2;
  return {
    granted: false,
    showManageSettings,
    deniedOnce: !showManageSettings,
  };
}

/** Step 2 of the flow: custom popup was dismissed → native prompt. */
export async function completeCustomThenNativeFlow(): Promise<LocationPermissionFlowResult> {
  let outcome: LocationPermissionFlowResult = {
    granted: false,
    showManageSettings: false,
    deniedOnce: false,
  };
  await afterCustomPopupDismiss(async () => {
    outcome = await requestNativeLocationPermission();
  });
  return outcome;
}
