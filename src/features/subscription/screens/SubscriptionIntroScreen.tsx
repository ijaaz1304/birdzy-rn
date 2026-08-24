/**
 * Subscription Intro Screen
 * Introduction screen with discount timer, gift box hero, and Free vs Premium comparison
 */

import { AppImage, AppImageBackground } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { Text, Button, NavBackIcon } from "../../../atoms";
import { SubscriptionStackParamList } from "../../../navigation/types";
import { FREE_VS_PREMIUM_COMPARISON } from "../../../data/subscription";
import { SUBSCRIPTION_TEXTS } from "../../../config";
import { Images } from "../../../assets";
import LinearGradient from "react-native-linear-gradient";
import {
  DISCOUNT_PILL_GRADIENT,
  SUBSCRIPTION_CTA_COLOR,
  COMPARISON_TABLE_COLORS,
} from "../../../constants/subscriptionColors";
import { SUBSCRIPTION_COLORS } from "../../../constants/colorConstants";
import { formatCountdownSegment } from "../../../utils";
import { useDiscountOfferCountdown } from "../utils/discountOffer";
import { getSubscriptionBackground } from "../../post-auth-onboarding/utils/background";
import { usePostAuthOnboardingIsDark } from "../../post-auth-onboarding/utils/theme";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

type SubscriptionIntroScreenNavigationProp = NativeStackNavigationProp<
  SubscriptionStackParamList,
  "SubscriptionIntro"
>;

const FEATURE_ICONS_LIGHT: Record<string, ImageSourcePropType> = {
  Identification: Images.subscriptionListIdentification,
  Collections: Images.subscriptionListCollection,
  Details: Images.subscriptionListDetails,
  Feed: Images.subscriptionListFeed,
  "Mushrooms of the day": Images.subscriptionListMushroomOfDay,
  "AI Chat": Images.subscriptionListAiChat,
};

const FEATURE_ICONS_DARK: Record<string, ImageSourcePropType> = {
  Identification: Images.subscriptionListIdentificationDark,
  Collections: Images.subscriptionListCollectionDark,
  Details: Images.subscriptionListDetailsDark,
  Feed: Images.subscriptionListFeedDark,
  "Mushrooms of the day": Images.subscriptionListMushroomOfDayDark,
  "AI Chat": Images.subscriptionListAiChatDark,
};

