/**
 * Discount Timer Store
 * 24h discount → 24h no discount → repeat. Timer starts at first app open.
 * Used for timer UI on home and subscription screen; tap navigates to subscription.
 */

const HOUR_MS = 60 * 60 * 1000;
const CYCLE_PHASE_MS = 24 * HOUR_MS; // 24 hours per phase

export interface DiscountTimerPhase {
  /** true = discount active, false = no discount */
  isDiscountActive: boolean;
  /** seconds until end of current phase (discount ends or next discount starts) */
  secondsRemaining: number;
  /** "Xh Ym left" or "Discount in Xh Ym" */
  label: string;
}

/**
 * Compute current phase and time remaining from first app open timestamp.
 * Phase 0 = first 24h = discount, phase 1 = next 24h = no discount, then repeat.
 */
export function getDiscountTimerPhase(
  firstAppOpenAt: number | null
): DiscountTimerPhase | null {
  if (firstAppOpenAt == null || firstAppOpenAt <= 0) return null;
  const now = Date.now();
  const elapsed = now - firstAppOpenAt;
  if (elapsed < 0) return null;
  const phaseIndex = Math.floor(elapsed / CYCLE_PHASE_MS) % 2;
  const isDiscountActive = phaseIndex === 0;
  const elapsedInCurrentPhase = elapsed % CYCLE_PHASE_MS;
  const secondsRemaining = Math.max(
    0,
    Math.floor((CYCLE_PHASE_MS - elapsedInCurrentPhase) / 1000)
  );
  const h = Math.floor(secondsRemaining / 3600);
  const m = Math.floor((secondsRemaining % 3600) / 60);
  const timeStr = `${h}h ${m}m`;
  const label = isDiscountActive ? `${timeStr} left` : `Discount in ${timeStr}`;
  return { isDiscountActive, secondsRemaining, label };
}

/**
 * Pure: whether the discount phase is active for a given first-app-open timestamp.
 * Use this in loaders so they stay deterministic (no store access).
 */
export function isDiscountPhaseActive(firstAppOpenAt: number | null): boolean {
  if (!firstAppOpenAt) return false;
  const phase = getDiscountTimerPhase(firstAppOpenAt);
  return phase?.isDiscountActive ?? false;
}
