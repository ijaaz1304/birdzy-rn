import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../common/typography";
import {
  getSubscriptionTrialDisclosureText,
  type SubscriptionDisclosurePlan,
} from "../utils/planDisplay";
import type { PostAuthOnboardingColors } from "../constants";

type Props = {
  plan?: SubscriptionDisclosurePlan | null;
  colors?: PostAuthOnboardingColors;
};

export const PostAuthSubscriptionDisclosure: React.FC<Props> = ({
  plan,
  colors,
}) => {
  const disclosure = getSubscriptionTrialDisclosureText({
    duration: plan?.duration ?? "year",
    priceDisplay: plan?.priceDisplay,
    trialDays: plan?.trialDays,
    platform: Platform.OS,
  });

  if (!disclosure) return null;

  const textColor =
    colors?.textPrimary === "#FFFFFF" ? colors.textPrimary : "#5D5D5D";

  return (
    <View style={styles.wrap}>
      <Text allowFontScaling={false} style={[styles.text, { color: textColor }]}>{disclosure}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 12,
    marginTop: 4,
  },
  text: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 4,
  },
});
