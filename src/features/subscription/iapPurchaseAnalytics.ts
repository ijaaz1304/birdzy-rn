/**
 * In-app purchase analytics: dynamic pack-name event, `paid_purchase` (GA4-style `value` + `currency`),
 * `Trial_started` → `Trial_converted` when the same product later pays.
 * Android: after `acknowledgePurchaseAndroid`. iOS: after successful `subscribeApple` (backend confirmed).
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProducts } from "react-native-iap";
import type { ProductSubscriptionAndroid } from "react-native-iap";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";
import { getBirdzyPackAnalyticsEvent } from "../../services/analytics/packAnalytics";
import type { PlanId } from "../../config/subscriptionConfig";
import { getPlanById } from "../../config/subscriptionConfig";
import {
  ensureIapInitialized,
  detectAndroidTrialFromProductDetails,
  fetchAllProductPrices,
  type Purchase,
} from "./services/iap.service";
import {
  getAndroidOneTimeFormattedPrice,
  getAndroidSubscriptionFormattedPrice,
  selectAndroidSubscriptionOffer,
} from "./utils/iapPriceDisplay";
import { shouldPreferPaidAndroidOffer } from "./utils/trialEligibility";
import { useAppLogsStore } from "../app-logs/app-logs.store";

const LOG = "[IAP PurchaseAnalytics]";
/**
 * Search app logs for `[IAP PaidPurchase]` to follow the paid_purchase pipeline:
 * numbered steps, block reasons, and when Firebase events are sent.
 */
const PAID_TRACE = "[IAP PaidPurchase]";

function tracePaidPurchase(
  step: string,
  metadata?: Record<string, unknown>
): void {
  useAppLogsStore.getState().info(`${PAID_TRACE} ${step}`, {
    flow: "paid_purchase",
    ...metadata,
  });
}

const PAID_PURCHASE_DEDUPE_STORAGE_KEY = "@iap_analytics_paid_purchase_last";
/** Set when `Trial_started` fires; cleared on paid purchase or product change */
const TRIAL_PENDING_PRODUCT_KEY = "@iap_analytics_trial_pending_product_id";

export type AndroidAckAnalyticsResult = {
  includesTrial: boolean;
};

type PriceSource =
  | "one_time_offer"
  | "one_time_formatted"
  | "android_product_display_price"
  | "android_subscription_offer_phases"
  | "android_one_time_offer"
  | "android_one_time_offer_details"
  | "subscription_last_paid_phase"
  | "subscription_first_paid_phase"
  | "storekit_product"
  | "local_pack_item"
  | "unresolved";

export type PriceSnapshot = {
  value: number;
  currency: string;
  source: PriceSource;
};

/**
 * GA4 revenue: use `value` (number, currency units — not micros) + `currency`.
 * Do not send `price` as the revenue key; GA4/BQ monetization reports use `value`.
 */
function ga4RevenueParams(
  snapshot: PriceSnapshot
): Record<string, string | number> {
  const v =
    typeof snapshot.value === "number" && Number.isFinite(snapshot.value)
      ? snapshot.value
      : 0;
  return {
    value: v,
    currency: (snapshot.currency || "USD").slice(0, 3).toUpperCase(),
    price_source: snapshot.source,
  };
}

function isLifetimePlanId(planId: PlanId): boolean {
  return planId.toLowerCase().includes("lifetime");
}

/** GA4 `paid_purchase` / `trial_converted`: billing period for dashboards (weekly | monthly | yearly | lifetime | unknown). */
function getPlanTypeLabelForAnalytics(planId: PlanId): string {
  const id = planId.toLowerCase();
  if (id.includes("lifetime")) return "lifetime";
  if (id.includes("year")) return "yearly";
  if (id.includes("week")) return "weekly";
  if (id.includes("month")) return "monthly";
  const plan = getPlanById(planId);
  if (plan) {
    const d = String(plan.duration || "").toLowerCase();
    if (d.includes("life")) return "lifetime";
    if (d.includes("year")) return "yearly";
    if (d.includes("week")) return "weekly";
    if (d.includes("month")) return "monthly";
  }
  return "unknown";
}

/** Firebase: lowercase, [a-z0-9_], collapse underscores, prefix if starts with digit. Max 40 chars. */
export function sanitizeProductIdToAnalyticsEventName(raw: string): string {
  let s = raw.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  s = s.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  if (/^\d/.test(s)) {
    s = `purchase_${s}`;
  }
  if (s.length > 40) {
    s = s.slice(0, 40).replace(/_+$/g, "");
  }
  return s || "purchase_unknown";
}

