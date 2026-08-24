/**
 * Discount timer pill: shows "Xh Ym left" or "Discount in Xh Ym".
 * Tap navigates to subscription screen. Hide when subscribed.
 */

import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";
import { useDiscountOfferCountdown } from "../subscription/utils/discountOffer";
import { FONTS } from "../../common/typography";

import {
  useSubscriptionStore,
  selectIsPremium,
} from "../subscription/subscription.store";

export interface DiscountTimerPillProps {
  onPress: () => void;
}

export const DiscountTimerPill: React.FC<DiscountTimerPillProps> = ({
  onPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const isPremium = useSubscriptionStore(selectIsPremium);
  const discountOffer = useDiscountOfferCountdown();

  if (isPremium || !discountOffer.label) return null;

  const isActive = discountOffer.isActive;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        {
          backgroundColor: isActive
            ? colors.primary + "20"
            : colors.surfaceVariant,
          borderColor: isActive ? colors.primary : colors.border,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          borderRadius: radius.full,
        },
      ]}
    >
      <MaterialIcons
        name="schedule"
        size={16}
        color={isActive ? colors.primary : colors.textSecondary}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.primary : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {discountOffer.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
});
