import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { BlurView } from "@react-native-community/blur";
import { FONTS } from "../../../common/typography";
import {
  POST_AUTH_LAYOUT,
  POST_AUTH_ONBOARDING_COLORS_LIGHT,
  POST_AUTH_PACK_BORDER_GRADIENT,
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

/** Unselected pack — Figma glass card */
const UNSELECTED_PACK_SHADOW = "rgba(114, 84, 129, 0.16)";
const UNSELECTED_PACK_BLUR = 8;

/** Shared row layout for subscription paywall + post-auth onboarding plan cards. */
export const HORIZONTAL_PLAN_ROW_STYLE = {
  flexDirection: "row" as const,
  gap: POST_AUTH_LAYOUT.planGap,
  width: "100%" as const,
  alignItems: "stretch" as const,
  overflow: "visible" as const,
  paddingTop: 8,
  marginBottom: 4,
};

const CARD_RADIUS = 16;
const CARD_INNER_RADIUS =
  CARD_RADIUS - POST_AUTH_PACK_BORDER_GRADIENT.borderWidth;

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
        styles.cardOuter,
        {
          opacity: pressed ? 0.85 : 1,
          zIndex: showPopular ? 3 : 1,
          shadowColor: selected
            ? "rgba(203, 75, 0, 0.08)"
            : UNSELECTED_PACK_SHADOW,
        },
      ]}
    >
      {showPopular ? (
        <View style={styles.popularBadgeWrap}>
          <PostAuthPopularBadge colors={colors} />
        </View>
      ) : null}
      <LinearGradient
        colors={[...POST_AUTH_PACK_BORDER_GRADIENT.colors]}
        locations={[...POST_AUTH_PACK_BORDER_GRADIENT.locations]}
        useAngle
        angle={POST_AUTH_PACK_BORDER_GRADIENT.angle}
        style={styles.gradientBorder}
      >
        <View
          style={[
            styles.cardInner,
            {
              backgroundColor: POST_AUTH_PACK_BORDER_GRADIENT.innerBackground,
            },
          ]}
        >
          {selected ? (
            <View
              pointerEvents="none"
              style={[
                styles.selectedOverlay,
                {
                  backgroundColor: colors.planCardBackgroundSelected,
                },
              ]}
            />
          ) : (
            <View style={styles.blurClip} pointerEvents="none">
              {Platform.OS === "ios" ? (
                <BlurView
                  style={StyleSheet.absoluteFillObject}
                  blurType="light"
                  blurAmount={UNSELECTED_PACK_BLUR}
                  reducedTransparencyFallbackColor={colors.planCardBackground}
                />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: colors.planCardBackground },
                ]}
              />
            </View>
          )}
          <Text
            style={[styles.title, styles.cardForeground, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>

          <View style={[styles.priceDetails, styles.cardForeground]}>
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
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: CARD_RADIUS,
    minWidth: 0,
    overflow: "visible",
    position: "relative",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  gradientBorder: {
    flexGrow: 1,
    alignSelf: "stretch",
    width: "100%",
    borderRadius: CARD_RADIUS,
    padding: POST_AUTH_PACK_BORDER_GRADIENT.borderWidth,
    overflow: "hidden",
  },
  cardInner: {
    alignSelf: "stretch",
    borderRadius: CARD_INNER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    minHeight: 104,
    overflow: "hidden",
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_INNER_RADIUS,
  },
  cardForeground: {
    zIndex: 1,
  },
  blurClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_INNER_RADIUS,
    overflow: "hidden",
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
