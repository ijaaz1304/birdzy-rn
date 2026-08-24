/** Shown on plan cards when the App Store / Play Store did not return a price. */
export const MISSING_IAP_PRICE = "—";

function parseStorePriceAmount(priceDisplay: string): number {
  return parseFloat(priceDisplay.replace(/[^0-9.]/g, "")) || 0;
}

/** True when price string came from the App Store / Play Store (not a placeholder). */
export function hasRealStorePrice(priceDisplay?: string | null): boolean {
  const trimmed = priceDisplay?.trim();
  if (
    !trimmed ||
    trimmed === MISSING_IAP_PRICE ||
    trimmed === "--" ||
    trimmed === "Loading…"
  ) {
    return false;
  }
  if (/^free$/i.test(trimmed)) return false;
  if (/\d/.test(trimmed) && parseStorePriceAmount(trimmed) <= 0) {
    return false;
  }
  return true;
}

/** Map raw IAP price to UI display; use em dash when the store did not return a price. */
export function resolveStorePriceDisplay(priceDisplay?: string | null): string {
  return hasRealStorePrice(priceDisplay)
    ? priceDisplay!.trim()
    : MISSING_IAP_PRICE;
}

export function filterPlansWithStorePrices<
  T extends { priceDisplay?: string }
>(plans: T[]): T[] {
  return plans.filter((plan) => hasRealStorePrice(plan.priceDisplay));
}

/** Half-price SKU → matching full-price SKU for compare-at display. */
const HALF_TO_FULL_PLAN_ID: Record<string, string> = {
  yearly_birdzy_pack_half_price: "yearly_birdzy_pack",
  lifetime_birdzy_half_price: "lifetime_birdzy",
};

export function getFullPackPlanId(planId: string): string | null {
  return HALF_TO_FULL_PLAN_ID[planId] ?? null;
}

function readStorePrice(
  storePrices: ReadonlyMap<string, string>,
  planId: string
): string | null {
  const price = storePrices.get(planId);
  return hasRealStorePrice(price) ? price!.trim() : null;
}

/** Full-pack store price for a half-pack plan (for strikethrough), when available. */
export function getCompareAtPriceDisplay(
  planId: string,
  currentPriceDisplay: string | undefined,
  storePrices: ReadonlyMap<string, string>
): string | null {
  const fullPlanId = getFullPackPlanId(planId);
  if (!fullPlanId) return null;
  const fullPrice = readStorePrice(storePrices, fullPlanId);
  if (!fullPrice) return null;
  const current = currentPriceDisplay?.trim();
  if (!hasRealStorePrice(current) || !fullPrice || fullPrice === current) return null;
  return fullPrice;
}
