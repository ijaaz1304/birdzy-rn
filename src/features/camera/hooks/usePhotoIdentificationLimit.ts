import { useCallback, useEffect, useState } from "react";
import {
  formatDailyLimitResetCountdown,
  getPhotoIdentificationLimitDisplay,
  type PhotoIdentificationLimitDisplay,
} from "../utils/photoIdentificationLimit";

type LimitState = PhotoIdentificationLimitDisplay & {
  resetLabel: string;
};

const EMPTY: LimitState = {
  dailyLimit: 2,
  usedToday: 0,
  remaining: 2,
  resetMs: 0,
  resetLabel: "0h:00m",
};

export function usePhotoIdentificationLimit(enabled: boolean) {
  const [limit, setLimit] = useState<LimitState>(EMPTY);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const next = await getPhotoIdentificationLimitDisplay();
    setLimit({
      ...next,
      resetLabel: formatDailyLimitResetCountdown(next.resetMs),
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const interval = setInterval(() => {
      setLimit((prev) => {
        const resetMs = Math.max(0, prev.resetMs - 60_000);
        return {
          ...prev,
          resetMs,
          resetLabel: formatDailyLimitResetCountdown(resetMs),
        };
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { limit, refresh };
}
