import { getIdentificationLimitDisplay } from "../../../services/session/usageLimit.service";
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
  known: boolean;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  resetMs: number;
};

export async function getPhotoIdentificationLimitDisplay(): Promise<PhotoIdentificationLimitDisplay> {
  return { ...(await getIdentificationLimitDisplay()), resetMs: 0 };
}
