import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FONTS } from "../../../common/typography";
import {
  POST_AUTH_LAYOUT,
  POST_AUTH_ONBOARDING_COLORS_LIGHT,
  type PostAuthOnboardingColors,
} from "../constants";
import type { PostAuthLayoutMetrics } from "../utils/postAuthLayout";
import { PostAuthPopularBadge } from "./PostAuthPopularBadge";

type Props = {
  title: string;
  price: string;
  originalPrice?: string | null;
  discountLabel?: string;
  trialLabel?: string;
  showPopular?: boolean;
  selected: boolean;
  onPress: () => void;
  colors?: PostAuthOnboardingColors;
  layout?: Pick<
    PostAuthLayoutMetrics,
    | "planGap"
    | "planCardYearlyMinHeight"
    | "planCardPaddingVertical"
    | "priceFontSize"
  >;
  isLast?: boolean;
};

export const PostAuthDiscountPlanCard: React.FC<Props> = ({
  title,
  price,
  originalPrice,
  discountLabel = "70% Off",
  trialLabel,
  showPopular = false,
  selected,
  onPress,
  colors = POST_AUTH_ONBOARDING_COLORS_LIGHT,
  layout,
  isLast = false,
}) => {
  const planGap = layout?.planGap ?? POST_AUTH_LAYOUT.planGap;
  const minHeight = layout?.planCardYearlyMinHeight ?? 80;
  const paddingVertical = layout?.planCardPaddingVertical ?? 16;
  const priceFontSize = layout?.priceFontSize ?? 18;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        { minHeight, paddingVertical },
        !isLast && { marginBottom: planGap },
        selected
          ? {
              borderWidth: 2,
              borderColor: colors.planBorderSelected,
            }
          : {
              borderWidth: 1,
              borderColor: colors.planBorderUnselected,
            },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            {showPopular ? <PostAuthPopularBadge colors={colors} /> : null}
          </View>
          {trialLabel ? (
            <Text style={[styles.trialLabel, { color: colors.textDisabled }]}>
              {trialLabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.priceCol}>
          <Text style={[styles.discountLabel, { color: colors.discountRed }]}>
            {discountLabel}
          </Text>
          <View style={styles.priceRow}>
            {originalPrice ? (
              <Text
                style={[styles.originalPrice, { color: colors.textDisabled }]}
              >
                {originalPrice}
              </Text>
            ) : null}
            <Text
              style={[
                styles.price,
                { color: colors.textPrimary, fontSize: priceFontSize },
              ]}
            >
              {price}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  title: {
    flexShrink: 1,
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  trialLabel: {
    marginTop: 2,
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  priceCol: {
    flexShrink: 1,
    alignItems: "flex-end",
    minWidth: 112,
    maxWidth: 132,
  },
  discountLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
    textDecorationLine: "line-through",
  },
  price: {
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
});
