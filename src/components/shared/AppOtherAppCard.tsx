import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ImageSourcePropType,
  TouchableOpacity,
  Text,
  Platform,
  useWindowDimensions,
} from "react-native";
import AppText from "./AppText";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { ACCENT_COLORS, HOME_COLORS } from "../../constants/colorConstants";
import { typography } from "../../design-system/typography";
import { Images } from "../../assets";

import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

type Props = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  variant?: "vertical" | "horizontal";
  width?: number;
  /**
   * Grid card in a single-column list (narrow screen / large text): no 196pt minimum, so the
   * card fits its content instead of leaving empty space above it.
   */
  singleColumn?: boolean;
};

/** Figma grid card: 196pt tall at default text (minimum — grows with larger text) */
const CARD_MIN_HEIGHT = 196;
const ICON_SIZE = 40;
const HORIZONTAL_CARD_WIDTH = 250;
const HORIZONTAL_ICON_SIZE = 72;
/** Above this font scale the horizontal card stacks (icon + Get on top, text full width below). */
const HORIZONTAL_STACK_FONT_SCALE = 1.3;
/** Home side margins (20 + 20) plus a peek of the next card. */
const HORIZONTAL_SCREEN_RESERVE = 64;

const AppOtherAppCard: React.FC<Props> = ({
  title,
  subtitle,
  image,
  onPress,
  variant = "vertical",
  width,
  singleColumn = false,
}) => {
  const theme = useTheme();
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const colors = theme.colors;
  const isDark = useIsDark();
  const [imageError, setImageError] = useState(false);
  const effectiveImage =
    Platform.OS === "ios" && imageError ? Images.mineralSample : image;

  const otherCard = HOME_COLORS.OTHER_APP_CARD;
  const cardBg = isDark ? otherCard.BG_DARK : otherCard.BG_LIGHT;
  const borderColor = isDark ? colors.border : otherCard.BORDER_LIGHT;
  const iconWrapBg = isDark ? colors.surfaceVariant : otherCard.ICON_WRAP_LIGHT;
  const getButtonBg = isDark ? otherCard.BG_DARK : "#FFFFFF";
  const getButtonTextColor = isDark
    ? otherCard.GET_TEXT_DARK
    : colors.textPrimary;
  const getAppButtonBg = colors.primaryCTA;
  const getAppButtonTextColor = otherCard.GET_APP_CTA_TEXT;
  const getAppButtonRadius = isDark ? otherCard.GET_APP_CTA_RADIUS : 20;
  const shadowOpacity = isDark ? 0.2 : 0.08;

  if (variant === "horizontal") {
    // Large text: give the copy the card's full width (Figma row layout leaves ~80pt at 2× text,
    // which breaks words letter by letter) and let the card widen with the font, within the screen.
    const stacked = fontScale > HORIZONTAL_STACK_FONT_SCALE;
    const baseWidth = width ?? HORIZONTAL_CARD_WIDTH;
    const cardWidth = stacked
      ? Math.min(
          Math.round(baseWidth * fontScale),
          Math.max(baseWidth, windowWidth - HORIZONTAL_SCREEN_RESERVE)
        )
      : baseWidth;
    const icon = (
      <View
        style={[styles.horizontalIconWrap, { backgroundColor: iconWrapBg }]}
      >
        <AppImage
          source={effectiveImage}
          style={styles.horizontalIcon}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
      </View>
    );
    const copy = (
      <View
        style={
          stacked
            ? styles.horizontalTextBlockStacked
            : styles.horizontalTextBlock
        }
      >
        <AppText
          variant="title18"
          color={colors.textPrimary}
          numberOfLines={3}
          android_hyphenationFrequency="full"
          style={styles.horizontalTitle}
        >
          {title}
        </AppText>
        <AppText
          variant="body14"
          color={colors.textSecondary}
          numberOfLines={4}
          android_hyphenationFrequency="full"
        >
          {subtitle}
        </AppText>
      </View>
    );
    const getButton = (
      <TouchableOpacity
        style={[
          styles.horizontalButton,
          { borderColor, backgroundColor: getButtonBg },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.horizontalButtonText,
            typography.button.medium,
            { color: getButtonTextColor },
          ]}
        >
          Get
        </Text>
      </TouchableOpacity>
    );
    return (
      <View
        style={[
          stacked ? styles.horizontalCardStacked : styles.horizontalCard,
          {
            backgroundColor: cardBg,
            borderColor,
            width: cardWidth,
            shadowColor: ACCENT_COLORS.SHADOW,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity,
            shadowRadius: 8,
            elevation: 3,
          },
        ]}
      >
        {stacked ? (
          <>
            <View style={styles.horizontalStackedTop}>
              {icon}
              {getButton}
            </View>
            {copy}
          </>
        ) : (
          <>
            {icon}
            {copy}
            {getButton}
          </>
        )}
      </View>
    );
  }

  /**
   * Grid card — Figma 8015:142150 ("Our Other Apps"): 12pt padding and gaps, 40pt icon, title
   * Body/16 Bold (max 3 lines), description Caption/12 (max 4 lines), "Get app" pill (label may wrap
   * to 2 lines). Minimum 196pt tall; grows with large text instead of clipping.
   */
  return (
    <View
      style={[
        styles.card,
        singleColumn && styles.cardSingleColumn,
        isDark
          ? {
              backgroundColor: cardBg,
              borderColor,
              shadowColor: ACCENT_COLORS.SHADOW,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity,
              shadowRadius: 8,
              elevation: 3,
            }
          : {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.border0,
            },
      ]}
    >
      <AppImage
        source={effectiveImage}
        style={styles.image}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
      <View style={styles.copy}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={3}
          android_hyphenationFrequency="full"
        >
          {title}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={4}
        >
          {subtitle}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: getAppButtonBg,
            borderRadius: getAppButtonRadius,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text
          style={[styles.buttonText, { color: getAppButtonTextColor }]}
          numberOfLines={2}
        >
          Get app
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AppOtherAppCard;

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    gap: 12,
    width: "100%",
    minHeight: CARD_MIN_HEIGHT,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  cardSingleColumn: {
    minHeight: undefined,
    flexGrow: 0,
  },
  image: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 8,
  },
  copy: {
    alignSelf: "stretch",
    gap: 4,
  },
  /** Body/16px/SemiBold (Satoshi Bold 16/24) */
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  /** Caption/12px/Regular at 60% opacity */
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.6,
  },
  button: {
    minHeight: 28,
    paddingVertical: 4,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  /** Button/14px (Satoshi Medium 14/20) */
  buttonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  horizontalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    overflow: "hidden",
  },
  horizontalCardStacked: {
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    overflow: "hidden",
  },
  horizontalStackedTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  horizontalTextBlockStacked: {
    gap: 4,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  horizontalIconWrap: {
    width: HORIZONTAL_ICON_SIZE,
    height: HORIZONTAL_ICON_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalIcon: {
    width: HORIZONTAL_ICON_SIZE,
    height: HORIZONTAL_ICON_SIZE,
  },
  horizontalTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  horizontalTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
  horizontalButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
