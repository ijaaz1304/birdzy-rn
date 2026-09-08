import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { DEFAULT_SUBSCRIPTION_BENEFITS } from "../../../data/subscription/subscriptionStatus";
import type { PostAuthOnboardingColors } from "../../post-auth-onboarding/constants";

type Props = {
  colors: PostAuthOnboardingColors;
  benefits?: string[];
};

const BENEFIT_CHECK_BG = APP_COLORS.splashBackground;

export const SubscriptionBenefitsCard: React.FC<Props> = ({
  colors,
  benefits = DEFAULT_SUBSCRIPTION_BENEFITS,
}) => (
  <View style={styles.wrapper}>
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
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 12,
    gap: 8,
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
    gap: 16,
    minHeight: 32,
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