function parseAnalyticsPriceString(raw: string): number {
  let s = raw.replace(/[^\d,.-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function inferCurrencyFromFormattedPrice(raw: string): string {
  const s = String(raw || "");
  if (s.includes("₹")) return "INR";
  if (s.includes("$")) return "USD";
  if (s.includes("€")) return "EUR";
  if (s.includes("£")) return "GBP";
  return "USD";
}

/** Currency from react-native-iap Android product (matches UI `getDisplayPriceFromProduct`). */
function androidStoreProductCurrency(p: Record<string, unknown>): string {
  const cur = p.currency;
  if (typeof cur === "string" && cur.trim().length >= 3) {
    return cur.trim().slice(0, 3).toUpperCase();
  }
  const oneTime = p.oneTimePurchaseOfferDetails as
    | { priceCurrencyCode?: string }
    | undefined;
  if (oneTime?.priceCurrencyCode) {
    return String(oneTime.priceCurrencyCode).slice(0, 3).toUpperCase();
  }
  return "USD";
}

/**
 * Android: IAP + subs products expose `displayPrice` / `localizedPrice` even when
 * `oneTimePurchaseOfferDetails.priceAmountMicros` is missing from the bridge — same paths as the paywall.
 */
function tryAndroidPriceSnapshotFromStoreProduct(
  p: Record<string, unknown>
): PriceSnapshot | null {
  const isSubscription =
    p.type === "subs" ||
    Array.isArray(p.subscriptionOffers) ||
    Array.isArray(p.subscriptionOfferDetailsAndroid);

  const phaseFormatted = isSubscription
    ? getAndroidSubscriptionFormattedPrice(p)
    : getAndroidOneTimeFormattedPrice(p);
  if (phaseFormatted) {
    const value = parseAnalyticsPriceString(phaseFormatted);
    if (value > 0) {
      return {
        value,
        currency: androidStoreProductCurrency(p),
        source: isSubscription
          ? "android_subscription_offer_phases"
          : "android_one_time_offer",
      };
    }
  }

  const display =
    typeof p.displayPrice === "string"
      ? p.displayPrice
      : typeof p.localizedPrice === "string"
      ? p.localizedPrice
      : "";
  if (display) {
    const value = parseAnalyticsPriceString(display);
    if (value > 0) {
      return {
        value,
        currency: androidStoreProductCurrency(p),
        source: "android_product_display_price",
      };
    }
  }

  const oneTime = p.oneTimePurchaseOfferDetails as
    | {
        formattedPrice?: string;
        priceCurrencyCode?: string;
      }
    | undefined;
  const androidOneTimeOffers = p.oneTimePurchaseOfferDetailsAndroid as
    | Array<{ formattedPrice?: string; priceCurrencyCode?: string }>
    | undefined;
  for (const offer of androidOneTimeOffers ?? []) {
    if (offer.formattedPrice) {
      const value = parseAnalyticsPriceString(offer.formattedPrice);
      if (value > 0) {
        return {
          value,
          currency: offer.priceCurrencyCode
            ? String(offer.priceCurrencyCode).slice(0, 3).toUpperCase()
            : androidStoreProductCurrency(p),
          source: "android_one_time_offer_details",
        };
      }
    }
  }
  if (oneTime?.formattedPrice) {
    const value = parseAnalyticsPriceString(oneTime.formattedPrice);
    if (value > 0) {
      return {
        value,
        currency: oneTime.priceCurrencyCode
          ? String(oneTime.priceCurrencyCode).slice(0, 3).toUpperCase()
          : androidStoreProductCurrency(p),
        source: "one_time_formatted",
      };
    }
  }

  return null;
}

async function fallbackPriceSnapshotFromLoadedStoreMap(
  planId: PlanId
): Promise<PriceSnapshot | null> {
  try {
    const map = await fetchAllProductPrices([planId]);
    const details = map.get(planId);
    if (!details?.priceDisplay) return null;
    const value = parseAnalyticsPriceString(details.priceDisplay);
    if (!(value > 0)) return null;
    return {
      value,
      currency: inferCurrencyFromFormattedPrice(details.priceDisplay),
      source: "android_product_display_price",
    };
  } catch {
    return null;
  }
}

function getAndroidProductIds(purchase: Purchase): string[] {
  const ids = (purchase as Purchase & { productIds?: string[] }).productIds;
  if (Array.isArray(ids) && ids.length > 0) {
    return ids;
  }
  return purchase.productId ? [purchase.productId] : [];
}

function getAndroidOrderId(purchase: Purchase): string {
  const p = purchase as Purchase & {
    orderId?: string;
    transactionId?: string;
  };
  const id = p.orderId ?? p.transactionId;
  return id != null && String(id).trim() !== "" ? String(id) : "";
}

function getIosTransactionId(purchase: Purchase): string {
  const tid = (purchase as Purchase & { transactionId?: string }).transactionId;
  return tid != null && String(tid).trim() !== "" ? String(tid) : "";
}

function isAndroidPurchasedStateValue(state: unknown): boolean {
  if (typeof state === "string") {
    return state.trim().toLowerCase() === "purchased";
  }
  const n = typeof state === "number" ? state : Number(state);
  return n === 1;
}

function readablePurchaseState(state: unknown): string {
  if (isAndroidPurchasedStateValue(state)) return "PURCHASED";
  const n = typeof state === "number" ? state : Number(state);
  if (n === 2) return "PENDING";
  if (n === 0) return "UNSPECIFIED";
  if (Number.isNaN(n)) return "UNKNOWN";
  return `UNKNOWN (${state})`;
}

function readablePurchaseStateWithIosDefault(purchase: Purchase): string {
  const raw = (purchase as unknown as { purchaseState?: number }).purchaseState;
  if (raw === undefined && Platform.OS === "ios") {
    return "PURCHASED";
  }
  return readablePurchaseState(raw);
}

async function readPaidPurchaseDedupeComposite(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PAID_PURCHASE_DEDUPE_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writePaidPurchaseDedupeComposite(
  composite: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(PAID_PURCHASE_DEDUPE_STORAGE_KEY, composite);
  } catch {
    /* ignore */
  }
}

function paidPurchaseDedupeKey(
  platform: "android" | "ios",
  id: string
): string {
  return `${platform}:${id}`;
}

async function setTrialPendingProductId(productId: string): Promise<void> {
  if (!productId) return;
  try {
    await AsyncStorage.setItem(TRIAL_PENDING_PRODUCT_KEY, productId);
  } catch {
    /* ignore */
  }
}

async function readTrialPendingProductId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TRIAL_PENDING_PRODUCT_KEY);
  } catch {
    return null;
  }
}

