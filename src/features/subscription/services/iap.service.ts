/**
 * In-App Purchase service
 * Wraps react-native-iap and maps purchases to backend payloads (GoogleSubscriptionRequest / AppleSubscriptionRequest).
 */

import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { useAppLogsStore } from "../../../features/app-logs/app-logs.store";
import {
  initConnection,
  endConnection,
  fetchProducts,
  getAvailablePurchases,
  getReceiptIOS,
  requestReceiptRefreshIOS,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  acknowledgePurchaseAndroid,
  consumePurchaseAndroid as consumePurchaseAndroidNative,
  type Purchase,
  type PurchaseError,
} from "react-native-iap";
import type {
  ProductSubscription,
  ProductSubscriptionAndroid,
} from "react-native-iap";
import type {
  GoogleSubscriptionRequest,
  AppleSubscriptionRequest,
} from "../../../services/api/features/auth.api.types";
import type { PlanId } from "../../../config/subscriptionConfig";
import {
  getPlanById,
  getAllSubscriptionPlans,
} from "../../../config/subscriptionConfig";
import { hasRealStorePrice } from "../utils/storePlanPricing";
import {
  formattedPriceMatchesExpectedCurrency,
  getAndroidSubscriptionFormattedPrice,
  getAndroidSubscriptionOfferToken,
  resolveProductCurrency,
  resolveProductDisplayPrice,
} from "../utils/iapPriceDisplay";
import { APPLE_RECEIPT_SHARED_SECRET } from "../../../constants/env";

export type { Purchase, PurchaseError };
export { getReceiptIOS };

/** Minimum PKCS#7 app receipt length for Apple verifyReceipt (same guard as legacy App Store receipt checks). */
export const MIN_IOS_APP_STORE_RECEIPT_LENGTH = 1000;
let lastKnownValidIosAppReceipt: string | null = null;

/** Plan IDs that are one-time lifetime purchases (not recurring). */
function isLifetimePlan(planId: PlanId): boolean {
  return planId.toLowerCase().includes("lifetime");
}

/** Plan preference for "best" entitlement when restoring: lifetime > yearly > weekly/monthly */
function getPlanPriority(planId: PlanId): number {
  const id = planId.toLowerCase();
  if (id.includes("lifetime")) return 4;
  if (id.includes("yearly")) return 2;
  if (id.includes("weekly") || id.includes("week")) return 1;
  return 1;
}

/**
 * Extract display price from IAP product (subs or in-app).
 * Prefer store-formatted strings (displayPrice / localizedPrice). Numeric fallback uses
 * device country (e.g. IN → INR) when StoreKit 2 omits currency.
 */
function getDisplayPriceFromProduct(product: Record<string, unknown>): string {
  const productId = (product.id as string) ?? "unknown";
  const log = useAppLogsStore.getState();
  const expectedCurrency = resolveProductCurrency(product);

  const resolved = resolveProductDisplayPrice(product);
  if (resolved) {
    log.info("[IAP] getDisplayPriceFromProduct using resolved store price", {
      productId,
      platform: Platform.OS,
      price: resolved.substring(0, 30),
      expectedCurrency,
    });
    return resolved;
  }

  const androidSubPrice = getAndroidSubscriptionFormattedPrice(product);
  if (
    androidSubPrice &&
    formattedPriceMatchesExpectedCurrency(androidSubPrice, expectedCurrency)
  ) {
    log.info(
      "[IAP] getDisplayPriceFromProduct Android using subscriptionOfferDetails",
      {
        productId,
        price: androidSubPrice.substring(0, 30),
        expectedCurrency,
      }
    );
    return androidSubPrice;
  }

  log.warn("[IAP] getDisplayPriceFromProduct no price found", { productId });
  return "";
}

/** Single-flight init so parallel callers (paywall prices + useIapPurchase) share one connection. */
let iapInitPromise: Promise<boolean> | null = null;

/**
 * Ensures `initConnection()` has completed exactly once (shared promise). Use before any
 * `fetchProducts` / purchase / `getAvailablePurchases` to avoid "Connection not initialized".
 */
export async function ensureIapInitialized(): Promise<boolean> {
  if (!iapInitPromise) {
    iapInitPromise = initIapConnectionOnce();
  }
  try {
    return await iapInitPromise;
  } catch (e) {
    iapInitPromise = null;
    throw e;
  }
}

