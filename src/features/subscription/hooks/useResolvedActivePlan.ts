import { useCallback, useEffect, useState } from "react";
import type { PlanId } from "../../../config/subscriptionConfig";
import { getOurAvailablePurchases } from "../services/iap.service";
import { getLocalEntitlementSnapshot } from "../localEntitlement.store";
import { useSubscriptionStore } from "../subscription.store";
import {
  getPlanKindFromId,
  resolveCurrentPlanId,
  type SubscriptionPlanKind,
} from "../utils/subscriptionStatusDisplay";

type ResolvedActivePlan = {
  currentPlanId: PlanId | null;
  planKind: SubscriptionPlanKind;
  hasLifetimeInStore: boolean;
  isResolving: boolean;
  refresh: () => Promise<void>;
};

export function useResolvedActivePlan(): ResolvedActivePlan {
  const subscriptionPlanId = useSubscriptionStore(
    (s) => s.subscription?.planId
  );
  const [storePlanId, setStorePlanId] = useState<PlanId | null>(null);
  const [localPlanId, setLocalPlanId] = useState<PlanId | null>(null);
  const [hasLifetimeInStore, setHasLifetimeInStore] = useState(false);
  const [isResolving, setIsResolving] = useState(true);

  const refresh = useCallback(async () => {
    setIsResolving(true);
    try {
      const [snapshot, ours] = await Promise.all([
        getLocalEntitlementSnapshot(),
        getOurAvailablePurchases(),
      ]);
      setLocalPlanId(snapshot.planId ?? null);
      setStorePlanId(ours[0]?.planId ?? null);
      setHasLifetimeInStore(
        ours.some((p) => getPlanKindFromId(p.planId) === "lifetime")
      );
    } finally {
      setIsResolving(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentPlanId = resolveCurrentPlanId(
    storePlanId ?? subscriptionPlanId,
    localPlanId
  );

  return {
    currentPlanId,
    planKind: getPlanKindFromId(currentPlanId),
    hasLifetimeInStore,
    isResolving,
    refresh,
  };
}