async function clearTrialPendingProductId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TRIAL_PENDING_PRODUCT_KEY);
  } catch {
    /* ignore */
  }
}

/** Google Play Billing: Purchase.State.PURCHASED === 1 */
function isAndroidPurchasePurchased(purchase: Purchase): boolean {
  if (Platform.OS !== "android") return true;
  const raw = (purchase as unknown as { purchaseState?: number | string })
    .purchaseState;
  if (raw === undefined) return true;
  return isAndroidPurchasedStateValue(raw);
}

/**
 * True when the subscription offer selected for purchase starts with a free trial.
 * Uses the same selection logic as requestPlanPurchase — not subscriptionOfferDetails[0].
 */
async function isSelectedAndroidOfferFreeTrial(
  productId: string
): Promise<boolean> {
  if (!productId) return false;
  try {
    await ensureIapInitialized();
    const subs = await fetchProducts({ skus: [productId], type: "subs" });
    const sub = (Array.isArray(subs) ? subs : []).find(
      (s: { type?: string; id?: string }) =>
        s.type === "subs" && s.id === productId
    ) as ProductSubscriptionAndroid | undefined;
    if (!sub) return false;
    const selected = selectAndroidSubscriptionOffer(
      sub as unknown as Record<string, unknown>,
      {
        logSelection: false,
        preferPaidOffer: shouldPreferPaidAndroidOffer(),
      }
    );
    return selected?.isTrial ?? false;
  } catch {
    return false;
  }
}

