/**
 * Canonical Birdzy pack analytics event names.
 * Product IDs differ by store (yearly_birdzy_pack vs yearly_pack_birdzy).
 */

import { analyticsService } from "./analytics.service";
import { EVENTS } from "./analytics.events";

export function getBirdzyPackAnalyticsEvent(
  productOrPlanId: string
): string | null {
  const s = productOrPlanId.toLowerCase();
  if (s.includes("life")) return EVENTS.lifetime_pack_birdzy;
  if (s.includes("year")) return EVENTS.yearly_pack_birdzy;
  if (s.includes("week")) return EVENTS.weekly_pack_birdzy;
  return null;
}

export function logBirdzyPackEvent(
  productOrPlanId: string,
  extra?: Record<string, unknown>
): void {
  const eventName = getBirdzyPackAnalyticsEvent(productOrPlanId);
  if (!eventName) return;
  analyticsService.logEvent(eventName, {
    pack_name: productOrPlanId,
    ...extra,
  });
}
