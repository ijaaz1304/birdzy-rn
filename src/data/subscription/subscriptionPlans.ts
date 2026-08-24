/**
 * Subscription Plans Data (UI layer).
 * Plans: UI must use useSubscriptionPlansWithPrices() only. No getSubscriptionPlansForUI in components.
 */

/** Plan ID = product ID (e.g. lifetime_birdzy, yearly_birdzy_pack_half_price). */
export type PlanType = string;

export interface Plan {
  id: PlanType;
  title: string;
  price: string;
  subtitle?: string;
  badge?: string;
  description: string[];
  ctaLabel: string;
  recurring?: boolean;
}

export interface ComparisonFeature {
  feature: string;
  free: string;
  premium: string;
}

export const FREE_VS_PREMIUM_COMPARISON: ComparisonFeature[] = [
  { feature: "Identification", free: "2/day", premium: "Unlimited" },
  {
    feature: "Collections",
    free: "2 collections, 50 mushrooms",
    premium: "Unlimited",
  },
  { feature: "Details", free: "Overview only", premium: "Full details" },
  { feature: "Feed", free: "1 post/day", premium: "Unlimited" },
  { feature: "Mushrooms of the day", free: "1", premium: "Unlimited" },
  { feature: "AI Chat", free: "5 mess/day", premium: "Unlimited" },
];
