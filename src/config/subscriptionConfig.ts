/**
 * Subscription / Paywall config. Static UI strings and legal copy.
 * Plans: UI must use useSubscriptionPlansWithPrices() only. No subscriptionConfig.plans.
 */

import {
  getAllSubscriptionPlans,
  getAllSubscriptionPlanIds,
} from "../data/subscription/subscriptionPlansLoader";
import { LEGAL_URL_FALLBACKS } from "../constants/legalUrls";
import { DEFAULT_APP_DISPLAY_NAME } from "../constants/branding";

export { getAllSubscriptionPlanIds, getAllSubscriptionPlans };

/** Plan ID is the same as store product ID (e.g. lifetime_birdzy, yearly_birdzy_pack_half_price). */
export type PlanId = string;

export interface ComparisonRow {
  feature: string;
  free: string;
  premium: string;
}

export interface SubscriptionPlan {
  id: PlanId;
  title: string;
  price: number;
  priceDisplay: string;
  /** India price display (Rs) for reference / locale */
  priceDisplayIndia?: string;
  duration: string;
  trialDays: number;
  recurring: boolean;
  productIdIos: string;
  productIdAndroid: string;
  /** Trial offer product ID (yearly plans); store may use for introductory offer */
  trialProductIdIos?: string;
  trialProductIdAndroid?: string;
  descriptionLines: string[];
  ctaLabel: string;
  badge?: string;
  subtitle?: string;
}

export interface SubscriptionConfigPayload {
  paywallTitle: string;
  discountPercent: number;
  discountBadgeLabel: string;
  countdownPrefix: string;
  countdownDuration: { hours: number; minutes: number; seconds: number };
  featureComparison: ComparisonRow[];
  appName: string;
  ctaPrimary: string;
  ctaLater: string;
  /** Fallback only; UI should use useSubscriptionPlansWithPrices().defaultSelectedPlanId */
  defaultSelectedPlanId: PlanId;
  comparisonHeaders: { feature: string; free: string; premium: string };
  planModalTitle: string;
  legal: {
    termsUrl: string;
    paidServicesUrl: string;
    appleDisclaimer: string;
    termsLabel: string;
    paidServicesLabel: string;
  };
}

const subscriptionConfigBase: SubscriptionConfigPayload = {
  paywallTitle: "Get 50% Off — Unlock Advanced Capabilities",
  discountPercent: 50,
  discountBadgeLabel: "70% OFF",
  countdownPrefix: "Discount ends in",
  countdownDuration: { hours: 0, minutes: 20, seconds: 20 },
  comparisonHeaders: {
    feature: "Feature",
    free: "Free",
    premium: "Premium",
  },
  featureComparison: [
    { feature: "Identification", free: "2/day", premium: "Unlimited" },
    { feature: "Collections", free: "2 max", premium: "Unlimited" },
    { feature: "Details", free: "Basic", premium: "Advanced" },
    { feature: "Feed", free: "Limited", premium: "Unlimited" },
    { feature: "Bird of the Day", free: "1/day", premium: "Unlimited" },
    { feature: "AI Chat", free: "5/day", premium: "Unlimited" },
  ],
  appName: DEFAULT_APP_DISPLAY_NAME,
  planModalTitle: "Premium",
  ctaPrimary: "Get Started",
  ctaLater: "Later",
  defaultSelectedPlanId: "yearly_birdzy_pack",
  legal: {
    termsUrl: LEGAL_URL_FALLBACKS.TERMS_OF_SERVICE,
    paidServicesUrl: LEGAL_URL_FALLBACKS.TERMS_OF_SERVICE,
    termsLabel: "Terms of Service",
    paidServicesLabel: "Paid Services",
    appleDisclaimer:
      'By clicking "Subscribe" you agree to the Terms of Service and Paid Services Terms. Subscription auto-renews unless cancelled 24 hours before the end of the period.',
  },
};

export const subscriptionConfig: SubscriptionConfigPayload = {
  ...subscriptionConfigBase,
};

/** Resolves any plan id from either full_pack or half_pack (for IAP price fetch and purchase). */
export const getPlanById = (id: PlanId): SubscriptionPlan | undefined =>
  getAllSubscriptionPlans().find((p) => p.id === id) as
    | SubscriptionPlan
    | undefined;

export const getDefaultPlan = () =>
  getPlanById(subscriptionConfig.defaultSelectedPlanId);
