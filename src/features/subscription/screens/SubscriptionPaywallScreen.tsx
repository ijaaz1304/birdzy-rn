/**
 * Subscription Paywall — mushroom Figma layout (trial / subscribe / no-discount variants).
 * Matches post-auth onboarding subscription slides: gradient bg, feature carousel, plan cards.
 */

import { AppImage, AppImageBackground } from "@/components/AppImage";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { View, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePopParentStackOnBack } from "../../../hooks/usePopParentStackOnBack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SubscriptionStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { getSubscriptionBackground } from "../../post-auth-onboarding/utils/background";
import { usePostAuthOnboardingIsDark } from "../../post-auth-onboarding/utils/theme";
import { useToast } from "../../../hooks/useToast";
import { NavBackIcon } from "../../../atoms";
import { Images } from "../../../assets";
import { type PlanId } from "../../../config/subscriptionConfig";
import {
  useIapPurchase,
  isPendingBackendError,
  isFailedPurchaseError,
} from "../hooks/useIapPurchase";
import { useSubscriptionPlansWithPrices } from "../hooks/useSubscriptionPlansWithPrices";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { logBirdzyPackEvent } from "../../../services/analytics/packAnalytics";
import { SubscriptionFailedPopup } from "../../../molecules/Modal";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import { formatCountdownSegment } from "../../../utils";
import { useDiscountOfferCountdown } from "../utils/discountOffer";
import { useSubscriptionStore, selectIsPremium } from "../subscription.store";
import {
  getPrivacyPolicyUrl,
  getTermsOfServiceUrl,
} from "../../../constants/legalUrls";
import { getOurAvailablePurchases } from "../services/iap.service";
import { DISCOUNT_TIMER_PILL } from "../../../constants/subscriptionColors";
import { PostAuthSubscriptionFeatureCarousel } from "../../post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel";
import { PostAuthGradientButton } from "../../post-auth-onboarding/components/PostAuthGradientButton";
import { PostAuthHorizontalPlanCard, HORIZONTAL_PLAN_ROW_STYLE } from "../../post-auth-onboarding/components/PostAuthHorizontalPlanCard";
import { PostAuthLegalFooter } from "../../post-auth-onboarding/components/PostAuthLegalFooter";
import { PostAuthSubscriptionDisclosure } from "../../post-auth-onboarding/components/PostAuthSubscriptionDisclosure";
import { PostAuthPhoneLayout } from "../../post-auth-onboarding/components/PostAuthPhoneLayout";
import { getPostAuthBackgroundLayout } from "../../post-auth-onboarding/utils/background";
import { usePostAuthLayoutMetrics } from "../../post-auth-onboarding/utils/postAuthLayout";
import {
  getPostAuthOnboardingColors,
  POST_AUTH_LAYOUT,
} from "../../post-auth-onboarding/constants";
import {
  getPlanCardTrialDays,
  getPlanCardPriceView,
  getPlanDisplayTitle,
  getSubscriptionCtaLabel,
  localizeCompareAtPriceDisplay,
} from "../../post-auth-onboarding/utils/planDisplay";
import { getCompareAtPriceDisplay } from "../utils/storePlanPricing";

import { FONTS } from "../../../common/typography";

import { APP_COLORS } from "../../../config/colors";

type SubscriptionPaywallRouteProp = RouteProp<
  SubscriptionStackParamList,
  "SubscriptionMain"
>;

function pickDefaultYearlyPlanId(
  plans: { id: string; duration?: string }[]
): PlanId | null {
  const yearly = plans.find((p) => (p.duration ?? "").toLowerCase() === "year");
  return (yearly?.id ?? plans[0]?.id ?? null) as PlanId | null;
}

