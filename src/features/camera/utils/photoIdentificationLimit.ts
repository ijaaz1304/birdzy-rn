import {
  getFreePlanPhotoDailyLimit,
  getPhotoIdentificationUsageToday,
} from "../../../services/session/usageLimit.service";
import {
  formatDailyLimitResetCountdown,
  getMsUntilDailyLimitReset,
  MAX_CAMERA_IDENTIFY_IMAGES,
} from "./identificationLimitDisplay";

export {
  formatDailyLimitResetCountdown,
  getMsUntilDailyLimitReset,
  MAX_CAMERA_IDENTIFY_IMAGES,
};

export type PhotoIdentificationLimitDisplay = {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  resetMs: number;
};

export async function getPhotoIdentificationLimitDisplay(): Promise<PhotoIdentificationLimitDisplay> {
  const [usage, dailyLimit] = await Promise.all([
    getPhotoIdentificationUsageToday(),
    Promise.resolve(getFreePlanPhotoDailyLimit()),
  ]);
  const usedToday = usage.isToday ? usage.count : 0;
  const remaining = Math.max(0, dailyLimit - usedToday);
  return {
    dailyLimit,
    usedToday,
    remaining,
    resetMs: getMsUntilDailyLimitReset(),
  };
}
