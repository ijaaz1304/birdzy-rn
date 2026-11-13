import { getCurrentBackendAiUsage, isFreeScanExempt } from "./scanQuota";
/** Photo and sound use the backend account allowance; premium is unlimited. */
import { scanQuota } from "./scanQuota";

export const getFreePlanPhotoDailyLimit = () =>
  getCurrentBackendAiUsage()?.successThreshold ?? 0;
export const getFreePlanSoundDailyLimit = getFreePlanPhotoDailyLimit;
export const getFreePlanIdentificationDailyLimit = getFreePlanPhotoDailyLimit;
export type IdentificationMode = "photo" | "sound";
export interface IdentificationUsageToday {
  count: number;
  isToday: boolean;
}
export const getIdentificationUsageToday =
  async (): Promise<IdentificationUsageToday> => ({
    count: (await scanQuota.get()).used,
    isToday: true,
  });
export const getPhotoIdentificationUsageToday = getIdentificationUsageToday;
export const getSoundIdentificationUsageToday = getIdentificationUsageToday;
export const incrementIdentificationUsage = async (): Promise<void> => {
  // Accounting is returned by the identification endpoint.
};
export const incrementPhotoIdentificationUsage = incrementIdentificationUsage;
export const incrementSoundIdentificationUsage = incrementIdentificationUsage;
export const canIdentify = async (): Promise<boolean> =>
  isFreeScanExempt() ||
  (await scanQuota.get().then((usage) => !usage.known || usage.remaining > 0));
export const canIdentifyByMode = (_mode: IdentificationMode) => canIdentify();
export const canIdentifyPhoto = canIdentify;
export const canIdentifySound = canIdentify;
export const getIdentificationLimitDisplay = async () => {
  const { used, remaining, limit, known } = await scanQuota.get();
  return {
    dailyLimit: limit,
    known,
    usedToday: used,
    remaining,
  };
};
