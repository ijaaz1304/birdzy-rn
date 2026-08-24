/**
 * Subscription plans loader.
 * Plans are read directly from local birdzyPacks.json (full_pack + half_pack).
 * Pack selection is deterministic from (firstAppOpenAt, isPremium) via getSubscriptionPlans().
 * App-facing plans: use useSubscriptionPlansWithPrices() (hook calls getRuntimeSubscriptionPlans with store values).
 */

import { isDiscountPhaseActive } from "../../features/discount/discountTimer.store";
import birdzyPacksJson from "./birdzyPacks.json";

export interface RemotePackItem {
  /** Canonical plan / App Store product ID. */
  name: string;
  /** Google Play product ID when it differs from App Store (optional). */
  androidName?: string;
  type: "IAP" | "SUBS";
  title: string;
}

export interface RemotePacksPayload {
  full_pack?: RemotePackItem[];
  half_pack?: RemotePackItem[];
}

/** Plan shape built from remote; id = productId (name). */
export interface LoadedSubscriptionPlan {
  id: string;
  title: string;
  price: number;
  priceDisplay: string;
  duration: string;
  trialDays: number;
  recurring: boolean;
  productIdIos: string;
  productIdAndroid: string;
  descriptionLines: string[];
  ctaLabel: string;
  badge?: string;
  subtitle?: string;
}

/**
 * Build plan from remote pack item. planId = productId = name.
 * Prices are fetched dynamically from IAP store (see useSubscriptionPlansWithPrices).
 */
function getDurationFromPackItem(item: RemotePackItem): string {
  if (item.type === "IAP") return "lifetime";
  const n = item.name.toLowerCase();
  const t = item.title?.toLowerCase() ?? "";
  if (t === "yearly" || n.includes("yearly") || n.includes("_year")) return "year";
  if (t === "weekly" || n.includes("weekly") || n.includes("_week")) return "week";
  if (t === "monthly" || n.includes("monthly") || n.includes("_month")) return "month";
  return "year";
}

function buildPlanFromPackItem(item: RemotePackItem): LoadedSubscriptionPlan {
  const id = item.name;
  const recurring = item.type === "SUBS";
  const duration = getDurationFromPackItem(item);
  const badge = item.name.includes("half_price") ? "50% OFF" : undefined;
  const subtitle =
    duration === "week"
      ? "/ week"
      : duration === "month"
      ? "/ month"
      : duration === "year"
      ? "/ year"
      : undefined;
  return {
    id,
    title: item.title,
    price: 0,
    priceDisplay: "", // Filled from IAP store (useSubscriptionPlansWithPrices)
    duration,
    trialDays: recurring && duration === "year" ? 7 : 0,
    recurring,
    productIdIos: id,
    productIdAndroid: item.androidName?.trim() || id,
    descriptionLines: recurring
      ? [
          "Cancel anytime",
          duration === "week"
            ? "Billed weekly"
            : duration === "month"
            ? "Billed monthly"
            : "Billed yearly",
        ]
      : ["One-time purchase", "Unlimited access forever"],
    ctaLabel: item.title,
    badge,
    subtitle,
  };
}

/** Pack list from local birdzyPacks.json — single source of truth. */
const BIRDZY_PAYLOAD: RemotePacksPayload =
  birdzyPacksJson as RemotePacksPayload;

function pickYearly(item: RemotePackItem): boolean {
  const t = item.title?.toLowerCase();
  const n = item.name?.toLowerCase() ?? "";
  return t === "yearly" || n.includes("yearly") || n.includes("_year");
}
function pickLifetime(item: RemotePackItem): boolean {
  const t = item.title?.toLowerCase();
  const n = item.name?.toLowerCase() ?? "";
  return t === "lifetime" || n.includes("lifetime");
}
function pickWeekly(item: RemotePackItem): boolean {
  const t = item.title?.toLowerCase();
  const n = item.name?.toLowerCase() ?? "";
  if (pickYearly(item)) return false;
  return t === "weekly" || n.includes("weekly") || n.includes("_week");
}

function buildPlansFromPayload(
  payload: RemotePacksPayload,
  firstAppOpenAt: number | null,
  isPremium: boolean,
  offerActiveOverride?: boolean
): LoadedSubscriptionPlan[] {
  const full = payload.full_pack ?? [];
  const half = payload.half_pack ?? [];
  const offerActive =
    offerActiveOverride !== undefined
      ? offerActiveOverride
      : firstAppOpenAt != null &&
        !isPremium &&
        isDiscountPhaseActive(firstAppOpenAt);
  const pack = offerActive ? half : full;

  const weekly = pack.find(pickWeekly);
  const yearly = pack.find(pickYearly);
  const lifetime = pack.find(pickLifetime);

  const items: RemotePackItem[] = [
    ...(weekly ? [weekly] : []),
    ...(yearly ? [yearly] : []),
    ...(lifetime ? [lifetime] : []),
  ];
  return items.map(buildPlanFromPackItem);
}

function getPlansFromPayload(
  payload: RemotePacksPayload,
  firstAppOpenAt: number | null,
  isPremium: boolean,
  offerActiveOverride?: boolean
): LoadedSubscriptionPlan[] {
  return buildPlansFromPayload(
    payload,
    firstAppOpenAt,
    isPremium,
    offerActiveOverride
  );
}

/** Default plan to select when no preference (first plan in current list, or yearly). */
export const DEFAULT_SELECTED_PLAN_ID = "yearly_birdzy_pack_half_price";

/**
 * Pure: return subscription plans from birdzyPacks.json.
 * When offerActive is provided, use it; else derive from firstAppOpenAt + isPremium.
 * Use getRuntimeSubscriptionPlans() for app-facing plans.
 */
export function getSubscriptionPlans(
  firstAppOpenAt: number | null,
  isPremium: boolean,
  offerActive?: boolean
): LoadedSubscriptionPlan[] {
  return getPlansFromPayload(
    BIRDZY_PAYLOAD,
    firstAppOpenAt,
    isPremium,
    offerActive
  );
}

/**
 * Build plans from a single pack (full or half only).
 */
function buildPlansFromSinglePack(
  items: RemotePackItem[]
): LoadedSubscriptionPlan[] {
  return items.map(buildPlanFromPackItem);
}

/**
 * Return all unique plans from both full_pack and half_pack (merged by id).
 * Used so getPlanById can resolve any product id and IAP can fetch prices for all.
 */
export function getAllSubscriptionPlans(): LoadedSubscriptionPlan[] {
  const full = BIRDZY_PAYLOAD.full_pack ?? [];
  const half = BIRDZY_PAYLOAD.half_pack ?? [];
  const fullPlans = buildPlansFromSinglePack(full);
  const halfPlans = buildPlansFromSinglePack(half);
  const byId = new Map<string, LoadedSubscriptionPlan>();
  fullPlans.forEach((p) => byId.set(p.id, p));
  halfPlans.forEach((p) => byId.set(p.id, p));
  return Array.from(byId.values());
}

/**
 * Return all unique plan IDs from both full_pack and half_pack.
 * Use when fetching IAP prices so we have prices for whichever pack is active (avoids empty prices if offer state changes).
 */
export function getAllSubscriptionPlanIds(): string[] {
  return getAllSubscriptionPlans().map((p) => p.id);
}

/**
 * No-op for backwards compatibility. Plans are always from birdzyPacks.json; no URL fetch.
 */
export async function loadSubscriptionPlans(): Promise<void> {
  // Plans come directly from birdzyPacks.json
}
