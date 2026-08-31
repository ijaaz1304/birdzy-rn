/**
 * Post-auth onboarding: location → notifications → subscription → surprise → 50% offer.
 * Skips permission slides when already granted/blocked; premium skips subscription promos.
 * Five slides advanced only via CTAs (no swipe paging).
 */

import { AppImage } from "@/components/AppImage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PostAuthOnboardingBackground } from "../utils/background";
import { Images } from "../../../assets";
import { APP_COLORS } from "../../../config/colors";
import { FONTS } from "../../../common/typography";
import { ROUTES } from "../../../constants";
import {
  getPrivacyPolicyUrl,
  getTermsOfServiceUrl,
} from "../../../constants/legalUrls";
import { RootStackParamList } from "../../../navigation/types";
import { requestNotificationPermission } from "../../../services/permissions/permission.service";
import { markNotificationPermissionPrompted } from "../../../services/permissions/permissionPromptSkip";
import { checkLocationPermission } from "../../../services/permissions";
import {
  requestNativeLocationPermission,
} from "../../../services/permissions/locationPermissionFlow.service";
import { useIdentificationLocation } from "../../camera/useIdentificationLocation";
import { usePushNotifications } from "../../../hooks/usePushNotifications";
import { useAuthStore } from "../../auth/auth.store";
import { useIapPurchase } from "../../subscription/hooks/useIapPurchase";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { logBirdzyPackEvent } from "../../../services/analytics/packAnalytics";
import { useSubscriptionPlansWithPrices } from "../../subscription/hooks/useSubscriptionPlansWithPrices";
import type { PlanId } from "../../../config/subscriptionConfig";
import { PostAuthGradientButton } from "../components/PostAuthGradientButton";
import { PostAuthHorizontalPlanCard, HORIZONTAL_PLAN_ROW_STYLE } from "../components/PostAuthHorizontalPlanCard";
import { PostAuthLegalFooter } from "../components/PostAuthLegalFooter";
import { PostAuthLegalModal } from "../components/PostAuthLegalModal";
import { PostAuthSubscriptionFeatureCarousel } from "../components/PostAuthSubscriptionFeatureCarousel";
import { PostAuthLocationAccessSlide } from "../components/PostAuthLocationAccessSlide";
import { PostAuthSubscriptionDisclosure } from "../components/PostAuthSubscriptionDisclosure";
import { SubscriptionSuccessModal } from "../../../molecules/Modal";
import {
  POST_AUTH_LAYOUT,
  POST_AUTH_ONBOARDING_STEPS,
  POST_AUTH_ONBOARDING_SLIDE_COUNT,
  getPostAuthOnboardingColors,
} from "../constants";
import {
  getPlanCardTrialDays,
  getPlanCardPriceView,
  getPlanDisplayTitle,
  getSubscriptionCtaLabel,
  localizeCompareAtPriceDisplay,
} from "../utils/planDisplay";
import { getCompareAtPriceDisplay } from "../../subscription/utils/storePlanPricing";
import { PostAuthPhoneLayout } from "../components/PostAuthPhoneLayout";
import { usePostAuthLayoutMetrics } from "../utils/postAuthLayout";
import { usePostAuthOnboardingIsDark } from "../utils/theme";
import { usePostAuthOnboardingStore } from "../post-auth-onboarding.store";
import { TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY } from "../../../components/AppLogsTooltip/AppLogsTooltip";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../subscription/subscription.store";
import {
  isPostAuthPromoSlide,
  shouldSkipPostAuthPromoSlides,
} from "../utils/skipPromoSlides";
import { resolvePostAuthOnboardingSlide } from "../utils/postAuthSlideResolution";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PostAuthOnboarding"
>;

function pickDefaultYearlyPlanId(
  plans: { id: string; duration?: string }[]
): PlanId {
  const yearly = plans.find((p) => (p.duration ?? "").toLowerCase() === "year");
  return (yearly?.id ?? plans[0]?.id ?? "yearly_birdzy_pack") as PlanId;
}

