import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../common/typography";
import {
  POST_AUTH_ONBOARDING_COLORS_LIGHT,
  type PostAuthOnboardingColors,
} from "../constants";

type Props = {
  colors?: PostAuthOnboardingColors;
};

export const PostAuthPopularBadge: React.FC<Props> = ({
  colors = POST_AUTH_ONBOARDING_COLORS_LIGHT,
}) => (
  <View style={[styles.badgeShell, { backgroundColor: colors.popularBadgeBg }]}>
    <Text style={[styles.label, { color: colors.popularBadgeText }]}>
      Popular
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badgeShell: {
    minWidth: 63,
    borderRadius: 16,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
  },
});
