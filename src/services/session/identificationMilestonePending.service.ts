import AsyncStorage from "@react-native-async-storage/async-storage";
import { IDENTIFICATION_STORAGE_KEYS } from "../../constants/storageConstants";

export async function setPendingIdentificationMilestone(
  count: number
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      IDENTIFICATION_STORAGE_KEYS.PENDING_MILESTONE,
      String(count)
    );
  } catch {
    // Non-blocking
  }
}

export async function peekPendingIdentificationMilestone(): Promise<
  number | null
> {
  try {
    const raw = await AsyncStorage.getItem(
      IDENTIFICATION_STORAGE_KEYS.PENDING_MILESTONE
    );
    if (!raw) return null;
    const count = parseInt(raw, 10);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

export async function clearPendingIdentificationMilestone(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      IDENTIFICATION_STORAGE_KEYS.PENDING_MILESTONE
    );
  } catch {
    // Non-blocking
  }
}
