/**
 * PayCard Component - MASTER SPEC - EXACT IMPLEMENTATION
 * Subscription plan card with EXACT styling specifications
 * NO gradients, NO blue background fill, theme colors only
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

import { APP_COLORS } from "../../config/colors";

import {
  SCREEN_COLORS,
  SUBSCRIPTION_COLORS,
  UI_COLORS,
} from "../../constants/colorConstants";

export type PlanCardProps = {
  title: string;
  price: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
  selected?: boolean;
};

export const PlanCard: React.FC<PlanCardProps> = ({
  title,
  price,
  subtitle,
  badge,
  onPress,
  selected = false,
}) => {
  const _theme = useTheme();
  const isDark = useIsDark();

  // MASTER SPEC: Exact colors
  const cardBg = isDark
    ? SUBSCRIPTION_COLORS.CARD_BG_DARK // #111111
    : SUBSCRIPTION_COLORS.CARD_BG_LIGHT; // #FFFFFF

  const cardBorder = selected
    ? SUBSCRIPTION_COLORS.CARD_SELECTED_BORDER
    : isDark
    ? SUBSCRIPTION_COLORS.CARD_UNSELECTED_BORDER_DARK // #333333
    : SUBSCRIPTION_COLORS.CARD_UNSELECTED_BORDER_LIGHT; // #E7E7E7

  const primaryText = isDark
    ? SCREEN_COLORS.DARK.text
    : SCREEN_COLORS.LIGHT.text;
  const secondaryText = isDark
    ? SCREEN_COLORS.DARK.textSecondary
    : SCREEN_COLORS.LIGHT.textSecondary;

  // MASTER SPEC: Shadow ONLY on selected, exact value: 2px 2px 16px rgba(14,84,148,0.30)
  const shadowStyle = selected
    ? {
        shadowColor: APP_COLORS.planCardShadowBlue, // Base color for shadow
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3, // This creates rgba(14,84,148,0.30)
        shadowRadius: 16,
        elevation: Platform.OS === "android" ? 4 : 0, // Controlled elevation for Android
      }
    : {
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderWidth: selected ? 2 : 1,
        },
        shadowStyle,
      ]}
    >
      {/* Left side: Title, Price, Subtitle */}
      <View style={styles.left}>
        <Text style={[styles.title, { color: primaryText }]}>{title}</Text>
        <Text style={[styles.price, { color: primaryText }]}>{price}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: secondaryText }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side: Badge (if exists) */}
      <View style={styles.right}>
        {badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: SUBSCRIPTION_COLORS.CARD_SELECTED_BORDER },
            ]}
          >
            <Text style={[styles.badgeText, { color: UI_COLORS.WHITE }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>

      {/* Selection indicator (checkmark) */}
      {selected && (
        <View style={styles.checkmark}>
          <View
            style={[
              styles.checkmarkCircle,
              { backgroundColor: SUBSCRIPTION_COLORS.CARD_SELECTED_BORDER },
            ]}
          >
            <Text style={styles.checkmarkIcon}>✓</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    // MASTER SPEC: padding 10px 16px EXACTLY
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
    // MASTER SPEC: borderRadius 12px EXACTLY
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // MASTER SPEC: gap 16px between left and right
    gap: spacing[4],
    marginBottom: 12,
  },
  left: {
    flex: 1,
    // No gap property here - let natural text spacing work
  },
  right: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    lineHeight: 20,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    lineHeight: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkIcon: {
    color: UI_COLORS.WHITE,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
