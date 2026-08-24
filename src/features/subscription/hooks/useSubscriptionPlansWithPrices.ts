/**
 * Single source of plans for UI.
 *
 * RULES (enforced):
 * - This is the ONLY place allowed to read: getCachedFirstAppOpenAt(), useSubscriptionStore(selectIsPremium).
 * - UI must NEVER call getRuntimeSubscriptionPlans(), getSubscriptionPlans(), or subscriptionConfig.plans.
 * - Logging only when planIdsKey changes (ref guard). Price fetch runs once (storePrices.size > 0 guard).
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getAllSubscriptionPlanIds } from "../../../config/subscriptionConfig";
import type { SubscriptionPlan } from "@/config/subscriptionConfig";
import { getSubscriptionPlans } from "../../../data/subscription/subscriptionPlansLoader";
import { getRuntimeSubscriptionPlans } from "../runtime/subscriptionRuntime";
import { getCachedFirstAppOpenAt } from "../utils/discountOffer";
import { useSubscriptionStore, selectIsPremium } from "../subscription.store";
import { fetchAllProductPrices } from "../services/iap.service";
import {
  hasRealStorePrice,
  MISSING_IAP_PRICE,
  resolveStorePriceDisplay,
} from "../utils/storePlanPricing";
import {
  formattedPriceMatchesExpectedCurrency,
  getDeviceCurrency,
  localizePriceDisplayForDevice,
} from "../utils/iapPriceDisplay";
import { sortPlansForDisplay } from "../utils/planDisplayOrder";
import { useAppLogsStore } from "../../app-logs/app-logs.store";

function parsePrice(display: string): number {
  return parseFloat(display.replace(/[^0-9.]/g, "")) || 0;
}

function toLocalizedStorePrice(storePrice?: string): string {
  const resolved = resolveStorePriceDisplay(storePrice);
  if (!hasRealStorePrice(resolved)) return resolved;
  return localizePriceDisplayForDevice(resolved);
}

function hasDeviceLocalizedStorePrice(storePrice?: string): boolean {
  return (
    hasRealStorePrice(storePrice) &&
    formattedPriceMatchesExpectedCurrency(storePrice!, getDeviceCurrency())
  );
}

export type UseSubscriptionPlansWithPricesOptions = {
  /** When set, selects full_pack (false) or half_pack (true) instead of the discount timer. */
  offerActiveOverride?: boolean;
};

