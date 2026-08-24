import AsyncStorage from "@react-native-async-storage/async-storage";
import { SCREEN_STORAGE_KEYS } from "../../constants/storageConstants";

const DENIAL_COUNT_KEY = SCREEN_STORAGE_KEYS.LOCATION_PERMISSION_DENIAL_COUNT;

/** After this many native denials, show Manage Location Access instead of the system prompt. */
export const MAX_LOCATION_DENIALS_BEFORE_SETTINGS = 2;

export async function getLocationPermissionDenialCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(DENIAL_COUNT_KEY);
    const parsed = parseInt(raw ?? "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function incrementLocationPermissionDenialCount(): Promise<number> {
  const next = (await getLocationPermissionDenialCount()) + 1;
  try {
    await AsyncStorage.setItem(DENIAL_COUNT_KEY, String(next));
  } catch {
    // ignore persistence errors
  }
  return next;
}

export async function resetLocationPermissionDenialCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DENIAL_COUNT_KEY);
  } catch {
    // ignore
  }
}

export async function shouldShowLocationManageSettingsPopup(): Promise<boolean> {
  const count = await getLocationPermissionDenialCount();
  return count >= MAX_LOCATION_DENIALS_BEFORE_SETTINGS;
}

/** True after the user denied the native location dialog at least once. */
export async function hasNativeLocationPromptBeenDenied(): Promise<boolean> {
  return (await getLocationPermissionDenialCount()) >= 1;
}
