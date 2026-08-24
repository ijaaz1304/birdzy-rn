/**
 * Restore purchase history: sync store entitlements with the backend.
 *
 * - **Manual restore**: user taps "Restore purchases" → {@link runRestorePurchasesSync} with
 *   `trigger: 'manual'`.
 * - **Optional one-time auto restore** after install: {@link runAutoRestoreOncePerInstallIfNeeded}
 *   (disabled by default; see `ENABLE_ONE_TIME_AUTO_RESTORE_ON_INSTALL`).
 * - **Pending retry** on launch: {@link retryPendingPurchases} resends stored payloads only
 *   (no receipt refresh).
 */

import { Platform } from "react-native";
import {
  initIapConnection,
  getOurAvailablePurchases,
  buildGoogleSubscriptionRequest,
  buildAppleReceiptBody,
  validateReceiptIosSmartWithRetry,
  buildAppleSubscriptionRequestFromValidation,
  getAppleVerifyReceiptStatusLabel,
  getIosAppStoreReceiptBase64OrThrow,
  maskAppleReceiptForLog,
} from "./services/iap.service";
import { useAuthStore } from "../auth/auth.store";
import { useSubscriptionStore } from "./subscription.store";
import {
  getPendingPurchases,
  removePendingPurchase,
  type PendingPurchaseEntry,
} from "./pendingPurchase.store";
import {
  setLocalEntitlementSnapshot,
  clearLocalEntitlementSnapshot,
} from "./localEntitlement.store";
import { useAppLogsStore } from "../app-logs/app-logs.store";
import {
  hasCompletedAutoRestoreThisInstall,
  markAutoRestoreCompletedThisInstall,
} from "./restoreInstallFlag";
import { isAppleSubscriptionsEnabled } from "./appleSubscriptionsFeature";

export type RestorePurchasesTrigger =
  | "manual"
  | "initial_install"
  /** iOS: transient receipt/StoreKit failure before pending save — recover via restore path */
  | "auto_recovery";

export type RestorePurchasesOptions = {
  /** When true, skip initIapConnection (e.g. already inited by useIapPurchase). */
  skipInit?: boolean;
  /** Why restore was invoked (logging). */
  trigger?: RestorePurchasesTrigger;
};

/**
 * When `true`, first authenticated session after install runs {@link runRestorePurchasesSync} once
 * (then never again until reinstall). When `false`, only user-initiated restore runs.
 */
export const ENABLE_ONE_TIME_AUTO_RESTORE_ON_INSTALL = false;

/** Coalesce overlapping restores to avoid duplicate receipt/StoreKit work and extra Apple ID prompts on iOS. */
let restorePurchasesSyncInFlight: Promise<boolean> | null = null;

/**
 * Optional: one automatic restore per app install (AsyncStorage). Does nothing if disabled or already done.
 * Sets the flag before calling restore so a failed/cancelled attempt does not loop popups on every launch.
 */
