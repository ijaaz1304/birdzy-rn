import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, TouchableOpacity, ImageSourcePropType } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Images } from "../../assets";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Space } from "../../design";
import AppText from "./AppText";
import { CARD_COLORS, UI_COLORS } from "../../constants/colorConstants";
import { CardImageCarousel } from "../../molecules/CardImageCarousel";

import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

type Props = {
  image?: ImageSourcePropType;
  /** When provided and length > 1, shows auto-sliding carousel; otherwise first image or image fallback */
  imageUrls?: string[] | unknown[] | null;
  title: string;
  subtitle?: string;
  starred?: boolean;
  remindersCount?: number;
  onPress?: () => void;
  onStarPress?: () => void;
  style?: object;
  /** List grids: first image only, no auto-slide (faster catalogue scrolling). */
  enableImageCarousel?: boolean;
};

const AppCard: React.FC<Props> = React.memo(
  ({
    image,
    imageUrls,
    title,
    subtitle,
    starred = false,
    remindersCount,
    onPress,
    onStarPress,
    style,
    enableImageCarousel = true,
  }) => {
    const theme = useTheme();
    const colors = theme.colors;
    const isDark = useIsDark();
    const carouselUrls =
      enableImageCarousel || !Array.isArray(imageUrls)
        ? imageUrls
        : imageUrls.length > 0
        ? [imageUrls[0]]
        : imageUrls;
    const hasImageUrls = Array.isArray(carouselUrls) && carouselUrls.length > 0;
    const fallbackSource: { uri: string } | number | undefined =
      typeof image === "number"
        ? image
        : image != null &&
            typeof image === "object" &&
            "uri" in image &&
            typeof image.uri === "string"
          ? { uri: image.uri }
          : undefined;
    const cardStyle = isDark
      ? {
          borderWidth: 1,
          borderColor: CARD_COLORS.DARK.border,
          backgroundColor: CARD_COLORS.DARK.background,
        }
      : {
          borderWidth: 1,
          borderColor: CARD_COLORS.LIGHT.border,
          backgroundColor: CARD_COLORS.LIGHT.background,
        };

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.card, cardStyle, style]}
      >
        {/* Image section – single or carousel via CardImageCarousel */}
        <View style={styles.imageContainer}>
          <CardImageCarousel
            imageUrls={hasImageUrls ? carouselUrls : undefined}
            fallbackImage={hasImageUrls ? undefined : fallbackSource}
            style={styles.carouselFill}
            borderRadius={CARD_RADIUS}
            autoSlideIntervalMs={enableImageCarousel ? undefined : 0}
          />

          {/* Reminders Badge - Bottom Left */}
          {remindersCount !== undefined && remindersCount > 0 && (
            <View
              style={[
                styles.remindersBadge,
                { backgroundColor: colors.success || UI_COLORS.SUCCESS_GREEN },
              ]}
            >
              <MaterialIcons
                name="schedule"
                size={12}
                color={UI_COLORS.WHITE}
              />
              <AppText
                variant="body14"
                color={UI_COLORS.WHITE}
                style={styles.remindersText}
              >
                {remindersCount} reminder{remindersCount !== 1 ? "s" : ""}
              </AppText>
            </View>
          )}

          {onStarPress != null && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onStarPress();
              }}
              style={[
                styles.starButton,
                { backgroundColor: colors.surfacePrimary },
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={
                starred ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              <AppImage
                key={starred ? "star-filled" : "star-empty"}
                source={
                  starred
                    ? Images.mushroomWishlistStarFilled
                    : Images.mushroomWishlistStar
                }
                style={styles.starIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Text section */}
        <View style={styles.textContainer}>
          <AppText
            variant="body16"
            color={colors.textPrimary}
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {title}
          </AppText>
          {subtitle && (
            <AppText
              variant="body14"
              color={colors.textSecondary}
              style={styles.subtitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {subtitle}
            </AppText>
          )}
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    const imageEqual =
      prevProps.image === nextProps.image ||
      (prevProps.image != null &&
        nextProps.image != null &&
        typeof prevProps.image === "object" &&
        typeof nextProps.image === "object" &&
        "uri" in prevProps.image &&
        "uri" in nextProps.image &&
        prevProps.image.uri === nextProps.image.uri);
    const imageUrlsEqual =
      prevProps.imageUrls === nextProps.imageUrls ||
      (Array.isArray(prevProps.imageUrls) &&
        Array.isArray(nextProps.imageUrls) &&
        prevProps.imageUrls.length === nextProps.imageUrls.length &&
        prevProps.imageUrls.every(
          (u, i) => (nextProps.imageUrls as any)?.[i] === u
        ));

    return (
      prevProps.title === nextProps.title &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.starred === nextProps.starred &&
      prevProps.remindersCount === nextProps.remindersCount &&
      imageEqual &&
      imageUrlsEqual &&
      prevProps.onPress === nextProps.onPress &&
      prevProps.onStarPress === nextProps.onStarPress &&
      prevProps.style === nextProps.style &&
      prevProps.enableImageCarousel === nextProps.enableImageCarousel
    );
  }
);

AppCard.displayName = "AppCard";

export default AppCard;

const CARD_RADIUS = 12;

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
    borderWidth: 0,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  carouselFill: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  starButton: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 50,
    padding: 4,
    elevation: 2,
    zIndex: 2,
  },
  starIcon: {
    width: 20,
    height: 20,
  },
  remindersBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    gap: 4,
  },
  remindersText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    lineHeight: 14,
  },
  textContainer: {
    padding: Space.md,
    alignItems: "flex-start",
    minHeight: 60, // Ensure enough space for text
    flexShrink: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 2,
    fontStyle: "normal",
  },
});
