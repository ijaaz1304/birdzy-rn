/**
 * Free plan usage limits: photo and sound identifications per day (separate buckets).
 * Premium users have unlimited identifications.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../features/subscription/subscription.store";
import { getRemoteConfigValue } from "../remoteConfig";
import { IDENTIFICATION_STORAGE_KEYS } from "../../constants/storageConstants";

/** Fallback when Remote Config is not yet available */
export const FREE_PLAN_PHOTO_DAILY_LIMIT = 2;
export const FREE_PLAN_SOUND_DAILY_LIMIT = 2;

/** @deprecated Use FREE_PLAN_PHOTO_DAILY_LIMIT */
export const FREE_PLAN_IDENTIFICATION_DAILY_LIMIT = FREE_PLAN_PHOTO_DAILY_LIMIT;

export type IdentificationMode = "photo" | "sound";

const MODE_KEYS = {
  photo: {
    date: IDENTIFICATION_STORAGE_KEYS.PHOTO_DATE,
    count: IDENTIFICATION_STORAGE_KEYS.PHOTO_COUNT,
  },
  sound: {
    date: IDENTIFICATION_STORAGE_KEYS.SOUND_DATE,
    count: IDENTIFICATION_STORAGE_KEYS.SOUND_COUNT,
  },
} as const;

const getTodayKey = () => new Date().toISOString().slice(0, 10);

export interface IdentificationUsageToday {
  count: number;
  isToday: boolean;
}

function readRemoteLimit(
  key: "freeUserDailyPhotoScanLimit" | "freeUserDailySoundScanLimit" | "freeUserDailyScanLimit",
  fallback: number
): number {
  const value = getRemoteConfigValue(key);
  if (typeof value === "number" && value >= 0) return value;
  return fallback;
}

/** Daily photo identification limit for free users. */
export const getFreePlanPhotoDailyLimit = (): number =>
  readRemoteLimit(
    "freeUserDailyPhotoScanLimit",
    readRemoteLimit("freeUserDailyScanLimit", FREE_PLAN_PHOTO_DAILY_LIMIT)
  );

/** Daily sound identification limit for free users. */
export const getFreePlanSoundDailyLimit = (): number =>
  readRemoteLimit(
    "freeUserDailySoundScanLimit",
    readRemoteLimit("freeUserDailyScanLimit", FREE_PLAN_SOUND_DAILY_LIMIT)
  );

/** @deprecated Use getFreePlanPhotoDailyLimit */
export const getFreePlanIdentificationDailyLimit = getFreePlanPhotoDailyLimit;

async function migrateLegacyPhotoUsageIfNeeded(): Promise<void> {
  const [legacyDate, legacyCount, photoDate] = await Promise.all([
    AsyncStorage.getItem(IDENTIFICATION_STORAGE_KEYS.DATE),
    AsyncStorage.getItem(IDENTIFICATION_STORAGE_KEYS.COUNT),
    AsyncStorage.getItem(IDENTIFICATION_STORAGE_KEYS.PHOTO_DATE),
  ]);
  if (photoDate || !legacyDate) return;
  await AsyncStorage.setItem(IDENTIFICATION_STORAGE_KEYS.PHOTO_DATE, legacyDate);
  if (legacyCount) {
    await AsyncStorage.setItem(IDENTIFICATION_STORAGE_KEYS.PHOTO_COUNT, legacyCount);
  }
}

async function getUsageForMode(
  mode: IdentificationMode
): Promise<IdentificationUsageToday> {
  try {
    if (mode === "photo") await migrateLegacyPhotoUsageIfNeeded();
    const keys = MODE_KEYS[mode];
    const [date, countStr] = await Promise.all([
      AsyncStorage.getItem(keys.date),
      AsyncStorage.getItem(keys.count),
    ]);
    const today = getTodayKey();
    if (date !== today) return { count: 0, isToday: false };
    return { count: parseInt(countStr ?? "0", 10) || 0, isToday: true };
  } catch {
    return { count: 0, isToday: false };
  }
}

export const getPhotoIdentificationUsageToday = (): Promise<IdentificationUsageToday> =>
  getUsageForMode("photo");

export const getSoundIdentificationUsageToday = (): Promise<IdentificationUsageToday> =>
  getUsageForMode("sound");

/** @deprecated Use getPhotoIdentificationUsageToday */
export const getIdentificationUsageToday = getPhotoIdentificationUsageToday;

async function incrementUsageForMode(mode: IdentificationMode): Promise<void> {
  try {
    const keys = MODE_KEYS[mode];
    const today = getTodayKey();
    const [countStr, date] = await Promise.all([
      AsyncStorage.getItem(keys.count),
      AsyncStorage.getItem(keys.date),
    ]);
    const count = date === today ? (parseInt(countStr ?? "0", 10) || 0) + 1 : 1;
    await AsyncStorage.setItem(keys.date, today);
    await AsyncStorage.setItem(keys.count, String(count));

    if (mode === "photo") {
      await AsyncStorage.setItem(IDENTIFICATION_STORAGE_KEYS.DATE, today);
      await AsyncStorage.setItem(IDENTIFICATION_STORAGE_KEYS.COUNT, String(count));
    }
  } catch {
    // ignore
  }
}

export const incrementPhotoIdentificationUsage = (): Promise<void> =>
  incrementUsageForMode("photo");

export const incrementSoundIdentificationUsage = (): Promise<void> =>
  incrementUsageForMode("sound");

/** @deprecated Use incrementPhotoIdentificationUsage */
export const incrementIdentificationUsage = incrementPhotoIdentificationUsage;

export const canIdentifyByMode = async (
  mode: IdentificationMode
): Promise<boolean> => {
  if (selectIsPremium(useSubscriptionStore.getState())) return true;
  const limit =
    mode === "photo"
      ? getFreePlanPhotoDailyLimit()
      : getFreePlanSoundDailyLimit();
  const usage = await getUsageForMode(mode);
  if (!usage.isToday) return true;
  return usage.count < limit;
};

export const canIdentifyPhoto = (): Promise<boolean> => canIdentifyByMode("photo");
export const canIdentifySound = (): Promise<boolean> => canIdentifyByMode("sound");

/** @deprecated Use canIdentifyPhoto */
export const canIdentify = canIdentifyPhoto;