export async function runAutoRestoreOncePerInstallIfNeeded(): Promise<void> {
  const log = useAppLogsStore.getState();
  if (!ENABLE_ONE_TIME_AUTO_RESTORE_ON_INSTALL) {
    log.debug(
      "[IAP] restore skipped on init (ENABLE_ONE_TIME_AUTO_RESTORE_ON_INSTALL is false)"
    );
    return;
  }
  if (!useAuthStore.getState().isAuthenticated) {
    return;
  }
  try {
    const done = await hasCompletedAutoRestoreThisInstall();
    if (done) {
      log.info(
        "[IAP] restore skipped on init (one-time already completed this install)"
      );
      return;
    }
    await markAutoRestoreCompletedThisInstall();
    log.info("[IAP] restore one-time after install (auto)");
    await runRestorePurchasesSync({
      skipInit: false,
      trigger: "initial_install",
    });
  } catch (e) {
    log.warn("[IAP] runAutoRestoreOncePerInstallIfNeeded failed", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Retry pending purchases on app launch (startup recovery).
 * For each stored pending payload: call subscribeGoogle/subscribeApple; on success remove from storage.
 * Does NOT block UI, does NOT throw. Log failures only.
 */
export async function retryPendingPurchases(): Promise<void> {
  const log = useAppLogsStore.getState();
  const { isAuthenticated, subscribeGoogle, subscribeApple } =
    useAuthStore.getState();
  if (!isAuthenticated) {
    log.debug(
      "[Subscription] retryPendingPurchases skipped (not authenticated)"
    );
    return;
  }

  let list: PendingPurchaseEntry[] = [];
  try {
    list = await getPendingPurchases();
  } catch (e) {
    log.warn(
      "[Subscription] retryPendingPurchases getPendingPurchases failed",
      { error: String(e) }
    );
    return;
  }

  if (list.length === 0) return;
  log.info("[Subscription] retryPendingPurchases start", {
    count: list.length,
    note: "stored payloads only — no receipt refresh",
  });

  for (const entry of list) {
    try {
      const platform = entry.payload.platform;
      log.info("[Subscription] retryPendingPurchases item start", {
        platform,
        keyPrefix: entry.key.slice(0, 24) + "…",
        ...(platform === "apple"
          ? {
              isSandboxPayload: entry.payload.payload.isSandbox,
              receiptLength: entry.payload.payload.receipt?.length ?? 0,
            }
          : { itemId: entry.payload.payload.itemId }),
      });
      if (entry.payload.platform === "google") {
        await subscribeGoogle(entry.payload.payload);
      } else if (Platform.OS === "ios" && !isAppleSubscriptionsEnabled()) {
        log.warn("[Subscription] retryPendingPurchases apple item skipped", {
          keyPrefix: entry.key.slice(0, 24) + "…",
          reason: "appleSubscriptionsEnabled=false",
        });
      } else {
        await subscribeApple(entry.payload.payload);
      }
      useSubscriptionStore.getState().syncFromAuthStore();
      await removePendingPurchase(entry.key);
      log.info("[Subscription] retryPendingPurchases item success", {
        platform,
        keyPrefix: entry.key.slice(0, 24) + "…",
        outcome: "success",
      });
    } catch (err) {
      log.warn("[Subscription] retryPendingPurchases item failed", {
        platform: entry.payload.platform,
        keyPrefix: entry.key.slice(0, 24) + "…",
        outcome: "failure",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/**
 * Auto-unsubscribe when backend/local says subscribed but store has no active purchases
 * (e.g. refund, cancel, or consumed elsewhere). Matches Coinzy: if purchaseCount === 0 → unsubscribe.
 */
async function autoUnsubscribeIfNoPurchases(): Promise<void> {
  const log = useAppLogsStore.getState();
  const { user, unsubscribeGoogle, unsubscribeApple } = useAuthStore.getState();
  const wasSubscribed =
    user?.isSubscribed === true ||
    useSubscriptionStore.getState().subscription?.isActive === true;
  if (!wasSubscribed) return;

  const ourPurchases = await getOurAvailablePurchases();
  if (ourPurchases.length > 0) return;

  log.info(
    "[Subscription] autoUnsubscribeIfNoPurchases (no purchases in store)"
  );

  try {
    const provider = user?.subscriptionProvider;
    if (provider === "google") {
      await unsubscribeGoogle();
      log.info("[Subscription] autoUnsubscribe: unsubscribeGoogle done");
    } else if (provider === "apple") {
      await unsubscribeApple();
      log.info("[Subscription] autoUnsubscribe: unsubscribeApple done");
    }
    await clearLocalEntitlementSnapshot();
    useSubscriptionStore.getState().syncFromAuthStore();
  } catch (err) {
    log.warn("[Subscription] autoUnsubscribeIfNoPurchases failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Check store purchases and auto-unsubscribe when count is zero.
 * Safe to call on app launch after auth; no-op when user is not currently subscribed.
 */
export async function runAutoUnsubscribeIfNoPurchases(): Promise<void> {
  const log = useAppLogsStore.getState();
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    log.debug(
      "[Subscription] autoUnsubscribe check skipped (not authenticated)"
    );
    return;
  }
  try {
    await initIapConnection();
    await autoUnsubscribeIfNoPurchases();
  } catch (err) {
    log.warn("[Subscription] runAutoUnsubscribeIfNoPurchases failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Sync purchase history with backend: init IAP (unless skipInit), get available purchases from the store,
 * send the best entitlement to backend (subscribeGoogle/subscribeApple), then sync subscription store.
 * Only runs if user is authenticated. Does NOT call finishTransaction (restored purchases are already owned).
 * Resolves to true if at least one purchase was synced, false if none or not authenticated.
 *
 * When no purchases found: runs auto-unsubscribe if user was previously subscribed (Coinzy parity).
 */
export async function runRestorePurchasesSync(
  options: RestorePurchasesOptions = {}
): Promise<boolean> {
  if (restorePurchasesSyncInFlight) {
    useAppLogsStore.getState().info("[IAP] restore skipped (already running)", {
      coalesced: true,
      trigger: options.trigger ?? null,
    });
    return restorePurchasesSyncInFlight;
  }
  restorePurchasesSyncInFlight = runRestorePurchasesSyncInner(options).finally(
    () => {
      restorePurchasesSyncInFlight = null;
    }
  );
  return restorePurchasesSyncInFlight;
}

async function runRestorePurchasesSyncInner(
  options: RestorePurchasesOptions = {}
): Promise<boolean> {
  const log = useAppLogsStore.getState();
  const { skipInit = false, trigger } = options;
  const { isAuthenticated, subscribeGoogle, subscribeApple } =
    useAuthStore.getState();

  if (trigger === "manual") {
    log.info("[IAP] restore triggered manually");
  } else if (trigger === "initial_install") {
    log.info("[IAP] restore triggered (one-time after install)");
  } else if (trigger === "auto_recovery") {
    log.info(
      "[IAP] restore triggered (auto recovery after transient StoreKit failure)"
    );
  }

  log.info("[Subscription] runRestorePurchasesSync start", {
    skipInit,
    platform: Platform.OS,
    trigger: trigger ?? "unspecified",
  });

  if (!isAuthenticated) {
    log.debug(
      "[Subscription] runRestorePurchasesSync skipped (not authenticated)"
    );
    return false;
  }

  if (Platform.OS === "ios" && !isAppleSubscriptionsEnabled()) {
    log.warn(
      "[Subscription] runRestorePurchasesSync skipped (appleSubscriptionsEnabled=false)"
    );
    return false;
  }

  if (!skipInit) {
    try {
      const ok = await initIapConnection();
      if (!ok) {
        log.warn(
          "[Subscription] runRestorePurchasesSync initIapConnection returned false"
        );
        return false;
      }
    } catch (e) {
      log.warn(
        "[Subscription] runRestorePurchasesSync initIapConnection failed",
        { error: String(e) }
      );
      return false;
    }
  }

  const ourPurchases = await getOurAvailablePurchases();

  // Android: optimistic premium while backend sync runs. iOS: only after Apple status === 0 + subscribeApple success.
  if (ourPurchases.length > 0 && Platform.OS === "android") {
    const { planId } = ourPurchases[0];
    await setLocalEntitlementSnapshot({
      hasActiveEntitlement: true,
      planId,
    });
    useSubscriptionStore.getState().setLocalPremiumOverride(true);
  }

  if (ourPurchases.length === 0) {
    log.info(
      "[Subscription] runRestorePurchasesSync no purchases, running autoUnsubscribe if needed"
    );
    await autoUnsubscribeIfNoPurchases();
    return false;
  }

  const { purchase, planId } = ourPurchases[0];
  log.info("[Subscription] runRestorePurchasesSync syncing best purchase", {
    planId,
    platform: Platform.OS,
  });
  try {
    if (Platform.OS === "android") {
      const payload = buildGoogleSubscriptionRequest(purchase, planId);
      log.info("[Subscription] Android: restore — calling subscribeGoogle", {
        planId,
        productId: purchase.productId,
        itemId: payload.itemId,
      });
      await subscribeGoogle(payload);
      log.info("[Subscription] Android: restore — subscribeGoogle OK", {
        planId,
        productId: purchase.productId,
        outcome: "success",
      });
    } else {
      log.info(
        "[Subscription] iOS: restore – building payload and syncing with backend",
        {
          planId,
          productId: purchase.productId,
        }
      );
      const receipt = await getIosAppStoreReceiptBase64OrThrow({
        isUserInitiatedFlow: true,
        allowInteractiveReceiptRefresh: false,
        maxAttempts: 1,
      });
      log.info("[Subscription] iOS: restore – validating receipt with Apple", {
        receiptLength: receipt.length,
        receiptMasked: maskAppleReceiptForLog(receipt),
        planId,
      });
      const receiptBody = buildAppleReceiptBody(receipt);
      const validation = await validateReceiptIosSmartWithRetry({
        receiptBody,
      });
      if (validation == null) {
        log.error("[Subscription] iOS: restore — Apple verifyReceipt null", {
          planId,
          productId: purchase.productId,
          outcome: "failure",
          phase: "validateReceiptIosSmartWithRetry",
        });
        throw new Error(
          "Apple receipt validation failed (no response or network error)"
        );
      }
      if (validation.status !== 0) {
        log.warn("[Subscription] iOS: restore — Apple verifyReceipt rejected", {
          planId,
          productId: purchase.productId,
          outcome: "failure",
          status: validation.status,
          statusLabel: getAppleVerifyReceiptStatusLabel(validation.status),
          environment: validation.environment ?? "(not set)",
        });
        throw new Error(
          `Apple receipt validation failed: ${validation.status}`
        );
      }
      log.info("[Subscription] iOS: restore — Apple verifyReceipt accepted", {
        planId,
        productId: purchase.productId,
        outcome: "success",
        status: validation.status,
        environment: validation.environment,
        isSandboxStore: validation.environment?.toLowerCase() === "sandbox",
      });
      const payload = buildAppleSubscriptionRequestFromValidation(
        receipt,
        planId,
        validation
      );
      log.info("[Subscription] iOS: restore — calling subscribeApple", {
        receiptMasked: maskAppleReceiptForLog(payload.receipt),
        receiptLength: payload.receipt.length,
        isSandboxPayload: payload.isSandbox,
        validationEnvironment: validation.environment,
        isLifetimePurchase: payload.isLifetimePurchase,
        includesTrial: payload.includesTrial,
      });
      await subscribeApple(payload);
      log.info("[Subscription] iOS: restore — subscribeApple OK", {
        planId,
        productId: purchase.productId,
        outcome: "success",
        appleEnvironment: validation.environment,
      });
      await setLocalEntitlementSnapshot({
        hasActiveEntitlement: true,
        planId,
      });
      useSubscriptionStore.getState().setLocalPremiumOverride(true);
    }
    useSubscriptionStore.getState().syncFromAuthStore();
    log.info("[Subscription] runRestorePurchasesSync success", {
      planId,
      platform: Platform.OS,
      outcome: "success",
    });
    return true;
  } catch (err) {
    log.error("[Subscription] runRestorePurchasesSync failed", {
      planId,
      platform: Platform.OS,
      outcome: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    if (Platform.OS === "ios") {
      return false;
    }
    // Android: optimistic premium was already applied when purchases were found
    return true;
  }
}
