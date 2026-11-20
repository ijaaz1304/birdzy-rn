/** Figma 9375:212476 — full-price Home offer between discount windows. */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppImageBackground } from "../../../components/AppImage";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useSubscriptionPlansWithPrices } from "../../subscription/hooks/useSubscriptionPlansWithPrices";
import { getPlanCardPriceView } from "../../post-auth-onboarding/utils/planDisplay";
import { APP_COLORS } from "../../../../theme/colors";

type Props = { onSubscribe: () => void };

export function HomeFullPriceBanner({ onSubscribe }: Props) {
  const { plans } = useSubscriptionPlansWithPrices({
    offerActiveOverride: false,
  });
  const annual = plans.find((plan) => plan.duration.toLowerCase() === "year");
  const price = getPlanCardPriceView(annual?.priceDisplay, "year");

  return (
    <TouchableOpacity
      onPress={onSubscribe}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel="Upgrade to Pro. Subscribe now"
    >
      <AppImageBackground
        source={Images.homeDiscountBannerDark}
        style={styles.banner}
        resizeMode="stretch"
      >
        <View style={styles.copy}>
          <View style={styles.details}>
            <Text allowFontScaling={false} style={styles.title}>
              Upgrade to Pro
            </Text>
            <Text allowFontScaling={false} style={styles.description}>
              Unlimited access to all features.
            </Text>
            {price.hasStorePrice && (
              <View style={styles.priceRow}>
                <Text allowFontScaling={false} style={styles.amount}>
                  {price.amount}
                  <Text style={styles.period}>{price.suffix}</Text>
                </Text>
                {price.billingNote && (
                  <Text allowFontScaling={false} style={styles.monthly}>
                    ({price.billingNote})
                  </Text>
                )}
              </View>
            )}
          </View>
          <View style={styles.cta}>
            <Text allowFontScaling={false} style={styles.ctaText}>
              Subscribe now
            </Text>
          </View>
        </View>
      </AppImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    aspectRatio: 335 / 160,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
  },
  copy: {
    width: 231,
    maxWidth: "72%",
    paddingLeft: 20,
    paddingRight: 12,
    gap: 12,
  },
  details: { gap: 4 },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
    color: APP_COLORS.homeTextDark,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: APP_COLORS.homeTextDark,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  amount: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: APP_COLORS.homeTextDark,
  },
  period: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 16 },
  monthly: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 16,
    color: APP_COLORS.homeSecondaryTextDark,
  },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: APP_COLORS.ctaPrimaryDark,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ctaText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: APP_COLORS.homeSurfaceDark,
  },
});
