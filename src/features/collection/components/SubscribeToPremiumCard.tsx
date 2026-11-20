/**
 * Premium gate card on bird details (catalogue / locked sections).
 * Light: bundled subs_to_premium artwork (title + body + Get Premium).
 * Dark: Figma 9399:160040 native premium card.
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
import { APP_COLORS } from "../../../config/colors";
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
          Subscribe to our premium plan to view more details about this bird.
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
        source={Images.birdSubsToPremium}
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
    width: "100%",
    maxWidth: 327,
    backgroundColor: APP_COLORS.homeCardDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#01474F",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
  },
  darkTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 29,
    color: darkColors.text.primary,
    textAlign: "center",
  },
  darkBody: {
    marginTop: 8,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: darkColors.text.secondary,
    textAlign: "center",
  },
  darkCta: {
    marginTop: 24,
    backgroundColor: SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  darkCtaText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: SUBSCRIPTION_COLORS.CTA_TEXT_DARK,
  },
});
