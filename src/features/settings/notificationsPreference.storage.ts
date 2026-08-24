/**
 * Local draft toggles for bird notification categories (product spec J).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@birdzy/notification_preferences";

export type BirdNotificationPreferences = {
  push: boolean;
  birdOfDay: boolean;
  migrationAlerts: boolean;
  communityReplies: boolean;
  identificationTips: boolean;
  weeklyDigest: boolean;
};

const DEFAULTS: BirdNotificationPreferences = {
  push: true,
  birdOfDay: true,
  migrationAlerts: true,
  communityReplies: true,
  identificationTips: false,
  weeklyDigest: false,
};

export async function loadNotificationPreferences(): Promise<BirdNotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<BirdNotificationPreferences>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveNotificationPreferences(
  prefs: BirdNotificationPreferences
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
