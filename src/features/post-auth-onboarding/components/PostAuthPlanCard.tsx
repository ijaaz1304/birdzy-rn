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
  trialLabel?: string;
  showPopular?: boolean;
  selected: boolean;
  onPress: () => void;
  colors?: PostAuthOnboardingColors;
  layout?: Pick<
    PostAuthLayoutMetrics,
    | "planGap"
    | "planCardCompactMinHeight"
    | "planCardYearlyMinHeight"
    | "planCardPaddingVertical"
    | "priceFontSize"
  >;
  isLast?: boolean;
};

export const PostAuthPlanCard: React.FC<Props> = ({
  title,
  price,
  trialLabel,
  showPopular = false,
  selected,
  onPress,
  colors = POST_AUTH_ONBOARDING_COLORS_LIGHT,
  layout,
  isLast = false,
}) => {
  const isYearlyStyle = Boolean(trialLabel || showPopular);
  const planGap = layout?.planGap ?? POST_AUTH_LAYOUT.planGap;
  const compactMinHeight = layout?.planCardCompactMinHeight ?? 64;
  const yearlyMinHeight = layout?.planCardYearlyMinHeight ?? 80;
  const paddingVertical = layout?.planCardPaddingVertical ?? 16;
  const priceFontSize = layout?.priceFontSize ?? 18;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isYearlyStyle
          ? { minHeight: yearlyMinHeight, paddingVertical }
          : { minHeight: compactMinHeight, paddingVertical },
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
        <Text
          style={[
            styles.price,
            { color: colors.textPrimary, fontSize: priceFontSize },
          ]}
        >
          {price}
        </Text>
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
  price: {
    flexShrink: 1,
    fontFamily: FONTS.bold,
    lineHeight: 24,
    maxWidth: "100%",
    textAlign: "right",
  },
});