async function initIapConnectionOnce(): Promise<boolean> {
  const log = useAppLogsStore.getState();
  try {
    const result = await initConnection();
    log.info("[IAP] initConnection", {
      success: result,
      platform: Platform.OS,
    });
    if (Platform.OS === "ios" && result) {
      log.info("[IAP] iOS: StoreKit connection ready");
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    return result;
  } catch (e) {
    log.error("[IAP] initConnection failed", {
      error: String(e),
      platform: Platform.OS,
    });
    throw e;
  }
}

/**
 * Initialize IAP connection. Delegates to {@link ensureIapInitialized} (singleton).
 */
export async function initIapConnection(): Promise<boolean> {
  return ensureIapInitialized();
}

/**
 * Disconnect IAP. Call on logout or when leaving subscription flow if desired.
 */
export async function disconnectIap(): Promise<boolean> {
  iapInitPromise = null;
  return endConnection();
}

/**
 * Fetch all IAP products for the given plan IDs and return planId -> displayPrice map.
 * - SUBS (recurring): fetchProducts(type='subs'); map keyed only by product id returned by store.
 * - IAP (one-time): fetchProducts(type='in-app'); map keyed only by product id returned by store.
 * Each plan's price is set only when the store returns that exact product id; no cross-plan assignment.
 */
export async function fetchAllProductPrices(
  planIds: PlanId[]
): Promise<Map<string, string>> {
  const priceMap = new Map<string, string>();
  if (planIds.length === 0) return priceMap;

  const log = useAppLogsStore.getState();
  log.info("[IAP] ensuring connection before fetching products");
  const connected = await ensureIapInitialized();
  if (!connected) {
    log.warn(
      "[IAP] fetchAllProductPrices skipped (initConnection returned false)",
      { planIds }
    );
    return priceMap;
  }
  log.info("[IAP] fetchAllProductPrices input planIds", { planIds });

  const subsPlanIds: PlanId[] = [];
  const iapPlanIds: PlanId[] = [];
  for (const id of planIds) {
    const plan = getPlanById(id);
    if (plan?.recurring) subsPlanIds.push(id);
    else if (plan) iapPlanIds.push(id);
  }

  const subsSkus = subsPlanIds.map((id) => getProductIdForPlan(id));
  const iapSkus = iapPlanIds.map((id) => getProductIdForPlan(id));

  const storeSkuToPlanId = new Map<string, PlanId>();
  for (const planId of [...subsPlanIds, ...iapPlanIds]) {
    storeSkuToPlanId.set(getProductIdForPlan(planId), planId);
  }

  log.info("[IAP] fetchAllProductPrices SKUs sent to fetchProducts", {
    subs: subsSkus,
    iap: iapSkus,
  });

  try {
    if (subsSkus.length > 0) {
      const products = await fetchProducts({ skus: subsSkus, type: "subs" });
      const arr = Array.isArray(products) ? products : [];
      const returnedIds: string[] = [];
      for (const product of arr) {
        const productId = (product as { id?: string }).id;
        if (!productId) continue;
        returnedIds.push(productId);
        const price = getDisplayPriceFromProduct(
          product as unknown as Record<string, unknown>
        );
        const planId = storeSkuToPlanId.get(productId) ?? productId;
        if (hasRealStorePrice(price)) priceMap.set(planId, price);
      }
      log.info(
        "[IAP] fetchAllProductPrices getSubscriptions (type=subs) returned",
        {
          requested: subsSkus,
          returnedIds,
          pricesFound: returnedIds
            .map((id) => storeSkuToPlanId.get(id) ?? id)
            .filter((id) => priceMap.has(id)),
        }
      );
    }
    if (iapSkus.length > 0) {
      const products = await fetchProducts({ skus: iapSkus, type: "in-app" });
      const arr = Array.isArray(products) ? products : [];
      const returnedIds: string[] = [];
      for (const product of arr) {
        const productId = (product as { id?: string }).id;
        if (!productId) continue;
        returnedIds.push(productId);
        const price = getDisplayPriceFromProduct(
          product as unknown as Record<string, unknown>
        );
        const planId = storeSkuToPlanId.get(productId) ?? productId;
        if (hasRealStorePrice(price)) priceMap.set(planId, price);
      }
      log.info(
        "[IAP] fetchAllProductPrices getProducts (type=in-app) returned",
        {
          requested: iapSkus,
          returnedIds,
          pricesFound: returnedIds
            .map((id) => storeSkuToPlanId.get(id) ?? id)
            .filter((id) => priceMap.has(id)),
        }
      );
    }
    log.info("[IAP] fetchAllProductPrices merged (store-only keys)", {
      requestedCount: planIds.length,
      resolvedCount: priceMap.size,
      resolvedPlanIds: Array.from(priceMap.keys()),
    });
  } catch (e) {
    log.warn("[IAP] fetchAllProductPrices failed", { error: String(e) });
  }
  return priceMap;
}

/**
 * Get store product ID for a plan on the current platform.
 */
export function getProductIdForPlan(planId: PlanId): string {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return Platform.OS === "android" ? plan.productIdAndroid : plan.productIdIos;
}

/**
 * All subscription product IDs (monthly, yearly, yearly_half) for fetching from store.
 * Uses getAllSubscriptionPlans() so both full and half SKUs work for restore/purchase.
 */
export function getSubscriptionProductIds(): string[] {
  return getAllSubscriptionPlans()
    .filter((p) => p.recurring)
    .map((p) =>
      Platform.OS === "android" ? p.productIdAndroid : p.productIdIos
    );
}

/**
 * Primary lifetime product ID for current platform (first lifetime plan).
 * Uses getAllSubscriptionPlans() so both full and half SKUs work.
 */
export function getLifetimeProductId(): string {
  const plan = getAllSubscriptionPlans().find((p) => !p.recurring);
  if (!plan) {
    throw new Error("No lifetime plan in subscription config");
  }
  return Platform.OS === "android" ? plan.productIdAndroid : plan.productIdIos;
}

function getPlanIdFromProductId(productId: string): PlanId | undefined {
  const plan = getAllSubscriptionPlans().find(
    (p) =>
      (Platform.OS === "android" ? p.productIdAndroid : p.productIdIos) ===
      productId
  );
  return plan?.id;
}

/**
 * Get available (owned/active) purchases from the store and return only our product IDs,
 * sorted by plan preference (lifetime > yearly > monthly) so the "best" entitlement is first.
 * Use this to restore purchase history and sync with backend so user shows as premium.
 */
export async function getOurAvailablePurchases(): Promise<
  Array<{ purchase: Purchase; planId: PlanId }>
> {
  const connected = await ensureIapInitialized();
  if (!connected) {
    useAppLogsStore
      .getState()
      .warn(
        "[IAP] getOurAvailablePurchases skipped (initConnection returned false)"
      );
    return [];
  }
  const purchases = await getAvailablePurchases({
    onlyIncludeActiveItemsIOS: true,
  });
  const ourPurchases = purchases
    .map((purchase) => {
      const planId = getPlanIdFromProductId(purchase.productId);
      return planId ? { purchase, planId } : null;
    })
    .filter((x): x is { purchase: Purchase; planId: PlanId } => x !== null);
  ourPurchases.sort(
    (a, b) => getPlanPriority(b.planId) - getPlanPriority(a.planId)
  );
  useAppLogsStore.getState().info("[IAP] getOurAvailablePurchases", {
    count: ourPurchases.length,
    planIds: ourPurchases.map((p) => p.planId),
  });
  return ourPurchases;
}

/**
 * Request purchase for a plan:
 * - Android subscription (monthly/yearly): fetches subscription offers, then requestSubscription
 * - Android lifetime: requestPurchase with skus
 * - iOS subscription: requestSubscription with sku
 * - iOS lifetime: requestPurchase with sku
 * The actual result is delivered via purchaseUpdatedListener; this only starts the flow.
 */
export async function requestPlanPurchase(planId: PlanId): Promise<void> {
  const connected = await ensureIapInitialized();
  if (!connected) {
    throw new Error(
      "Store connection unavailable (initConnection returned false)"
    );
  }
  const productId = getProductIdForPlan(planId);
  const isLifetime = isLifetimePlan(planId);
  const log = useAppLogsStore.getState();
  log.info("[IAP] requestPlanPurchase", {
    planId,
    productId,
    isLifetime,
    platform: Platform.OS,
  });
  log.info("[IAP] Purchase requested", { productId });
  log.info("[IAP PaidPurchase] -1_user_initiated_buy (requestPlanPurchase)", {
    planId,
    productId,
    platform: Platform.OS,
    next: "native store UI → purchaseUpdatedListener (step 00 on success)",
  });

  if (Platform.OS === "android") {
    if (isLifetime) {
      console.log("[IAP-DEBUG] Android lifetime purchase", { planId, productId });
      log.info("[IAP-DEBUG] Android lifetime purchase", { planId, productId });
      await requestPurchase({
        request: { google: { skus: [productId] } },
        type: "in-app",
      });
    } else {
      console.log("[IAP-DEBUG] Android subscription purchase: fetching subs", {
        planId,
        productId,
      });
      log.info("[IAP-DEBUG] Android subscription purchase: fetching subs", {
        planId,
        productId,
      });
      const subs = await fetchProducts({ skus: [productId], type: "subs" });
      const subsArr = Array.isArray(subs) ? subs : [];
      console.log("[IAP-DEBUG] fetchProducts(subs) returned", {
        productId,
        count: subsArr.length,
        ids: subsArr.map((s) => (s as { id?: string; type?: string }).id),
        types: subsArr.map((s) => (s as { id?: string; type?: string }).type),
      });
      log.info("[IAP-DEBUG] fetchProducts(subs) returned", {
        productId,
        count: subsArr.length,
        ids: subsArr.map((s) => (s as { id?: string; type?: string }).id),
      });
      const sub = subsArr.find(
        (s) => s.type === "subs" && s.id === productId
      ) as ProductSubscription | undefined;
      const subRecord = sub as unknown as Record<string, unknown> | undefined;
      console.log("[IAP-DEBUG] matched subscription product", {
        productId,
        found: Boolean(sub),
        keys: subRecord ? Object.keys(subRecord) : [],
        subscriptionOffersCount: Array.isArray(subRecord?.subscriptionOffers)
          ? subRecord!.subscriptionOffers!.length
          : 0,
        subscriptionOfferDetailsAndroidCount: Array.isArray(
          subRecord?.subscriptionOfferDetailsAndroid
        )
          ? subRecord!.subscriptionOfferDetailsAndroid!.length
          : 0,
        subscriptionOfferDetailsCount: Array.isArray(
          subRecord?.subscriptionOfferDetails
        )
          ? subRecord!.subscriptionOfferDetails!.length
          : 0,
      });
      log.info("[IAP-DEBUG] matched subscription product", {
        productId,
        found: Boolean(sub),
        keys: subRecord ? Object.keys(subRecord) : [],
      });
      const offerToken = subRecord
        ? getAndroidSubscriptionOfferToken(subRecord)
        : null;
      console.log("[IAP-DEBUG] resolved Android offer token", {
        productId,
        hasOfferToken: Boolean(offerToken),
        offerTokenPreview: offerToken ? `${offerToken.slice(0, 12)}…` : null,
      });
      log.info("[IAP-DEBUG] resolved Android offer token", {
        productId,
        hasOfferToken: Boolean(offerToken),
      });
      if (!offerToken) {
        const errMsg =
          "Subscription offer not found. Ensure products are configured in Play Console.";
        console.error("[IAP-DEBUG] Android subscription purchase aborted", {
          productId,
          reason: errMsg,
          subSnapshot: subRecord
            ? JSON.stringify(subRecord).slice(0, 2000)
            : null,
        });
        log.error("[IAP-DEBUG] Android subscription purchase aborted", {
          productId,
          reason: errMsg,
        });
        throw new Error(errMsg);
      }
      console.log("[IAP-DEBUG] calling requestPurchase(subs)", {
        productId,
        offerTokenPreview: `${offerToken.slice(0, 12)}…`,
      });
      log.info("[IAP-DEBUG] calling requestPurchase(subs)", { productId });
      await requestPurchase({
        request: {
          google: {
            skus: [productId],
            subscriptionOffers: [{ sku: productId, offerToken }],
          },
        },
        type: "subs",
      });
      console.log("[IAP-DEBUG] requestPurchase(subs) invoked (awaiting listener)", {
        productId,
      });
    }
  } else {
    console.log("[IAP-DEBUG] iOS purchase", {
      planId,
      productId,
      isLifetime,
      purchaseType: isLifetime ? "in-app" : "subs",
    });
    log.info("[IAP-DEBUG] iOS purchase", {
      planId,
      productId,
      isLifetime,
      purchaseType: isLifetime ? "in-app" : "subs",
    });
    if (isLifetime) {
      await requestPurchase({
        request: { apple: { sku: productId } },
        type: "in-app",
      });
    } else {
      await requestPurchase({
        request: { apple: { sku: productId } },
        type: "subs",
      });
    }
    console.log("[IAP-DEBUG] requestPurchase(apple) invoked (awaiting listener)", {
      productId,
      isLifetime,
    });
  }
}

/**
 * Build backend Google payload from a Purchase and plan.
 * When includesTrialOverride is provided (from Android ProductDetails trial detection), use it;
 * otherwise fall back to plan.trialDays > 0.
 * purchaseTime is always sent as ISO string for backend consistency.
 */
export function buildGoogleSubscriptionRequest(
  purchase: Purchase,
  planId: PlanId,
  options?: { includesTrial?: boolean }
): GoogleSubscriptionRequest {
  if (!purchase.purchaseToken) {
    throw new Error("Missing purchaseToken for Google purchase");
  }

  const purchaseTimeRaw =
    typeof purchase.transactionDate === "number"
      ? purchase.transactionDate
      : Date.now();

  const purchaseTime =
    typeof purchaseTimeRaw === "number"
      ? new Date(purchaseTimeRaw).toISOString()
      : String(purchaseTimeRaw);

  const includesTrial =
    options?.includesTrial !== undefined ? options.includesTrial : false;

  return {
    purchaseToken: purchase.purchaseToken,
    itemId: purchase.productId,
    purchaseTime,
    isProduct: isLifetimePlan(planId),
    isLifetimePurchase: isLifetimePlan(planId),
    includesTrial,
  };
}

/**
 * Precise Android trial detection from ProductDetails (Coinzy native parity).
 * Query subscription product and inspect subscriptionOfferDetails.pricingPhases:
 * Trial = any phase with priceAmountMicros == 0 AND billingCycleCount == 1.
 */
export async function detectAndroidTrialFromProductDetails(
  purchase: Purchase
): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }
  const log = useAppLogsStore.getState();
  try {
    await ensureIapInitialized();
    const subs = await fetchProducts({
      skus: [purchase.productId],
      type: "subs",
    });
    const sub = (Array.isArray(subs) ? subs : []).find(
      (s: { type?: string; id?: string }) =>
        s.type === "subs" && s.id === purchase.productId
    ) as ProductSubscriptionAndroid | undefined;
    if (!sub) {
      log.debug("[IAP] detectAndroidTrial: no subscription product", {
        productId: purchase.productId,
      });
      return false;
    }

    const phaseLists: Array<
      Array<{ priceAmountMicros?: string; billingCycleCount?: number }>
    > = [];

    for (const offer of sub.subscriptionOffers ?? []) {
      const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
      if (phases.length) phaseLists.push(phases);
    }
    for (const offer of sub.subscriptionOfferDetailsAndroid ?? []) {
      const phases = offer.pricingPhases?.pricingPhaseList ?? [];
      if (phases.length) phaseLists.push(phases);
    }

    if (!phaseLists.length) return false;

    for (const phases of phaseLists) {
      for (const phase of phases) {
        if (
          String(phase.priceAmountMicros) === "0" &&
          phase.billingCycleCount === 1
        ) {
          log.info("[IAP] detectAndroidTrial: trial phase found", {
            productId: purchase.productId,
          });
          return true;
        }
      }
    }
    log.debug("[IAP] detectAndroidTrial: no trial phase", {
      productId: purchase.productId,
    });
    return false;
  } catch (e) {
    log.warn("[IAP] detectAndroidTrial failed", {
      productId: purchase.productId,
      error: String(e),
    });
    return false;
  }
}