export const PostAuthOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const token = useAuthStore((s) => s.token);
  const userIsSubscribed = useAuthStore((s) => s.user?.isSubscribed === true);
  const isPremium = useSubscriptionStore(selectIsPremium);
  const syncFromAuthStore = useSubscriptionStore((s) => s.syncFromAuthStore);
  const skipPromoSlides = shouldSkipPostAuthPromoSlides(
    isPremium,
    userIsSubscribed
  );
  const purchasedThisSessionRef = useRef(false);
  const { registerDevice } = usePushNotifications();
  const isDark = usePostAuthOnboardingIsDark();
  const { width: windowWidth } = useWindowDimensions();
  const layout = usePostAuthLayoutMetrics();
  const colors = useMemo(() => getPostAuthOnboardingColors(isDark), [isDark]);
  const onboardingImages = useMemo(
    () => ({
      notification: isDark
        ? Images.onboardingNotificationDark
        : Images.onboardingNotification,
      gift: isDark ? Images.onboardingGiftDark : Images.onboardingGift,
      discount: isDark
        ? Images.onboarding50PercentDark
        : Images.onboarding50Percent,
    }),
    [isDark]
  );
  const persistCurrentSlide = usePostAuthOnboardingStore((s) => s.setCurrentSlide);
  const markPostAuthCompleted = usePostAuthOnboardingStore((s) => s.markCompleted);
  const persistedSlide = usePostAuthOnboardingStore((s) => s.currentSlide);
  const postAuthHydrated = usePostAuthOnboardingStore((s) => s._hasHydrated);
  const [currentSlide, setCurrentSlide] = useState<number>(
    POST_AUTH_ONBOARDING_STEPS.LOCATION
  );
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;
  const hasRestoredSlideRef = useRef(false);
  const [locationAllowLoading, setLocationAllowLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const [legalModal, setLegalModal] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const setPendingWelcomeModal = useSubscriptionStore(
    (s) => s.setPendingWelcomeModal
  );

  const offerActiveOverride = useMemo(() => {
    if (currentSlide === POST_AUTH_ONBOARDING_STEPS.DISCOUNT) return true;
    if (currentSlide === POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION) return false;
    return undefined;
  }, [currentSlide]);

  const { plans, isLoadingPrices, priceLoadError, refetchPrices, storePrices } =
    useSubscriptionPlansWithPrices({ offerActiveOverride });
  const refetchPricesRef = useRef(refetchPrices);
  refetchPricesRef.current = refetchPrices;

  const visiblePlans = plans;

  const effectiveSelectedPlanId =
    selectedPlanId ?? pickDefaultYearlyPlanId(visiblePlans);

  const selectedPlan = visiblePlans.find(
    (plan) => plan.id === effectiveSelectedPlanId
  );

  const isDiscountSlide = currentSlide === POST_AUTH_ONBOARDING_STEPS.DISCOUNT;

  useEffect(() => {
    syncFromAuthStore();
  }, [syncFromAuthStore]);

  useEffect(() => {
    if (
      currentSlide !== POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION &&
      currentSlide !== POST_AUTH_ONBOARDING_STEPS.DISCOUNT
    ) {
      return;
    }
    setSelectedPlanId(null);
  }, [currentSlide, offerActiveOverride]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refetchPricesRef.current();
    }, 2500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (
      currentSlide === POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION ||
      currentSlide === POST_AUTH_ONBOARDING_STEPS.DISCOUNT
    ) {
      void refetchPricesRef.current();
    }
  }, [currentSlide]);

  useEffect(() => {
    if (currentSlide !== POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS) return;
    analyticsService.logEvent(EVENTS.notif_popup);
    analyticsService.logEvent(EVENTS.notification_modal_shown);
    analyticsService.logEvent(EVENTS.native_permission);
  }, [currentSlide]);

  const { purchasePlan, isPurchasing, restorePurchases, isRestoring } =
    useIapPurchase(plans, { skipNavigateHomeOnSuccess: true });
  const { syncPermission } = useIdentificationLocation();

  const ctaLabel = useMemo(
    () =>
      getSubscriptionCtaLabel({
        isPurchasing,
        selectedPlan,
        has50Discount: isDiscountSlide,
        useTrialCta: currentSlide === POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION,
      }),
    [currentSlide, isDiscountSlide, isPurchasing, selectedPlan]
  );

  const finishToMainApp = useCallback(() => {
    markPostAuthCompleted();
    void AsyncStorage.setItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY, "true");
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ROUTES.MAIN.TABS }],
      })
    );
  }, [markPostAuthCompleted, navigation]);

  const goToSlide = useCallback(
    (index: number, animated = true) => {
      const clamped = Math.max(
        0,
        Math.min(index, POST_AUTH_ONBOARDING_SLIDE_COUNT - 1)
      );
      setCurrentSlide(clamped);
      persistCurrentSlide(clamped);
      // No outer pager; slide changes are state-driven.
      void animated;
    },
    [persistCurrentSlide]
  );

  const applyResolvedSlide = useCallback(
    async (startSlide: number) => {
      const resolved = await resolvePostAuthOnboardingSlide(
        startSlide,
        skipPromoSlides
      );
      if (resolved.kind === "complete") {
        finishToMainApp();
        return;
      }
      // Don't pull the user back after Don't Allow / Continue already advanced.
      if (resolved.slide < currentSlideRef.current) {
        return;
      }
      if (resolved.slide !== startSlide) {
        goToSlide(resolved.slide, false);
      } else if (resolved.slide !== currentSlideRef.current) {
        setCurrentSlide(resolved.slide);
      }
    },
    [finishToMainApp, goToSlide, skipPromoSlides]
  );

  useEffect(() => {
    if (
      currentSlide !== POST_AUTH_ONBOARDING_STEPS.LOCATION &&
      currentSlide !== POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS
    ) {
      return;
    }
    let mounted = true;
    void (async () => {
      await applyResolvedSlide(currentSlide);
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [applyResolvedSlide, currentSlide]);

  useEffect(() => {
    if (!postAuthHydrated || hasRestoredSlideRef.current) return;
    hasRestoredSlideRef.current = true;
    const slide = Math.max(
      0,
      Math.min(persistedSlide, POST_AUTH_ONBOARDING_SLIDE_COUNT - 1)
    );
    void applyResolvedSlide(slide);
  }, [applyResolvedSlide, persistedSlide, postAuthHydrated]);

  useEffect(() => {
    if (!skipPromoSlides || purchasedThisSessionRef.current) return;
    if (showWelcomeModal) return;
    if (!isPostAuthPromoSlide(currentSlide)) return;
    finishToMainApp();
  }, [currentSlide, finishToMainApp, showWelcomeModal, skipPromoSlides]);

  const openLegal = useCallback((url: string, title: string) => {
    setLegalModal({ url, title });
  }, []);

  const handleWelcomeDismiss = useCallback(() => {
    setShowWelcomeModal(false);
    setPendingWelcomeModal(false);
    finishToMainApp();
  }, [finishToMainApp, setPendingWelcomeModal]);

  const showWelcomeIfPurchaseSucceeded = useCallback(() => {
    const pendingWelcome = useSubscriptionStore.getState().pendingWelcomeModal;
    const isPremium = selectIsPremium(useSubscriptionStore.getState());
    if (pendingWelcome || isPremium) {
      setShowWelcomeModal(true);
      return true;
    }
    return false;
  }, []);

  const handleRestore = useCallback(async () => {
    const synced = await restorePurchases();
    if (synced) {
      purchasedThisSessionRef.current = true;
    }
    if (synced && showWelcomeIfPurchaseSucceeded()) {
      return;
    }
    if (synced) {
      finishToMainApp();
    }
  }, [finishToMainApp, restorePurchases, showWelcomeIfPurchaseSucceeded]);

  const handlePurchase = useCallback(async () => {
    if (!effectiveSelectedPlanId) return;
    try {
      analyticsService.logEvent(EVENTS.subs_button, {
        plan_id: effectiveSelectedPlanId,
      });
      analyticsService.logEvent(EVENTS.subscription_pack_click, {
        plan_id: effectiveSelectedPlanId,
      });
      logBirdzyPackEvent(effectiveSelectedPlanId, {
        source: "post_auth_cta",
      });
      await purchasePlan(effectiveSelectedPlanId);
      purchasedThisSessionRef.current = true;
      if (!showWelcomeIfPurchaseSucceeded()) {
        finishToMainApp();
      }
    } catch {
      // useIapPurchase surfaces errors; stay on screen
    }
  }, [
    effectiveSelectedPlanId,
    finishToMainApp,
    purchasePlan,
    showWelcomeIfPurchaseSucceeded,
  ]);

  const handleEnableNotifications = useCallback(async () => {
    try {
      const result = await requestNotificationPermission();
      if (result.granted) {
        analyticsService.logEvent(EVENTS.notification_permission_granted, {
          source: "post_auth_onboarding",
        });
        analyticsService.logEvent(EVENTS.permission_given);
        analyticsService.logEvent(EVENTS.native_permission_given);
        if (token) {
          registerDevice({ requestPermission: false }).catch(() => undefined);
        }
      } else {
        analyticsService.logEvent(EVENTS.notification_permission_denied, {
          source: "post_auth_onboarding",
        });
        analyticsService.logEvent(EVENTS.permission_denied);
        analyticsService.logEvent(EVENTS.native_permission_denied);
      }
    } catch {
      analyticsService.logEvent(EVENTS.permission_closed);
      analyticsService.logEvent(EVENTS.notification_permission_dismissed);
      analyticsService.logEvent(EVENTS.native_permission_closed);
    }
    await markNotificationPermissionPrompted();
    if (skipPromoSlides) {
      finishToMainApp();
      return;
    }
    goToSlide(POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION);
  }, [finishToMainApp, goToSlide, registerDevice, skipPromoSlides, token]);

  const handleLocationContinue = useCallback(async () => {
    if (locationAllowLoading) return;
    setLocationAllowLoading(true);
    try {
      const current = await checkLocationPermission();
      if (current.granted) {
        await syncPermission();
      } else {
        const outcome = await requestNativeLocationPermission();
        if (outcome.granted) {
          await syncPermission();
        }
        // Denied / blocked: skip manage-settings UI and continue onboarding.
      }
    } catch {
      // Continue to notifications either way
    } finally {
      setLocationAllowLoading(false);
    }
    void applyResolvedSlide(POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS);
  }, [applyResolvedSlide, locationAllowLoading, syncPermission]);

  const renderSkip = (onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.skipButton}
    >
      <Text style={[styles.skipText, { color: colors.textPrimary }]}>Skip</Text>
    </TouchableOpacity>
  );

  const renderBottomActions = (children: React.ReactNode) => (
    <View
      style={[
        styles.bottomActions,
        { paddingBottom: layout.subscriptionBottomPadding },
      ]}
    >
      {children}
    </View>
  );

  const renderHorizontalPlanCards = (planList: typeof visiblePlans) =>
    planList.map((plan) => {
      const duration = (plan.duration ?? "").toLowerCase();
      const isYearly = duration === "year";
      const priceView = getPlanCardPriceView(plan.priceDisplay, duration);

      return (
        <PostAuthHorizontalPlanCard
          key={plan.id}
          title={getPlanDisplayTitle(duration, plan.title)}
          priceAmount={priceView.amount}
          priceSuffix={priceView.suffix}
          billingNote={priceView.billingNote}
          duration={duration}
          trialDays={getPlanCardTrialDays(duration, plan.trialDays)}
          showPopular={isYearly}
          selected={effectiveSelectedPlanId === plan.id}
          onPress={() => setSelectedPlanId(plan.id as PlanId)}
          colors={colors}
        />
      );
    });

  const renderDiscountHorizontalPlanCards = () =>
    visiblePlans.map((plan) => {
      const duration = (plan.duration ?? "").toLowerCase();
      const isYearly = duration === "year";
      const isLifetime = duration === "lifetime";
      const priceView = getPlanCardPriceView(plan.priceDisplay, duration);
      const originalPrice =
        priceView.hasStorePrice && (isLifetime || isYearly)
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
          colors={colors}
        />
      );
    });

  const renderPriceRetryBanner = () =>
    priceLoadError ? (
      <TouchableOpacity
        onPress={() => void refetchPrices()}
        style={styles.retryBanner}
      >
        <Text style={[styles.retryText, { color: colors.textSecondary }]}>
          Couldn&apos;t load prices. Tap to retry.
        </Text>
      </TouchableOpacity>
    ) : null;

  const renderPaywallFooter = () => (
    <View style={styles.paywallFooter}>
      <PostAuthSubscriptionDisclosure plan={selectedPlan} colors={colors} />
      <PostAuthGradientButton
        title={ctaLabel}
        onPress={handlePurchase}
        loading={isPurchasing}
        disabled={isLoadingPrices || !effectiveSelectedPlanId}
        colors={colors}
      />
      <PostAuthLegalFooter
        onTerms={() =>
          openLegal(getTermsOfServiceUrl(), "Terms of Service")
        }
        onPrivacy={() => openLegal(getPrivacyPolicyUrl(), "Privacy Policy")}
        onRestore={handleRestore}
        isRestoring={isRestoring}
        colors={colors}
      />
    </View>
  );

  const renderLocationSlide = () => (
    <View style={styles.stepFill}>
      <PostAuthLocationAccessSlide
        onContinue={() => void handleLocationContinue()}
        continueLoading={locationAllowLoading}
        textPrimary={colors.textPrimary}
        primaryColor={colors.ctaSolidBackground}
        onPrimaryColor={colors.ctaTextDark}
      />
    </View>
  );

  const renderNotificationsSlide = () => (
    <View style={styles.stepFill}>
      <PostAuthLocationAccessSlide
        onContinue={handleEnableNotifications}
        textPrimary={colors.textPrimary}
        primaryColor={colors.ctaSolidBackground}
        onPrimaryColor={colors.ctaTextDark}
        title="Important updates can come fast — don't miss them."
        subtitle="Get alerts for new mushroom finds, safety warnings, and similar species."
        image={onboardingImages.notification}
        continueLabel="Continue"
      />
    </View>
  );

  const renderSubscriptionSlide = () => (
    <View style={styles.stepFill}>
      <View
        style={[
          styles.headerRow,
          { minHeight: Math.max(layout.headerMinHeight, 44) },
        ]}
      >
        {renderSkip(() => goToSlide(POST_AUTH_ONBOARDING_STEPS.SURPRISE))}
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
        <View style={styles.subscriptionCenterBlock}>
          <PostAuthSubscriptionFeatureCarousel
            isDark={isDark}
            colors={colors}
          />
          {renderPriceRetryBanner()}
        </View>
      </View>
      {renderBottomActions(
        <>
          <View
            style={[
              HORIZONTAL_PLAN_ROW_STYLE,
              styles.horizontalPlanRow,
              {
                marginTop: layout.subscriptionPlanRowMarginTop,
              },
            ]}
          >
            {renderHorizontalPlanCards(visiblePlans)}
          </View>
          {renderPaywallFooter()}
        </>
      )}
    </View>
  );

  const renderSurpriseSlide = () => (
    <View style={styles.stepFill}>
      <View
        style={[
          styles.surpriseBody,
          { paddingTop: layout.discountSlideTopPadding },
        ]}
      >
        <Text
          style={[
            styles.discountTitle,
            {
              color: isDark ? colors.textPrimary : "#000000",
              fontSize: layout.discountTitleFontSize,
              lineHeight: layout.discountTitleLineHeight,
              marginBottom: layout.isCompact ? 4 : 8,
            },
          ]}
        >
          We got a little surprise{"\n"}for you!
        </Text>
        <View style={styles.surpriseImageWrap}>
          <AppImage
            source={onboardingImages.gift}
            style={{
              width: layout.surpriseImageWidth,
              height: layout.surpriseImageHeight,
            }}
            resizeMode="contain"
          />
        </View>
        <View
          style={[
            styles.surpriseCtaWrap,
            {
              paddingTop: layout.isCompact ? 12 : 20,
              paddingBottom: layout.isCompact ? 8 : 16,
            },
          ]}
        >
          <PostAuthGradientButton
            title="Open it"
            onPress={() => goToSlide(POST_AUTH_ONBOARDING_STEPS.DISCOUNT)}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );

  const renderDiscountSlide = () => (
    <View style={styles.stepFill}>
      <View
        style={[
          styles.headerRow,
          { minHeight: Math.max(layout.headerMinHeight, 44) },
        ]}
      >
        {renderSkip(finishToMainApp)}
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
        <View style={styles.subscriptionCenterBlock}>
          <PostAuthSubscriptionFeatureCarousel
            isDark={isDark}
            colors={colors}
          />
          {renderPriceRetryBanner()}
        </View>
      </View>
      {renderBottomActions(
        <>
          <View
            style={[
              HORIZONTAL_PLAN_ROW_STYLE,
              styles.horizontalPlanRow,
              {
                marginTop: layout.subscriptionPlanRowMarginTop,
              },
            ]}
          >
            {renderDiscountHorizontalPlanCards()}
          </View>
          {renderPaywallFooter()}
        </>
      )}
    </View>
  );

  const renderSlide = (slideIndex: number) => {
    switch (slideIndex) {
      case POST_AUTH_ONBOARDING_STEPS.LOCATION:
        return renderLocationSlide();
      case POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS:
        return renderNotificationsSlide();
      case POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION:
        return renderSubscriptionSlide();
      case POST_AUTH_ONBOARDING_STEPS.SURPRISE:
        return renderSurpriseSlide();
      case POST_AUTH_ONBOARDING_STEPS.DISCOUNT:
        return renderDiscountSlide();
      default:
        return null;
    }
  };

  return (
    <View style={styles.background}>
      <PostAuthOnboardingBackground isDark={isDark} />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={[styles.slide, { width: windowWidth }]}>
          <PostAuthPhoneLayout>
            {renderSlide(currentSlide)}
          </PostAuthPhoneLayout>
        </View>
      </SafeAreaView>

      <PostAuthLegalModal
        visible={legalModal != null}
        url={legalModal?.url ?? ""}
        title={legalModal?.title ?? ""}
        onClose={() => setLegalModal(null)}
      />
      <SubscriptionSuccessModal
        visible={showWelcomeModal}
        onDismiss={handleWelcomeDismiss}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    position: "relative",
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  slide: {
    flex: 1,
  },
  stepFill: {
    flex: 1,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingTop: 4,
    zIndex: 2,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  skipText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 0,
  },
  subscriptionBody: {
    flex: 1,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    justifyContent: "center",
    minHeight: 0,
    paddingBottom: 8,
    zIndex: 1,
  },
  subscriptionCenterBlock: {
    width: "100%",
    alignItems: "center",
  },
  surpriseBody: {
    flex: 1,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    alignItems: "center",
    minHeight: 0,
  },
  surpriseImageWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  surpriseCtaWrap: {
    width: "100%",
    maxWidth: "100%",
    alignItems: "center",
    flexShrink: 0,
  },
  discountBody: {
    flex: 1,
    minHeight: 0,
  },
  discountContent: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    alignItems: "center",
  },
  discountBannerWrap: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  discountPaywallFooter: {
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingBottom: 4,
    width: "100%",
    alignItems: "center",
    flexShrink: 0,
  },
  discountTitle: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    lineHeight: 34,
    textAlign: "center",
    marginBottom: 8,
    width: 343,
    maxWidth: "100%",
    flexShrink: 0,
  },
  slideTitle: {
    textAlign: "center",
    fontFamily: FONTS.bold,
    width: 343,
    maxWidth: "100%",
  },
  slideBody: {
    textAlign: "center",
    fontFamily: FONTS.medium,
    letterSpacing: -0.16,
    width: 330,
    maxWidth: "100%",
    flexShrink: 0,
  },
  horizontalPlanRow: {
    marginTop: 16,
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
  bottomActions: {
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingBottom: 4,
    width: "100%",
    alignItems: "center",
    flexShrink: 0,
    zIndex: 2,
  },
  ctaStack: {
    width: "100%",
    maxWidth: "100%",
    gap: 8,
  },
  secondaryButton: {
    height: POST_AUTH_LAYOUT.ctaHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    width: "100%",
  },
  maybeLater: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  paywallFooter: {
    width: "100%",
    maxWidth: "100%",
    gap: 8,
  },
});
