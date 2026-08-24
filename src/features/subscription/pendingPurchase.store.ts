/**
 * Durable Pending Purchase Persistence (Android + iOS)
 *
 * WHY: If ACK succeeds but backend call fails (e.g. network), the purchase must not be lost
 * after app kill. We persist the payload AFTER successful ACK (Android) or before backend (iOS)
 * and remove ONLY after backend confirms success. Startup recovery then retries each pending item.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  GoogleSubscriptionRequest,
  AppleSubscriptionRequest,
} from "../../services/api/features/auth.api.types";
import { useAppLogsStore } from "../app-logs/app-logs.store";

const PENDING_PURCHASES_KEY = "PENDING_PURCHASE_QUEUE";

export type PendingPurchasePayload =
  | { platform: "google"; payload: GoogleSubscriptionRequest }
  | { platform: "apple"; payload: AppleSubscriptionRequest };

export interface PendingPurchaseEntry {
  key: string;
  payload: PendingPurchasePayload;
  /** When saved; for optional TTL or debugging */
  savedAt: number;
}

/**
 * Generate unique key for a pending purchase.
 * Android: purchaseToken (unique per purchase).
 * iOS: transactionId if available, else short hash of receipt so we can dedupe.
 */
export function getPendingPurchaseKey(
  platform: "android" | "ios",
  purchaseTokenOrReceipt: string,
  transactionId?: string | null
): string {
  if (platform === "android") {
    return `android:${purchaseTokenOrReceipt}`;
  }
  if (transactionId) {
    return `ios:${transactionId}`;
  }
  return `ios:${purchaseTokenOrReceipt.slice(0, 80)}:${
    purchaseTokenOrReceipt.length
  }`;
}

/**
 * Save pending payload AFTER successful ACK (Android) or before backend call (iOS).
 * Remove from storage ONLY after backend confirms success (call removePendingPurchase).
 */
export async function savePendingPurchase(
  key: string,
  payload: PendingPurchasePayload
): Promise<void> {
  const log = useAppLogsStore.getState();
  try {
    const list = await getPendingPurchases();
    const entry: PendingPurchaseEntry = { key, payload, savedAt: Date.now() };
    const next = list.filter((e) => e.key !== key);
    next.push(entry);
    await AsyncStorage.setItem(PENDING_PURCHASES_KEY, JSON.stringify(next));
    log.info("[Subscription] savePendingPurchase", {
      key: key.slice(0, 20) + "…",
      platform: payload.platform,
    });
  } catch (e) {
    log.error("[Subscription] savePendingPurchase failed", {
      key: key.slice(0, 20),
      error: String(e),
    });
    throw e;
  }
}

/**
 * Get all pending purchases for startup retry. Does not mutate.
 */
export async function getPendingPurchases(): Promise<PendingPurchaseEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_PURCHASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingPurchaseEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * True if a pending row exists for this iOS StoreKit transaction id (`ios:${transactionId}`).
 * Used to decide whether transient-failure recovery can rely on retryPendingPurchases alone.
 */
export async function checkIfPendingExistsForTransaction(
  transactionId: string | null | undefined
): Promise<boolean> {
  if (transactionId == null || String(transactionId).trim() === "") {
    return false;
  }
  const expectedKey = `ios:${transactionId}`;
  const list = await getPendingPurchases();
  return list.some((e) => e.key === expectedKey);
}

/**
 * Remove one pending purchase after backend confirms success.
 */
export async function removePendingPurchase(key: string): Promise<void> {
  const log = useAppLogsStore.getState();
  try {
    const list = await getPendingPurchases();
    const next = list.filter((e) => e.key !== key);
    if (next.length === list.length) return;
    await AsyncStorage.setItem(PENDING_PURCHASES_KEY, JSON.stringify(next));
    log.info("[Subscription] removePendingPurchase", {
      key: key.slice(0, 20) + "…",
      remaining: next.length,
    });
  } catch (e) {
    log.warn("[Subscription] removePendingPurchase failed", {
      key: key.slice(0, 20),
      error: String(e),
    });
  }
}

/**
 * Clear all pending (e.g. on logout). Use sparingly.
 */
export async function clearPendingPurchases(): Promise<void> {
  const log = useAppLogsStore.getState();
  try {
    await AsyncStorage.removeItem(PENDING_PURCHASES_KEY);
    log.info("[Subscription] clearPendingPurchases");
  } catch (e) {
    log.warn("[Subscription] clearPendingPurchases failed", {
      error: String(e),
    });
  }
}
