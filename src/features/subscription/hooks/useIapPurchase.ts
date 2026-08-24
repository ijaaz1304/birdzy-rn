/**
 * Hook to run native IAP flow and send purchase to backend (subscribeGoogle / subscribeApple).
 * Sets up purchaseUpdatedListener and purchaseErrorListener; purchasePlan(planId) starts the flow
 * and returns a Promise that resolves when the purchase is validated and finished.
 *
 * Android: STRICT ORDER — 1) acknowledgePurchaseAndroid, 2) savePendingPurchase, 3) backend, 4) removePending + finishTransaction.
 * iOS: savePending → backend → removePending + finishTransaction (no manual ACK).
 * Local entitlement blocks lifetime purchase if already subscribed; startup retries pending purchases.
 *
 * iOS: `purchaseUpdatedListener` (and one cold-start batch) enqueue into a **serial FIFO queue** so
 * only one receipt/backend pipeline runs at a time — no parallel StoreKit reads, no lost events when
 * another transaction arrives mid-flight.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAuthStore } from "../../auth/auth.store";
import { useSubscriptionStore, selectIsPremium } from "../subscription.store";
import {
  initIapConnection,
  requestPlanPurchase,
  getOurAvailablePurchases,
  buildGoogleSubscriptionRequest,
  buildAppleSubscriptionRequest,
  buildAppleReceiptBody,
  validateReceiptIosSmartWithRetry,
  buildAppleSubscriptionRequestFromValidation,
  getAppleVerifyReceiptStatusLabel,
  getIosAppStoreReceiptBase64OrThrow,
  isTransientIosStoreKitError,
  MIN_IOS_APP_STORE_RECEIPT_LENGTH,
  maskAppleReceiptForLog,
  finishPurchaseTransaction,
  acknowledgePurchaseAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type PurchaseError,
} from "../services/iap.service";
import {
  runRestorePurchasesSync,
  retryPendingPurchases,
} from "../restorePurchases";
import {
  getPendingPurchaseKey,
  savePendingPurchase,
  removePendingPurchase,
  checkIfPendingExistsForTransaction,
} from "../pendingPurchase.store";
import {
  getLocalEntitlementSnapshot,
  setLocalEntitlementSnapshot,
} from "../localEntitlement.store";
import {
  getPlanById,
  type PlanId,
  type SubscriptionPlan,
} from "../../../config/subscriptionConfig";
import { getAllSubscriptionPlans } from "../../../data/subscription/subscriptionPlansLoader";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import { NavigationService } from "../../../utils/navigation";
import {
  logAndroidPurchaseAnalyticsAfterAcknowledge,
  logIosPurchaseAnalyticsAfterBackendSuccess,
} from "../iapPurchaseAnalytics";
import {
  APPLE_SUBSCRIPTIONS_DISABLED_MESSAGE,
  isAppleSubscriptionsEnabled,
} from "../appleSubscriptionsFeature";

/** Shown when backend fails (500): pending purchase is kept and will retry on next launch. */
export const PURCHASE_PENDING_BACKEND = "PURCHASE_PENDING_BACKEND";

/**
 * After native purchase + backend confirm, reload auth + subscription and jump Home
 * (same idea as paywall success close). Deferred so the IAP pipeline can finish cleanup first.
 */
type AppRefreshAfterPurchaseOptions = {
  skipNavigateHome?: boolean;
};

