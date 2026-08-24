import { getCompareAtPriceDisplay } from "../../subscription/utils/storePlanPricing";
import { localizeCompareAtPriceDisplay } from "./planDisplay";

/**
 * @deprecated Use getCompareAtPriceDisplay with store IAP prices instead.
 * Kept for backwards compatibility only — no longer doubles the discounted price.
 */
export function getOriginalPriceDisplay(
  discountedPriceDisplay: string,
  storePrices?: ReadonlyMap<string, string>,
  planId?: string
): string | null {
  if (storePrices && planId) {
    return localizeCompareAtPriceDisplay(
      getCompareAtPriceDisplay(planId, discountedPriceDisplay, storePrices)
    );
  }
  return null;
}
