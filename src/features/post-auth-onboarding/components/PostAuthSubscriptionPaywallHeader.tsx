import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../common/typography";
import {
  POST_AUTH_LAYOUT,
  type PostAuthOnboardingColors,
} from "../constants";

type Props = {
  colors: PostAuthOnboardingColors;
};

export const PostAuthSubscriptionPaywallHeader: React.FC<Props> = ({
  colors,
}) => (
  <View style={styles.wrap}>
    <Text allowFontScaling={false} style={[styles.title, { color: colors.textPrimary }]}>
      Especially for you!
    </Text>
    <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textPrimary }]}>
      Unlock unlimited scans, explore detailed insights and featured birds of
      the day.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: POST_AUTH_LAYOUT.contentWidth,
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    width: "100%",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    width: "100%",
  },
});