async function resolveAndroidPriceSnapshot(
  productId: string,
  planId: PlanId,
  isLifetime: boolean
): Promise<PriceSnapshot> {
  try {
    await ensureIapInitialized();
    const type = isLifetime ? "in-app" : "subs";
    const products = await fetchProducts({ skus: [productId], type });
    const list = Array.isArray(products) ? products : [];
    const p = list.find((x) => x.id === productId) as
      | Record<string, unknown>
      | undefined;
    if (!p) {
      return fallbackPriceFromPlan(planId);
    }

    if (isLifetime) {
      const oneTime = p.oneTimePurchaseOfferDetails as
        | {
            priceAmountMicros?: string;
            priceCurrencyCode?: string;
          }
        | undefined;
      if (oneTime?.priceAmountMicros != null) {
        const micros = Number(oneTime.priceAmountMicros);
        if (!Number.isNaN(micros) && micros > 0) {
          return {
            value: micros / 1_000_000,
            currency: String(oneTime.priceCurrencyCode || "USD"),
            source: "one_time_offer",
          };
        }
      }
      const lifetimeFromDisplay = tryAndroidPriceSnapshotFromStoreProduct(p);
      if (lifetimeFromDisplay) {
        return lifetimeFromDisplay;
      }
    } else {
      const sub = p as unknown as ProductSubscriptionAndroid;
      const offers = sub.subscriptionOfferDetailsAndroid ?? [];
      for (const offer of offers) {
        const phases = offer.pricingPhases?.pricingPhaseList ?? [];
        const paid = phases.filter(
          (ph) =>
            Number((ph as { priceAmountMicros?: string }).priceAmountMicros) > 0
        );
        const lastPaid = paid[paid.length - 1] as
          | { priceAmountMicros?: string; priceCurrencyCode?: string }
          | undefined;
        if (lastPaid?.priceAmountMicros) {
          const micros = Number(lastPaid.priceAmountMicros);
          if (!Number.isNaN(micros) && micros > 0) {
            return {
              value: micros / 1_000_000,
              currency: String(lastPaid.priceCurrencyCode || "USD"),
              source: "subscription_last_paid_phase",
            };
          }
        }
        const firstPaid = phases.find(
          (ph) =>
            Number((ph as { priceAmountMicros?: string }).priceAmountMicros) > 0
        ) as
          | { priceAmountMicros?: string; priceCurrencyCode?: string }
          | undefined;
        if (firstPaid?.priceAmountMicros) {
          const micros = Number(firstPaid.priceAmountMicros);
          if (!Number.isNaN(micros) && micros > 0) {
            return {
              value: micros / 1_000_000,
              currency: String(firstPaid.priceCurrencyCode || "USD"),
              source: "subscription_first_paid_phase",
            };
          }
        }
      }
      const subFromDisplay = tryAndroidPriceSnapshotFromStoreProduct(p);
      if (subFromDisplay) {
        return subFromDisplay;
      }
    }
  } catch (e) {
    useAppLogsStore
      .getState()
      .warn(`${LOG} resolveAndroidPriceSnapshot failed`, {
        error: String(e),
        productId,
      });
  }
  const loadedStoreFallback = await fallbackPriceSnapshotFromLoadedStoreMap(
    planId
  );
  if (loadedStoreFallback) {
    return loadedStoreFallback;
  }
  return fallbackPriceFromPlan(planId);
}

async function resolveIosPriceSnapshot(
  productId: string,
  planId: PlanId,
  isLifetime: boolean
): Promise<PriceSnapshot> {
  try {
    await ensureIapInitialized();
    const type = isLifetime ? "in-app" : "subs";
    const products = await fetchProducts({ skus: [productId], type });
    const list = Array.isArray(products) ? products : [];
    const p = list.find((x) => x.id === productId) as
      | Record<string, unknown>
      | undefined;
    if (!p) {
      return fallbackPriceFromPlan(planId);
    }
    const currency = String(p.currency || "USD");
    let value = 0;
    if (typeof p.price === "number" && p.price > 0) {
      value = p.price;
    } else if (typeof p.localizedPrice === "string") {
      value = parseAnalyticsPriceString(p.localizedPrice);
    } else if (typeof p.price === "string") {
      value = parseAnalyticsPriceString(p.price);
    }
    if (value > 0) {
      return { value, currency, source: "storekit_product" };
    }
  } catch (e) {
    useAppLogsStore.getState().warn(`${LOG} resolveIosPriceSnapshot failed`, {
      error: String(e),
      productId,
    });
  }
  return fallbackPriceFromPlan(planId);
}

function fallbackPriceFromPlan(planId: PlanId): PriceSnapshot {
  const plan = getPlanById(planId);
  if (!plan) {
    return { value: 0, currency: "USD", source: "unresolved" };
  }
  if (typeof plan.price === "number" && plan.price > 0) {
    return { value: plan.price, currency: "USD", source: "local_pack_item" };
  }
  const parsed = plan.priceDisplay
    ? parseAnalyticsPriceString(plan.priceDisplay)
    : 0;
  if (parsed > 0) {
    return { value: parsed, currency: "USD", source: "local_pack_item" };
  }
  return { value: 0, currency: "USD", source: "unresolved" };
}

