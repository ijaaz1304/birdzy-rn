/**
 * Subscription status screen for active subscribers (Figma 3494 / 8380).
 * Recurring plans show renewal countdown + Switch Plan; lifetime shows benefits only.
 */

import { AppImageBackground } from "@/components/AppImage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PlanId } from "../../../config/subscriptionConfig";
import { NavBackIcon } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { DEFAULT_SUBSCRIPTION_BENEFITS } from "../../../data/subscription/subscriptionStatus";
import { useToast } from "../../../hooks/useToast";
import { SubscriptionStackParamList } from "../../../navigation/types";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { getSubscriptionBackground } from "../../post-auth-onboarding/utils/background";
import { usePostAuthOnboardingIsDark } from "../../post-auth-onboarding/utils/theme";
import { PostAuthGradientButton } from "../../post-auth-onboarding/components/PostAuthGradientButton";
import {
  getPostAuthOnboardingColors,
  POST_AUTH_LAYOUT,
} from "../../post-auth-onboarding/constants";
import { useAuthStore } from "../../auth/auth.store";
import {
  useIapPurchase,
  isFailedPurchaseError,
  isPendingBackendError,
} from "../hooks/useIapPurchase";
import { useResolvedActivePlan } from "../hooks/useResolvedActivePlan";
import { useSubscriptionPlansWithPrices } from "../hooks/useSubscriptionPlansWithPrices";
import { useSubscriptionStore, selectIsPremium } from "../subscription.store";
import { RenewalCountdownPills } from "../components/RenewalCountdownPills";
import { SubscriptionBenefitsCard } from "../components/SubscriptionBenefitsCard";
import { SwitchPlanBottomSheet } from "../components/SwitchPlanBottomSheet";
import { SubscriptionFailedPopup } from "../../../molecules/Modal";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import {
  canSwitchPlan,
  estimateRenewalDate,
  formatSubscriptionSinceLabel,
  getPlanKindFromId,
  getPlanStatusTitle,
  getPreviewRenewalDate,
  getSwitchPlanFooterTitle,
  planMatchesKind,
} from "../utils/subscriptionStatusDisplay";

const SINCE_BADGE_BG = "#747E3B";

type SubscriptionStatusRouteProp = RouteProp<
  SubscriptionStackParamList,
  "SubscriptionStatus"
>;