/**
 * Returns whether the current iOS environment should use Apple's sandbox for IAP.
 * Uses DeviceInfo.getInstallerPackageName() to detect TestFlight; otherwise falls back to __DEV__.
 * Used when building the Apple subscription payload. Backend must still call validateReceiptIosSmart
 * first; the return result to use is isSandbox = validation?.environment?.toLowerCase() === 'sandbox'.
 */
export async function getIsAppleSandbox(): Promise<boolean> {
  return getFallbackIsSandboxWhenAppleValidationFails();
}

/**
 * Build backend Apple payload from a Purchase (iOS only).
 * Sends receipt, isSandbox, isProduct, isLifetimePurchase, includesTrial.
 * Backend must call validateReceiptIosSmart before using isSandbox;
 * the return result is isSandbox = validation?.environment?.toLowerCase() === 'sandbox'.
 * On iOS, the receipt sent to the backend is the app receipt from {@link getIosAppStoreReceiptBase64OrThrow},
 * not `purchase.purchaseToken` (that value is a JWS on v14+).
 */
export async function buildAppleSubscriptionRequest(
  _purchase: Purchase,
  planId?: PlanId,
  options?: { preferCachedReceipt?: boolean; isUserInitiatedFlow?: boolean }
): Promise<AppleSubscriptionRequest> {
  let receipt =
    options?.preferCachedReceipt && lastKnownValidIosAppReceipt
      ? lastKnownValidIosAppReceipt
      : "";
  if (!receipt) {
    receipt = await getIosAppStoreReceiptBase64OrThrow({
      isUserInitiatedFlow: options?.isUserInitiatedFlow ?? true,
      allowInteractiveReceiptRefresh: false,
      maxAttempts: 1,
    });
  }
  const isSandbox = await getFallbackIsSandboxWhenAppleValidationFails();
  const isLifetime = planId ? isLifetimePlan(planId) : false;
  const plan = planId ? getPlanById(planId) : undefined;
  const includesTrial = !isLifetime && (plan?.trialDays ?? 0) > 0;

  if (Platform.OS === "ios") {
    useAppLogsStore
      .getState()
      .debug("[IAP] iOS buildAppleSubscriptionRequest", {
        hasReceipt: !!receipt,
        receiptLength: receipt.length,
        isSandbox,
        isProduct: isLifetime,
        isLifetimePurchase: isLifetime,
        includesTrial,
      });
  }
  return {
    receipt,
    isSandbox,
    isProduct: isLifetime,
    isLifetimePurchase: isLifetime,
    includesTrial,
  };
}

