import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../common/typography";
import {
  POST_AUTH_LAYOUT,
  POST_AUTH_ONBOARDING_COLORS_LIGHT,
  type PostAuthOnboardingColors,
} from "../constants";
import {
  compactPriceDecimals,
  getHorizontalPlanPriceFontSize,
  getPlanCardPriceParts,
  normalizePriceAmount,
} from "../utils/planDisplay";
import { PostAuthPopularBadge } from "./PostAuthPopularBadge";

type Props = {
  title: string;
  priceAmount: string;
  priceSuffix: string;
  billingNote?: string;
  /** week | month | year | lifetime — lifetime never shows trial copy. */
  duration?: string;
  trialDays?: number;
  showPopular?: boolean;
  selected: boolean;
  onPress: () => void;
  originalPrice?: string | null;
  colors?: PostAuthOnboardingColors;
};

/** Match SubscriptionPlanRow in SubscriptionSheetContent — bold 16px amount. */
const PRICE_AMOUNT_FONT_SIZE = 16;
const PRICE_SUFFIX_FONT_SIZE = 12;

/** Shared row layout for subscription paywall + post-auth onboarding plan cards. */
export const HORIZONTAL_PLAN_ROW_STYLE = {
  flexDirection: "row" as const,
  gap: POST_AUTH_LAYOUT.planGap,
  width: "100%" as const,
  alignItems: "stretch" as const,
  overflow: "visible" as const,
  paddingTop: 12,
  marginBottom: 4,
};

export const PostAuthHorizontalPlanCard: React.FC<Props> = ({
  title,
  priceAmount,
  priceSuffix,
  billingNote,
  duration,
  trialDays,
  showPopular = false,
  selected,
  onPress,
  originalPrice,
  colors = POST_AUTH_ONBOARDING_COLORS_LIGHT,
}) => {
  const priceParts = useMemo(
    () => getPlanCardPriceParts(priceAmount, priceSuffix, duration),
    [priceAmount, priceSuffix, duration]
  );
  const priceAmountFontSize = getHorizontalPlanPriceFontSize(
    `${priceParts.amount}${priceParts.suffix}`,
    PRICE_AMOUNT_FONT_SIZE,
    Platform.OS === "ios"
      ? "ios"
      : Platform.OS === "android"
        ? "android"
        : "default"
  );
  const showTrial =
    duration?.toLowerCase() !== "lifetime" &&
    trialDays != null &&
    trialDays > 0;
  const priceSecondaryLine = originalPrice?.trim() ? originalPrice.trim() : null;
  const normalizedPriceSecondaryLine = useMemo(() => {
    return priceSecondaryLine
      ? compactPriceDecimals(normalizePriceAmount(priceSecondaryLine))
      : null;
  }, [priceSecondaryLine]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected
            ? colors.planCardBackgroundSelected
            : colors.planCardBackground,
          borderColor: selected
            ? colors.planBorderSelected
            : colors.planBorderUnselected,
          borderWidth: 1.5,
          opacity: pressed ? 0.85 : 1,
          zIndex: showPopular ? 3 : 1,
        },
      ]}
    >
      {showPopular ? (
        <View style={styles.popularBadgeWrap}>
          <PostAuthPopularBadge colors={colors} />
        </View>
      ) : null}

      <Text
        style={[styles.title, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.priceDetails}>
        <View style={styles.priceGroup}>
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.priceAmount,
                {
                  color: colors.textPrimary,
                  fontSize: priceAmountFontSize,
                },
              ]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {priceParts.amount}
            </Text>
            {priceParts.suffix ? (
              <Text
                style={[styles.priceSuffix, { color: colors.textPrimary }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {priceParts.suffix}
              </Text>
            ) : null}
          </View>

          {normalizedPriceSecondaryLine ? (
            <Text
              style={[
                styles.billingNote,
                styles.strikethrough,
                { color: colors.textTertiary },
              ]}
              numberOfLines={1}
            >
              {normalizedPriceSecondaryLine}
            </Text>
          ) : null}

          {billingNote ? (
            <Text
              style={[styles.billingNote, { color: colors.textTertiary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {billingNote}
            </Text>
          ) : null}
        </View>

        {showTrial ? (
          <Text
            style={[styles.trialLine, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            <Text style={styles.trialBold}>{trialDays} days</Text>
            <Text style={styles.trialRegular}> free trial</Text>
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    minWidth: 0,
    overflow: "visible",
    shadowColor: "rgba(203, 75, 0, 0.08)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  popularBadgeWrap: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
    pointerEvents: "none",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  priceDetails: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 68,
    gap: 12,
  },
  priceGroup: {
    alignItems: "center",
    width: "100%",
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  priceAmount: {
    fontFamily: FONTS.medium,
    fontSize: PRICE_AMOUNT_FONT_SIZE,
    lineHeight: 24,
    textAlign: "center",
    flexShrink: 0,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
  },
  priceSuffix: {
    fontFamily: FONTS.regular,
    fontSize: PRICE_SUFFIX_FONT_SIZE,
    lineHeight: 16,
    textAlign: "center",
    flexShrink: 0,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
  },
  billingNote: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    width: "100%",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  trialLine: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    width: "100%",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
  },
  trialBold: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  trialRegular: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});
