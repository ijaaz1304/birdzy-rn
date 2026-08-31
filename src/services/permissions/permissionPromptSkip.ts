import AsyncStorage from "@react-native-async-storage/async-storage";
import { SCREEN_STORAGE_KEYS } from "../../constants/storageConstants";
import { getLocationPermissionEntryAction } from "./locationPermissionFlow.service";
import {
  checkMicrophonePermission,
  checkNotificationPermission,
} from "./permission.service";

const NOTIFICATION_PROMPTED_KEY =
  SCREEN_STORAGE_KEYS.NOTIFICATION_PERMISSION_PROMPTED;

/** Skip location UI when OS already granted or prompts are exhausted/blocked. */
export async function shouldSkipLocationPermissionPrompt(): Promise<boolean> {
  const entry = await getLocationPermissionEntryAction();
  return entry !== "show_custom";
}

export async function hasNotificationPermissionBeenPrompted(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PROMPTED_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

/** Call after the native notification dialog is shown (Allow or Don't Allow). */
export async function markNotificationPermissionPrompted(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PROMPTED_KEY, "true");
  } catch {
    // ignore persistence errors
  }
}

/** Skip notification UI when already granted, OS-blocked, or already answered. */
export async function shouldSkipNotificationPermissionPrompt(): Promise<boolean> {
  const result = await checkNotificationPermission();
  if (result.granted || result.blocked || !result.canRequestAgain) {
    return true;
  }
  return hasNotificationPermissionBeenPrompted();
}

/** Skip microphone UI when already granted or OS-blocked. */
export async function shouldSkipMicrophonePermissionPrompt(): Promise<boolean> {
  const result = await checkMicrophonePermission();
  return result.granted || result.blocked;
}
