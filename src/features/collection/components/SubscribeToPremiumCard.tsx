/**
 * Premium gate card on mushroom details (catalogue / locked sections).
 * Light: bundled subs_to_premium artwork (title + body + Get Premium).
 * Dark: themed subscription_premium card with the same copy — not the generic popup bg.
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { SUBSCRIPTION_COLORS } from "../../../constants/colorConstants";
import { Radius } from "../../../design";
import { darkColors } from "../../../theme/colors/dark";

const LIGHT_ASPECT = 836 / 1308;
const CARD_WIDTH = 280;

type Props = {
  isDark: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SubscribeToPremiumCard({ isDark, onPress, style }: Props) {
  if (isDark) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.darkCard, style]}
        accessibilityRole="button"
        accessibilityLabel="Subscribe to Premium"
      >
        <Text style={styles.darkTitle}>Subscribe to Premium</Text>
        <Text style={styles.darkBody}>
          Subscribe to our premium plan to view more details about your
          mushroom.
        </Text>
        <View style={styles.darkCta}>
          <Text style={styles.darkCtaText}>Get Premium</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.touchable, style]}
      accessibilityRole="button"
      accessibilityLabel="Subscribe to Premium"
    >
      <AppImage
        source={Images.mushroomSubsToPremium}
        style={styles.lightImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignItems: "center",
    justifyContent: "center",
  },
  lightImage: {
    width: CARD_WIDTH,
    height: Math.round(CARD_WIDTH * LIGHT_ASPECT),
  },
  darkCard: {
    width: CARD_WIDTH,
    backgroundColor: darkColors.surface.tertiary,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: darkColors.border.primary,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
  darkTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 22,
    color: darkColors.text.primary,
    textAlign: "center",
  },
  darkBody: {
    marginTop: 8,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: darkColors.text.secondary,
    textAlign: "center",
  },
  darkCta: {
    marginTop: 14,
    backgroundColor: SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK,
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 10,
    minWidth: 140,
    alignItems: "center",
  },
  darkCtaText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 18,
    color: SUBSCRIPTION_COLORS.CTA_TEXT_DARK,
  },
});