function logPackAcknowledgementEvent(purchase: Purchase): void {
  const productIds = getAndroidProductIds(purchase);
  const packName = productIds[0];
  if (!packName) {
    useAppLogsStore.getState().debug(`${LOG} skip pack event — no product id`);
    return;
  }
  const eventName =
    getBirdzyPackAnalyticsEvent(packName) ??
    sanitizeProductIdToAnalyticsEventName(packName);
  const p = purchase as unknown as {
    isAutoRenewingAndroid?: boolean;
    purchaseState?: number;
    isAcknowledged?: boolean;
  };
  analyticsService.logEvent(eventName, {
    pack_name: packName,
    purchase_token: purchase.purchaseToken ?? "",
    order_id: getAndroidOrderId(purchase),
    purchase_time:
      typeof purchase.transactionDate === "number"
        ? purchase.transactionDate
        : Date.now(),
    is_acknowledged: Boolean(p.isAcknowledged),
    is_auto_renewing: Boolean(p.isAutoRenewingAndroid),
    purchase_state: p.purchaseState ?? -1,
    product_ids: productIds.join(","),
  });
}

/**
 * Parity with native: `trial_purchase` + `Trial_started`; records pending product for `Trial_converted`.
 */
async function logTrialPurchaseAnalytics(
  purchase: Purchase,
  platform: "android" | "ios"
): Promise<void> {
  const productId =
    platform === "android"
      ? getAndroidProductIds(purchase)[0] ?? purchase.productId ?? ""
      : purchase.productId ?? "";
  const productIdsStr =
    platform === "android"
      ? getAndroidProductIds(purchase).join(",")
      : productId;
  const orderOrTx =
    platform === "android"
      ? getAndroidOrderId(purchase)
      : getIosTransactionId(purchase);
  const purchaseState =
    platform === "android"
      ? readablePurchaseState(
          (purchase as unknown as { purchaseState?: number }).purchaseState
        )
      : readablePurchaseStateWithIosDefault(purchase);

  const baseParams: Record<string, string> = {
    product_id: productId,
    pack_name: productId,
    product_ids: productIdsStr,
    is_trial: "true",
    purchase_state: purchaseState,
    order_id: orderOrTx || "N/A",
    purchase_token: purchase.purchaseToken ?? "",
  };

  analyticsService.logEvent(EVENTS.trial_purchase, baseParams);
  analyticsService.logEvent(EVENTS.trial_started, baseParams);
  await setTrialPendingProductId(productId);
}

function logIosPackPurchaseEvent(purchase: Purchase): void {
  const productId = purchase.productId ?? "";
  if (!productId) {
    useAppLogsStore
      .getState()
      .debug(`${LOG} skip iOS pack event — no product id`);
    return;
  }
  const eventName =
    getBirdzyPackAnalyticsEvent(productId) ??
    sanitizeProductIdToAnalyticsEventName(productId);
  const tx = getIosTransactionId(purchase);
  analyticsService.logEvent(eventName, {
    pack_name: productId,
    purchase_token: purchase.purchaseToken ?? "",
    order_id: tx,
    purchase_time:
      typeof purchase.transactionDate === "number"
        ? purchase.transactionDate
        : Date.now(),
    is_acknowledged: true,
    is_auto_renewing: false,
    purchase_state: readablePurchaseStateWithIosDefault(purchase),
    product_ids: productId,
  });
}

async function logPaidPurchaseAnalyticsAndroidIfNeeded(
  purchase: Purchase,
  planId: PlanId,
  isTrial: boolean,
  preResolvedPrice?: PriceSnapshot
): Promise<void> {
  tracePaidPurchase("04_enter logPaidPurchaseAnalyticsAndroidIfNeeded", {
    platform: "android",
    planId,
    isTrial,
    productId: getAndroidProductIds(purchase)[0] ?? purchase.productId ?? "",
  });

  if (isTrial) {
    tracePaidPurchase(
      "05_trial purchase also dispatches paid_purchase + paid_purchase_ga4",
      {
        platform: "android",
        planId,
        productId:
          getAndroidProductIds(purchase)[0] ?? purchase.productId ?? "",
      }
    );
  }
  const orderId = getAndroidOrderId(purchase);
  if (orderId) {
    const composite = paidPurchaseDedupeKey("android", orderId);
    const prev = await readPaidPurchaseDedupeComposite();
    if (prev === composite) {
      tracePaidPurchase("05_SKIP paid_purchase + paid_purchase_ga4", {
        reason: "dedupe_same_order_id",
        detail:
          "AsyncStorage says we already logged paid_purchase for this order_id.",
        composite,
        orderId,
      });
      useAppLogsStore
        .getState()
        .info(`${LOG} skip Firebase paid_purchase (duplicate order)`, {
          composite,
          orderId,
        });
      return;
    }
  }

  const productId =
    getAndroidProductIds(purchase)[0] ?? purchase.productId ?? "";
  const isLifetime = isLifetimePlanId(planId);
  const snapshot =
    preResolvedPrice ??
    (await resolveAndroidPriceSnapshot(
      productId || purchase.productId,
      planId,
      isLifetime
    ));
  const androidPs = (purchase as unknown as { purchaseState?: number })
    .purchaseState;
  // Omit purchase_token: GA4 dedup uses transaction_id; tokens are long and can break Firebase param limits.
  const payload: Record<string, string | number> = {
    ...ga4RevenueParams(snapshot),
    plan_id: planId,
    plan_type: getPlanTypeLabelForAnalytics(planId),
    transaction_id: orderId || "N/A",
    product_id: productId,
    item_id: productId,
    is_trial: String(isTrial),
    purchase_state: readablePurchaseState(androidPs),
  };

  tracePaidPurchase("06_OK dispatch Firebase revenue events", {
    platform: "android",
    events: [EVENTS.paid_purchase, EVENTS.paid_purchase_ga4],
    transaction_id: orderId || "N/A",
    value: payload.value,
    currency: payload.currency,
    price_source: snapshot.source,
  });
  useAppLogsStore
    .getState()
    .info(`${LOG} [Analytics] paid_purchase fired → Firebase`, {
      platform: "android",
      planId,
      event: EVENTS.paid_purchase,
      payload,
      price_source: snapshot.source,
    });
  analyticsService.logEvent(EVENTS.paid_purchase, payload);
  analyticsService.logEvent(EVENTS.paid_purchase_ga4, payload);
  if (!isTrial) {
    await maybeLogTrialConvertedAfterPaid(productId, payload);
  }

  if (orderId) {
    await writePaidPurchaseDedupeComposite(
      paidPurchaseDedupeKey("android", orderId)
    );
  }
}

