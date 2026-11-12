import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ImageSourcePropType,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import AppText from "./AppText";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { ACCENT_COLORS, HOME_COLORS } from "../../constants/colorConstants";
import { typography } from "../../design-system/typography";
import { Images } from "../../assets";

import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

type Props = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  variant?: "vertical" | "horizontal";
  width?: number;
};

const CARD_HEIGHT = 220;
const ICON_SIZE = 56;
const HORIZONTAL_CARD_WIDTH = 250;
const HORIZONTAL_ICON_SIZE = 72;

const AppOtherAppCard: React.FC<Props> = ({
  title,
  subtitle,
  image,
  onPress,
  variant = "vertical",
  width,
}) => {
  const theme = useTheme();
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
    return (
      <View
        style={[
          styles.horizontalCard,
          {
            backgroundColor: cardBg,
            borderColor,
            width: width ?? HORIZONTAL_CARD_WIDTH,
            shadowColor: ACCENT_COLORS.SHADOW,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity,
            shadowRadius: 8,
            elevation: 3,
          },
        ]}
      >
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
        <View style={styles.horizontalTextBlock}>
          <AppText
            variant="title18"
            color={colors.textPrimary}
            style={styles.horizontalTitle}
          >
            {title}
          </AppText>
          <AppText variant="body14" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        </View>
        <TouchableOpacity
          style={[
            styles.horizontalButton,
            { borderColor, backgroundColor: getButtonBg },
          ]}
          onPress={onPress}
          activeOpacity={0.8}
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
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor,
          minHeight: CARD_HEIGHT,
          shadowColor: ACCENT_COLORS.SHADOW,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <View style={styles.topContent}>
        <View style={[styles.imageWrap, { backgroundColor: iconWrapBg }]}>
          <AppImage
            source={effectiveImage}
            style={[styles.image, { width: ICON_SIZE, height: ICON_SIZE }]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>
        <AppText
          variant="button14"
          color={colors.textPrimary}
          style={styles.title}
        >
          {title}
        </AppText>
        <AppText
          variant="caption12"
          color={colors.textSecondary}
          style={styles.subtitle}
        >
          {subtitle}
        </AppText>
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
      >
        <Text
          style={[
            styles.buttonText,
            typography.button.medium,
            { fontStyle: "normal" as const },
            { color: getAppButtonTextColor },
          ]}
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
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: spacing[4],
    width: "100%",
    alignItems: "flex-start",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  topContent: {
    alignItems: "flex-start",
    flex: 1,
  },
  imageWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: 10,
  },
  image: {
    borderRadius: Radius.md,
  },
  title: {
    textAlign: "left",
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "left",
    marginBottom: 12,
  },
  button: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  buttonText: {
    fontFamily: FONTS.medium,
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
