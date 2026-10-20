/** Photo and sound share one lifetime allowance of 30; premium is unlimited. */
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import {
  scanQuota,
  beginFreeScanAttempt,
  completeFreeScanAttempt,
} from "./scanQuota";

export const FREE_PLAN_IDENTIFICATION_LIMIT = 30;
// Compatibility names for existing camera consumers. These are no longer daily buckets.
export const FREE_PLAN_PHOTO_DAILY_LIMIT = FREE_PLAN_IDENTIFICATION_LIMIT;
export const FREE_PLAN_SOUND_DAILY_LIMIT = FREE_PLAN_IDENTIFICATION_LIMIT;
export const FREE_PLAN_IDENTIFICATION_DAILY_LIMIT =
  FREE_PLAN_IDENTIFICATION_LIMIT;
export type IdentificationMode = "photo" | "sound";
export interface IdentificationUsageToday {
  count: number;
  isToday: boolean;
}
export const getFreePlanPhotoDailyLimit = () => FREE_PLAN_IDENTIFICATION_LIMIT;
export const getFreePlanSoundDailyLimit = getFreePlanPhotoDailyLimit;
export const getFreePlanIdentificationDailyLimit = getFreePlanPhotoDailyLimit;
export const getIdentificationUsageToday =
  async (): Promise<IdentificationUsageToday> => ({
    count: (await scanQuota.get()).used,
    isToday: true,
  });
export const getPhotoIdentificationUsageToday = getIdentificationUsageToday;
export const getSoundIdentificationUsageToday = getIdentificationUsageToday;
export const incrementIdentificationUsage = async (): Promise<void> => {
  const start = await beginFreeScanAttempt();
  if (start.status === "ready")
    await completeFreeScanAttempt(start.attempt, "success");
};
export const incrementPhotoIdentificationUsage = incrementIdentificationUsage;
export const incrementSoundIdentificationUsage = incrementIdentificationUsage;
export const canIdentify = async (): Promise<boolean> =>
  selectIsPremium(useSubscriptionStore.getState()) ||
  (await scanQuota.get()).remaining > 0;
export const canIdentifyByMode = (_mode: IdentificationMode) => canIdentify();
export const canIdentifyPhoto = canIdentify;
export const canIdentifySound = canIdentify;
export const getIdentificationLimitDisplay = async () => {
  const { used, remaining } = await scanQuota.get();
  return {
    dailyLimit: FREE_PLAN_IDENTIFICATION_LIMIT,
    usedToday: used,
    remaining,
  };
};
