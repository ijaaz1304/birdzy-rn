import AsyncStorage from "@react-native-async-storage/async-storage";
import { IDENTIFICATION_STORAGE_KEYS } from "../../constants/storageConstants";

export async function hasSeenIdentificationSafetyWarning(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(
      IDENTIFICATION_STORAGE_KEYS.HAS_SEEN_SAFETY_WARNING
    );
    return raw === "true";
  } catch {
    return false;
  }
}

export async function markIdentificationSafetyWarningSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      IDENTIFICATION_STORAGE_KEYS.HAS_SEEN_SAFETY_WARNING,
      "true"
    );
  } catch {
    // Non-blocking
  }
}
