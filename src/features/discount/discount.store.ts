/**
 * Discount Popup Store
 * Tracks first visit, discount popup, and discount banner state.
 * Popup cooldown uses Remote Config (discountBannerCooldownHours).
 * Sticky banner: hidden for the session it was closed in, shown again next session.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRemoteConfigValue } from "../../services/remoteConfig/remoteConfig.service";
import { useSubscriptionStore } from "../subscription/subscription.store";

interface DiscountState {
  hasVisitedHome: boolean;
  lastShownDate: string | null;
  lastDiscountBannerClosedSession: number | null;

  // Actions
  setHasVisitedHome: (visited: boolean) => void;
  shouldShowDiscount: () => boolean;
  isDiscountBannerClosedForSession: (sessionCount: number) => boolean;
  markAsShown: () => void;
  markDiscountBannerClosed: (sessionCount: number) => void;
  reset: () => void;
}

export const useDiscountStore = create<DiscountState>()(
  persist(
    (set, get) => ({
      hasVisitedHome: false,
      lastShownDate: null,
      lastDiscountBannerClosedSession: null,

      setHasVisitedHome: (visited: boolean) => {
        set({ hasVisitedHome: visited });
      },

      shouldShowDiscount: () => {
        if (useSubscriptionStore.getState().devDisable50Discount) return false;

        const showWhenTimerActive = getRemoteConfigValue(
          "discountPopupShowWhenTimerActive"
        );
        if (!showWhenTimerActive) return false;

        const { lastShownDate } = get();
        const cooldownHours =
          getRemoteConfigValue("discountPopupCooldownHours") ??
          getRemoteConfigValue("discountBannerCooldownHours") ??
          24;
        if (lastShownDate) {
          const hoursSince =
            (Date.now() - new Date(lastShownDate).getTime()) / (1000 * 60 * 60);
          if (hoursSince < cooldownHours) return false;
        }
        return true;
      },

      isDiscountBannerClosedForSession: (sessionCount: number) => {
        const { lastDiscountBannerClosedSession } = get();
        return lastDiscountBannerClosedSession === sessionCount;
      },

      markAsShown: () => {
        set({
          hasVisitedHome: true,
          lastShownDate: new Date().toISOString(),
        });
      },

      markDiscountBannerClosed: (sessionCount: number) => {
        set({ lastDiscountBannerClosedSession: sessionCount });
      },

      reset: () => {
        set({
          hasVisitedHome: false,
          lastShownDate: null,
          lastDiscountBannerClosedSession: null,
        });
      },
    }),
    {
      name: "birdzy-discount-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