export const SubscriptionStatusScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<
        SubscriptionStackParamList,
        "SubscriptionStatus"
      >
    >();
  const route = useRoute<SubscriptionStatusRouteProp>();
  const isPreview = route.params?.preview === true;
  const { showToast } = useToast();
  const isDark = usePostAuthOnboardingIsDark();
  const colors = useMemo(() => getPostAuthOnboardingColors(isDark), [isDark]);
  const isPremium = useSubscriptionStore(selectIsPremium);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const cancelSubscription = useSubscriptionStore((s) => s.cancelSubscription);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);
  const isCancelling = useSubscriptionStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  const { plans } = useSubscriptionPlansWithPrices();
  const {
    purchasePlan,
    isPurchasing,
    error: iapError,
    clearError: clearIapError,
  } = useIapPurchase(plans, { skipNavigateHomeOnSuccess: true });

  const {
    currentPlanId,
    planKind: resolvedPlanKind,
    hasLifetimeInStore,
    refresh: refreshActivePlan,
  } = useResolvedActivePlan();

  const [showSwitchSheet, setShowSwitchSheet] = useState(false);

  const planKind = isPreview
    ? route.params?.previewPlanKind ?? "year"
    : resolvedPlanKind;
  const showSwitchPlan = canSwitchPlan(planKind);

  useFocusEffect(
    useCallback(() => {
      if (isPreview) return;
      void fetchSubscription();
      void refreshActivePlan();
    }, [fetchSubscription, isPreview, refreshActivePlan])
  );

  useEffect(() => {
    if (!iapError) return;
    if (isPendingBackendError(iapError)) {
      const message =
        iapError.reason === "manual_restore_needed"
          ? "Purchase found in App Store. Tap Restore Purchase to sync backend access."
          : "Purchase received. Finalizing in background…";
      showToast(message, "info");
      clearIapError();
    }
  }, [iapError, showToast, clearIapError]);

  const sinceLabel =
    formatSubscriptionSinceLabel(
      user?.subscriptionDate ?? subscription?.subscriptionDate ?? null
    ) ?? (isPreview ? "Since August 2025" : null);

  const renewalDate = useMemo(() => {
    if (isPreview) {
      return getPreviewRenewalDate();
    }
    return estimateRenewalDate(
      user?.subscriptionDate ?? subscription?.subscriptionDate ?? null,
      planKind
    );
  }, [
    isPreview,
    planKind,
    subscription?.subscriptionDate,
    user?.subscriptionDate,
  ]);

  const handleSwitchSubscribe = useCallback(
    async (planId: PlanId) => {
      if (isPreview) {
        showToast("Preview mode — purchase is disabled.", "info");
        return;
      }

      const targetPlan = plans.find((p) => p.id === planId);
      if (targetPlan && planMatchesKind(targetPlan, planKind)) {
        showToast("You are already on this plan.", "info");
        return;
      }

      if (getPlanKindFromId(planId) === "lifetime" && hasLifetimeInStore) {
        showToast("You already have a lifetime subscription.", "info");
        return;
      }

      useAppLogsStore
        .getState()
        .info("[Subscription] flow: switch plan purchase", {
          fromPlanId: currentPlanId,
          toPlanId: planId,
        });
      analyticsService.logEvent(EVENTS.subs_button, {
        plan_id: planId,
        source: "switch_plan",
      });

      try {
        await purchasePlan(planId);
        await refreshActivePlan();
        setShowSwitchSheet(false);
        showToast("Your plan has been updated.", "success");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err ?? "");
        if (/lifetime subscription/i.test(errMsg)) {
          showToast("You already have a lifetime subscription.", "info");
          clearIapError();
        }
      }
    },
    [
      clearIapError,
      currentPlanId,
      hasLifetimeInStore,
      isPreview,
      planKind,
      plans,
      purchasePlan,
      refreshActivePlan,
      showToast,
    ]
  );

  const handleDowngrade = useCallback(async () => {
    if (isPreview) {
      showToast("Preview mode — downgrade is disabled.", "info");
      return;
    }

    try {
      await cancelSubscription();
      await refreshActivePlan();
      setShowSwitchSheet(false);
      showToast(
        "Your subscription will end at the current billing cycle.",
        "info"
      );
      navigation.goBack();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not cancel subscription. Please try again.";
      showToast(msg, "error");
    }
  }, [cancelSubscription, isPreview, navigation, refreshActivePlan, showToast]);

  if (!isPremium && !isPreview) {
    return null;
  }

  const backgroundImage = getSubscriptionBackground(isDark);
  const showFailedPopup = isFailedPurchaseError(iapError);

  return (
    <AppImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <NavBackIcon color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {sinceLabel ? (
              <View style={styles.sinceBadge}>
                <Text style={styles.sinceBadgeText}>{sinceLabel}</Text>
              </View>
            ) : null}

            <Text style={[styles.heading, { color: colors.textPrimary }]}>
              You are in{"\n"}
              {getPlanStatusTitle(planKind)}
            </Text>
            <Text style={[styles.subheading, { color: colors.textSecondary }]}>
              You get fully access to every features.
            </Text>
          </View>

          <SubscriptionBenefitsCard
            colors={colors}
            benefits={DEFAULT_SUBSCRIPTION_BENEFITS}
          />

          {showSwitchPlan && renewalDate ? (
            <View style={styles.renewalSection}>
              <Text
                style={[styles.renewalLabel, { color: colors.textSecondary }]}
              >
                Days left to renew date:
              </Text>
              <View style={styles.renewalCountdownWrap}>
                <RenewalCountdownPills renewalDate={renewalDate} />
              </View>
            </View>
          ) : null}
        </ScrollView>

        {showSwitchPlan ? (
          <View style={styles.footer}>
            <PostAuthGradientButton
              title={getSwitchPlanFooterTitle(planKind)}
              onPress={() => setShowSwitchSheet(true)}
              colors={colors}
            />
          </View>
        ) : null}
      </SafeAreaView>

      {showSwitchPlan ? (
        <SwitchPlanBottomSheet
          visible={showSwitchSheet}
          currentPlanKind={planKind}
          onClose={() => setShowSwitchSheet(false)}
          onSubscribe={handleSwitchSubscribe}
          onDowngrade={handleDowngrade}
          isPurchasing={isPurchasing}
          isDowngrading={isCancelling}
        />
      ) : null}

      <SubscriptionFailedPopup
        visible={showFailedPopup}
        failed={showFailedPopup ? iapError : null}
        onClose={clearIapError}
        onRetry={clearIapError}
      />
    </AppImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingBottom: 24,
    gap: 24,
    alignItems: "center",
  },
  hero: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  sinceBadge: {
    backgroundColor: SINCE_BADGE_BG,
    borderRadius: 360,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sinceBadgeText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    width: "100%",
  },
  subheading: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    width: "100%",
  },
  renewalSection: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  renewalCountdownWrap: {
    width: "100%",
    maxWidth: 335,
    alignSelf: "center",
  },
  renewalLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