async function logPaidPurchaseAnalyticsIosIfNeeded(
  purchase: Purchase,
  planId: PlanId,
  isTrial: boolean,
  preResolvedPrice?: PriceSnapshot
): Promise<void> {
  tracePaidPurchase("04_enter logPaidPurchaseAnalyticsIosIfNeeded", {
    platform: "ios",
    planId,
    isTrial,
    productId: purchase.productId ?? "",
  });

  if (isTrial) {
    tracePaidPurchase(
      "05_trial purchase also dispatches paid_purchase + paid_purchase_ga4",
      {
        platform: "ios",
        planId,
        productId: purchase.productId ?? "",
      }
    );
  }
  const txId = getIosTransactionId(purchase);
  if (txId) {
    const composite = paidPurchaseDedupeKey("ios", txId);
    const prev = await readPaidPurchaseDedupeComposite();
    if (prev === composite) {
      tracePaidPurchase("05_SKIP paid_purchase + paid_purchase_ga4", {
        reason: "dedupe_same_transaction_id",
        detail:
          "AsyncStorage says we already logged paid_purchase for this transaction_id.",
        composite,
        transaction_id: txId,
      });
      useAppLogsStore
        .getState()
        .info(`${LOG} skip Firebase paid_purchase (duplicate transaction)`, {
          composite,
          transaction_id: txId,
        });
      return;
    }
  }

  const productId = purchase.productId ?? "";
  const isLifetime = isLifetimePlanId(planId);
  const snapshot =
    preResolvedPrice ??
    (await resolveIosPriceSnapshot(productId, planId, isLifetime));
  // Omit purchase_token: GA4 dedup uses transaction_id; tokens can break Firebase param limits.
  const payload: Record<string, string | number> = {
    ...ga4RevenueParams(snapshot),
    plan_id: planId,
    plan_type: getPlanTypeLabelForAnalytics(planId),
    transaction_id: txId || "N/A",
    product_id: productId,
    item_id: productId,
    is_trial: String(isTrial),
    purchase_state: readablePurchaseStateWithIosDefault(purchase),
  };

  tracePaidPurchase("06_OK dispatch Firebase revenue events", {
    platform: "ios",
    events: [EVENTS.paid_purchase, EVENTS.paid_purchase_ga4],
    transaction_id: txId || "N/A",
    value: payload.value,
    currency: payload.currency,
    price_source: snapshot.source,
  });
  useAppLogsStore
    .getState()
    .info(`${LOG} [Analytics] paid_purchase fired → Firebase`, {
      platform: "ios",
      planId,
      event: EVENTS.paid_purchase,
      payload,
      price_source: snapshot.source,
    });
  analyticsService.logEvent(EVENTS.paid_purchase, payload);
  analyticsService.logEvent(EVENTS.paid_purchase_ga4, payload);
  if (!isTrial) {
    await maybeLogTrialConvertedAfterPaid(productId, payload);
  }

  if (txId) {
    await writePaidPurchaseDedupeComposite(paidPurchaseDedupeKey("ios", txId));
  }
}

