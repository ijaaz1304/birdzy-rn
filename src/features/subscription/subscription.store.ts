/**
 * Subscription store using Zustand
 * Now integrated with Auth Store to get real subscription status
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../auth/auth.store";
import {
  clearLocalEntitlementSnapshot,
  getLocalEntitlementSnapshot,
} from "./localEntitlement.store";
import { useAppLogsStore } from "../app-logs/app-logs.store";

export type SubscriptionTier = "free" | "premium" | "pro";

export interface Subscription {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: string;
  features: string[];
  /** Plan ID = product ID (e.g. yearly_birdzy_pack_half_price, lifetime_birdzy). */
  planId?: string;
  provider?: "google" | "apple" | null;
  subscriptionDate?: string | null;
}

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  /** Dev only: when true, app behaves as if user is premium (Settings toggle, dev builds only) */
  devForcePremium: boolean;
  /** When true, 50% discount / half_pack is disabled — full-price plans only (Settings testing toggle). */
  devDisable50Discount: boolean;
  /**
   * When true, show user as premium even if backend has not synced yet (e.g. backend API failed
   * after purchase, or we have local entitlement / purchase count). Set from local entitlement
   * on load and when backend fails after a successful IAP. Cleared when syncFromAuthStore sees user is subscribed.
   */
  localPremiumOverride: boolean;
  /** Ephemeral: show welcome modal after user-initiated purchase/restore (not persisted). */
  pendingWelcomeModal: boolean;

  // Actions
  fetchSubscription: () => Promise<void>;
  upgradeSubscription: (tier: SubscriptionTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkFeatureAccess: (feature: string) => boolean;
  syncFromAuthStore: () => void;
  setDevForcePremium: (value: boolean) => void;
  setDevDisable50Discount: (value: boolean) => void;
  setLocalPremiumOverride: (value: boolean) => void;
  setPendingWelcomeModal: (value: boolean) => void;
  reset: () => void;
}

/** Selector: effective premium status (backend subscription, local override, or dev override). Use this everywhere instead of inline tier check. */
export const selectIsPremium = (s: SubscriptionState): boolean =>
  s.devForcePremium ||
  s.localPremiumOverride ||
  s.subscription?.tier === "premium" ||
  s.subscription?.tier === "pro";

const defaultSubscription: Subscription = {
  tier: "free",
  isActive: true,
  features: ["basic_identification"],
};

