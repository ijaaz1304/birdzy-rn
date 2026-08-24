/**
 * Deep link observability — Firebase Analytics.
 */

import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";

export function logDeepLinkReceived(url: string, parsed: boolean): void {
  analyticsService.logEvent(EVENTS.deep_link_received, {
    parsed: parsed ? "1" : "0",
    url_host: safeUrlHost(url),
  });
}

export function logDeepLinkApplied(url: string, screen: string): void {
  analyticsService.logEvent(EVENTS.deep_link_applied, {
    screen,
    url_host: safeUrlHost(url),
  });
}

export function logDeepLinkSkipped(reason: string, url?: string): void {
  analyticsService.logEvent(EVENTS.deep_link_skipped, {
    reason: reason.slice(0, 40),
    ...(url ? { url_host: safeUrlHost(url) } : {}),
  });
}

function safeUrlHost(url: string): string {
  try {
    return new URL(url).hostname.slice(0, 100);
  } catch {
    return "unknown";
  }
}