/** After a paid (non-trial) purchase: if same product had `Trial_started`, emit `Trial_converted` and clear pending. */
async function maybeLogTrialConvertedAfterPaid(
  productId: string,
  payload: Record<string, string | number>
): Promise<void> {
  const pending = await readTrialPendingProductId();
  if (!pending) {
    tracePaidPurchase("07_trial_converted: skip", {
      reason: "no_pending_trial_product_in_storage",
      productId,
    });
    return;
  }
  if (pending === productId) {
    tracePaidPurchase("07_trial_converted: dispatch Firebase", {
      event: EVENTS.trial_converted,
      productId,
    });
    analyticsService.logEvent(EVENTS.trial_converted, payload);
  } else {
    tracePaidPurchase("07_trial_converted: skip", {
      reason: "pending_product_id_mismatch",
      pending,
      productId,
      detail: "Clearing pending key anyway.",
    });
  }
  await clearTrialPendingProductId();
}

/**
 * Android: call immediately after `acknowledgePurchaseAndroid` succeeds.
 */
export async function logAndroidPurchaseAnalyticsAfterAcknowledge(params: {
  purchase: Purchase;
  planId: PlanId;
}): Promise<AndroidAckAnalyticsResult> {
  const { purchase, planId } = params;
  tracePaidPurchase("01_android pipeline start (after acknowledgePurchase)", {
    planId,
    productId: purchase.productId,
  });
  useAppLogsStore
    .getState()
    .info("[IAP] Purchase success triggered (Android ACK analytics)", {
      planId,
      productId: purchase.productId,
      purchaseTokenPreview: purchase.purchaseToken?.slice(0, 16),
    });

  const productId =
    getAndroidProductIds(purchase)[0] ?? purchase.productId ?? "";
  const pendingTrialPid = await readTrialPendingProductId();
  const productListsTrialPhase = await detectAndroidTrialFromProductDetails(
    purchase
  );
  const selectedOfferIsTrial = await isSelectedAndroidOfferFreeTrial(productId);
  /** After trial_started, pending stores product id; next charge must be paid_purchase, not trial again. */
  const isPostTrialConversion = pendingTrialPid === productId;
  const useTrialAnalyticsPath =
    !isPostTrialConversion &&
    productListsTrialPhase &&
    selectedOfferIsTrial;

  tracePaidPurchase("02_evaluate trial vs paid path", {
    platform: "android",
    useTrialAnalyticsPath,
    isPostTrialConversion,
    productId,
    planId,
    flags: {
      productListsTrialPhase,
      selectedOfferIsTrial,
      pendingTrialPid,
    },
    ifTrialPathMeans:
      "Will log trial_purchase / Trial_started AND paid_purchase / paid_purchase_ga4.",
    ifPaidPathMeans:
      "Will call logPaidPurchaseAnalyticsAndroidIfNeeded → paid_purchase (unless skipped inside).",
  });

  useAppLogsStore.getState().info("[Analytics] Evaluating purchase path", {
    useTrialAnalyticsPath,
    isPostTrialConversion,
    productId,
    planId,
  });

  if (!isAndroidPurchasePurchased(purchase)) {
    const ps = (purchase as unknown as { purchaseState?: number })
      .purchaseState;
    tracePaidPurchase("03_BLOCKED no pack/trial/paid analytics", {
      reason: "purchase_state_not_PURCHASED",
      detail:
        "Android Billing purchaseState must be 1 (PURCHASED). paid_purchase will NOT run.",
      purchaseState: ps,
      readable: readablePurchaseState(ps),
    });
    useAppLogsStore
      .getState()
      .info(
        `${LOG} skip pack / trial / paid analytics — Android purchase_state is not PURCHASED`,
        {
          purchaseState: ps,
        }
      );
    return { includesTrial: false };
  }

  const isLifetime = isLifetimePlanId(planId);
  const priceSnapshot = await resolveAndroidPriceSnapshot(
    productId || purchase.productId,
    planId,
    isLifetime
  );
  logPackAcknowledgementEvent(purchase);

  if (useTrialAnalyticsPath) {
    tracePaidPurchase("03_ROUTE trial analytics + paid analytics", {
      planId,
      productId,
      reason:
        "Default offer first phase is free trial and this is not post-trial conversion.",
    });
    useAppLogsStore
      .getState()
      .info(`${LOG} analytics path: trial (trial_purchase / Trial_started)`, {
        planId,
        productId,
        includesTrial: true,
        isPostTrialConversion,
        pendingTrialPid,
        selectedOfferIsTrial,
      });
    await logTrialPurchaseAnalytics(purchase, "android");
    await logPaidPurchaseAnalyticsAndroidIfNeeded(
      purchase,
      planId,
      true,
      priceSnapshot
    );
  } else {
    tracePaidPurchase(
      "03_ROUTE paid analytics → logPaidPurchaseAnalyticsAndroidIfNeeded",
      {
        planId,
        productId,
        reason: isPostTrialConversion
          ? "Post-trial paid charge (or no trial on default offer)."
          : "Direct paid purchase (no trial path).",
      }
    );
    useAppLogsStore
      .getState()
      .info(`${LOG} analytics path: paid (paid_purchase)`, {
        planId,
        productId,
        includesTrial: false,
        isPostTrialConversion,
        pendingTrialPid,
        productListsTrialPhase,
        selectedOfferIsTrial,
      });
    await logPaidPurchaseAnalyticsAndroidIfNeeded(
      purchase,
      planId,
      false,
      priceSnapshot
    );
  }

  return { includesTrial: useTrialAnalyticsPath };
}