function scheduleAppRefreshAfterPurchaseSuccess(
  reason: string,
  options?: AppRefreshAfterPurchaseOptions
): void {
  setTimeout(() => {
    void (async () => {
      const log = useAppLogsStore.getState();
      try {
        log.info("[Subscription] flow: app refresh after purchase success", {
          reason,
          skipNavigateHome: options?.skipNavigateHome ?? false,
        });
        await useAuthStore.getState().getProfile();
      } catch (e) {
        log.warn("[Subscription] flow: getProfile during app refresh failed", {
          reason,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      useSubscriptionStore.getState().syncFromAuthStore();
      if (!options?.skipNavigateHome) {
        NavigationService.reset("MainTabs");
        NavigationService.resetToNested("MainTabs", "Home");
      }
    })();
  }, 0);
}

/** UI state for paywall / modals (replaces plain string errors). */
export type IapPurchaseErrorState =
  | null
  | {
      type: "pending_backend";
      reason?: "background_retry" | "manual_restore_needed";
    }
  | {
      type: "failed";
      summary: string;
      detail?: string;
      appAccountMasked?: string;
      transientStoreKit?: boolean;
    };

export function isPendingBackendError(
  e: IapPurchaseErrorState
): e is { type: "pending_backend" } {
  return e !== null && typeof e === "object" && e.type === "pending_backend";
}

export function isFailedPurchaseError(
  e: IapPurchaseErrorState
): e is Extract<IapPurchaseErrorState, { type: "failed" }> {
  return e !== null && typeof e === "object" && e.type === "failed";
}

function maskEmailForDisplay(email: string): string {
  const t = email.trim();
  const at = t.indexOf("@");
  if (at <= 0) return t;
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (local.length <= 2) return `***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function buildFailedPurchaseState(
  err: unknown,
  options?: { transientStoreKit?: boolean }
): Extract<IapPurchaseErrorState, { type: "failed" }> {
  const raw = err instanceof Error ? err.message : String(err);
  const transient = Boolean(options?.transientStoreKit);
  const summary = transient
    ? "The App Store could not complete the request."
    : "We could not complete your subscription.";
  const detailParts: string[] = [`Details: ${raw}`];
  if (transient) {
    detailParts.push(
      "Try Restore purchases or try again in a moment. If you were charged, Restore usually syncs your access."
    );
  }
  const email = useAuthStore.getState().user?.email?.trim();
  return {
    type: "failed",
    summary,
    detail: detailParts.join("\n\n"),
    appAccountMasked:
      email && email.length >= 3 ? maskEmailForDisplay(email) : undefined,
    transientStoreKit: transient,
  };
}

/** iOS: drop dedupe keys after this long so the Set does not grow forever. */
const IOS_FINISHED_DEDUPE_TTL_MS = 5 * 60 * 1000;

/** First `getReceiptIOS` after a transaction — stagger so StoreKit is less likely to cancel in flight. */
const IOS_RECEIPT_PREREAD_MIN_MS = 300;
const IOS_RECEIPT_PREREAD_MAX_MS = 800;

function iosReceiptPrereadDelayMs(): number {
  const span = IOS_RECEIPT_PREREAD_MAX_MS - IOS_RECEIPT_PREREAD_MIN_MS;
  return IOS_RECEIPT_PREREAD_MIN_MS + Math.floor(Math.random() * (span + 1));
}

/** Stable identity for queue + pipeline (matches finish-transaction dedupe). */
export function getIosPurchaseQueueMeta(purchase: Purchase): {
  transactionId: string | null;
  productId: string;
  pipelineDedupeKey: string;
  dedupeKeyTier: "transactionId" | "transactionDate" | "jws" | "fallback";
  iosPurchaseDateRaw: number | string | null;
  iosPurchaseToken: string | null;
} {
  const transactionId =
    (purchase as Purchase & { transactionId?: string }).transactionId ?? null;
  const productId = purchase.productId;
  const iosPurchaseDateRaw =
    (purchase as Purchase & { transactionDate?: number | string })
      .transactionDate ?? null;
  const iosPurchaseToken =
    typeof purchase.purchaseToken === "string" &&
    purchase.purchaseToken.length > 0
      ? purchase.purchaseToken
      : null;
  const dedupeKeyTier:
    | "transactionId"
    | "transactionDate"
    | "jws"
    | "fallback" = transactionId
    ? "transactionId"
    : iosPurchaseDateRaw != null && String(iosPurchaseDateRaw).length > 0
    ? "transactionDate"
    : iosPurchaseToken
    ? "jws"
    : "fallback";
  const pipelineDedupeKey = transactionId
    ? `${productId}:${transactionId}`
    : iosPurchaseDateRaw != null && String(iosPurchaseDateRaw).length > 0
    ? `${productId}:${String(iosPurchaseDateRaw)}`
    : iosPurchaseToken
    ? `${productId}:jws:${iosPurchaseToken.slice(0, 96)}`
    : `${productId}:fallback:${Date.now()}:${Math.random()
        .toString(36)
        .slice(2, 11)}`;
  return {
    transactionId,
    productId,
    pipelineDedupeKey,
    dedupeKeyTier,
    iosPurchaseDateRaw,
    iosPurchaseToken,
  };
}

type IosQueueItem = {
  purchase: Purchase;
  source: "listener" | "cold_start";
} & ReturnType<typeof getIosPurchaseQueueMeta>;

/** One cold-start enqueue batch per app JS load (avoids duplicate parallel fetches on Strict Mode remount). */
let iosColdStartPurchaseBatchScheduled = false;
/** Global activity flag so other flows (home modals) can avoid interrupting IAP processing. */
let activeIapPipelineJobs = 0;
/**
 * Session-wide iOS pipeline dedupe across hook remounts.
 * Prevents replayed listener callbacks from re-running receipt work when user re-opens paywall.
 */
const iosSessionCompletedPipelineKeys = new Set<string>();
/** Prevents repeated auto-recovery loops for the same transaction/product in a short window. */
const iosDeferredRecoveryLastRunAtByKey = new Map<string, number>();
const IOS_DEFERRED_RECOVERY_COOLDOWN_MS = 60_000;

export const isIapPipelineBusy = (): boolean => activeIapPipelineJobs > 0;

/**
 * iOS only: true if this product (and transaction when known) is still returned by the store.
 * Used to treat receipt/validation failures as recoverable when the entitlement clearly exists.
 */
async function iosPurchaseStillInAvailablePurchases(
  productId: string,
  transactionId: string | null
): Promise<boolean> {
  try {
    const ours = await getOurAvailablePurchases();
    return ours.some(({ purchase: p }) => {
      if (p.productId !== productId) return false;
      if (transactionId == null || String(transactionId).trim() === "") {
        return true;
      }
      const tid = (p as Purchase & { transactionId?: string }).transactionId;
      return tid === transactionId;
    });
  } catch {
    return false;
  }
}

function scheduleIosDeferredPipelineRecovery(opts: {
  productId: string;
  transactionId: string | null;
  reason: string;
}): void {
  const { productId, transactionId, reason } = opts;
  const log = useAppLogsStore.getState();
  const recoveryKey =
    transactionId != null && String(transactionId).trim().length > 0
      ? `tx:${transactionId}`
      : `product:${productId}`;
  const now = Date.now();
  const last = iosDeferredRecoveryLastRunAtByKey.get(recoveryKey) ?? 0;
  const elapsed = now - last;
  if (elapsed < IOS_DEFERRED_RECOVERY_COOLDOWN_MS) {
    log.info("[IAP] iOS: deferred recovery skipped (cooldown)", {
      reason,
      productId,
      transactionId,
      recoveryKey,
      elapsedMs: elapsed,
      cooldownMs: IOS_DEFERRED_RECOVERY_COOLDOWN_MS,
    });
    return;
  }
  iosDeferredRecoveryLastRunAtByKey.set(recoveryKey, now);
  log.info("[IAP] iOS: deferred recovery scheduled", {
    reason,
    productId,
    transactionId,
    recoveryKey,
    retryPendingMs: 1500,
    restoreFallbackMs: null,
  });
  setTimeout(() => {
    log.info("[IAP] iOS: deferred recovery — retryPendingPurchases", {
      productId,
      transactionId,
    });
    retryPendingPurchases().catch((scheduleErr) => {
      log.warn("[IAP] iOS: retryPendingPurchases (deferred recovery) failed", {
        error:
          scheduleErr instanceof Error
            ? scheduleErr.message
            : String(scheduleErr),
        productId,
        transactionId,
      });
    });
  }, 1500);
}

type Pending = {
  resolve: () => void;
  reject: (err: Error) => void;
  productId: string;
};

function getPlanIdFromProductId(
  productId: string,
  plans: SubscriptionPlan[]
): PlanId | undefined {
  const plan = plans.find(
    (p) =>
      (Platform.OS === "android" ? p.productIdAndroid : p.productIdIos) ===
      productId
  );
  return plan?.id;
}

/** Merge JSON catalog + session subset so store SKUs (e.g. full pack) resolve when the UI list is offer-scoped. */
function getPlansForProductResolution(
  sessionPlans?: SubscriptionPlan[]
): SubscriptionPlan[] {
  const all = getAllSubscriptionPlans() as SubscriptionPlan[];
  if (!sessionPlans?.length) {
    return all;
  }
  const byId = new Map<string, SubscriptionPlan>();
  for (const p of all) {
    byId.set(p.id, p);
  }
  for (const p of sessionPlans) {
    byId.set(p.id, p);
  }
  return [...byId.values()];
}

function isLifetimePlanId(planId: string | null | undefined): boolean {
  return (
    typeof planId === "string" && planId.toLowerCase().includes("lifetime")
  );
}

export type UseIapPurchaseOptions = {
  /** @deprecated Recovery via focus/resume was removed (iOS single pipeline). Kept for call-site compatibility. */
  onPurchaseRecovered?: () => void;
  /** Keep user on the current screen after purchase (e.g. switch-plan status). */
  skipNavigateHomeOnSuccess?: boolean;
};

export function useIapPurchase(
  sessionPlans?: SubscriptionPlan[],
  options?: UseIapPurchaseOptions
) {
  const skipNavigateHomeRef = useRef(
    options?.skipNavigateHomeOnSuccess ?? false
  );
  skipNavigateHomeRef.current = options?.skipNavigateHomeOnSuccess ?? false;

  const notifyPurchaseSuccess = useCallback((reason: string) => {
    if (pendingRef.current) {
      useSubscriptionStore.getState().setPendingWelcomeModal(true);
    }
    scheduleAppRefreshAfterPurchaseSuccess(reason, {
      skipNavigateHome: skipNavigateHomeRef.current,
    });
  }, []);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<IapPurchaseErrorState>(null);
  const pendingRef = useRef<Pending | null>(null);
  const pendingWatchdogTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const pendingListenerRecoveryTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isInitializedRef = useRef(false);
  const hasRestoredOnMountRef = useRef(false);
  /**
   * Android: prevents overlapping handlePurchaseUpdate from duplicate callbacks.
   * iOS uses a serial {@link iosPurchaseQueueRef} + {@link iosPipelineStateRef} instead.
   */
  const purchaseUpdateInFlightRef = useRef(false);
  const premiumRecoveryRefreshTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  /** iOS FIFO queue — never drop events; different transactions wait behind the current job. */
  const iosPurchaseQueueRef = useRef<IosQueueItem[]>([]);
  /** Keys currently present in the queue (not the active job) — prevents duplicate queue slots. */
  const iosQueueEnqueuedKeysRef = useRef<Set<string>>(new Set());
  /**
   * Exactly one drain loop at a time; inner `while` drains until queue empty so bursts are serialized
   * without parallel `await`s.
   */
  const iosDrainLoopBusyRef = useRef(false);
  /**
   * Pipeline lock model (requirement): one active processor, exposes which transaction owns it.
   * Updated only by the queue drain loop around each `processIosPurchaseFromQueue` call.
   */
  const iosPipelineStateRef = useRef<{
    isProcessing: boolean;
    currentTransactionId: string | null;
    currentPipelineDedupeKey: string | null;
  }>({
    isProcessing: false,
    currentTransactionId: null,
    currentPipelineDedupeKey: null,
  });

  /**
   * Backend subscribeApple succeeded for this pipeline key this session — safe to skip re-processing
   * duplicates (listener replay / cold-start overlap).
   */
  const iosCompletedPipelineKeysRef = useRef<Set<string>>(
    new Set(iosSessionCompletedPipelineKeys)
  );

  /** Latest queue processor (avoids stale closures in the long-lived drain loop). */
  const processIosPurchaseFromQueueRef = useRef<
    (item: IosQueueItem) => Promise<void>
  >(async () => {});

  /** Listener + cold-start call enqueue; init effect needs latest fn via ref. */
  const enqueueIosPurchaseRef = useRef<
    (purchase: Purchase, source: "listener" | "cold_start") => void
  >(() => {});

  /** iOS: ensure finishTransaction runs at most once per productId+transactionId (successful finish only). */
  const iosFinishedTransactionIdsRef = useRef<Set<string>>(new Set());
  const iosPendingKickLastAtRef = useRef<number>(0);
  /** Guard: only one purchase flow at a time. Reset only in handlePurchaseUpdate (finally) or handlePurchaseError. */
  const isPurchasingRef = useRef(false);
  /**
   * Keep listener callbacks stable across re-renders so we do not detach/reattach native listeners
   * during an in-flight App Store purchase sheet.
   */
  const handlePurchaseUpdateRef = useRef<
    (purchase: Purchase) => void | Promise<void>
  >(() => {});
  const handlePurchaseErrorRef = useRef<(err: PurchaseError) => void>(() => {});

  const subscribeGoogle = useAuthStore((s) => s.subscribeGoogle);
  const subscribeApple = useAuthStore((s) => s.subscribeApple);
  const syncFromAuthStore = useSubscriptionStore((s) => s.syncFromAuthStore);
  const setLocalPremiumOverride = useSubscriptionStore(
    (s) => s.setLocalPremiumOverride
  );
  const refreshProfileSilent = useAuthStore((s) => s.refreshProfileSilent);
  const isPremiumFromStore = useSubscriptionStore(selectIsPremium);

  const clearPendingWatchdog = useCallback(() => {
    if (pendingWatchdogTimeoutRef.current != null) {
      clearTimeout(pendingWatchdogTimeoutRef.current);
      pendingWatchdogTimeoutRef.current = null;
    }
    if (pendingListenerRecoveryTimeoutRef.current != null) {
      clearTimeout(pendingListenerRecoveryTimeoutRef.current);
      pendingListenerRecoveryTimeoutRef.current = null;
    }
  }, []);

  const schedulePremiumRecoveryRefresh = useCallback(
    (reason: string, delayMs = 2500) => {
      if (premiumRecoveryRefreshTimeoutRef.current != null) {
        clearTimeout(premiumRecoveryRefreshTimeoutRef.current);
      }
      premiumRecoveryRefreshTimeoutRef.current = setTimeout(() => {
        premiumRecoveryRefreshTimeoutRef.current = null;
        const premiumNow = selectIsPremium(useSubscriptionStore.getState());
        if (premiumNow) return;
        const log = useAppLogsStore.getState();
        log.warn(
          "[IAP] premium recovery refresh: store transaction detected but premium still false",
          { reason, delayMs }
        );
        NavigationService.reset("MainTabs");
        NavigationService.resetToNested("MainTabs", "Home");
      }, delayMs);
    },
    []
  );

  // If backend/profile sync flips premium while a purchase Promise is pending,
  // settle immediately so UI does not remain stuck on "Processing...".
  useEffect(() => {
    if (!isPremiumFromStore) return;
    const pending = pendingRef.current;
    if (!pending) return;
    useAppLogsStore
      .getState()
      .info(
        "[Subscription] flow: premium became true while pending → resolve purchase promise",
        { productId: pending.productId }
      );
    clearPendingWatchdog();
    notifyPurchaseSuccess("premium_became_true_while_pending");
    pending.resolve();
    pendingRef.current = null;
    isPurchasingRef.current = false;
    setIsPurchasing(false);
  }, [isPremiumFromStore, clearPendingWatchdog]);

  const logPremiumStateSnapshot = useCallback(
    (stage: string, meta?: Record<string, unknown>) => {
      const log = useAppLogsStore.getState();
      const authUser = useAuthStore.getState().user as Record<
        string,
        unknown
      > | null;
      const subState = useSubscriptionStore.getState();
      log.info("[Subscription] premium snapshot", {
        stage,
        isSubscribedFromAuth: Boolean(authUser?.isSubscribed),
        authPlanId: authUser?.planId ?? null,
        authProvider: authUser?.subscriptionProvider ?? null,
        isPremiumSelector: selectIsPremium(subState),
        localPremiumOverride: subState.localPremiumOverride,
        subscriptionTier: subState.subscription?.tier ?? null,
        subscriptionPlanId: subState.subscription?.planId ?? null,
        ...meta,
      });
    },
    []
  );

  const drainIosPurchaseQueue = useCallback(async () => {
    if (Platform.OS !== "ios") return;
    if (iosDrainLoopBusyRef.current) return;
    iosDrainLoopBusyRef.current = true;
    const log = useAppLogsStore.getState();
    try {
      while (iosPurchaseQueueRef.current.length > 0) {
        const item = iosPurchaseQueueRef.current.shift()!;
        iosQueueEnqueuedKeysRef.current.delete(item.pipelineDedupeKey);
        log.info("[IAP] iOS queue: DEQUEUE", {
          transactionId: item.transactionId,
          productId: item.productId,
          pipelineDedupeKey: item.pipelineDedupeKey,
          source: item.source,
          remainingInQueue: iosPurchaseQueueRef.current.length,
        });

        if (iosCompletedPipelineKeysRef.current.has(item.pipelineDedupeKey)) {
          log.info(
            "[IAP] iOS queue: skip dequeued job (already completed this session)",
            {
              transactionId: item.transactionId,
              pipelineDedupeKey: item.pipelineDedupeKey,
            }
          );
          continue;
        }

        iosPipelineStateRef.current = {
          isProcessing: true,
          currentTransactionId: item.transactionId,
          currentPipelineDedupeKey: item.pipelineDedupeKey,
        };
        activeIapPipelineJobs += 1;

        try {
          await processIosPurchaseFromQueueRef.current(item);
          log.info("[IAP] iOS queue: pipeline job finished", {
            transactionId: item.transactionId,
            productId: item.productId,
            pipelineDedupeKey: item.pipelineDedupeKey,
          });
        } catch (outer) {
          log.error("[IAP] iOS queue: unexpected outer throw", {
            transactionId: item.transactionId,
            error: outer instanceof Error ? outer.message : String(outer),
          });
        } finally {
          activeIapPipelineJobs = Math.max(0, activeIapPipelineJobs - 1);
          iosPipelineStateRef.current = {
            isProcessing: false,
            currentTransactionId: null,
            currentPipelineDedupeKey: null,
          };
        }
      }
    } finally {
      iosDrainLoopBusyRef.current = false;
      if (iosPurchaseQueueRef.current.length > 0) {
        void drainIosPurchaseQueue();
      }
    }
  }, []);

  const kickPendingIosPurchaseFromAvailable = useCallback(
    (reason: string, options?: { bypassThrottle?: boolean }) => {
      if (Platform.OS !== "ios") return;
      const now = Date.now();
      if (
        !options?.bypassThrottle &&
        now - iosPendingKickLastAtRef.current < 4000
      ) {
        return;
      }
      const pending = pendingRef.current;
      if (!pending?.productId) return;
      iosPendingKickLastAtRef.current = now;
      const pendingProductId = pending.productId;
      const log = useAppLogsStore.getState();
      void getOurAvailablePurchases()
        .then((ours) => {
          const candidate = ours.find(
            (p) => p.purchase.productId === pendingProductId
          )?.purchase;
          if (!candidate) {
            log.info(
              "[IAP] iOS queue: pending kick skipped (pending SKU not in available purchases)",
              {
                reason,
                pendingProductId,
              }
            );
            return;
          }
          const candidateMeta = getIosPurchaseQueueMeta(candidate);
          const pipelineKey = candidateMeta.pipelineDedupeKey;
          const completedNow =
            iosCompletedPipelineKeysRef.current.has(pipelineKey);
          const queuedNow = iosQueueEnqueuedKeysRef.current.has(pipelineKey);
          if (completedNow) {
            const pend = pendingRef.current;
            if (pend && pend.productId === pendingProductId) {
              log.info(
                "[IAP] iOS queue: pending kick — tx already completed this session, settle pending",
                {
                  reason,
                  pendingProductId,
                  pipelineDedupeKey: pipelineKey,
                }
              );
              clearPendingWatchdog();
              notifyPurchaseSuccess("ios_pending_kick_already_completed");
              pend.resolve();
              pendingRef.current = null;
              isPurchasingRef.current = false;
              setIsPurchasing(false);
            }
            return;
          }
          if (queuedNow) {
            return;
          }
          iosPurchaseQueueRef.current.push({
            purchase: candidate,
            source: "listener",
            ...candidateMeta,
          });
          iosQueueEnqueuedKeysRef.current.add(candidateMeta.pipelineDedupeKey);
          log.info(
            "[IAP] iOS queue: pending kick ENQUEUE from available purchases",
            {
              reason,
              pendingProductId,
              transactionId: candidateMeta.transactionId,
              pipelineDedupeKey: candidateMeta.pipelineDedupeKey,
              queueLength: iosPurchaseQueueRef.current.length,
            }
          );
          void drainIosPurchaseQueue();
        })
        .catch((e) => {
          log.warn("[IAP] iOS queue: pending kick failed", {
            reason,
            pendingProductId,
            error: e instanceof Error ? e.message : String(e),
          });
        });
    },
    [drainIosPurchaseQueue, clearPendingWatchdog, setIsPurchasing]
  );

  const enqueueIosPurchase = useCallback(
    (purchase: Purchase, source: "listener" | "cold_start") => {
      if (Platform.OS !== "ios") return;
      const log = useAppLogsStore.getState();
      const meta = getIosPurchaseQueueMeta(purchase);
      const { pipelineDedupeKey, transactionId, productId } = meta;

      if (iosCompletedPipelineKeysRef.current.has(pipelineDedupeKey)) {
        const pending = pendingRef.current;
        log.info(
          "[IAP] iOS queue: ENQUEUE skip (session already completed this transaction)",
          {
            transactionId,
            productId,
            pipelineDedupeKey,
            source,
            pendingProductId: pending?.productId ?? null,
          }
        );
        if (
          source === "listener" &&
          pending?.productId &&
          pending.productId !== productId
        ) {
          const pendingFlow = pending;
          void getOurAvailablePurchases()
            .then((ours) => {
              const pendingInStore = ours.some(
                (o) => o.purchase.productId === pendingFlow.productId
              );
              if (pendingInStore) {
                kickPendingIosPurchaseFromAvailable(
                  "completed_skip_with_pending"
                );
                return;
              }
              log.warn(
                "[IAP] iOS queue: pending SKU not in store; settling with delivered product",
                {
                  pendingProductId: pendingFlow.productId,
                  deliveredProductId: productId,
                  pipelineDedupeKey,
                }
              );
              const plansForResolve =
                getPlansForProductResolution(sessionPlans);
              const actualPlanId = getPlanIdFromProductId(
                productId,
                plansForResolve
              );
              if (actualPlanId) {
                void setLocalEntitlementSnapshot({
                  hasActiveEntitlement: true,
                  planId: actualPlanId,
                });
              }
              const deliveredPlanId = actualPlanId;
              if (deliveredPlanId) {
                void (async () => {
                  try {
                    const upgradePayload = await buildAppleSubscriptionRequest(
                      purchase,
                      deliveredPlanId,
                      {
                        preferCachedReceipt: true,
                        isUserInitiatedFlow: false,
                      }
                    );
                    await subscribeApple(upgradePayload);
                    log.info(
                      "[IAP] iOS queue: mismatch settle backend call succeeded",
                      {
                        deliveredPlanId,
                        deliveredProductId: productId,
                        pendingProductId: pendingFlow.productId,
                      }
                    );
                  } catch (backendErr) {
                    log.warn(
                      "[IAP] iOS queue: mismatch settle backend call failed",
                      {
                        deliveredPlanId,
                        deliveredProductId: productId,
                        pendingProductId: pendingFlow.productId,
                        error:
                          backendErr instanceof Error
                            ? backendErr.message
                            : String(backendErr),
                      }
                    );
                  }
                })();
              }
              setLocalPremiumOverride(true);
              syncFromAuthStore();
              notifyPurchaseSuccess(
                "ios_pending_mismatch_delivered_product_settled"
              );
              clearPendingWatchdog();
              if (pendingRef.current === pendingFlow) {
                pendingFlow.resolve();
                pendingRef.current = null;
                isPurchasingRef.current = false;
                setIsPurchasing(false);
              }
            })
            .catch(() => {
              kickPendingIosPurchaseFromAvailable(
                "completed_skip_with_pending"
              );
            });
        }
        return;
      }

      const pipe = iosPipelineStateRef.current;
      if (
        pipe.isProcessing &&
        pipe.currentPipelineDedupeKey === pipelineDedupeKey
      ) {
        log.info(
          "[IAP] iOS queue: ENQUEUE skip (duplicate — same transaction processing now)",
          {
            transactionId,
            productId,
            pipelineDedupeKey,
            source,
          }
        );
        return;
      }

      if (iosQueueEnqueuedKeysRef.current.has(pipelineDedupeKey)) {
        log.info("[IAP] iOS queue: ENQUEUE skip (duplicate — already queued)", {
          transactionId,
          productId,
          pipelineDedupeKey,
          source,
        });
        return;
      }

      const queueItem: IosQueueItem = { purchase, source, ...meta };
      iosPurchaseQueueRef.current.push(queueItem);
      iosQueueEnqueuedKeysRef.current.add(pipelineDedupeKey);
      log.info("[IAP] iOS queue: ENQUEUE", {
        transactionId,
        productId,
        pipelineDedupeKey,
        dedupeKeyTier: meta.dedupeKeyTier,
        source,
        queueLength: iosPurchaseQueueRef.current.length,
      });
      void drainIosPurchaseQueue();
    },
    [
      drainIosPurchaseQueue,
      kickPendingIosPurchaseFromAvailable,
      sessionPlans,
      subscribeApple,
      setLocalPremiumOverride,
      syncFromAuthStore,
      clearPendingWatchdog,
      setIsPurchasing,
    ]
  );

  const processIosPurchaseFromQueue = useCallback(
    async (item: IosQueueItem) => {
      const purchase = item.purchase;
      const log = useAppLogsStore.getState();
      const iosTransactionId = item.transactionId;
      const iosFinishDedupeKey = item.pipelineDedupeKey;
      const iosPurchaseDateRaw = item.iosPurchaseDateRaw;

      const pending = pendingRef.current;
      const hasMatchingPending = !!(
        pending && pending.productId === purchase.productId
      );
      if (pending && !hasMatchingPending) {
        log.warn(
          "[IAP] iOS pipeline: pending product mismatch, treating callback as orphan queue item",
          {
            pendingProductId: pending.productId,
            callbackProductId: purchase.productId,
            transactionId: iosTransactionId,
            pipelineDedupeKey: iosFinishDedupeKey,
          }
        );
      }

      log.info("[IAP] iOS pipeline: job start", {
        transactionId: iosTransactionId,
        productId: purchase.productId,
        pipelineDedupeKey: iosFinishDedupeKey,
        source: item.source,
        hasPendingRef: hasMatchingPending,
        dedupeKeyTier: item.dedupeKeyTier,
        storeKitEnvironmentIOS: (purchase as { environmentIOS?: string | null })
          .environmentIOS,
      });

      const finishIosPurchaseOnce = async (): Promise<void> => {
        if (iosFinishedTransactionIdsRef.current.has(iosFinishDedupeKey)) {
          log.info("[IAP] finish skip (already finished this key)", {
            dedupeKey: iosFinishDedupeKey,
            productId: purchase.productId,
            transactionId: iosTransactionId,
          });
          return;
        }
        log.info("[IAP] finishing transaction", {
          productId: purchase.productId,
          transactionId: iosTransactionId,
          transactionDate: iosPurchaseDateRaw,
          dedupeKey: iosFinishDedupeKey,
        });
        try {
          await finishPurchaseTransaction(purchase, false);
          iosFinishedTransactionIdsRef.current.add(iosFinishDedupeKey);
          setTimeout(() => {
            iosFinishedTransactionIdsRef.current.delete(iosFinishDedupeKey);
          }, IOS_FINISHED_DEDUPE_TTL_MS);
          log.info("[IAP] finished transaction", {
            productId: purchase.productId,
            transactionId: iosTransactionId,
            dedupeKey: iosFinishDedupeKey,
          });
        } catch (finishErr) {
          log.error("[IAP] finishPurchaseTransaction failed", {
            error:
              finishErr instanceof Error
                ? finishErr.message
                : String(finishErr),
            productId: purchase.productId,
            transactionId: iosTransactionId,
            dedupeKey: iosFinishDedupeKey,
          });
        }
      };

      try {
        if (hasMatchingPending) {
          const pendingFlow = pending!;
          try {
            const plansForResolve = getPlansForProductResolution(sessionPlans);
            const planId = getPlanIdFromProductId(
              purchase.productId,
              plansForResolve
            );
            if (!planId) {
              log.warn("[Subscription] handlePurchaseUpdate unknown product", {
                productId: purchase.productId,
                transactionId: iosTransactionId,
              });
              pendingFlow.reject(new Error("Unknown product"));
              return;
            }
            const authUser = useAuthStore.getState().user as
              | (Record<string, unknown> | null)
              | undefined;
            const isSubscribedFromMe = Boolean(authUser?.isSubscribed);
            const localSnap = await getLocalEntitlementSnapshot();
            const hasLocalEntitlement = Boolean(
              localSnap?.hasActiveEntitlement
            );
            const skipReceiptForUpgrade =
              isSubscribedFromMe || hasLocalEntitlement;
            if (skipReceiptForUpgrade) {
              iosCompletedPipelineKeysRef.current.add(iosFinishDedupeKey);
              iosSessionCompletedPipelineKeys.add(iosFinishDedupeKey);
              log.info(
                "[Subscription] iOS: upgrade flow detected — skipping Apple verify, calling backend directly",
                {
                  planId,
                  productId: purchase.productId,
                  transactionId: iosTransactionId,
                  isSubscribedFromMe,
                  hasLocalEntitlement,
                }
              );
              let upgradeIncludesTrial =
                !isLifetimePlanId(planId) &&
                (getPlanById(planId)?.trialDays ?? 0) > 0;
              try {
                const upgradePayload = await buildAppleSubscriptionRequest(
                  purchase,
                  planId,
                  {
                    // Upgrade path should not trigger extra Apple auth prompts.
                    preferCachedReceipt: true,
                    isUserInitiatedFlow: false,
                  }
                );
                upgradeIncludesTrial = upgradePayload.includesTrial ?? false;
                await subscribeApple(upgradePayload);
              } catch (upgradeBackendErr) {
                log.warn(
                  "[Subscription] iOS: upgrade flow backend call failed (continuing finish-only)",
                  {
                    planId,
                    productId: purchase.productId,
                    transactionId: iosTransactionId,
                    error:
                      upgradeBackendErr instanceof Error
                        ? upgradeBackendErr.message
                        : String(upgradeBackendErr),
                  }
                );
              }
              await setLocalEntitlementSnapshot({
                hasActiveEntitlement: true,
                planId,
              });
              setLocalPremiumOverride(true);
              syncFromAuthStore();
              await logIosPurchaseAnalyticsAfterBackendSuccess({
                purchase,
                planId,
                includesTrial: upgradeIncludesTrial,
              });
              analyticsService.logEvent(EVENTS.subs_confirm);
              analyticsService.logEvent(EVENTS.subscription_confirm);
              notifyPurchaseSuccess("ios_upgrade_skip_receipt_verify");
              pendingFlow.resolve();
              return;
            }

            log.info(
              "[Subscription] iOS: validate receipt → savePending → backend → finishTransaction (finally)",
              {
                planId,
                productId: purchase.productId,
                transactionId: iosTransactionId,
                source: item.source,
              }
            );

            const receiptPrereadMs = iosReceiptPrereadDelayMs();
            log.info("[IAP] iOS: receipt obtain (staggered read)", {
              transactionId: iosTransactionId,
              productId: purchase.productId,
              preReadDelayMs: receiptPrereadMs,
            });
            const receipt = await getIosAppStoreReceiptBase64OrThrow({
              isUserInitiatedFlow: true,
              preReadDelayMs: receiptPrereadMs,
              allowInteractiveReceiptRefresh: false,
              maxAttempts: 1,
            });
            log.info(
              "[Subscription] iOS: building receipt body and validating with Apple",
              {
                receiptLength: receipt.length,
                receiptMasked: maskAppleReceiptForLog(receipt),
                planId,
                productId: purchase.productId,
                transactionId: iosTransactionId,
              }
            );
            const receiptBody = buildAppleReceiptBody(receipt);
            const validation = await validateReceiptIosSmartWithRetry({
              receiptBody,
            });
            if (validation == null) {
              log.error("[Subscription] iOS: Apple verifyReceipt — no result", {
                planId,
                productId: purchase.productId,
                transactionId: iosTransactionId,
                outcome: "failure",
                phase: "validateReceiptIosSmartWithRetry",
              });
              throw new Error(
                "Apple receipt validation failed (no response or network error)"
              );
            }
            if (validation.status !== 0) {
              log.warn("[Subscription] iOS: Apple verifyReceipt — rejected", {
                planId,
                productId: purchase.productId,
                transactionId: iosTransactionId,
                outcome: "failure",
                phase: "validateReceiptIosSmartWithRetry",
                status: validation.status,
                statusLabel: getAppleVerifyReceiptStatusLabel(
                  validation.status
                ),
                environment: validation.environment ?? "(not set)",
                receiptLength: receipt.length,
              });
              throw new Error(
                `Apple receipt validation failed: ${validation.status}`
              );
            }
            log.info("[Subscription] iOS: Apple verifyReceipt — accepted", {
              planId,
              productId: purchase.productId,
              transactionId: iosTransactionId,
              outcome: "success",
              phase: "validateReceiptIosSmartWithRetry",
              status: validation.status,
              environment: validation.environment,
              isSandboxStore:
                validation.environment?.toLowerCase() === "sandbox",
              receiptLength: receipt.length,
            });

            const payload = buildAppleSubscriptionRequestFromValidation(
              receipt,
              planId,
              validation
            );
            const key = getPendingPurchaseKey("ios", receipt, iosTransactionId);
            log.info(
              "[Subscription] iOS: saving pending, then calling backend",
              {
                keyPrefix: key.slice(0, 24) + "…",
                isSandbox: payload.isSandbox,
                validationEnvironment: validation.environment,
                isSandboxUsed: payload.isSandbox,
                isLifetimePurchase: payload.isLifetimePurchase,
                includesTrial: payload.includesTrial ?? false,
                transactionId: iosTransactionId,
              }
            );
            await savePendingPurchase(key, { platform: "apple", payload });
            log.info("[Subscription][BackendPayload]", {
              platform: "apple",
              payload: {
                receiptMasked: maskAppleReceiptForLog(payload.receipt),
                receiptLength: payload.receipt?.length ?? 0,
                isSandbox: payload.isSandbox,
                isProduct: payload.isProduct,
                isLifetimePurchase: payload.isLifetimePurchase,
                includesTrial: payload.includesTrial ?? false,
              },
              validationStatus: validation.status,
              transactionId: iosTransactionId,
            });
            log.info("[Subscription] iOS: calling backend subscribeApple", {
              planId,
              productId: purchase.productId,
              transactionId: iosTransactionId,
              appleEnvironment: validation.environment,
              isSandboxPayload: payload.isSandbox,
            });

            let backendOk = false;
            try {
              await subscribeApple(payload);
              backendOk = true;
            } catch (backendErr) {
              const msg =
                backendErr instanceof Error
                  ? backendErr.message
                  : String(backendErr);
              log.error("[Subscription] iOS: backend subscribeApple failed", {
                error: msg,
                planId,
                productId: purchase.productId,
                transactionId: iosTransactionId,
                outcome: "failure",
                phase: "backend_subscribeApple",
                appleEnvironment: validation.environment,
                isSandboxPayload: payload.isSandbox,
              });
              pendingFlow.reject(
                backendErr instanceof Error
                  ? backendErr
                  : new Error(String(backendErr))
              );
            }

            if (backendOk) {
              iosCompletedPipelineKeysRef.current.add(iosFinishDedupeKey);
              iosSessionCompletedPipelineKeys.add(iosFinishDedupeKey);
              await removePendingPurchase(key);
              log.info(
                "[Subscription] iOS: backend subscribeApple OK (pending removed)",
                {
                  planId,
                  productId: purchase.productId,
                  transactionId: iosTransactionId,
                  appleEnvironment: validation.environment,
                }
              );
              await setLocalEntitlementSnapshot({
                hasActiveEntitlement: true,
                planId,
              });
              setLocalPremiumOverride(true);
              logPremiumStateSnapshot("ios_after_local_override_before_sync", {
                planId,
                transactionId: iosTransactionId,
              });
              syncFromAuthStore();
              logPremiumStateSnapshot("ios_after_syncFromAuthStore", {
                planId,
                transactionId: iosTransactionId,
              });
              await logIosPurchaseAnalyticsAfterBackendSuccess({
                purchase,
                planId,
                includesTrial: payload.includesTrial ?? false,
              });
              analyticsService.logEvent(EVENTS.subs_confirm);
              analyticsService.logEvent(EVENTS.subscription_confirm);
              log.info("[Subscription] flow: purchase update success", {
                planId,
                platform: "ios",
                outcome: "success",
                flow: "apple_iap",
                appleEnvironment: validation.environment,
                isSandboxPayload: payload.isSandbox,
                transactionId: iosTransactionId,
              });
              notifyPurchaseSuccess("ios_subscribe_apple_ok_pending_match");
              pendingFlow.resolve();
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const transientStoreKit = isTransientIosStoreKitError(err);
            let stillInStore = false;
            try {
              stillInStore = await iosPurchaseStillInAvailablePurchases(
                purchase.productId,
                iosTransactionId
              );
            } catch {
              stillInStore = false;
            }

            if (stillInStore) {
              const plansForResolve =
                getPlansForProductResolution(sessionPlans);
              const recoveredPlanId = getPlanIdFromProductId(
                purchase.productId,
                plansForResolve
              );
              log.warn(
                "[Subscription] iOS: pipeline failed BUT purchase still in getAvailablePurchases — RECOVERABLE",
                {
                  error: msg,
                  transactionId: iosTransactionId,
                  productId: purchase.productId,
                  transientStoreKit,
                }
              );
              await setLocalEntitlementSnapshot({
                hasActiveEntitlement: true,
                planId: recoveredPlanId,
              });
              setLocalPremiumOverride(true);
              syncFromAuthStore();
              schedulePremiumRecoveryRefresh("still_in_store_recoverable");
              setError({ type: "pending_backend", reason: "background_retry" });
              const authUser = useAuthStore.getState().user as
                | (Record<string, unknown> | null)
                | undefined;
              const isSubscribedFromMe = Boolean(authUser?.isSubscribed);
              if (isSubscribedFromMe) {
                log.info(
                  "[IAP] iOS: skip deferred recovery (still in store, /me isSubscribed=true)",
                  {
                    productId: purchase.productId,
                    transactionId: iosTransactionId,
                    planId: authUser?.planId ?? null,
                  }
                );
                notifyPurchaseSuccess("ios_recoverable_in_store_subscribed");
                pendingFlow.resolve();
                return;
              }
              const hasPendingSaved = await checkIfPendingExistsForTransaction(
                iosTransactionId
              );
              if (hasPendingSaved) {
                scheduleIosDeferredPipelineRecovery({
                  productId: purchase.productId,
                  transactionId: iosTransactionId,
                  reason: "entitlement_still_in_store",
                });
              } else {
                log.info(
                  "[IAP] iOS: recoverable in-store transaction has no pending row → skip deferred recovery",
                  {
                    productId: purchase.productId,
                    transactionId: iosTransactionId,
                  }
                );
              }
              notifyPurchaseSuccess("ios_recoverable_in_store_background");
              pendingFlow.resolve();
            } else {
              log.error("[Subscription] handlePurchaseUpdate failed", {
                error: msg,
                platform: "ios",
                productId: purchase.productId,
                transactionId: iosTransactionId,
                outcome: "failure",
                transientStoreKit,
                stillInStore,
                hint: transientStoreKit
                  ? "Retry receipt/verify or Restore purchases if charged"
                  : undefined,
              });
              setError(buildFailedPurchaseState(err, { transientStoreKit }));
              if (transientStoreKit) {
                scheduleIosDeferredPipelineRecovery({
                  productId: purchase.productId,
                  transactionId: iosTransactionId,
                  reason: "transient_storekit_no_store_row",
                });
              }
              pendingFlow.reject(
                err instanceof Error ? err : new Error(String(err))
              );
            }
          } finally {
            pendingRef.current = null;
            isPurchasingRef.current = false;
            setIsPurchasing(false);
          }
        } else {
          log.info("[IAP] orphan purchase in queue", {
            transactionId: iosTransactionId,
            productId: purchase.productId,
            source: item.source,
          });
          const authUser = useAuthStore.getState().user as
            | (Record<string, unknown> | null)
            | undefined;
          const isSubscribedFromMe = Boolean(authUser?.isSubscribed);
          const localSnap = await getLocalEntitlementSnapshot();
          const hasLocalEntitlement = Boolean(localSnap?.hasActiveEntitlement);
          // Product decision: orphan replays should not trigger receipt reads/verification.
          // Keep it finish-only to avoid Apple prompt/noise on launch and replays.
          const skipReceiptForOrphanReplay = !pendingRef.current;
          if (skipReceiptForOrphanReplay) {
            iosCompletedPipelineKeysRef.current.add(iosFinishDedupeKey);
            iosSessionCompletedPipelineKeys.add(iosFinishDedupeKey);
            log.info(
              "[IAP] orphan replay: skipping receipt/backend and finishing only",
              {
                productId: purchase.productId,
                transactionId: iosTransactionId,
                source: item.source,
                isSubscribedFromMe,
                hasLocalEntitlement,
              }
            );
            await finishIosPurchaseOnce();
            return;
          }
          try {
            const plansForResolve = getPlansForProductResolution(sessionPlans);
            const planId = getPlanIdFromProductId(
              purchase.productId,
              plansForResolve
            );
            if (!planId) {
              log.warn("[Subscription] iOS orphan: unknown product", {
                productId: purchase.productId,
                transactionId: iosTransactionId,
              });
            } else {
              let rawReceipt: string;
              try {
                const orphanPreread = iosReceiptPrereadDelayMs();
                log.info("[IAP] iOS orphan: obtaining receipt (staggered)", {
                  transactionId: iosTransactionId,
                  productId: purchase.productId,
                  preReadDelayMs: orphanPreread,
                  interactiveReceiptRefreshAllowed: false,
                });
                rawReceipt = await getIosAppStoreReceiptBase64OrThrow({
                  // Critical: orphan/cold-start queue processing must never trigger Apple ID prompts.
                  // We only allow interactive receipt refresh in active user-initiated purchase flow.
                  isUserInitiatedFlow: false,
                  preReadDelayMs: orphanPreread,
                  allowInteractiveReceiptRefresh: false,
                  maxAttempts: 1,
                });
              } catch (orphanReceiptErr) {
                log.warn("[IAP] orphan: receipt obtain failed → finish only", {
                  productId: purchase.productId,
                  transactionId: iosTransactionId,
                  error:
                    orphanReceiptErr instanceof Error
                      ? orphanReceiptErr.message
                      : String(orphanReceiptErr),
                });
                rawReceipt = "";
              }
              if (
                !rawReceipt ||
                rawReceipt.length <= MIN_IOS_APP_STORE_RECEIPT_LENGTH
              ) {
                log.info("[IAP] orphan: no valid receipt → finish only", {
                  productId: purchase.productId,
                  transactionId: iosTransactionId,
                  receiptLength: rawReceipt?.length ?? 0,
                });
              } else {
                const receiptBody = buildAppleReceiptBody(rawReceipt);
                const validation = await validateReceiptIosSmartWithRetry({
                  receiptBody,
                });
                if (validation != null && validation.status === 0) {
                  const payload = buildAppleSubscriptionRequestFromValidation(
                    rawReceipt,
                    planId,
                    validation
                  );
                  const key = getPendingPurchaseKey(
                    "ios",
                    rawReceipt,
                    iosTransactionId
                  );
                  await savePendingPurchase(key, {
                    platform: "apple",
                    payload,
                  });
                  try {
                    await subscribeApple(payload);
                    await removePendingPurchase(key);
                    iosCompletedPipelineKeysRef.current.add(iosFinishDedupeKey);
                    iosSessionCompletedPipelineKeys.add(iosFinishDedupeKey);
                    await setLocalEntitlementSnapshot({
                      hasActiveEntitlement: true,
                      planId,
                    });
                    setLocalPremiumOverride(true);
                    logPremiumStateSnapshot(
                      "ios_orphan_after_local_override_before_sync",
                      {
                        planId,
                        transactionId: iosTransactionId,
                      }
                    );
                    syncFromAuthStore();
                    logPremiumStateSnapshot(
                      "ios_orphan_after_syncFromAuthStore",
                      {
                        planId,
                        transactionId: iosTransactionId,
                      }
                    );
                    await logIosPurchaseAnalyticsAfterBackendSuccess({
                      purchase,
                      planId,
                      includesTrial: payload.includesTrial ?? false,
                    });
                    analyticsService.logEvent(EVENTS.subs_confirm);
                    analyticsService.logEvent(EVENTS.subscription_confirm);
                    log.info("[IAP] orphan purchase subscribeApple OK", {
                      planId,
                      productId: purchase.productId,
                      transactionId: iosTransactionId,
                    });
                    notifyPurchaseSuccess("ios_orphan_subscribe_apple_ok");
                    const settlePending = pendingRef.current;
                    if (
                      settlePending &&
                      settlePending.productId === purchase.productId
                    ) {
                      log.info(
                        "[Subscription] flow: pending purchase settled after orphan subscribeApple",
                        {
                          productId: purchase.productId,
                          transactionId: iosTransactionId,
                        }
                      );
                      clearPendingWatchdog();
                      settlePending.resolve();
                      pendingRef.current = null;
                      isPurchasingRef.current = false;
                      setIsPurchasing(false);
                    }
                  } catch (orphanBackendErr) {
                    log.error(
                      "[Subscription] iOS orphan: subscribeApple failed",
                      {
                        error:
                          orphanBackendErr instanceof Error
                            ? orphanBackendErr.message
                            : String(orphanBackendErr),
                        planId,
                        productId: purchase.productId,
                        transactionId: iosTransactionId,
                      }
                    );
                  }
                } else {
                  log.warn(
                    "[Subscription] iOS orphan: receipt validation not OK",
                    {
                      productId: purchase.productId,
                      transactionId: iosTransactionId,
                      status: validation?.status ?? null,
                      environment: validation?.environment ?? null,
                    }
                  );
                }
              }
            }
            log.info("[IAP] orphan purchase handled", {
              productId: purchase.productId,
              transactionId: iosTransactionId,
            });
          } catch (orphanErr) {
            log.warn("[IAP] orphan flow failed", {
              error:
                orphanErr instanceof Error
                  ? orphanErr.message
                  : String(orphanErr),
              productId: purchase.productId,
              transactionId: iosTransactionId,
            });
          }
        }
      } catch (iosOuterErr) {
        const msg =
          iosOuterErr instanceof Error
            ? iosOuterErr.message
            : String(iosOuterErr);
        log.error("[IAP] purchase update error", {
          error: msg,
          productId: purchase.productId,
          transactionId: iosTransactionId,
        });
        await finishIosPurchaseOnce();
      } finally {
        await finishIosPurchaseOnce();
      }
    },
    [
      sessionPlans,
      subscribeApple,
      syncFromAuthStore,
      setLocalPremiumOverride,
      logPremiumStateSnapshot,
      clearPendingWatchdog,
    ]
  );

  useEffect(() => {
    processIosPurchaseFromQueueRef.current = processIosPurchaseFromQueue;
  }, [processIosPurchaseFromQueue]);

  useEffect(() => {
    enqueueIosPurchaseRef.current = enqueueIosPurchase;
  }, [enqueueIosPurchase]);

  const handlePurchaseUpdate = useCallback(
    async (purchase: Purchase) => {
      const log = useAppLogsStore.getState();
      console.log("[IAP-DEBUG] purchaseUpdatedListener fired", {
        platform: Platform.OS,
        productId: purchase.productId,
        hasPurchaseToken: Boolean(purchase.purchaseToken),
        transactionDate: purchase.transactionDate,
      });

      // ----- Android: unchanged (finish only after successful backend) -----
      if (Platform.OS === "android") {
        const pending = pendingRef.current;
        if (!pending || purchase.productId !== pending.productId) {
          log.debug(
            "[Subscription] handlePurchaseUpdate skip (no pending or productId mismatch)",
            {
              purchaseProductId: purchase.productId,
              pendingProductId: pending?.productId ?? null,
              hasPending: !!pending,
            }
          );
          return;
        }
        let skipSharedCleanup = false;
        try {
          const plansForResolve = getPlansForProductResolution(sessionPlans);
          const planId = getPlanIdFromProductId(
            purchase.productId,
            plansForResolve
          );
          if (!planId) {
            log.warn("[Subscription] handlePurchaseUpdate unknown product", {
              productId: purchase.productId,
            });
            pending.reject(new Error("Unknown product"));
            return;
          }
          log.info("[Subscription] flow: purchase update (native)", {
            planId,
            productId: purchase.productId,
            platform: "android",
          });

          if (purchaseUpdateInFlightRef.current) {
            log.info(
              "[Subscription] handlePurchaseUpdate skip (already processing)",
              {
                planId,
                productId: purchase.productId,
                reason:
                  "concurrent StoreKit callback — first invocation owns flow",
              }
            );
            skipSharedCleanup = true;
            return;
          }
          purchaseUpdateInFlightRef.current = true;

          let purchaseSuccessMeta: Record<string, unknown> = {};

          log.info("[IAP] Purchase success received", {
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            purchaseTokenPreview: purchase.purchaseToken?.slice(0, 24),
          });
          log.info("[IAP PaidPurchase] 00_android: store purchase update", {
            planId,
            productId: purchase.productId,
            next: "acknowledgePurchase → logAndroidPurchaseAnalyticsAfterAcknowledge (steps 01–06)",
          });
          log.info("[Subscription] Android: acknowledgePurchaseAndroid");
          await acknowledgePurchaseAndroid(purchase.purchaseToken!);
          log.info("[IAP] Purchase acknowledged", {
            productId: purchase.productId,
          });
          const { includesTrial } =
            await logAndroidPurchaseAnalyticsAfterAcknowledge({
              purchase,
              planId,
            });
          const payload = buildGoogleSubscriptionRequest(purchase, planId, {
            includesTrial,
          });
          const isAndroidConsumable =
            Platform.OS === "android" &&
            !isLifetimePlanId(planId) &&
            !getPlanById(planId)?.recurring;
          const key = getPendingPurchaseKey("android", purchase.purchaseToken!);
          await savePendingPurchase(key, { platform: "google", payload });
          log.info("[Subscription][BackendPayload]", {
            platform: "google",
            payload,
          });
          try {
            await subscribeGoogle(payload);
          } catch (backendErr) {
            const msg =
              backendErr instanceof Error
                ? backendErr.message
                : String(backendErr);
            log.error("[Subscription] backend subscribeGoogle failed", {
              error: msg,
            });
            await setLocalEntitlementSnapshot({
              hasActiveEntitlement: true,
              planId,
            });
            setLocalPremiumOverride(true);
            syncFromAuthStore();
            refreshProfileSilent().catch(() => {});
            notifyPurchaseSuccess(
              "android_backend_failed_but_local_entitlement_set"
            );
            pending.resolve();
            pendingRef.current = null;
            isPurchasingRef.current = false;
            setIsPurchasing(false);
            return;
          }
          await removePendingPurchase(key);
          await finishPurchaseTransaction(purchase, isAndroidConsumable);
          log.info(
            "[Subscription] Android: backend success, finishTransaction done",
            {
              planId,
              productId: purchase.productId,
              includesTrial: payload.includesTrial,
              isConsumable: isAndroidConsumable,
              outcome: "success",
            }
          );
          purchaseSuccessMeta = {
            flow: "google_iap",
            productId: purchase.productId,
            includesTrial: payload.includesTrial,
          };

          await setLocalEntitlementSnapshot({
            hasActiveEntitlement: true,
            planId,
          });
          setLocalPremiumOverride(true);
          logPremiumStateSnapshot("android_after_local_override_before_sync", {
            planId,
            productId: purchase.productId,
          });
          syncFromAuthStore();
          logPremiumStateSnapshot("android_after_syncFromAuthStore", {
            planId,
            productId: purchase.productId,
          });
          // subscribeGoogle already awaited getProfile(); avoid refreshProfileSilent here — a second
          // GET /me can briefly return isSubscribed:false and break premium UI if we synced again.
          analyticsService.logEvent(EVENTS.subs_confirm);
          analyticsService.logEvent(EVENTS.subscription_confirm);
          log.info("[Subscription] flow: purchase update success", {
            planId,
            platform: "android",
            outcome: "success",
            ...purchaseSuccessMeta,
          });
          notifyPurchaseSuccess("android_subscribe_google_ok");
          pending.resolve();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          log.error("[Subscription] handlePurchaseUpdate failed", {
            error: msg,
            platform: "android",
            productId: pending?.productId ?? null,
            outcome: "failure",
          });
          setError(
            buildFailedPurchaseState(err, {
              transientStoreKit: isTransientIosStoreKitError(err),
            })
          );
          pending.reject(err instanceof Error ? err : new Error(String(err)));
        } finally {
          if (!skipSharedCleanup) {
            pendingRef.current = null;
            isPurchasingRef.current = false;
            setIsPurchasing(false);
            purchaseUpdateInFlightRef.current = false;
          }
        }
        return;
      }

      // ----- iOS: listener → FIFO queue (serial processor; never drop transactions) -----
      const iosMeta = getIosPurchaseQueueMeta(purchase);
      console.log("[IAP-DEBUG] iOS purchaseUpdatedListener → queue", {
        productId: purchase.productId,
        transactionId: iosMeta.transactionId,
        pipelineDedupeKey: iosMeta.pipelineDedupeKey,
        hasPendingRef: !!pendingRef.current,
        pendingProductId: pendingRef.current?.productId ?? null,
        storeKitEnvironmentIOS: (purchase as { environmentIOS?: string | null })
          .environmentIOS,
      });
      log.info("[IAP PaidPurchase] 00_ios: store purchase update (queued)", {
        productId: purchase.productId,
        transactionId: iosMeta.transactionId,
        next: "serial queue → validate receipt → subscribeApple → logIosPurchaseAnalyticsAfterBackendSuccess (steps 01–06)",
      });
      log.info("[IAP] Purchase success received", {
        productId: purchase.productId,
        transactionId: iosMeta.transactionId,
        pipelineDedupeKey: iosMeta.pipelineDedupeKey,
      });
      log.info("[IAP] purchase update received (listener → queue)", {
        transactionId: iosMeta.transactionId,
        productId: purchase.productId,
        pipelineDedupeKey: iosMeta.pipelineDedupeKey,
        hasPendingRef: !!pendingRef.current,
      });
      log.info("[Subscription] flow: purchase update (native)", {
        platform: "ios",
        productId: purchase.productId,
        transactionId: iosMeta.transactionId,
        hasPendingRef: !!pendingRef.current,
        storeKitEnvironmentIOS: (purchase as { environmentIOS?: string | null })
          .environmentIOS,
      });
      enqueueIosPurchase(purchase, "listener");
      return;
    },
    [
      sessionPlans,
      subscribeGoogle,
      subscribeApple,
      syncFromAuthStore,
      setLocalPremiumOverride,
      refreshProfileSilent,
      enqueueIosPurchase,
      logPremiumStateSnapshot,
    ]
  );

  const handlePurchaseError = useCallback(
    (err: PurchaseError) => {
      const log = useAppLogsStore.getState();
      console.error("[IAP-DEBUG] purchaseErrorListener fired", {
        platform: Platform.OS,
        code: err?.code,
        message: err?.message,
        responseCode: (err as PurchaseError & { responseCode?: number })
          ?.responseCode,
        debugMessage: (err as PurchaseError & { debugMessage?: string })
          ?.debugMessage,
      });
      const pending = pendingRef.current;
      let deferPendingToIosPipeline = false;
      const code = String(err?.code ?? "");
      const msg = String(err?.message ?? "");
      const isCancelled =
        code === "E_USER_CANCELLED" ||
        code === "user-cancelled" ||
        /cancelled|canceled/i.test(msg);
      const isAlreadyOwned =
        code === "already-owned" ||
        code === "E_ALREADY_OWNED" ||
        /already owned|already-owned/i.test(msg);
      if (isCancelled) {
        log.info("[IAP] User cancelled purchase", { platform: Platform.OS });
      } else {
        log.warn("[Subscription] handlePurchaseError", {
          platform: Platform.OS,
          code,
          message: err?.message ?? "Unknown",
          responseCode: (err as PurchaseError & { responseCode?: number })
            ?.responseCode,
          debugMessage: (err as PurchaseError & { debugMessage?: string })
            ?.debugMessage,
        });
      }
      if (pending) {
        let handledAsResolved = false;
        if (isCancelled) {
          analyticsService.logEvent(EVENTS.subs_cancel);
        } else if (isAlreadyOwned && Platform.OS === "ios") {
          const authUser = useAuthStore.getState().user as
            | (Record<string, unknown> | null)
            | undefined;
          const isSubscribedFromMe = Boolean(authUser?.isSubscribed);
          const plansForResolve = getPlansForProductResolution(sessionPlans);
          const pendingPlanId = getPlanIdFromProductId(
            pending.productId,
            plansForResolve
          );
          if (isSubscribedFromMe) {
            void setLocalEntitlementSnapshot({
              hasActiveEntitlement: true,
              planId: pendingPlanId,
            });
            setLocalPremiumOverride(true);
            syncFromAuthStore();
            schedulePremiumRecoveryRefresh("purchase_error_already_owned");
            setError(null);
            log.info(
              "[IAP] iOS already-owned: /me subscribed — resolve pending",
              {
                pendingProductId: pending.productId,
                planId: authUser?.planId ?? null,
                code,
                message: msg,
              }
            );
            notifyPurchaseSuccess("ios_already_owned_me_subscribed");
            pending.resolve();
            handledAsResolved = true;
          } else {
            // Keep local premium override unchanged here: flipping it to true can trigger the
            // premium→pending effect and resolve the promise before subscribeApple runs.
            void setLocalEntitlementSnapshot({
              hasActiveEntitlement: true,
              planId: pendingPlanId,
            });
            syncFromAuthStore();
            log.info(
              "[IAP] iOS already-owned: driving StoreKit tx through queue for backend sync",
              {
                pendingProductId: pending.productId,
                code,
                message: msg,
              }
            );
            if (pendingListenerRecoveryTimeoutRef.current != null) {
              clearTimeout(pendingListenerRecoveryTimeoutRef.current);
              pendingListenerRecoveryTimeoutRef.current = null;
            }
            kickPendingIosPurchaseFromAvailable(
              "purchase_error_already_owned",
              {
                bypassThrottle: true,
              }
            );
            setError({ type: "pending_backend", reason: "background_retry" });
            deferPendingToIosPipeline = true;
          }
        } else {
          const message = msg || "Purchase failed";
          analyticsService.logEvent(EVENTS.subs_fail, {
            error_message: message,
          });
        }
        if (!deferPendingToIosPipeline) {
          if (!handledAsResolved) {
            pending.reject(
              new Error(
                isCancelled
                  ? "Purchase was cancelled"
                  : isAlreadyOwned && Platform.OS === "ios"
                  ? `${PURCHASE_PENDING_BACKEND}: already owned in App Store. Use Restore purchases manually if backend is not updated.`
                  : msg || "Purchase failed"
              )
            );
          }
          pendingRef.current = null;
        }
      }
      if (!deferPendingToIosPipeline) {
        clearPendingWatchdog();
        isPurchasingRef.current = false;
        setIsPurchasing(false);
      }
      if (
        !isCancelled &&
        !(isAlreadyOwned && Platform.OS === "ios") &&
        !deferPendingToIosPipeline
      ) {
        setError(
          buildFailedPurchaseState(new Error(msg || "Purchase failed"), {
            transientStoreKit: isTransientIosStoreKitError(err),
          })
        );
      }
    },
    [
      clearPendingWatchdog,
      sessionPlans,
      kickPendingIosPurchaseFromAvailable,
      setLocalPremiumOverride,
      syncFromAuthStore,
      schedulePremiumRecoveryRefresh,
    ]
  );

  useEffect(() => {
    handlePurchaseUpdateRef.current = handlePurchaseUpdate;
  }, [handlePurchaseUpdate]);

  useEffect(() => {
    handlePurchaseErrorRef.current = handlePurchaseError;
  }, [handlePurchaseError]);

  useEffect(() => {
    let updateSub: { remove: () => void } | null = null;
    let errorSub: { remove: () => void } | null = null;

    const setup = async () => {
      if (isInitializedRef.current) return;
      const maxAttempts = 3;
      let lastError: unknown;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          if (attempt === 0) {
            useAppLogsStore
              .getState()
              .info("[Subscription] flow: IAP init start");
          } else {
            useAppLogsStore
              .getState()
              .info("[Subscription] flow: IAP init retry", {
                attempt: attempt + 1,
                maxAttempts,
              });
          }
          await initIapConnection();
          isInitializedRef.current = true;
          useAppLogsStore
            .getState()
            .info("[Subscription] flow: IAP init success");
          break;
        } catch (e) {
          lastError = e;
          if (attempt < maxAttempts - 1) {
            await new Promise<void>((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
          }
        }
      }
      if (!isInitializedRef.current) {
        useAppLogsStore
          .getState()
          .warn("[Subscription] flow: IAP init failed after retries", {
            error:
              lastError instanceof Error
                ? lastError.message
                : String(lastError),
          });
        return;
      }

      updateSub = purchaseUpdatedListener((purchase) =>
        handlePurchaseUpdateRef.current(purchase)
      );
      errorSub = purchaseErrorListener((err) =>
        handlePurchaseErrorRef.current(err)
      );

      /**
       * iOS cold-start: exactly one `getOurAvailablePurchases` after init — enqueue only.
       * The FIFO drain runs jobs one-by-one (no parallel receipt reads). Duplicate tx keys are
       * dropped at enqueue; session-completed keys are dropped at dequeue.
       */
      if (Platform.OS === "ios" && !iosColdStartPurchaseBatchScheduled) {
        iosColdStartPurchaseBatchScheduled = true;
        const coldLog = useAppLogsStore.getState();
        const authUser = useAuthStore.getState().user as
          | (Record<string, unknown> | null)
          | undefined;
        const isSubscribedFromMe = Boolean(authUser?.isSubscribed);
        if (isSubscribedFromMe) {
          coldLog.info(
            "[IAP] iOS cold-start: skip getOurAvailablePurchases enqueue (/me isSubscribed=true)",
            {
              isSubscribedFromMe,
              planId: authUser?.planId ?? null,
              provider: authUser?.subscriptionProvider ?? null,
            }
          );
          return;
        }
        coldLog.info(
          "[IAP] iOS cold-start: scheduling getOurAvailablePurchases → queue"
        );
        void getOurAvailablePurchases()
          .then(async (ours) => {
            if (ours.length > 0) {
              const firstProductId = ours[0]?.purchase?.productId;
              const plansForResolve =
                getPlansForProductResolution(sessionPlans);
              const firstPlanId = firstProductId
                ? getPlanIdFromProductId(firstProductId, plansForResolve)
                : undefined;
              await setLocalEntitlementSnapshot({
                hasActiveEntitlement: true,
                planId: firstPlanId,
              });
              setLocalPremiumOverride(true);
              syncFromAuthStore();
              schedulePremiumRecoveryRefresh(
                "cold_start_store_transaction_detected"
              );
              coldLog.info(
                "[IAP] iOS cold-start: active store transaction found → set local premium true",
                {
                  count: ours.length,
                  firstProductId: firstProductId ?? null,
                  firstPlanId: firstPlanId ?? null,
                }
              );
            }
            coldLog.info(
              "[IAP] iOS cold-start: batch received → ENQUEUE each",
              {
                count: ours.length,
                transactionIds: ours.map(({ purchase: p }) => {
                  return (
                    (p as Purchase & { transactionId?: string })
                      .transactionId ?? null
                  );
                }),
              }
            );
            for (const { purchase } of ours) {
              const transactionId =
                (purchase as Purchase & { transactionId?: string })
                  .transactionId ?? null;
              // /me is not subscribed — always enqueue so orphan/cold-start pipeline can run
              // subscribeApple even when no pending row exists (StoreKit-only recovery).
              coldLog.info("[IAP] iOS cold-start: enqueue store transaction", {
                transactionId,
                productId: purchase.productId,
              });
              enqueueIosPurchaseRef.current(purchase, "cold_start");
            }
          })
          .catch((err) => {
            coldLog.warn(
              "[IAP] iOS cold-start: getOurAvailablePurchases failed",
              {
                error: err instanceof Error ? err.message : String(err),
              }
            );
          });
      }

      // Sync purchase history once when IAP is ready (so user shows as premium if they already bought)
      if (!hasRestoredOnMountRef.current) {
        hasRestoredOnMountRef.current = true;
        // Show premium from local entitlement immediately (before restore/backend) so UI shows "you are subscribed"
        getLocalEntitlementSnapshot().then((snap) => {
          if (snap.hasActiveEntitlement) {
            useSubscriptionStore.getState().setLocalPremiumOverride(true);
          }
        });
        useAppLogsStore
          .getState()
          .info(
            "[Subscription] flow: IAP init (no auto restore here — retry pending + optional one-time restore run from root)"
          );
      }
    };

    setup();
    return () => {
      updateSub?.remove();
      errorSub?.remove();
    };
  }, [schedulePremiumRecoveryRefresh]);

  /**
   * Legacy entry point (paywall focus / sheet close). Disabled: all platforms use
   * `purchaseUpdatedListener` only so we never re-enter receipt work from navigation/AppState.
   */
  const checkPendingPurchaseFromStore = useCallback(() => {
    useAppLogsStore
      .getState()
      .debug(
        "[Subscription] checkPendingPurchaseFromStore: no-op (listener-only pipeline)"
      );
  }, []);

  const purchasePlan = useCallback(
    (planId: PlanId): Promise<void> => {
      if (isPurchasingRef.current) {
        useAppLogsStore
          .getState()
          .warn("[Subscription] purchasePlan rejected (already in progress)", {
            planId,
          });
        return Promise.reject(new Error("Purchase already in progress"));
      }
      setError(null);
      return new Promise((resolve, reject) => {
        const plan = sessionPlans?.length
          ? sessionPlans.find((p) => p.id === planId)
          : getPlanById(planId);
        const productId =
          plan &&
          (Platform.OS === "android"
            ? plan.productIdAndroid
            : plan.productIdIos);
        if (!productId) {
          reject(new Error(`Unknown plan: ${planId}`));
          return;
        }
        getLocalEntitlementSnapshot()
          .then((snap) => {
            const authUser = useAuthStore.getState().user as
              | (Record<string, unknown> | null)
              | undefined;
            const authPlanId =
              typeof authUser?.planId === "string" ? authUser.planId : null;
            const hasLifetimeEntitlement =
              isLifetimePlanId(snap.planId ?? null) ||
              isLifetimePlanId(authPlanId);
            if (hasLifetimeEntitlement) {
              useAppLogsStore
                .getState()
                .info(
                  "[Subscription] purchasePlan blocked (lifetime already owned)",
                  {
                    planId,
                    snapshotPlanId: snap.planId ?? null,
                    authPlanId,
                  }
                );
              reject(new Error("You already have a lifetime subscription."));
              return;
            }
            startPurchaseFlow();
          })
          .catch((e) => {
            useAppLogsStore
              .getState()
              .warn(
                "[Subscription] purchasePlan: lifetime check failed, proceeding",
                {
                  planId,
                  error: e instanceof Error ? e.message : String(e),
                }
              );
            startPurchaseFlow();
          });

        function startPurchaseFlow() {
          if (Platform.OS === "ios" && !isAppleSubscriptionsEnabled()) {
            useAppLogsStore.getState().warn(
              "[Subscription] purchasePlan blocked (appleSubscriptionsEnabled=false)",
              { planId }
            );
            reject(new Error(APPLE_SUBSCRIPTIONS_DISABLED_MESSAGE));
            return;
          }
          if (isPurchasingRef.current) {
            useAppLogsStore
              .getState()
              .warn(
                "[Subscription] purchasePlan start blocked (race: already in progress)",
                { planId }
              );
            reject(new Error("Purchase already in progress"));
            return;
          }
          isPurchasingRef.current = true;
          console.log("[IAP-DEBUG] purchasePlan start", {
            planId,
            productId,
            platform: Platform.OS,
          });
          useAppLogsStore
            .getState()
            .info("[Subscription] flow: purchasePlan start", { planId });
          pendingRef.current = { resolve, reject, productId: productId! };
          setIsPurchasing(true);
          clearPendingWatchdog();
          pendingListenerRecoveryTimeoutRef.current = setTimeout(() => {
            // Upgrade safety net: if StoreKit replays an older transaction first,
            // proactively pull available purchases and enqueue the pending SKU.
            kickPendingIosPurchaseFromAvailable(
              "pending_listener_miss_recovery"
            );
          }, 6000);
          pendingWatchdogTimeoutRef.current = setTimeout(() => {
            const stillPending = pendingRef.current;
            if (!stillPending || stillPending.productId !== productId) return;
            useAppLogsStore
              .getState()
              .warn(
                "[Subscription] flow: purchase watchdog timeout (no terminal callback)",
                { planId, productId, timeoutMs: 90000 }
              );
            setError({
              type: "pending_backend",
            });
            stillPending.reject(
              new Error(
                `${PURCHASE_PENDING_BACKEND}: Purchase is still finalizing. Please wait or tap Restore.`
              )
            );
            pendingRef.current = null;
            isPurchasingRef.current = false;
            setIsPurchasing(false);
          }, 90_000);
          analyticsService.logEvent(EVENTS.subs_native);
          analyticsService.logEvent(EVENTS.subs_payment_initiated);
          requestPlanPurchase(planId).catch((err) => {
            console.error("[IAP-DEBUG] requestPlanPurchase failed", {
              planId,
              productId,
              error: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
            });
            useAppLogsStore
              .getState()
              .error("[Subscription] flow: requestPlanPurchase failed", {
                planId,
                productId,
                error: err instanceof Error ? err.message : String(err),
              });
            setError(
              buildFailedPurchaseState(err, {
                transientStoreKit: isTransientIosStoreKitError(err),
              })
            );
            pendingRef.current = null;
            clearPendingWatchdog();
            isPurchasingRef.current = false;
            setIsPurchasing(false);
            reject(err);
          });
        }
      });
    },
    [sessionPlans, clearPendingWatchdog]
  );

  const clearError = useCallback(() => setError(null), []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    const log = useAppLogsStore.getState();
    setError(null);
    if (Platform.OS === "ios" && !isAppleSubscriptionsEnabled()) {
      log.warn(
        "[Subscription] restore blocked (appleSubscriptionsEnabled=false)"
      );
      setError({
        type: "failed",
        summary: APPLE_SUBSCRIPTIONS_DISABLED_MESSAGE,
      });
      return false;
    }
    setIsRestoring(true);
    log.info("[Subscription] flow: restore (user-triggered) start");
    try {
      const synced = await runRestorePurchasesSync({
        skipInit: true,
        trigger: "manual",
      });
      log.info("[Subscription] flow: restore done", { synced });
      if (synced) {
        useSubscriptionStore.getState().setPendingWelcomeModal(true);
      }
      return synced;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Restore failed";
      log.warn("[Subscription] restorePurchases failed", { error: msg });
      setError(
        buildFailedPurchaseState(new Error(msg), {
          transientStoreKit: isTransientIosStoreKitError(err),
        })
      );
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingWatchdog();
      if (premiumRecoveryRefreshTimeoutRef.current != null) {
        clearTimeout(premiumRecoveryRefreshTimeoutRef.current);
        premiumRecoveryRefreshTimeoutRef.current = null;
      }
    };
  }, [clearPendingWatchdog]);

  return {
    purchasePlan,
    restorePurchases,
    isPurchasing,
    isRestoring,
    error,
    clearError,
    checkPendingPurchaseFromStore,
  };
}
