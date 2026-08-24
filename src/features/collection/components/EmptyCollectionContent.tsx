/**
 * Empty collection state — Figma: Collection / Mushrooms detail / Empty
 * Used for Private Collection, Identified, Wishlist, and custom collections.
 */

import { AppImage } from "@/components/AppImage";
import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text as RNText, Dimensions } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Images } from "../../../assets";
import { APP_COLORS } from "../../../config/colors";
import { FONTS } from "../../../common/typography";

import { spacing } from "../../../design-system/spacing";

/** Figma: Collection / Mushrooms detail / Empty — illustration (scaled down for mobile). */
const EMPTY_IMAGE_WIDTH = 220;
const EMPTY_IMAGE_HEIGHT = 197;

export interface EmptyCollectionContentProps {
  /** Optional — Figma collection empty state uses subtitle + CTA only. */
  title?: string;
  subtitle?: string;
  ctaLabel: string;
  onCtaPress: () => void;
}

export const EmptyCollectionContent: React.FC<EmptyCollectionContentProps> = ({
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const ctaTextColor = APP_COLORS.modalTextOnPrimary;

  const imageSize = useMemo(() => {
    const availableWidth = Dimensions.get("window").width - spacing[6] * 2;
    const width = Math.min(availableWidth, EMPTY_IMAGE_WIDTH);
    const height = Math.round(width * (EMPTY_IMAGE_HEIGHT / EMPTY_IMAGE_WIDTH));
    return { width, height };
  }, []);

  /** Empty collection inside a collection — no_mushroom.webp */
  const emptyImage = Images.emptyCatalogue;

  return (
    <View style={styles.container}>
      <AppImage
        source={emptyImage}
        style={[styles.image, imageSize]}
        resizeMode="contain"
      />
      {title ? (
        <Text
          variant="title"
          size="medium"
          weight="bold"
          color="textPrimary"
          style={styles.title}
        >
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          variant="body"
          size="large"
          color="textSecondary"
          style={styles.subtitle}
        >
          {subtitle}
        </Text>
      ) : null}
      <TouchableOpacity
        style={[
          styles.ctaButton,
          {
            backgroundColor: colors.surfaceBrand,
            width: imageSize.width,
          },
        ]}
        onPress={onCtaPress}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={22} color={ctaTextColor} />
        <RNText style={styles.ctaLabel}>{ctaLabel}</RNText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingTop: 32,
    paddingBottom: spacing[8],
  },
  image: {
    marginBottom: spacing[3],
  },
  title: {
    textAlign: "center",
    alignSelf: "stretch",
    marginBottom: spacing[2],
  },
  subtitle: {
    textAlign: "center",
    alignSelf: "stretch",
    marginBottom: spacing[6],
    maxWidth: 340,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: spacing[2],
    minHeight: 52,
    paddingHorizontal: spacing[6],
    paddingVertical: 14,
    borderRadius: 26,
  },
  ctaLabel: {
    color: APP_COLORS.modalTextOnPrimary,
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
});