export const SubscriptionPaywallScreen: React.FC = () => {
  const theme = useTheme();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<SubscriptionStackParamList, "SubscriptionMain">
    >();
  usePopParentStackOnBack();
  const dismissPaywall = useCallback(() => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) {
      parent.goBack();
      return;
    }
    navigation.goBack();
  }, [navigation]);
  useRoute<SubscriptionPaywallRouteProp>();
  const { showToast } = useToast();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const isDark = usePostAuthOnboardingIsDark();
  const paywallColors = useMemo(
    () => getPostAuthOnboardingColors(isDark),
    [isDark]
  );
  const layout = usePostAuthLayoutMetrics();

  const discountOffer = useDiscountOfferCountdown();
  const has50Discount = discountOffer.isActive;
  const discountCountdown = {
    hours: discountOffer.hours,
    minutes: discountOffer.minutes,
    seconds: discountOffer.seconds,
  };

  const {
    plans: plansWithPrices,
    isLoadingPrices: plansPriceLoading,
    priceLoadError: plansPriceError,
    refetchPrices,
    storePrices,
  } = useSubscriptionPlansWithPrices();
  const refetchPricesRef = useRef(refetchPrices);
  refetchPricesRef.current = refetchPrices;

  const {
    purchasePlan,
    isPurchasing,
    restorePurchases,
    error: iapError,
    clearError: clearIapError,
  } = useIapPurchase(plansWithPrices, { skipNavigateHomeOnSuccess: true });

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const [hasLifetimeStoreTransaction, setHasLifetimeStoreTransaction] =
    useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const visiblePlans = plansWithPrices;

  const effectiveSelectedPlanId =
    selectedPlanId ?? pickDefaultYearlyPlanId(visiblePlans);

  const selectedPlan = visiblePlans.find(
    (p) => p.id === effectiveSelectedPlanId
  );
  const disableSubscribeForAlreadyOwnedLifetime = hasLifetimeStoreTransaction;

  useEffect(() => {
    analyticsService.logEvent(EVENTS.subs_screen_viewed);
  }, []);

  useEffect(() => {
    if (plansWithPrices.length > 0) {
      useAppLogsStore
        .getState()
        .info("[Subscription] flow: paywall screen mounted", {
          planIds: plansWithPrices.map((p) => p.id),
        });
    }
  }, [plansWithPrices]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refetchPricesRef.current();
    }, 2500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadOwnedPlans = async () => {
      try {
        const ours = await getOurAvailablePurchases();
        const hasLifetimeInStore = ours.some((p) =>
          p.planId.toLowerCase().includes("lifetime")
        );
        if (cancelled) return;
        setHasLifetimeStoreTransaction(hasLifetimeInStore);
      } catch (e) {
        if (cancelled) return;
        useAppLogsStore
          .getState()
          .warn("[Subscription] flow: failed to read owned plans snapshot", {
            error: e instanceof Error ? e.message : String(e),
          });
      }
    };
    void loadOwnedPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const showFailedPopup = isFailedPurchaseError(iapError);

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

  const startPurchase = async (planId: PlanId) => {
    useAppLogsStore
      .getState()
      .info("[Subscription] flow: start purchase", { planId });
    if (hasLifetimeStoreTransaction) {
      showToast("You already have a lifetime subscription.", "info");
      return;
    }
    try {
      analyticsService.logEvent(EVENTS.subs_button, { plan_id: planId });
      analyticsService.logEvent(EVENTS.subscription_pack_click, {
        plan_id: planId,
      });
      logBirdzyPackEvent(planId, { source: "paywall_cta" });
      await purchasePlan(planId);
    } catch (_err) {
      const errMsg =
        _err instanceof Error ? _err.message : String(_err ?? "Unknown error");
      if (/lifetime subscription/i.test(errMsg)) {
        showToast("You already have a lifetime subscription.", "info");
      }
    }
  };

  const handleSubscribe = useCallback(async () => {
    if (!effectiveSelectedPlanId) return;
    if (disableSubscribeForAlreadyOwnedLifetime) {
      showToast("You already have a lifetime subscription.", "info");
      return;
    }
    await startPurchase(effectiveSelectedPlanId);
  }, [
    effectiveSelectedPlanId,
    disableSubscribeForAlreadyOwnedLifetime,
    showToast,
  ]);

  const handleRestore = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      await restorePurchases();
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, restorePurchases]);

  const ctaLabel = useMemo(
    () =>
      getSubscriptionCtaLabel({
        isPurchasing,
        selectedPlan,
        has50Discount,
        isPremium,
        disableSubscribe: disableSubscribeForAlreadyOwnedLifetime,
      }),
    [
      isPurchasing,
      disableSubscribeForAlreadyOwnedLifetime,
      isPremium,
      selectedPlan,
      has50Discount,
    ]
  );

  const renderPlanCards = () =>
    visiblePlans.map((plan) => {
      const duration = (plan.duration ?? "").toLowerCase();
      const isYearly = duration === "year";
      const isLifetime = duration === "lifetime";
      const priceView = getPlanCardPriceView(plan.priceDisplay, duration);
      const originalPrice =
        has50Discount &&
        priceView.hasStorePrice &&
        (isLifetime || isYearly)
          ? localizeCompareAtPriceDisplay(
              getCompareAtPriceDisplay(plan.id, plan.priceDisplay, storePrices)
            )
          : null;

      return (
        <PostAuthHorizontalPlanCard
          key={plan.id}
          title={getPlanDisplayTitle(duration, plan.title)}
          priceAmount={priceView.amount}
          priceSuffix={priceView.suffix}
          billingNote={priceView.billingNote}
          originalPrice={originalPrice}
          duration={duration}
          trialDays={getPlanCardTrialDays(duration, plan.trialDays)}
          showPopular={isYearly}
          selected={effectiveSelectedPlanId === plan.id}
          onPress={() => setSelectedPlanId(plan.id as PlanId)}
          colors={paywallColors}
        />
      );
    });

  const backgroundImage = getSubscriptionBackground(isDark);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { bgWidth, bgLeft, bgHeight, isWideScreen } = getPostAuthBackgroundLayout(
    windowWidth,
    windowHeight
  );

  return (
    <AppImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
      imageStyle={[
        styles.backgroundImage,
        isWideScreen
          ? {
              width: bgWidth,
              height: bgHeight,
              left: bgLeft,
            }
          : null,
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <PostAuthPhoneLayout>
          <View style={styles.stepFill}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={dismissPaywall}
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <NavBackIcon color={paywallColors.textPrimary} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.headerTitle,
                  { color: paywallColors.textPrimary },
                ]}
              >
                Subscription Plans
              </Text>
              <View style={styles.headerAction} />
            </View>

            <View
              style={[
                styles.subscriptionBody,
                {
                  paddingTop: layout.subscriptionTopPadding,
                  paddingBottom: layout.subscriptionBodyPaddingBottom,
                },
              ]}
            >
              <View
                style={[
                  styles.discountTimerOverlay,
                  { top: layout.subscriptionDiscountTimerTop },
                ]}
              >
                {!isPremium && discountOffer.remainingMs > 0 ? (
                  <View
                    style={[
                      styles.discountPill,
                      {
                        backgroundColor: isDark
                          ? DISCOUNT_TIMER_PILL.backgroundDark
                          : DISCOUNT_TIMER_PILL.background,
                      },
                    ]}
                  >
                    <View style={styles.discountPillContent}>
                      <AppImage
                        source={Images.discountTimer}
                        style={styles.discountPillIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.discountPillText}>
                        {has50Discount ? "Discount ends in" : "Discount in"}{" "}
                        {formatCountdownSegment(discountCountdown.hours)}:
                        {formatCountdownSegment(discountCountdown.minutes)}:
                        {formatCountdownSegment(discountCountdown.seconds)}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <View style={styles.subscriptionCenterBlock}>
                <PostAuthSubscriptionFeatureCarousel
                  isDark={isDark}
                  colors={paywallColors}
                />

                {plansPriceError ? (
                  <TouchableOpacity
                    onPress={refetchPrices}
                    style={styles.retryBanner}
                  >
                    <Text
                      style={[
                        styles.retryText,
                        { color: paywallColors.textSecondary },
                      ]}
                    >
                      Couldn&apos;t load prices. Tap to retry.
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View
              style={[
                styles.bottomActions,
                { paddingBottom: layout.subscriptionBottomPadding },
              ]}
            >
              <View
                style={[
                  HORIZONTAL_PLAN_ROW_STYLE,
                  styles.horizontalPlanRow,
                  { marginTop: layout.subscriptionPlanRowMarginTop },
                ]}
              >
                {renderPlanCards()}
              </View>
              <View style={styles.paywallFooter}>
                <PostAuthSubscriptionDisclosure
                  plan={selectedPlan}
                  colors={paywallColors}
                />
                <PostAuthGradientButton
                  title={ctaLabel}
                  onPress={handleSubscribe}
                  loading={isPurchasing}
                  disabled={
                    plansPriceLoading ||
                    !effectiveSelectedPlanId ||
                    disableSubscribeForAlreadyOwnedLifetime
                  }
                  colors={paywallColors}
                />
                <PostAuthLegalFooter
                  onTerms={() =>
                    navigation.navigate("LegalWebView", {
                      url: getTermsOfServiceUrl(),
                      title: "Terms of Service",
                    })
                  }
                  onPrivacy={() =>
                    navigation.navigate("LegalWebView", {
                      url: getPrivacyPolicyUrl(),
                      title: "Privacy Policy",
                    })
                  }
                  onRestore={handleRestore}
                  isRestoring={isRestoring}
                  colors={paywallColors}
                />
              </View>
            </View>
          </View>
        </PostAuthPhoneLayout>
      </SafeAreaView>

      <SubscriptionFailedPopup
        visible={showFailedPopup}
        failed={isFailedPurchaseError(iapError) ? iapError : null}
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
  stepFill: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  subscriptionBody: {
    flex: 1,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    justifyContent: "center",
    minHeight: 0,
    paddingBottom: 8,
    zIndex: 1,
    position: "relative",
  },
  discountTimerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  subscriptionCenterBlock: {
    width: "100%",
    alignItems: "center",
  },
  bottomActions: {
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingBottom: 4,
    width: "100%",
    alignItems: "center",
    flexShrink: 0,
    zIndex: 2,
  },
  paywallFooter: {
    width: "100%",
    maxWidth: "100%",
    gap: 8,
  },
  discountPill: {
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
  },
  discountPillContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  discountPillIcon: {
    width: 20,
    height: 20,
  },
  discountPillText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: DISCOUNT_TIMER_PILL.text,
  },
  horizontalPlanRow: {
    marginTop: 0,
    marginBottom: 8,
    flexShrink: 0,
    zIndex: 3,
    elevation: 3,
  },
  retryBanner: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.borderGrayLight,
    alignSelf: "center",
  },
  retryText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    textAlign: "center",
  },
});
