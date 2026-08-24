import type { InstallReferrerPayload } from "./androidReferrer";

/** Clock skew / small future drift (seconds). */
export const ATTRIBUTION_TS_MAX_AHEAD_SEC = 3600;

/** Ignore implausible pre-GPS-era timestamps (reduces 1970 / garbage). */
export const ATTRIBUTION_TS_MIN_REASONABLE_SEC = 946684800; // 2000-01-01 UTC

/**
 * Play `InstallReferrerModule` maps:
 * - `clickTimestamp` / `installTimestamp` in **milliseconds** (referrer click vs install begin).
 * Prefer **click** for last-touch; fall back to install begin if click is missing or insane.
 */
export function isSaneAttributionTimestampSec(
  tsSec: number,
  nowSec: number = Date.now() / 1000
): boolean {
  if (!Number.isFinite(tsSec) || tsSec <= 0) {
    return false;
  }
  if (tsSec < ATTRIBUTION_TS_MIN_REASONABLE_SEC) {
    return false;
  }
  if (tsSec > nowSec + ATTRIBUTION_TS_MAX_AHEAD_SEC) {
    return false;
  }
  return true;
}

export function gpiReferrerTouchTimestampSec(
  payload: InstallReferrerPayload,
  nowSec: number = Date.now() / 1000
): { sec: number; source: "click" | "install_begin" | "none" } {
  const clickSec = Math.floor(Number(payload.clickTimestamp) / 1000);
  const installSec = Math.floor(Number(payload.installTimestamp) / 1000);
  if (isSaneAttributionTimestampSec(clickSec, nowSec)) {
    return { sec: clickSec, source: "click" };
  }
  if (isSaneAttributionTimestampSec(installSec, nowSec)) {
    return { sec: installSec, source: "install_begin" };
  }
  return { sec: 0, source: "none" };
}