export const SubscriptionIntroScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const discountOffer = useDiscountOfferCountdown();
  const radius = theme.radius;
  const navigation = useNavigation<SubscriptionIntroScreenNavigationProp>();
  const isDark = usePostAuthOnboardingIsDark();

  const timerText = `${formatCountdownSegment(
    discountOffer.hours
  )}:${formatCountdownSegment(discountOffer.minutes)}:${formatCountdownSegment(
    discountOffer.seconds
  )}`;

  const backgroundImage = getSubscriptionBackground(isDark);

  return (
    <AppImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: "transparent" }]}
      >
        {/* Header: Back + Discount Timer Pill with clock icon */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <NavBackIcon color={colors.textPrimary} />
          </TouchableOpacity>

          {discountOffer.isActive && discountOffer.remainingMs > 0 && (
            <View style={styles.discountPillContainer}>
              <LinearGradient
                colors={[
                  DISCOUNT_PILL_GRADIENT.start,
                  DISCOUNT_PILL_GRADIENT.end,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.discountPill,
                  {
                    borderRadius: radius.full,
                    paddingVertical: spacing[2],
                    paddingHorizontal: spacing[4],
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
              >
                <MaterialIcons
                  name="schedule"
                  size={16}
                  color={colors.textInverse}
                  style={{ marginRight: 6 }}
                />
                <Text
                  variant="body"
                  size="small"
                  weight="semibold"
                  style={{ color: colors.textInverse }}
                >
                  {SUBSCRIPTION_TEXTS.intro.discountTimer.prefix} {timerText}
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { padding: spacing[4], paddingBottom: spacing[10] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero: Gift box + 70% off badge */}
          <View style={styles.heroSection}>
            <View style={styles.giftBoxWrap}>
              <AppImage
                source={Images.subscriptionDiscountBox}
                style={styles.giftBoxImage}
                resizeMode="contain"
              />
              <View
                style={[styles.badge70, { backgroundColor: colors.success }]}
              >
                <Text
                  variant="body"
                  size="small"
                  weight="bold"
                  style={{ color: colors.textInverse }}
                >
                  70% off
                </Text>
              </View>
            </View>
            <Text
              variant="headline"
              size="large"
              weight="bold"
              style={[
                styles.title,
                { color: colors.textPrimary, marginTop: spacing[4] },
              ]}
            >
              {SUBSCRIPTION_TEXTS.intro.title}
            </Text>
          </View>

          {/* Comparison Section: Free vs Premium with icons */}
          <View
            style={[
              styles.comparisonCard,
              {
                marginTop: spacing[6],
                backgroundColor: colors.cardBackground,
                borderRadius: radius.xl,
                padding: spacing[4],
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.comparisonTable}>
              {/* Header */}
              <View style={styles.comparisonRow}>
                <View style={[styles.comparisonCell, { flex: 1.4 }]}>
                  <Text
                    variant="body"
                    size="small"
                    weight="semibold"
                    color="textSecondary"
                  >
                    {SUBSCRIPTION_TEXTS.intro.comparison.headers.feature}
                  </Text>
                </View>
                <View
                  style={[
                    styles.comparisonCell,
                    styles.centerCell,
                    { flex: 1 },
                  ]}
                >
                  <Text
                    variant="body"
                    size="small"
                    weight="semibold"
                    color="textSecondary"
                  >
                    {SUBSCRIPTION_TEXTS.intro.comparison.headers.free}
                  </Text>
                </View>
                <View
                  style={[
                    styles.comparisonCell,
                    styles.centerCell,
                    styles.premiumHeaderCell,
                  ]}
                >
                  <Text
                    variant="body"
                    size="small"
                    weight="semibold"
                    color="textSecondary"
                  >
                    {SUBSCRIPTION_TEXTS.intro.comparison.headers.premium}
                  </Text>
                  <View
                    style={[
                      styles.premiumBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      variant="body"
                      size="small"
                      weight="semibold"
                      style={{ color: colors.textInverse }}
                    >
                      50% OFF
                    </Text>
                  </View>
                </View>
              </View>

              {/* Feature rows with icons */}
              {FREE_VS_PREMIUM_COMPARISON.map((item, index) => {
                const featureIcons = isDark
                  ? FEATURE_ICONS_DARK
                  : FEATURE_ICONS_LIGHT;
                const iconSource = featureIcons[item.feature];
                return (
                  <View
                    key={index}
                    style={[
                      styles.comparisonRow,
                      styles.comparisonRowBorder,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.comparisonCell,
                        styles.cellWithIcon,
                        { flex: 1.4 },
                      ]}
                    >
                      {iconSource ? (
                        <AppImage
                          source={iconSource}
                          style={styles.featureIcon}
                          resizeMode="contain"
                        />
                      ) : null}
                      <Text variant="body" size="small" style={{ flex: 1 }}>
                        {item.feature}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.comparisonCell,
                        styles.centerCell,
                        { flex: 1 },
                      ]}
                    >
                      <Text variant="body" size="small" color="textSecondary">
                        {item.free}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.comparisonCell,
                        styles.centerCell,
                        { flex: 1 },
                      ]}
                    >
                      <Text variant="body" size="small" color="textSecondary">
                        {item.premium}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer: single primary CTA + de-emphasized secondary action */}
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing[4],
              paddingTop: spacing[3],
              paddingBottom: spacing[4],
              borderTopColor: colors.border,
              backgroundColor: isDark
                ? colors.surfacePrimary + "E6"
                : "transparent",
            },
          ]}
        >
          <Button
            title={SUBSCRIPTION_TEXTS.intro.cta.primary}
            variant="primary"
            size="large"
            onPress={() =>
              navigation.navigate("SubscriptionMain", {
                discount50: discountOffer.isActive,
              })
            }
            fullWidth
            style={{ backgroundColor: SUBSCRIPTION_CTA_COLOR }}
          />
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginTop: spacing[3],
              alignSelf: "center",
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: isDark
                ? SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_DARK
                : SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_LIGHT,
            }}
          >
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={{ textDecorationLine: "underline" }}
            >
              {SUBSCRIPTION_TEXTS.intro.cta.later}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AppImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  footer: {
    borderTopWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  discountPillContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  discountPill: {
    minHeight: 32,
  },
  title: {
    textAlign: "center",
    lineHeight: 36,
  },
  heroSection: {
    alignItems: "center",
  },
  giftBoxWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  giftBoxImage: {
    width: 180,
    height: 160,
  },
  badge70: {
    position: "absolute",
    top: -4,
    right: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  comparisonCard: {
    marginBottom: 0,
  },
  comparisonTable: {
    width: "100%",
  },
  comparisonRow: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
  },
  comparisonRowBorder: {
    borderTopWidth: 1,
  },
  comparisonCell: {
    flex: 1,
    justifyContent: "center",
  },
  centerCell: {
    alignItems: "center",
  },
  premiumHeaderCell: {
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: COMPARISON_TABLE_COLORS.border,
  },
  premiumBadge: {
    position: "absolute",
    top: -8,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  cellWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
});
