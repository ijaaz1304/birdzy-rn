import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToScanQuotaChanges } from "../../../services/session/scanQuota";
import { getPhotoIdentificationLimitDisplay } from "../utils/photoIdentificationLimit";

export function usePhotoIdentificationLimit(enabled: boolean) {
  const [limit, setLimit] = useState({
    dailyLimit: 30,
    usedToday: 0,
    remaining: 30,
    resetMs: 0,
    resetLabel: "",
  });
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const version = ++generation.current;
    try {
      const next = await getPhotoIdentificationLimitDisplay();
      if (version === generation.current) setLimit({ ...next, resetLabel: "" });
    } catch {
      /* Submission reports storage errors; keep the last known display. */
    }
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const unsubscribe = subscribeToScanQuotaChanges(() => {
      void refresh();
    });
    return () => {
      generation.current += 1;
      unsubscribe();
    };
  }, [enabled, refresh]);
  return { limit, refresh };
}
