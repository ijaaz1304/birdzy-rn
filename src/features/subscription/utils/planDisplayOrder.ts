/** Design order: Weekly (left) → Yearly (center) → Lifetime (right). */
export const SUBSCRIPTION_PLAN_DISPLAY_ORDER = [
  "week",
  "month",
  "year",
  "lifetime",
] as const;

export function sortPlansForDisplay<
  T extends { duration?: string; title?: string }
>(plans: T[]): T[] {
  const order = SUBSCRIPTION_PLAN_DISPLAY_ORDER;
  return [...plans].sort((a, b) => {
    const aIdx = order.indexOf(
      (a.duration ?? "").toLowerCase() as (typeof order)[number]
    );
    const bIdx = order.indexOf(
      (b.duration ?? "").toLowerCase() as (typeof order)[number]
    );
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
}
