/**
 * Single source of truth for per-user discount offer state.
 * 24h ON / 24h OFF cycle starting from first app open.
 * Discount stops permanently once user becomes premium.
 */

import { useState, useEffect, useMemo } from "react";
import { getDiscountTimerPhase } from "../../discount/discountTimer.store";
import {
  getFirstAppOpenAt,
  ensureFirstAppOpenAt,
} from "../../../services/session/session.service";
import { useSubscriptionStore, selectIsPremium } from "../subscription.store";
import { useAppLogsStore } from "../../app-logs/app-logs.store";

/** Cached first app open timestamp. Set by initDiscountOfferFirstOpen (e.g. at app start). */
let cachedFirstAppOpenAt: number | null = null;

/** For loaders that need deterministic pack selection; avoids store access in loader. */
export function getCachedFirstAppOpenAt(): number | null {
  return cachedFirstAppOpenAt;
}

/** Prevent duplicate logs */
let lastLoggedActive: boolean | null = null;

/**
 * Ensure firstAppOpenAt exists.
 * Safe to call multiple times.
 */
export async function initDiscountOfferFirstOpen(): Promise<void> {
  if (cachedFirstAppOpenAt != null) return;

  await ensureFirstAppOpenAt();
  cachedFirstAppOpenAt = await getFirstAppOpenAt();
}

/**
 * Safe helper to get current phase.
 */
function getPhase() {
  if (!cachedFirstAppOpenAt) return null;
  return getDiscountTimerPhase(cachedFirstAppOpenAt);
}

/**
 * Whether any discount timer / banner UI should run (respects Settings testing toggle).
 */
export function isDiscountTimerUiEnabled(): boolean {
  const state = useSubscriptionStore.getState();
  if (selectIsPremium(state)) return false;
  if (state.devDisable50Discount) return false;
  return true;
}

/**
 * Whether discount offer is currently active.
 */
export function isDiscountOfferActive(): boolean {
  if (!isDiscountTimerUiEnabled()) return false;

  const phase = getPhase();
  if (!phase) return false;

  if (lastLoggedActive !== phase.isDiscountActive) {
    lastLoggedActive = phase.isDiscountActive;

    useAppLogsStore.getState().info("[Subscription] discount offer state", {
      firstAppOpenAt: cachedFirstAppOpenAt,
      isDiscountActive: phase.isDiscountActive,
      secondsRemaining: phase.secondsRemaining,
    });
  }

  return phase.isDiscountActive;
}

/**
 * Remaining milliseconds in the current 24h phase (discount or wait).
 */
export function getPhaseRemainingMs(): number {
  if (!isDiscountTimerUiEnabled()) return 0;

  const phase = getPhase();
  if (!phase) return 0;

  return phase.secondsRemaining * 1000;
}

/** Remaining ms while discount is active (0 when in the no-discount phase). */
export function getDiscountRemainingMs(): number {
  const phase = getPhase();
  if (!phase?.isDiscountActive) return 0;
  return getPhaseRemainingMs();
}

export interface DiscountOfferCountdown {
  isActive: boolean;
  remainingMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
  /** Countdown label for banners: "Discount ends in" vs "Discount in" */
  bannerLabel: string;
}

/**
 * Hook used by all discount UI (paywall, banners, sheets).
 * Updates every second.
 */
export function useDiscountOfferCountdown(): DiscountOfferCountdown {
  const isPremium = useSubscriptionStore(selectIsPremium);
  const devDisable50Discount = useSubscriptionStore((s) => s.devDisable50Discount);

  const [phase, setPhase] = useState<ReturnType<
    typeof getDiscountTimerPhase
  > | null>(null);

  const [remainingMs, setRemainingMs] = useState(0);

  /**
   * Initialize first app open timestamp
   */
  useEffect(() => {
    let cancelled = false;

    initDiscountOfferFirstOpen().then(() => {
      if (cancelled) return;

      const currentPhase = getPhase();

      setPhase(currentPhase);
      setRemainingMs(getPhaseRemainingMs());
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Tick every second
   */
  useEffect(() => {
    const tick = () => {
      const currentPhase = getPhase();

      setPhase(currentPhase);
      setRemainingMs(getPhaseRemainingMs());
    };

    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    if (!isDiscountTimerUiEnabled()) {
      return {
        isActive: false,
        remainingMs: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        label: "",
        bannerLabel: "",
      };
    }

    const isActive = phase?.isDiscountActive ?? false;

    const totalSeconds = Math.floor(remainingMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const timeStr = `${hours}h ${minutes}m`;

    const label = isActive ? `${timeStr} left` : phase?.label ?? "";
    const bannerLabel = isActive ? "Discount ends in" : "Discount in";

    return {
      isActive,
      remainingMs,
      hours,
      minutes,
      seconds,
      label,
      bannerLabel,
    };
  }, [devDisable50Discount, isPremium, phase, remainingMs]);
}
