import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  IDENTIFICATION_MILESTONE_COUNTS,
  IDENTIFICATION_STORAGE_KEYS,
} from "../../constants/storageConstants";

export type IdentificationMilestoneCount =
  (typeof IDENTIFICATION_MILESTONE_COUNTS)[number];

export function isIdentificationMilestone(
  count: number
): count is IdentificationMilestoneCount {
  return (IDENTIFICATION_MILESTONE_COUNTS as readonly number[]).includes(count);
}

export async function getLifetimeIdentificationCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(
      IDENTIFICATION_STORAGE_KEYS.LIFETIME_COUNT
    );
    return parseInt(raw ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

/** Call after each successful identification (free + premium). Returns new total. */
export async function incrementLifetimeIdentificationCount(): Promise<number> {
  try {
    const next = (await getLifetimeIdentificationCount()) + 1;
    await AsyncStorage.setItem(
      IDENTIFICATION_STORAGE_KEYS.LIFETIME_COUNT,
      String(next)
    );
    return next;
  } catch {
    return 0;
  }
}