export function useSubscriptionPlansWithPrices(
  options?: UseSubscriptionPlansWithPricesOptions
): {
  plans: SubscriptionPlan[];
  defaultSelectedPlanId: string;
  isLoadingPrices: boolean;
  priceLoadError: string | null;
  refetchPrices: () => Promise<void>;
  /** Raw IAP prices keyed by plan / product id (full + half packs). */
  storePrices: Map<string, string>;
} {
  const offerActiveOverride = options?.offerActiveOverride;
  const firstAppOpenAt = getCachedFirstAppOpenAt();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const devDisable50Discount = useSubscriptionStore((s) => s.devDisable50Discount);

  const [storePrices, setStorePrices] = useState<Map<string, string>>(
    new Map()
  );
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceLoadError, setPriceLoadError] = useState<string | null>(null);
  const lastLoggedPlans = useRef<string | null>(null);
  const storePricesRef = useRef(storePrices);
  storePricesRef.current = storePrices;
  const isFetchingPricesRef = useRef(false);
  const pendingPriceFetchRef = useRef(false);
  const fetchPricesRef = useRef<((force?: boolean) => Promise<void>) | null>(
    null
  );

  const basePlans = useMemo(() => {
    if (offerActiveOverride !== undefined) {
      return getSubscriptionPlans(
        firstAppOpenAt,
        isPremium,
        devDisable50Discount ? false : offerActiveOverride
      );
    }
    if (devDisable50Discount) {
      return getSubscriptionPlans(firstAppOpenAt, isPremium, false);
    }
    return getRuntimeSubscriptionPlans(firstAppOpenAt, isPremium);
  }, [firstAppOpenAt, isPremium, offerActiveOverride, devDisable50Discount]);
  const planIdsKey = useMemo(
    () => basePlans.map((p) => p.id).join(","),
    [basePlans]
  );

  useEffect(() => {
    if (lastLoggedPlans.current !== planIdsKey) {
      lastLoggedPlans.current = planIdsKey;
      useAppLogsStore.getState().info("[Subscription] pack selected", {
        planIds: planIdsKey ? planIdsKey.split(",") : [],
      });
    }
  }, [planIdsKey]);

  const fetchPrices = useCallback(
    async (force = false) => {
      const log = useAppLogsStore.getState();
      const currentPrices = storePricesRef.current;
      const allCurrentPlansHavePrices = basePlans.every((plan) => {
        const price = currentPrices.get(plan.id);
        return hasDeviceLocalizedStorePrice(price);
      });
      if (!force && allCurrentPlansHavePrices) {
        log.info(
          "[Subscription] flow: fetch prices skipped (already have prices)",
          {
            storePricesCount: currentPrices.size,
            planIdsKey,
          }
        );
        setIsLoadingPrices(false);
        return;
      }
      if (isFetchingPricesRef.current) {
        // Post-auth onboarding changes the active pack between its subscription
        // and discount slides. Do not lose a fetch request while the initial
        // StoreKit lookup is still connecting.
        pendingPriceFetchRef.current = true;
        return;
      }
      isFetchingPricesRef.current = true;
      log.info("[Subscription] flow: fetch prices start");
      const hasAnyCurrentPlanPrice = basePlans.some((plan) =>
        hasDeviceLocalizedStorePrice(currentPrices.get(plan.id))
      );
      if (!hasAnyCurrentPlanPrice) {
        setIsLoadingPrices(true);
      }
      setPriceLoadError(null);
      try {
        const planIds = getAllSubscriptionPlanIds();
        const priceMap = await fetchAllProductPrices(planIds);
        if (priceMap.size === 0) {
          setPriceLoadError("No prices returned from store");
          log.warn("[Subscription] flow: fetch prices returned no products", {
            requestedCount: planIds.length,
            planIds,
          });
        } else {
          setStorePrices((prev) => {
            const next = new Map(prev);
            for (const [planId, price] of priceMap) {
              next.set(planId, price);
            }
            return next;
          });
          setPriceLoadError(null);
          log.info("[Subscription] flow: fetch prices success", {
            requestedCount: planIds.length,
            pricesResolved: priceMap.size,
            resolvedPlanIds: Array.from(priceMap.keys()),
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load prices";
        setPriceLoadError(msg);
        log.warn("[Subscription] flow: fetch prices failed", {
          error: msg,
          stack: e instanceof Error ? e.stack : undefined,
        });
      } finally {
        isFetchingPricesRef.current = false;
        setIsLoadingPrices(false);
        if (pendingPriceFetchRef.current) {
          pendingPriceFetchRef.current = false;
          setTimeout(() => {
            void fetchPricesRef.current?.();
          }, 0);
        }
      }
    },
    [basePlans, planIdsKey]
  );
  fetchPricesRef.current = fetchPrices;

  useEffect(() => {
    void fetchPrices();
  }, [planIdsKey, fetchPrices]);

  const refetchPrices = useCallback(async () => {
    const currentPrices = storePricesRef.current;
    const needsRefetch =
      currentPrices.size === 0 ||
      basePlans.some(
        (plan) => !hasDeviceLocalizedStorePrice(currentPrices.get(plan.id))
      );
    await fetchPrices(needsRefetch);
  }, [basePlans, fetchPrices]);

  const plansWithPrices = useMemo(() => {
    const merged = basePlans.map((plan): SubscriptionPlan => {
      const storePrice = storePrices.get(plan.id);
      if (hasDeviceLocalizedStorePrice(storePrice)) {
        const priceDisplay = toLocalizedStorePrice(storePrice);
        return {
          ...plan,
          priceDisplay,
          price: parsePrice(storePrice!.trim()),
        };
      }
      return {
        ...plan,
        priceDisplay: isLoadingPrices ? "Loading…" : MISSING_IAP_PRICE,
        price: 0,
      };
    });
    // Keep all configured plans visible (weekly / yearly / lifetime) even if one
    // store SKU has not returned a price yet — hiding a plan breaks the 3-card layout.
    return sortPlansForDisplay(merged);
  }, [basePlans, storePrices, isLoadingPrices]);

  const defaultSelectedPlanId = useMemo(() => {
    const yearly = basePlans.find(
      (p) => (p.duration ?? "").toLowerCase() === "year"
    );
    return yearly?.id ?? basePlans[0]?.id ?? "yearly_birdzy_pack";
  }, [basePlans]);

  return {
    plans: plansWithPrices,
    defaultSelectedPlanId,
    refetchPrices,
    isLoadingPrices,
    priceLoadError,
    storePrices,
  };
}
