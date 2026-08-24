/**
 * Local Purchase Snapshot (Fast Guard)
 *
 * WHY: Everything currently depends on backend/profile reload. This gives a lightweight
 * local snapshot (boolean + planId) for:
 * - Blocking lifetime purchase if already subscribed
 * - Preventing duplicate purchase initiation
 * - Faster UI decisions
 *
 * Backend remains source of truth. Snapshot is updated after successful subscribe,
 * restore, and unsubscribe.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlanId } from "../../config/subscriptionConfig";
import { useAppLogsStore } from "../app-logs/app-logs.store";

const LOCAL_ACTIVE_ENTITLEMENT_KEY = "LOCAL_ACTIVE_ENTITLEMENT";

export interface LocalEntitlementSnapshot {
  hasActiveEntitlement: boolean;
  planId?: PlanId | null;
  /** Last time we updated from a reliable source (subscribe/restore/unsubscribe) */
  updatedAt?: number;
}

const defaultSnapshot: LocalEntitlementSnapshot = {
  hasActiveEntitlement: false,
  planId: null,
  updatedAt: 0,
};

/**
 * Read current snapshot from storage. Use for fast guards only.
 */
export async function getLocalEntitlementSnapshot(): Promise<LocalEntitlementSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ACTIVE_ENTITLEMENT_KEY);
    if (!raw) return defaultSnapshot;
    const parsed = JSON.parse(raw) as LocalEntitlementSnapshot;
    return {
      hasActiveEntitlement: Boolean(parsed?.hasActiveEntitlement),
      planId: parsed?.planId ?? null,
      updatedAt: typeof parsed?.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return defaultSnapshot;
  }
}

/**
 * Update snapshot after successful subscribe or restore.
 * Call with hasActiveEntitlement: true and planId when user has an active purchase.
 */
export async function setLocalEntitlementSnapshot(
  snapshot: LocalEntitlementSnapshot
): Promise<void> {
  const log = useAppLogsStore.getState();
  try {
    const toStore: LocalEntitlementSnapshot = {
      ...defaultSnapshot,
      ...snapshot,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(
      LOCAL_ACTIVE_ENTITLEMENT_KEY,
      JSON.stringify(toStore)
    );
    log.info("[Subscription] setLocalEntitlementSnapshot", {
      hasActiveEntitlement: toStore.hasActiveEntitlement,
      planId: toStore.planId,
    });
  } catch (e) {
    log.warn("[Subscription] setLocalEntitlementSnapshot failed", {
      error: String(e),
    });
  }
}

/**
 * Clear snapshot (e.g. after unsubscribe when no purchases found).
 */
export async function clearLocalEntitlementSnapshot(): Promise<void> {
  const log = useAppLogsStore.getState();
  try {
    await AsyncStorage.setItem(
      LOCAL_ACTIVE_ENTITLEMENT_KEY,
      JSON.stringify(defaultSnapshot)
    );
    log.info("[Subscription] clearLocalEntitlementSnapshot");
  } catch (e) {
    log.warn("[Subscription] clearLocalEntitlementSnapshot failed", {
      error: String(e),
    });
  }
}