/**
 * Build Apple receipt body for validateReceiptIosSmart (e.g. on purchase success).
 * Uses APP_SHARED_SECRET from .env as the password. Use this instead of hardcoding the shared secret.
 */
export function buildAppleReceiptBody(receiptData: string): {
  "receipt-data": string;
  password: string;
} {
  if (!APPLE_RECEIPT_SHARED_SECRET) {
    useAppLogsStore
      .getState()
      .warn(
        "[IAP] APP_SHARED_SECRET is empty — auto-renewable verifyReceipt may fail (set APP_SHARED_SECRET in .env)"
      );
  }
  return {
    "receipt-data": receiptData,
    password: APPLE_RECEIPT_SHARED_SECRET,
  };
}

const APPLE_VERIFY_RECEIPT_PRODUCTION =
  "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_RECEIPT_SANDBOX =
  "https://sandbox.itunes.apple.com/verifyReceipt";
/** Sandbox receipt sent to production — retry with sandbox URL. */
const APPLE_STATUS_SANDBOX_RECEIPT = 21007;
/** Production receipt sent to sandbox — retry with production URL. */
const APPLE_STATUS_PRODUCTION_RECEIPT = 21008;

/**
 * Apple verifyReceipt `status` meanings (subset). See Apple TN-2413 / verifyReceipt docs.
 * Use in app logs only — helps QA map numeric codes.
 */
export function getAppleVerifyReceiptStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    0: "valid",
    21000: "App Store could not read the JSON object",
    21002: "receipt-data property malformed or missing",
    21003: "receipt could not be authenticated",
    21004: "shared secret does not match",
    21005: "receipt server unavailable",
    21006: "subscription expired (valid receipt, expired sub)",
    21007: "sandbox receipt sent to production — use sandbox URL",
    21008: "production receipt sent to sandbox — use production URL",
    21010: "receipt could not be found",
  };
  return labels[status] ?? `see Apple docs (status ${status})`;
}

/** Apple verifyReceipt JSON (subset). Only status === 0 means a valid receipt. */
export type AppleVerifyReceiptResult = {
  status: number;
  environment?: string;
  latest_receipt_info?: Array<{
    expires_date_ms?: string;
    is_trial_period?: string;
    is_in_intro_offer_period?: string;
    product_id?: string;
    transaction_id?: string;
    auto_renew_status?: string;
  }>;
};

async function postVerifyReceipt(
  url: string,
  receiptBody: { "receipt-data": string; password: string }
): Promise<AppleVerifyReceiptResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(receiptBody),
  });
  const result = await response.json();
  return result as AppleVerifyReceiptResult;
}

/**
 * When Apple validation fails (network/parse), derive isSandbox without trusting DEV alone as "sandbox".
 * Dev / TestFlight → true; release App Store builds → false.
 */
export async function getFallbackIsSandboxWhenAppleValidationFails(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  if (__DEV__) return true;
  const installer = await DeviceInfo.getInstallerPackageName();
  return installer === "TestFlight";
}

/** Max attempts for disk / StoreKit receipt read. Keep at 1 to avoid repeated popup/retry loops. */
const IOS_RECEIPT_OBTAIN_MAX_ATTEMPTS = 1;
/** Delay before attempt 2..N (ms). Attempt 1 is immediate. (unused when max attempts is 1). */
const IOS_RECEIPT_OBTAIN_RETRY_DELAYS_MS = [600, 1800, 3200] as const;
/** Product policy: never trigger interactive Apple sign-in from automatic receipt paths. */
const IOS_DISABLE_INTERACTIVE_RECEIPT_REFRESH = true;

/**
 * True for Nitro/StoreKit errors that often succeed on retry (e.g. `service-error`, "Unable to Complete Request").
 */
export function isTransientIosStoreKitError(err: unknown): boolean {
  const s = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  const lower = s.toLowerCase();
  if (lower.includes("service-error")) return true;
  if (lower.includes("unable to complete request")) return true;
  if (lower.includes("margelo.nitro.rniap")) return true;
  if (lower.includes("code=-1")) return true;
  if (lower.includes("e_network")) return true;
  if (lower.includes("network request failed")) return true;
  if (lower.includes("the network connection was lost")) return true;
  if (lower.includes("timed out") || lower.includes("timeout")) return true;
  if (lower.includes("connection interrupted")) return true;
  if (lower.includes("request canceled")) return true;
  if (lower.includes("receipt-failed")) return true;
  return false;
}

/** Thrown when disk receipt is still empty but we refuse a second requestReceiptRefreshIOS (avoids repeated Apple ID prompts). */
const RECEIPT_RETRY_WITHOUT_REFRESH_MSG =
  "Receipt not available yet — retry read without refresh";
const IOS_INTERACTIVE_RECEIPT_REFRESH_COOLDOWN_MS = 2 * 60 * 1000;
let lastIosInteractiveReceiptRefreshAtMs = 0;

function canRunInteractiveReceiptRefresh(): boolean {
  const now = Date.now();
  return (
    now - lastIosInteractiveReceiptRefreshAtMs >=
    IOS_INTERACTIVE_RECEIPT_REFRESH_COOLDOWN_MS
  );
}

function markInteractiveReceiptRefreshRun(): void {
  lastIosInteractiveReceiptRefreshAtMs = Date.now();
}