/**
 * iOS: call after successful `subscribeApple` (backend confirmed purchase).
 * `includesTrial` must match the payload sent to the backend.
 */
export async function logIosPurchaseAnalyticsAfterBackendSuccess(params: {
  purchase: Purchase;
  planId: PlanId;
  includesTrial: boolean;
}): Promise<void> {
  const { purchase, planId, includesTrial } = params;
  tracePaidPurchase(
    "01_iOS pipeline start (after subscribeApple / backend OK)",
    {
      planId,
      productId: purchase.productId,
      includesTrialFromBackend: includesTrial,
    }
  );
  useAppLogsStore
    .getState()
    .info("[IAP] Purchase success triggered (iOS backend OK)", {
      planId,
      productId: purchase.productId,
      includesTrial,
      transactionId:
        (purchase as Purchase & { transactionId?: string }).transactionId ?? "",
    });
  const productId = purchase.productId ?? "";
  const pendingTrialPid = await readTrialPendingProductId();
  const useTrialAnalyticsPath = includesTrial && pendingTrialPid !== productId;
  tracePaidPurchase("02_evaluate trial vs paid path (iOS)", {
    platform: "ios",
    useTrialAnalyticsPath,
    isPostTrialConversion: pendingTrialPid === productId,
    productId,
    planId,
    includesTrialFromBackend: includesTrial,
    pendingTrialPid,
    ifTrialPathMeans:
      "Backend says trial AND pending trial product ≠ this product → trial_purchase + paid_purchase path.",
    ifPaidPathMeans:
      "Otherwise → logPaidPurchaseAnalyticsIosIfNeeded → paid_purchase.",
  });
  useAppLogsStore
    .getState()
    .info("[Analytics] Evaluating purchase path (iOS)", {
      useTrialAnalyticsPath,
      isPostTrialConversion: pendingTrialPid === productId,
      productId,
      planId,
      includesTrial,
    });
  const isLifetime = isLifetimePlanId(planId);
  const priceSnapshot = await resolveIosPriceSnapshot(
    productId,
    planId,
    isLifetime
  );
  logIosPackPurchaseEvent(purchase);
  if (useTrialAnalyticsPath) {
    tracePaidPurchase("03_ROUTE trial analytics + paid analytics", {
      planId,
      productId,
      reason:
        "includesTrial && pendingTrialPid !== productId (trial start flow).",
    });
    useAppLogsStore
      .getState()
      .info(`${LOG} analytics path: trial (trial_purchase / Trial_started)`, {
        planId,
        productId,
        includesTrial: true,
        pendingTrialPid,
      });
    await logTrialPurchaseAnalytics(purchase, "ios");
    await logPaidPurchaseAnalyticsIosIfNeeded(
      purchase,
      planId,
      true,
      priceSnapshot
    );
  } else {
    tracePaidPurchase(
      "03_ROUTE paid analytics → logPaidPurchaseAnalyticsIosIfNeeded",
      {
        planId,
        productId,
        reason: includesTrial
          ? "Same product as pending trial → post-trial paid (paid_purchase)."
          : "Backend includesTrial false → direct paid.",
      }
    );
    useAppLogsStore
      .getState()
      .info(`${LOG} analytics path: paid (paid_purchase)`, {
        planId,
        productId,
        includesTrial: false,
        includesTrialFromPlan: includesTrial,
        pendingTrialPid,
      });
    await logPaidPurchaseAnalyticsIosIfNeeded(
      purchase,
      planId,
      false,
      priceSnapshot
    );
  }
}
