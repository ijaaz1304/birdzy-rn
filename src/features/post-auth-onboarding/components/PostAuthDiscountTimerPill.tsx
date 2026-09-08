import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { formatCountdownSegment } from "../../../utils";
import { useDiscountOfferCountdown } from "../../subscription/utils/discountOffer";
import { POST_AUTH_DISCOUNT_TIMER_BG } from "../constants";

/** Countdown pill for post-auth subscription slide (screen 3). */
export const PostAuthDiscountTimerPill: React.FC = () => {
  const discountOffer = useDiscountOfferCountdown();

  if (discountOffer.remainingMs <= 0) {
    return null;
  }

  return (
    <View
      style={[styles.pill, { backgroundColor: POST_AUTH_DISCOUNT_TIMER_BG }]}
    >
      <View style={styles.content}>
        <AppImage
          source={Images.discountTimer}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.text}>
          {discountOffer.isActive ? "Discount ends in" : "Discount in"}{" "}
          {formatCountdownSegment(discountOffer.hours)}:
          {formatCountdownSegment(discountOffer.minutes)}:
          {formatCountdownSegment(discountOffer.seconds)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 0,
    marginBottom: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: APP_COLORS.modalTextOnPrimary,
  },
});