// Map subscription status from user to subscription tier
function mapUserToSubscription(user: any): Subscription {
  if (!user) {
    return defaultSubscription;
  }

  const isSubscribed = user.isSubscribed || false;
  const provider = user.subscriptionProvider as "google" | "apple" | null;

  // Determine tier based on subscription status
  let tier: SubscriptionTier = "free";
  let features = ["basic_identification"];

  if (isSubscribed) {
    // If subscribed, determine tier (you can enhance this logic based on your subscription plans)
    // For now, assume premium if subscribed
    tier = "premium";
    features = [
      "basic_identification",
      "advanced_identification",
      "unlimited_identifications",
      "unlimited_collections",
      "full_bird_data",
      "unlimited_feed_posts",
      "unlimited_ai_chat",
      "unlimited_bird_of_day_refresh",
    ];
  }

  return {
    tier,
    isActive: isSubscribed,
    planId: user.planId ?? undefined,
    subscriptionDate: user.subscriptionDate || undefined,
    provider,
    features,
  };
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: defaultSubscription,
      isLoading: false,
      error: null,
      devForcePremium: false,
      devDisable50Discount: false,
      localPremiumOverride: false,
      pendingWelcomeModal: false,

      setDevForcePremium: (value: boolean) => set({ devForcePremium: value }),
      setDevDisable50Discount: (value: boolean) =>
        set({ devDisable50Discount: value }),
      setLocalPremiumOverride: (value: boolean) =>
        set({ localPremiumOverride: value }),
      setPendingWelcomeModal: (value: boolean) =>
        set({ pendingWelcomeModal: value }),

      // Sync subscription from auth store. When backend says subscribed, clear local override.
      syncFromAuthStore: () => {
        const { user } = useAuthStore.getState();
        const subscription = mapUserToSubscription(user);
        set({
          subscription,
          localPremiumOverride: subscription.isActive
            ? false
            : get().localPremiumOverride,
        });
        useAppLogsStore
          .getState()
          .info("[Subscription] flow: syncFromAuthStore", {
            tier: subscription.tier,
            isActive: subscription.isActive,
            planId: subscription.planId ?? null,
          });
      },

      fetchSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          // Get user profile from auth store (which includes subscription info)
          const { getProfile } = useAuthStore.getState();
          await getProfile();

          // Sync subscription from updated user data
          get().syncFromAuthStore();

          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch subscription",
            isLoading: false,
          });
        }
      },

      upgradeSubscription: async (_tier: SubscriptionTier) => {
        // This is handled by auth store's subscribeGoogle/subscribeApple
        // Just sync the subscription after upgrade
        set({ isLoading: true, error: null });
        try {
          await get().fetchSubscription();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to upgrade subscription",
            isLoading: false,
          });
        }
      },

      cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const { user } = useAuthStore.getState();
          const provider = user?.subscriptionProvider;

          if (provider === "google") {
            const { unsubscribeGoogle } = useAuthStore.getState();
            await unsubscribeGoogle();
          } else if (provider === "apple") {
            const { unsubscribeApple } = useAuthStore.getState();
            await unsubscribeApple();
          } else {
            throw new Error(
              "No subscription provider found. Manage your plan in the App Store or Play Store."
            );
          }

          await clearLocalEntitlementSnapshot();
          get().syncFromAuthStore();
          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to cancel subscription",
            isLoading: false,
          });
          throw error;
        }
      },

      checkFeatureAccess: (feature: string) => {
        if (get().devForcePremium) return true;
        const { subscription } = get();
        if (!subscription) {
          get().syncFromAuthStore();
          const updatedSubscription = get().subscription;
          return updatedSubscription?.features.includes(feature) ?? false;
        }
        return subscription.features.includes(feature);
      },

      reset: () => {
        set({
          subscription: defaultSubscription,
          isLoading: false,
          error: null,
          localPremiumOverride: false,
          pendingWelcomeModal: false,
        });
      },
    }),
    {
      name: "birdzy-subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        // Dev toggles — not persisted (Settings dev UI disabled).
        // devForcePremium: state.devForcePremium,
        // devDisable50Discount: state.devDisable50Discount,
        localPremiumOverride: state.localPremiumOverride,
      }),
      onRehydrateStorage: () => (state, error) => {
        useSubscriptionStore.setState({
          devForcePremium: false,
          devDisable50Discount: false,
        });
        if (error) {
          useAppLogsStore
            .getState()
            .warn("[Subscription] hydration error (state retained)", {
              error: error instanceof Error ? error.message : String(error),
            });
          return;
        }
        // Boot safety: if local entitlement snapshot says active, keep premium locally
        // until backend /me sync finishes to avoid paywall flicker on app restart.
        void getLocalEntitlementSnapshot()
          .then((snapshot) => {
            if (!snapshot.hasActiveEntitlement) return;
            if (state?.localPremiumOverride) return;
            useSubscriptionStore.setState({ localPremiumOverride: true });
            useAppLogsStore
              .getState()
              .info(
                "[Subscription] hydration: applied local premium override",
                {
                  planId: snapshot.planId ?? null,
                }
              );
          })
          .catch((snapshotErr) => {
            useAppLogsStore
              .getState()
              .warn(
                "[Subscription] hydration: failed to read local entitlement",
                {
                  error:
                    snapshotErr instanceof Error
                      ? snapshotErr.message
                      : String(snapshotErr),
                }
              );
          });
      },
    }
  )
);
