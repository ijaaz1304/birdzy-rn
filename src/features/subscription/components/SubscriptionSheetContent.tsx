import React, { useMemo, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { useDiscountOfferCountdown } from "../utils/discountOffer";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import { formatCountdownSegment } from "../../../utils";
import { SUBSCRIPTION_COLORS } from "../../../constants/colorConstants";

import { FONTS } from "../../../common/typography";

import { SCREEN_COLORS } from "../../../constants/colorConstants";

import { Radius } from "../../../design";

import { APP_COLORS } from "../../../config/colors";
import {
  hasRealStorePrice,
  resolveStorePriceDisplay,
} from "../utils/storePlanPricing";
import { localizePriceDisplayForDevice } from "../utils/iapPriceDisplay";
import { compactPriceDecimals, getDefaultTrialDays, getRecurringPlanDescriptionLines, getSubscriptionCtaLabel } from "../../post-auth-onboarding/utils/planDisplay";

const SELECTED_BORDER = SUBSCRIPTION_COLORS.CARD_SELECTED_BORDER;
const UNSELECTED_LIGHT = SUBSCRIPTION_COLORS.CARD_UNSELECTED_BORDER_LIGHT;
const UNSELECTED_DARK = SUBSCRIPTION_COLORS.CARD_UNSELECTED_BORDER_DARK;

/** Plan item from paywall (IAP); id = productId for purchase. */
export interface SubscriptionSheetPlan {
  id: string;
  title: string;
  priceDisplay: string;
  duration: string;
  trialDays?: number;
  descriptionLines: string[];
  ctaLabel: string;
  badge?: string;
  subtitle?: string;
  /** Numeric price from IAP (for strikethrough and monthly equivalent). */
  price?: number;
}

/** Format original price (2x) from discounted priceDisplay for strikethrough. */
function getOriginalPriceDisplay(
  discountedPriceDisplay: string
): string | null {
  const trimmed = discountedPriceDisplay.trim();
  const match = trimmed.match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const num = parseFloat(numStr.replace(/,/g, ""));
  if (Number.isNaN(num) || num <= 0) return null;
  const originalNum = num * 2;
  const hadDecimals = /\.\d+/.test(numStr);
  const originalStr = hadDecimals
    ? originalNum.toFixed(2)
    : String(Math.round(originalNum));
  const formatted =
    numStr.includes(",") && !hadDecimals
      ? Number(originalStr).toLocaleString()
      : originalStr;
  return compactPriceDecimals(`${prefix}${formatted}${suffix}`.trim());
}

const LIFETIME_PLAN_LINES = [
  "One-time purchase",
  "Unlimited access forever",
];

interface PlanRowProps {
  title: string;
  price: string;
  subtitle?: string;
  badge?: string;
  features: string[];
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
  cardBg: string;
  textColor: string;
  textSecondary: string;
  /** When true, show 50% chip and strikethrough original price. */
  isDiscountActive?: boolean;
  /** Numeric price for strikethrough (2x) and yearly monthly equivalent. */
  priceNum?: number;
  /** month | year | lifetime – drives description lines and monthly equivalent. */
  duration?: string;
  /** Description lines below price (from duration: Monthly/Yearly copy). */
  planDescriptionLines?: string[];
  /** Strikethrough price when discount active (original = priceDisplay * 2). */
  originalPriceDisplay?: string | null;
  /** Yearly only: monthly equivalent e.g. "($1.25/month)". */
  monthlyEquivalentText?: string | null;
  /** Lifetime only: "(One time purchase)". */
  oneTimePurchaseText?: string | null;
}

function SubscriptionPlanRow({
  title,
  price,
  subtitle,
  badge,
  features,
  selected,
  onPress,
  isDark,
  cardBg,
  textColor,
  textSecondary,
  isDiscountActive,
  originalPriceDisplay,
  planDescriptionLines,
  monthlyEquivalentText,
  oneTimePurchaseText,
}: PlanRowProps) {
  const show50Chip = isDiscountActive;
  const showStrike = isDiscountActive && originalPriceDisplay;
  const descriptionLines = planDescriptionLines ?? features;
  const showRightFeatures = features.length > 0 && !planDescriptionLines;

  const cardInner = (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        planRowStyles.card,
        {
          backgroundColor: cardBg,
          borderWidth: selected ? 2 : 1,
          borderColor: selected
            ? SELECTED_BORDER
            : isDark
            ? UNSELECTED_DARK
            : UNSELECTED_LIGHT,
        },
      ]}
    >
      {/* Radio at start – no tick */}
      <View style={planRowStyles.radioWrap}>
        <View
          style={[
            planRowStyles.radioOuter,
            {
              borderColor: selected
                ? SELECTED_BORDER
                : isDark
                ? UNSELECTED_DARK
                : UNSELECTED_LIGHT,
            },
          ]}
        >
          {selected && <View style={planRowStyles.radioInner} />}
        </View>
      </View>

      {/* Center: title, price (strikethrough + current), description lines, 50% chip */}
      <View style={planRowStyles.body}>
        <View style={planRowStyles.titleRow}>
          <Text style={[planRowStyles.title, { color: textColor }]}>
            {title}
          </Text>
          {show50Chip ? (
            <View
              style={[
                planRowStyles.chip50,
                {
                  backgroundColor: isDark
                    ? APP_COLORS.subscriptionDiscountBg
                    : SUBSCRIPTION_COLORS.DISCOUNT_TIMER_BG ??
                      APP_COLORS.subscriptionDiscountTimer,
                },
              ]}
            >
              <Text style={planRowStyles.chip50Text}>50% off</Text>
            </View>
          ) : null}
        </View>
        <View style={planRowStyles.priceRow}>
          {showStrike ? (
            <Text
              style={[planRowStyles.originalPrice, { color: textSecondary }]}
              numberOfLines={1}
            >
              {originalPriceDisplay}
            </Text>
          ) : null}
          <Text
            style={[planRowStyles.price, { color: textColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {price}
          </Text>
          {subtitle ? (
            <Text style={[planRowStyles.periodSuffix, { color: textColor }]}>
              {subtitle}
            </Text>
          ) : null}
          {monthlyEquivalentText ? (
            <Text
              style={[
                planRowStyles.monthlyEquivalent,
                { color: textSecondary },
              ]}
            >
              {monthlyEquivalentText}
            </Text>
          ) : null}
          {oneTimePurchaseText ? (
            <Text
              style={[planRowStyles.oneTimePurchase, { color: textSecondary }]}
            >
              {oneTimePurchaseText}
            </Text>
          ) : null}
        </View>
        {descriptionLines.map((line, i) => (
          <Text
            key={i}
            style={[planRowStyles.planLine, { color: textSecondary }]}
          >
            • {line}
          </Text>
        ))}
        {badge && !show50Chip ? (
          <View style={planRowStyles.badge}>
            <Text style={planRowStyles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      {/* Right: features list (when not using plan description in body) */}
      {showRightFeatures ? (
        <View style={planRowStyles.features}>
          {features.map((line, i) => (
            <Text
              key={i}
              style={[planRowStyles.featureLine, { color: textSecondary }]}
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );

  if (selected && isDark) {
    return (
      <View style={planRowStyles.rowWrap}>
        <View
          style={[
            planRowStyles.cardOuter,
            { borderColor: UNSELECTED_DARK, borderWidth: 1 },
          ]}
        >
          {cardInner}
        </View>
      </View>
    );
  }
  return <View style={planRowStyles.rowWrap}>{cardInner}</View>;
}

const planRowStyles = StyleSheet.create({
  rowWrap: {
    marginBottom: 8,
  },
  cardOuter: {
    borderRadius: 10,
    overflow: "hidden",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    overflow: "hidden",
  },
  radioWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SELECTED_BORDER,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  chip50: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chip50Text: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: APP_COLORS.surfaceDark,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 2,
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  periodSuffix: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  monthlyEquivalent: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  oneTimePurchase: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  planLine: {
    fontSize: 11,
    opacity: 0.9,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 11,
    opacity: 0.8,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: SELECTED_BORDER,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: APP_COLORS.modalTextOnPrimary,
  },
  features: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  featureLine: {
    fontSize: 11,
    marginBottom: 1,
    textAlign: "right",
  },
});

interface Props {
  plans: SubscriptionSheetPlan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onSubscribe: () => void;
  onClose?: () => void;
  isPurchasing?: boolean;
  theme?: "light" | "dark";
  /** When true, show loading state for prices in the modal (IAP still fetching). */
  isLoadingPrices?: boolean;
  /** When set, show retry option so user can reload prices. */
  priceLoadError?: string | null;
  /** Callback to retry loading prices (e.g. refetch IAP). */
  onRetryPrices?: () => void;
  /** When true, discount timer pill is hidden (e.g. user is already premium). */
  isPremium?: boolean;
  /** Called when user taps "Terms of Service"; e.g. open in-app WebView. */
  onOpenTerms?: () => void;
  /** Called when user taps "Paid Services Terms"; e.g. open in-app WebView. */
  onOpenPaidServicesTerms?: () => void;
  /** Called when user taps "Privacy Policy" (iOS sheet). */
  onOpenPrivacyPolicy?: () => void;
  /** Called when user taps "Restore Purchase" (iOS sheet). Returns Promise<boolean>. */
  onRestorePurchases?: () => void | Promise<boolean>;
  /** Optional: disable CTA while still allowing plan selection (e.g. already subscribed lifetime). */
  isSubscribeDisabled?: boolean;
  /** Optional CTA text override when subscribe is disabled for business logic reasons. */
  subscribeDisabledLabel?: string;
}

const SubscriptionSheetContent: React.FC<Props> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  onSubscribe,
  onClose: _onClose,
  isPurchasing = false,
  theme,
  isLoadingPrices = false,
  priceLoadError = null,
  onRetryPrices,
  isPremium = false,
  onOpenTerms,
  onOpenPaidServicesTerms,
  onOpenPrivacyPolicy,
  onRestorePurchases,
  isSubscribeDisabled = false,
  subscribeDisabledLabel = "Unavailable",
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const appTheme = useTheme();
  const mode = theme ?? appTheme.mode ?? "light";
  const discountOffer = useDiscountOfferCountdown();
  const countdown = {
    hours: discountOffer.hours,
    minutes: discountOffer.minutes,
    seconds: discountOffer.seconds,
  };

  const isDark = mode === "dark";
  const colors = useMemo(() => {
    if (mode === "dark") {
      return {
        background: APP_COLORS.surfaceDark,
        cardBg: APP_COLORS.surfaceDark,
        cardBorder: SCREEN_COLORS.DARK.border,
        cardText: APP_COLORS.modalTextOnPrimary,
        cardTextSecondary: APP_COLORS.borderGray,
        discountBg: APP_COLORS.subscriptionDiscountTimer,
        premium: APP_COLORS.subscriptionPremium,
        strike: APP_COLORS.subscriptionMuted,
        ctaBg: SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK,
        ctaText: SUBSCRIPTION_COLORS.CTA_TEXT_DARK,
        terms: APP_COLORS.subscriptionMuted,
      };
    }

    return {
      background: APP_COLORS.modalTextOnPrimary,
      cardBg: APP_COLORS.modalTextOnPrimary,
      cardBorder: SCREEN_COLORS.LIGHT.border,
      cardText: APP_COLORS.surfaceDark,
      cardTextSecondary: APP_COLORS.textSecondaryGray,
      discountBg: APP_COLORS.subscriptionDiscountTimer,
      premium: APP_COLORS.subscriptionPremium,
      strike: APP_COLORS.subscriptionMuted,
      ctaBg: SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT,
      ctaText: SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT,
      terms: APP_COLORS.subscriptionMuted,
    };
  }, [mode]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );
  const ctaLabel = useMemo(() => {
    if (isPremium) return "Upgrade";
    if (!selectedPlan) return "Subscribe";
    return getSubscriptionCtaLabel({ selectedPlan });
  }, [selectedPlan, isPremium]);

  useEffect(() => {
    const plansWithoutPrice = plans.filter((p) => !hasRealStorePrice(p.priceDisplay));
    useAppLogsStore
      .getState()
      .info("[Subscription] flow: sheet content mounted", {
        planCount: plans.length,
        planIds: plans.map((p) => p.id),
        selectedPlanId,
        isLoadingPrices,
        hasPriceError: !!priceLoadError,
        plansWithoutPriceCount: plansWithoutPrice.length,
        plansWithoutPriceIds:
          plansWithoutPrice.length > 0
            ? plansWithoutPrice.map((p) => p.id)
            : undefined,
      });
  }, [plans, selectedPlanId, isLoadingPrices, priceLoadError]);

  const handleSubscribePress = () => {
    if (isSubscribeDisabled) {
      useAppLogsStore
        .getState()
        .info("[Subscription] flow: sheet subscribe blocked (disabled)", {
          selectedPlanId,
          isPurchasing,
        });
      return;
    }
    useAppLogsStore
      .getState()
      .info("[Subscription] flow: sheet subscribe pressed", {
        selectedPlanId,
        isPurchasing,
      });
    onSubscribe();
  };

  const handleRestorePress = async () => {
    if (!onRestorePurchases || isRestoring) return;
    setIsRestoring(true);
    try {
      const result = await Promise.resolve(onRestorePurchases());
      useAppLogsStore
        .getState()
        .info("[Subscription] sheet restore completed", { restored: result });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, flex: 1 },
      ]}
    >
      {/* Top 70%: title, timer, packs */}
      <View style={styles.topSection}>
        <Text style={[styles.header, { color: colors.cardText }]}>
          Birdzy{" "}
          <Text style={{ color: colors.premium, fontFamily: FONTS.bold }}>
            Premium
          </Text>
        </Text>

        {!isPremium && discountOffer.remainingMs > 0 ? (
          <View
            style={[styles.discountPill, { backgroundColor: colors.discountBg }]}
          >
            <Text style={styles.discountText}>
              🕒 {discountOffer.isActive ? "Discount ends in" : "Discount in"}{" "}
              {formatCountdownSegment(countdown.hours)}:
              {formatCountdownSegment(countdown.minutes)}:
              {formatCountdownSegment(countdown.seconds)}
            </Text>
          </View>
        ) : null}

        {plans.length === 0 ? (
          <Text
            style={[styles.loadingText, { color: colors.cardTextSecondary }]}
          >
            Loading plans…
          </Text>
        ) : (
          <View style={styles.plansWrap}>
            {priceLoadError && onRetryPrices ? (
              <TouchableOpacity
                onPress={() => {
                  useAppLogsStore
                    .getState()
                    .info("[Subscription] sheet: user tapped retry prices", {
                      priceLoadError,
                    });
                  onRetryPrices();
                }}
                style={[
                  styles.retryBanner,
                  {
                    backgroundColor: isDark
                      ? APP_COLORS.surfaceDarkAlt
                      : APP_COLORS.surfaceLightAlt,
                    borderColor: isDark
                      ? APP_COLORS.borderDarkLighter
                      : APP_COLORS.borderGrayLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.retryBannerText,
                    { color: colors.cardTextSecondary },
                  ]}
                >
                  Couldn't load prices. Tap to retry.
                </Text>
              </TouchableOpacity>
            ) : null}
            {plans.map((plan) => {
              const discountTimerActive = discountOffer.isActive;
              const duration = (plan.duration ?? "").toLowerCase();
              const isWeekly = duration === "week";
              const isMonthly = duration === "month";
              const isYearly = duration === "year";
              const isLifetime = duration === "lifetime";
              const trialDays = getDefaultTrialDays(duration, plan.trialDays);
              const planDescriptionLines = isLifetime
                ? LIFETIME_PLAN_LINES
                : isWeekly || isMonthly || isYearly
                ? getRecurringPlanDescriptionLines(duration, trialDays)
                : plan.descriptionLines?.length
                ? plan.descriptionLines
                : ["Cancel anytime"];
              const show50ForPlan =
                discountTimerActive &&
                !isWeekly &&
                !isMonthly &&
                hasRealStorePrice(plan.priceDisplay);
              const originalPriceDisplay =
                show50ForPlan && plan.priceDisplay
                  ? getOriginalPriceDisplay(
                      localizePriceDisplayForDevice(plan.priceDisplay)
                    )
                  : null;
              const priceNum =
                hasRealStorePrice(plan.priceDisplay) &&
                typeof (plan as SubscriptionSheetPlan & { price?: number })
                  .price === "number"
                  ? (plan as SubscriptionSheetPlan & { price?: number }).price
                  : undefined;
              const currencyPrefix =
                hasRealStorePrice(plan.priceDisplay) && plan.priceDisplay
                  ? (plan.priceDisplay.match(/^[^\d.,]+/) ?? [""])[0]
                  : "";
              const monthlyEquivalentText =
                isYearly &&
                priceNum != null &&
                priceNum > 0 &&
                hasRealStorePrice(plan.priceDisplay)
                  ? compactPriceDecimals(
                      `(${currencyPrefix}${(priceNum / 12).toFixed(2)}/month)`
                    )
                  : null;
              const oneTimePurchaseText = isLifetime
                ? "(One time purchase)"
                : null;
              const displayPrice = isLoadingPrices
                ? "Loading…"
                : compactPriceDecimals(
                    localizePriceDisplayForDevice(
                      resolveStorePriceDisplay(plan.priceDisplay)
                    )
                  );
              return (
                <SubscriptionPlanRow
                  key={plan.id}
                  title={plan.title}
                  price={displayPrice}
                  subtitle={plan.subtitle}
                  badge={plan.badge}
                  features={
                    plan.descriptionLines.length > 0
                      ? plan.descriptionLines
                      : ["Cancel anytime"]
                  }
                  selected={selectedPlanId === plan.id}
                  onPress={() => onSelectPlan(plan.id)}
                  isDark={isDark}
                  cardBg={colors.cardBg}
                  textColor={colors.cardText}
                  textSecondary={colors.cardTextSecondary}
                  isDiscountActive={show50ForPlan}
                  priceNum={priceNum}
                  duration={plan.duration}
                  planDescriptionLines={planDescriptionLines}
                  originalPriceDisplay={originalPriceDisplay}
                  monthlyEquivalentText={monthlyEquivalentText}
                  oneTimePurchaseText={oneTimePurchaseText}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom 30%: CTA + terms */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor: colors.ctaBg,
              opacity:
                selectedPlanId && !isPurchasing && !isSubscribeDisabled
                  ? 1
                  : 0.6,
            },
          ]}
          onPress={handleSubscribePress}
          disabled={!selectedPlanId || isPurchasing || isSubscribeDisabled}
        >
          <Text style={[styles.ctaText, { color: colors.ctaText }]}>
            {isPurchasing
              ? "Processing…"
              : isSubscribeDisabled
              ? subscribeDisabledLabel
              : ctaLabel}
          </Text>
        </TouchableOpacity>

        {Platform.OS === "ios" ? (
          <>
            <Text
              style={[
                styles.terms,
                styles.iosLinksBlock,
                { color: colors.terms },
              ]}
            >
              {onOpenPrivacyPolicy ? (
                <Text
                  style={[styles.termsLink, { color: colors.terms }]}
                  onPress={onOpenPrivacyPolicy}
                >
                  Privacy Policy
                </Text>
              ) : (
                <Text style={{ color: colors.terms }}>Privacy Policy</Text>
              )}
              <Text style={{ color: colors.terms }}> • </Text>
              {onOpenTerms ? (
                <Text
                  style={[styles.termsLink, { color: colors.terms }]}
                  onPress={onOpenTerms}
                >
                  Terms and Conditions
                </Text>
              ) : (
                <Text style={{ color: colors.terms }}>
                  Terms and Conditions
                </Text>
              )}
              <Text style={{ color: colors.terms }}> • </Text>
              {onRestorePurchases ? (
                <Text
                  style={[styles.termsLink, { color: colors.terms }]}
                  onPress={handleRestorePress}
                  disabled={isRestoring}
                >
                  {isRestoring ? "Restoring…" : "Restore Purchase"}
                </Text>
              ) : (
                <Text style={{ color: colors.terms }}>Restore Purchase</Text>
              )}
            </Text>
            {__DEV__ ? (
              <Text
                style={[
                  styles.terms,
                  styles.iosLinksBlock,
                  { color: colors.terms, fontSize: 9, marginTop: 6 },
                ]}
              >
                The App Store purchase sheet is drawn by Apple. The line
                &quot;Apple Account&quot; is normal. For sandbox purchases, sign
                in under Settings → Developer → Sandbox Apple Account (or App
                Store sandbox tester flow for your iOS version).
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={[styles.terms, { color: colors.terms }]}>
              By clicking "Subscribe" you agree to the{" "}
              {onOpenTerms ? (
                <Text
                  style={[styles.termsLink, { color: colors.terms }]}
                  onPress={onOpenTerms}
                >
                  Terms of Service
                </Text>
              ) : (
                "Terms of Service"
              )}{" "}
              and{" "}
              {onOpenPaidServicesTerms ? (
                <Text
                  style={[styles.termsLink, { color: colors.terms }]}
                  onPress={onOpenPaidServicesTerms}
                >
                  Paid Services Terms
                </Text>
              ) : (
                "Paid Services Terms"
              )}
              . What you're purchasing is a recurring subscription, which means
              we'll charge your Google account today and continue to charge you
              every month until you cancel.
            </Text>
            <Text
              style={[
                styles.terms,
                styles.termsSecondLine,
                { color: colors.terms },
              ]}
            >
              You can cancel any time up to 24 hours before your current period
              ends in the Play Store settings.
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
  },
  topSection: {
    flex: 8,
    minHeight: 0,
  },
  plansWrap: {
    flex: 1,
    minHeight: 0,
  },
  bottomSection: {
    flex: 2,
    minHeight: 0,
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  header: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 2,
    textAlign: "center",
  },
  discountPill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    alignSelf: "center",
    marginBottom: 12,
  },
  discountText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: APP_COLORS.modalTextOnPrimary,
  },
  cta: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  terms: {
    fontSize: 10,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  iosLinksBlock: {},
  termsLink: {
    textDecorationLine: "underline",
    fontFamily: FONTS.bold,
  },
  termsSecondLine: {
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    marginVertical: 12,
    textAlign: "center",
  },
  retryBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: 8,
  },
  retryBannerText: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default SubscriptionSheetContent;
