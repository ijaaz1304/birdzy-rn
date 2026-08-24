/**
 * Screen tracking hook. Call from screen-level components (ownership).
 * Fires SCREEN_VIEW with screen_name once on mount (fire-and-forget).
 */

import { useEffect } from "react";
import { analyticsService } from "./analytics.service";

export function useScreenTracking(
  screenName: string,
  params?: Record<string, string>
) {
  useEffect(() => {
    analyticsService.logScreenView(screenName, params);
  }, [screenName]);
}