function isRetryableReceiptObtainError(err: unknown): boolean {
  if (
    err instanceof Error &&
    err.message.includes("blocked for non-user-initiated flow")
  ) {
    return false;
  }
  if (isTransientIosStoreKitError(err)) return true;
  if (err instanceof Error && err.message === "Invalid receipt") return true;
  if (
    err instanceof Error &&
    err.message.includes(RECEIPT_RETRY_WITHOUT_REFRESH_MSG)
  ) {
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Single attempt: read disk receipt or refresh, validate length.
 * @param allowRequestReceiptRefresh When false and disk is empty, does not call requestReceiptRefreshIOS
 * (used on obtain retries so one purchase flow does not show multiple Apple ID prompts).
 */
async function getIosAppStoreReceiptBase64Once(options: {
  isUserInitiatedFlow: boolean;
  allowRequestReceiptRefresh: boolean;
  allowInteractiveReceiptRefresh: boolean;
}): Promise<string> {
  const {
    isUserInitiatedFlow,
    allowRequestReceiptRefresh,
    allowInteractiveReceiptRefresh,
  } = options;
  const log = useAppLogsStore.getState();
  let source: "getReceiptIOS" | "requestReceiptRefreshIOS" = "getReceiptIOS";
  let receipt: string;
  try {
    receipt = await getReceiptIOS();
  } catch (err) {
    const transient = isTransientIosStoreKitError(err);
    const canFallbackToRefresh =
      transient &&
      isUserInitiatedFlow &&
      allowRequestReceiptRefresh &&
      allowInteractiveReceiptRefresh;
    log.warn("[IAP] iOS: getReceiptIOS failed", {
      error: err instanceof Error ? err.message : String(err),
      transientStoreKit: transient,
      canFallbackToRefresh,
    });
    if (!canFallbackToRefresh) {
      throw err;
    }
    if (!canRunInteractiveReceiptRefresh()) {
      log.info(
        "[IAP] iOS: skip requestReceiptRefreshIOS (global cooldown active)"
      );
      throw new Error(RECEIPT_RETRY_WITHOUT_REFRESH_MSG);
    }
    log.info(
      "[IAP] iOS: getReceiptIOS transient failure — fallback to requestReceiptRefreshIOS"
    );
    markInteractiveReceiptRefreshRun();
    receipt = await requestReceiptRefreshIOS();
    source = "requestReceiptRefreshIOS";
  }
  const initialLen = receipt?.length ?? 0;
  const receiptMissing =
    receipt == null ||
    (typeof receipt === "string" && receipt.trim().length === 0);
  if (receiptMissing) {
    if (!isUserInitiatedFlow) {
      log.info(
        "[IAP] skip receipt refresh (not user-initiated flow; disk receipt empty)",
        { initialLength: initialLen }
      );
      throw new Error(
        "Receipt unavailable without refresh (blocked for non-user-initiated flow)"
      );
    }
    if (!allowRequestReceiptRefresh || !allowInteractiveReceiptRefresh) {
      log.info(
        "[IAP] skip receipt refresh (obtain retry — avoid repeated Apple ID prompt)",
        { initialLength: initialLen }
      );
      throw new Error(RECEIPT_RETRY_WITHOUT_REFRESH_MSG);
    }
    log.info("[IAP] receipt refresh triggered (no receipt on disk)", {
      initialLength: initialLen,
    });
    log.info(
      "[IAP] iOS: no app receipt on disk — calling requestReceiptRefreshIOS (may prompt for Apple ID)",
      {
        initialLength: initialLen,
      }
    );
    if (!canRunInteractiveReceiptRefresh()) {
      log.info(
        "[IAP] iOS: skip requestReceiptRefreshIOS (global cooldown active)",
        { initialLength: initialLen }
      );
      throw new Error(RECEIPT_RETRY_WITHOUT_REFRESH_MSG);
    }
    markInteractiveReceiptRefreshRun();
    receipt = await requestReceiptRefreshIOS();
    source = "requestReceiptRefreshIOS";
  } else {
    log.info("[IAP] receipt refresh skipped (receipt present on disk)", {
      receiptLength: receipt.length,
    });
    if (receipt.length <= MIN_IOS_APP_STORE_RECEIPT_LENGTH) {
      log.warn(
        "[IAP] iOS: app receipt shorter than expected — using as-is (no refresh to avoid repeated password prompts)",
        {
          receiptLength: receipt.length,
          minExpected: MIN_IOS_APP_STORE_RECEIPT_LENGTH + 1,
        }
      );
    }
  }
  if (
    !receipt ||
    typeof receipt !== "string" ||
    receipt.length <= MIN_IOS_APP_STORE_RECEIPT_LENGTH
  ) {
    log.error(
      "[IAP] iOS: app store receipt invalid after getReceiptIOS/refresh",
      {
        source,
        receiptLength: receipt?.length ?? 0,
        minRequired: MIN_IOS_APP_STORE_RECEIPT_LENGTH + 1,
      }
    );
    throw new Error("Invalid receipt");
  }
  log.info("[IAP] iOS: app store receipt obtained", {
    source,
    receiptLength: receipt.length,
    receiptMasked: maskAppleReceiptForLog(receipt),
  });
  lastKnownValidIosAppReceipt = receipt;
  return receipt;
}

/**
 * Base64 **App Store app receipt** (PKCS#7) for Apple's verifyReceipt and your backend.
 *
 * On react-native-iap v14, `purchase.purchaseToken` on iOS is a **JWS** (StoreKit 2), not `receipt-data`.
 * Sending JWS to verifyReceipt causes **21002** (malformed). Always use the on-disk receipt from
 * `getReceiptIOS` / `requestReceiptRefreshIOS` for classic receipt validation.
 *
 * Retries transient StoreKit failures (`service-error`, etc.) with backoff.
 * **At most one** `requestReceiptRefreshIOS` per call (first attempt only) so retries do not stack Apple ID prompts.
 *
 * @param options.isUserInitiatedFlow When false and the receipt file is empty, does **not** call
 * `requestReceiptRefreshIOS` (avoids Apple ID prompt); throws instead. Use true for purchase + manual restore.
 */
export async function getIosAppStoreReceiptBase64OrThrow(options?: {
  isUserInitiatedFlow?: boolean;
  /**
   * Wait before the first disk read so StoreKit can settle after a transaction update.
   * Parallel receipt work (e.g. duplicate listeners) often yields `Request Canceled`; pairing
   * this with a single serial purchase pipeline reduces cancellations.
   */
  preReadDelayMs?: number;
  /**
   * Force disable/enable interactive requestReceiptRefreshIOS.
   * Defaults to false (no Apple sign-in prompt).
   */
  allowInteractiveReceiptRefresh?: boolean;
  /**
   * Override receipt obtain attempts. Defaults to 1 to avoid repeated popup/retry loops.
   */
  maxAttempts?: number;
}): Promise<string> {
  const isUserInitiatedFlow = options?.isUserInitiatedFlow ?? true;
  const preReadDelayMs = Math.max(0, options?.preReadDelayMs ?? 0);
  const allowInteractiveReceiptRefresh =
    options?.allowInteractiveReceiptRefresh ??
    !IOS_DISABLE_INTERACTIVE_RECEIPT_REFRESH;
  const maxAttempts = Math.max(
    1,
    options?.maxAttempts ?? IOS_RECEIPT_OBTAIN_MAX_ATTEMPTS
  );
  const log = useAppLogsStore.getState();
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt === 0 && preReadDelayMs > 0) {
      log.info("[IAP] iOS: pre-read delay before receipt obtain", {
        attempt: attempt + 1,
        maxAttempts,
        preReadDelayMs,
      });
      await sleep(preReadDelayMs);
    }
    if (attempt > 0) {
      const delayMs = IOS_RECEIPT_OBTAIN_RETRY_DELAYS_MS[attempt - 1] ?? 2000;
      log.info("[IAP] iOS: receipt obtain retry after transient failure", {
        attempt: attempt + 1,
        maxAttempts,
        delayMs,
      });
      await sleep(delayMs);
    }
    try {
      return await getIosAppStoreReceiptBase64Once({
        isUserInitiatedFlow,
        /** Only the first pass may prompt for Apple ID; later passes only re-read disk. */
        allowRequestReceiptRefresh: attempt === 0,
        allowInteractiveReceiptRefresh,
      });
    } catch (e) {
      lastErr = e;
      const retryable = isRetryableReceiptObtainError(e);
      const willRetry = retryable && attempt < maxAttempts - 1;
      if (willRetry) {
        log.warn("[IAP] iOS: receipt obtain attempt failed", {
          attempt: attempt + 1,
          maxAttempts,
          willRetry: true,
          error: e instanceof Error ? e.message : String(e),
        });
        continue;
      }
      throw e;
    }
  }
  /* Unreachable: loop always returns or throws. */
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * @deprecated Prefer {@link getIosAppStoreReceiptBase64OrThrow}. Purchase fields are not reliable for verifyReceipt on iOS 14+.
 */
export function extractValidIosReceiptOrThrow(purchase: Purchase): string {
  const raw =
    (purchase as Purchase & { transactionReceipt?: string })
      .transactionReceipt ?? purchase.purchaseToken;
  if (raw == null || raw === "") {
    throw new Error("Invalid receipt");
  }
  if (typeof raw !== "string") {
    throw new Error("Invalid receipt");
  }
  if (raw.length <= MIN_IOS_APP_STORE_RECEIPT_LENGTH) {
    throw new Error("Invalid receipt");
  }
  return raw;
}

/**
 * Validate iOS receipt with Apple: production first, then sandbox if 21007, then production if 21008.
 * Uses buildAppleReceiptBody for the shared secret from .env.
 * Returns Apple's JSON (check status === 0 for validity) or null only on network/parse failure.
 */
export async function validateReceiptIosSmart({
  receiptBody,
}: {
  receiptBody: { "receipt-data": string; password: string };
}): Promise<AppleVerifyReceiptResult | null> {
  const log = useAppLogsStore.getState();
  const receiptLen = receiptBody["receipt-data"]?.length ?? 0;
  const hasSharedSecret = Boolean(
    receiptBody.password && receiptBody.password.length > 0
  );
  try {
    log.info(
      "[IAP] iOS: validateReceiptIosSmart — start (production endpoint first)",
      {
        receiptDataLength: receiptLen,
        hasAppSharedSecret: hasSharedSecret,
      }
    );

    let result = await postVerifyReceipt(
      APPLE_VERIFY_RECEIPT_PRODUCTION,
      receiptBody
    );
    const firstProductionStatus = result.status;
    let lastEndpoint: "production" | "sandbox" = "production";
    let retriedSandboxAfter21007 = false;
    let retriedProductionAfter21008 = false;

    if (result.status === APPLE_STATUS_SANDBOX_RECEIPT) {
      log.info(
        "[IAP] iOS: verifyReceipt production returned 21007 — retrying sandbox URL",
        {
          firstProductionStatus,
          statusLabel: getAppleVerifyReceiptStatusLabel(result.status),
        }
      );
      result = await postVerifyReceipt(
        APPLE_VERIFY_RECEIPT_SANDBOX,
        receiptBody
      );
      lastEndpoint = "sandbox";
      retriedSandboxAfter21007 = true;
    }

    if (result.status === APPLE_STATUS_PRODUCTION_RECEIPT) {
      log.info(
        "[IAP] iOS: verifyReceipt returned 21008 — retrying production URL",
        {
          statusBeforeRetry: result.status,
          statusLabel: getAppleVerifyReceiptStatusLabel(result.status),
        }
      );
      result = await postVerifyReceipt(
        APPLE_VERIFY_RECEIPT_PRODUCTION,
        receiptBody
      );
      lastEndpoint = "production";
      retriedProductionAfter21008 = true;
    }

    const summary = {
      outcome:
        result.status === 0 ? ("success" as const) : ("failure" as const),
      status: result.status,
      statusLabel: getAppleVerifyReceiptStatusLabel(result.status),
      environment: result.environment ?? "(not set)",
      appleStoreEnvironment:
        result.environment?.toLowerCase() === "sandbox"
          ? ("Sandbox" as const)
          : result.environment?.toLowerCase() === "production"
          ? ("Production" as const)
          : ("unknown" as const),
      latestReceiptInfoCount: result.latest_receipt_info?.length ?? 0,
      firstProductionStatus,
      lastVerifyEndpoint: lastEndpoint,
      retriedSandboxAfter21007,
      retriedProductionAfter21008,
    };

    if (result.status === 0) {
      log.info(
        "[IAP] iOS: validateReceiptIosSmart — Apple validation OK",
        summary
      );
    } else {
      log.warn(
        "[IAP] iOS: validateReceiptIosSmart — Apple validation NOT OK",
        summary
      );
    }

    return result;
  } catch (err) {
    log.error("[IAP] iOS: validateReceiptIosSmart — network/parse failure", {
      error: err instanceof Error ? err.message : String(err),
      receiptDataLength: receiptLen,
      hasAppSharedSecret: hasSharedSecret,
    });
    return null;
  }
}

const APPLE_VERIFY_RECEIPT_RETRY_ATTEMPTS = 3;
const APPLE_VERIFY_RECEIPT_RETRY_DELAYS_MS = [800, 2200] as const;

/**
 * Like {@link validateReceiptIosSmart} but retries when Apple returns **null** (network/parse only).
 * Does not retry when Apple returns a JSON body with status !== 0 (that is a definitive response).
 */
export async function validateReceiptIosSmartWithRetry(params: {
  receiptBody: { "receipt-data": string; password: string };
}): Promise<AppleVerifyReceiptResult | null> {
  const log = useAppLogsStore.getState();
  let last: AppleVerifyReceiptResult | null = null;
  for (
    let attempt = 0;
    attempt < APPLE_VERIFY_RECEIPT_RETRY_ATTEMPTS;
    attempt++
  ) {
    if (attempt > 0) {
      const delayMs = APPLE_VERIFY_RECEIPT_RETRY_DELAYS_MS[attempt - 1] ?? 2000;
      log.info("[IAP] iOS: validateReceiptIosSmart retry (previous null)", {
        attempt: attempt + 1,
        maxAttempts: APPLE_VERIFY_RECEIPT_RETRY_ATTEMPTS,
        delayMs,
      });
      await sleep(delayMs);
    }
    last = await validateReceiptIosSmart(params);
    if (last !== null) {
      return last;
    }
  }
  return last;
}

/**
 * Build Apple subscription payload from a successful validateReceiptIosSmart result (status === 0 only).
 * isSandbox is validation.environment === 'sandbox' (case-insensitive).
 */
export function buildAppleSubscriptionRequestFromValidation(
  receipt: string,
  planId: PlanId,
  validation: AppleVerifyReceiptResult
): AppleSubscriptionRequest {
  if (validation.status !== 0) {
    throw new Error(`Apple receipt validation failed: ${validation.status}`);
  }
  const log = useAppLogsStore.getState();
  const isLifetime = isLifetimePlan(planId);
  const isSandbox = validation.environment?.toLowerCase() === "sandbox";

  let includesTrial = false;
  if (!isLifetime && validation.latest_receipt_info?.length) {
    const latest =
      validation.latest_receipt_info[validation.latest_receipt_info.length - 1];
    includesTrial =
      latest?.is_trial_period === "true" ||
      latest?.is_in_intro_offer_period === "true";
  }

  log.info("[IAP] iOS: buildAppleSubscriptionRequestFromValidation", {
    planId,
    isSandbox,
    isLifetime,
    includesTrial,
    environment: validation.environment,
    validationStatus: validation.status,
    outcome: "success",
  });

  return {
    receipt,
    isSandbox,
    isProduct: isLifetime,
    isLifetimePurchase: isLifetime,
    includesTrial,
  };
}

/** Mask receipt for logs (never log full base64). */
export function maskAppleReceiptForLog(receipt: string): string {
  if (receipt.length <= 24) {
    return `(len=${receipt.length})`;
  }
  return `${receipt.slice(0, 12)}…${receipt.slice(-8)} (len=${receipt.length})`;
}

/**
 * Finish (acknowledge/consume) a purchase after backend validation.
 */
export async function finishPurchaseTransaction(
  purchase: Purchase,
  isConsumable: boolean
): Promise<void> {
  useAppLogsStore.getState().debug("[IAP] finishPurchaseTransaction", {
    productId: purchase.productId,
    isConsumable,
  });
  if (Platform.OS === "android" && isConsumable) {
    if (!purchase.purchaseToken) {
      throw new Error("Missing purchaseToken for Android consumable purchase");
    }
    await consumePurchaseAndroid(purchase.purchaseToken);
    return;
  }
  await finishTransaction({ purchase, isConsumable });
}

/**
 * Android-only: consume a managed in-app purchase token.
 * Call this for consumable products only (never for subscriptions/non-consumables).
 */
export async function consumePurchaseAndroid(
  purchaseToken: string
): Promise<void> {
  if (Platform.OS !== "android") return;
  if (!purchaseToken) {
    throw new Error("Missing purchaseToken for consumePurchaseAndroid");
  }
  useAppLogsStore.getState().info("[IAP] consumePurchaseAndroid", {
    purchaseTokenPreview: purchaseToken.slice(0, 24),
  });
  await consumePurchaseAndroidNative(purchaseToken);
}

/** Android-only: acknowledge purchase before calling backend. Enforces ACK → backend → finishTransaction order. */
export {
  acknowledgePurchaseAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
};
