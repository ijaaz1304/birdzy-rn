import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { FONTS } from "../../../common/typography";
import { DEFAULT_SUBSCRIPTION_BENEFITS } from "../../../data/subscription/subscriptionStatus";
import type { PostAuthOnboardingColors } from "../../post-auth-onboarding/constants";

type Props = {
  colors: PostAuthOnboardingColors;
  benefits?: string[];
};

const BENEFIT_CHECK_BG = "#32BE45";

const CARD_BORDER = "rgba(255, 255, 255, 0.20)";
const CARD_BACKGROUND = "rgba(255, 255, 255, 0.15)";
const CARD_SHADOW = "rgba(203, 75, 0, 0.30)";

export const SubscriptionBenefitsCard: React.FC<Props> = ({
  colors,
  benefits = DEFAULT_SUBSCRIPTION_BENEFITS,
}) => (
  <View style={styles.wrapper}>
    {Platform.OS === "ios" ? (
      <BlurView
        style={StyleSheet.absoluteFillObject}
        blurType="light"
        blurAmount={8}
        reducedTransparencyFallbackColor={CARD_BACKGROUND}
      />
    ) : null}
    <View style={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Your Benefits:
      </Text>
      {benefits.map((benefit) => (
        <View key={benefit} style={styles.row}>
          <View style={styles.checkCircle}>
            <MaterialIcons name="check" size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.benefitText, { color: colors.textPrimary }]}>
            {benefit}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    overflow: "hidden",
    backgroundColor: CARD_BACKGROUND,
    shadowColor: CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 6,
  },
  content: {
    padding: 12,
    gap: 16,
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BENEFIT_CHECK_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
