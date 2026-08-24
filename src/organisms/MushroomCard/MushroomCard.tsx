/**
 * MushroomCard organism component
 * Reusable card component for displaying mushroom information
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity, ImageSourcePropType } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";
import { Card } from "../../molecules";
import { CardImageCarousel } from "../../molecules/CardImageCarousel";
import { Images } from "../../assets";
import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

import {
  getMushroomDisplayName,
  getMushroomDisplayScientific,
} from "../../utils/mushroomDisplayUtils";

export interface MushroomCardProps {
  id: string;
  name: string;
  scientificName?: string;
  canonicalName?: string | null;
  image?: ImageSourcePropType | string;
  /** When provided and length > 1, shows auto-sliding carousel; otherwise first image or image fallback */
  imageUrls?: string[] | unknown[] | null;
  description?: string;
  rarity?: "common" | "uncommon" | "rare" | "very rare";
  hardness?: string;
  color?: string;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
  /** When false, star/favorite icon is hidden (e.g. in search result list). Default true. */
  showFavorite?: boolean;
  /** Kept for call-site compatibility; stars use iconfix/home wishlist assets. */
  starIconSet?: "catalogue" | "default";
  variant?: "compact" | "detailed";
  /** When set (e.g. 1 for square), image container uses aspectRatio instead of fixed height. Matches catalogue card list. */
  imageAspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

export const MushroomCard: React.FC<MushroomCardProps> = ({
  id,
  name,
  scientificName,
  canonicalName,
  image,
  imageUrls,
  description,
  rarity,
  hardness,
  color,
  isFavorite = false,
  onPress,
  onFavoritePress,
  showFavorite = true,
  starIconSet: _starIconSet = "default",
  variant = "detailed",
  imageAspectRatio,
  style,
}) => {
  const theme = useTheme();
  const hasImageUrls = Array.isArray(imageUrls) && imageUrls.length > 0;
  const fallbackSource: { uri: string } | number | undefined =
    image != null
      ? typeof image === "string"
        ? { uri: image }
        : typeof image === "number"
          ? image
          : typeof image === "object" && image && "uri" in image && image.uri
            ? { uri: image.uri }
            : undefined
      : undefined;
  const displayName = getMushroomDisplayName(
    name,
    scientificName,
    canonicalName
  );
  const displayScientific = getMushroomDisplayScientific(name, scientificName);
  const showScientificLine = displayScientific !== undefined;

  const starSource = isFavorite
    ? Images.mushroomWishlistStarFilled
    : Images.mushroomWishlistStar;

  const getRarityColor = (): string => {
    const colorMap: Record<string, string> = {
      common: theme.colors.success,
      uncommon: theme.colors.primary,
      rare: theme.colors.warning,
      "very rare": theme.colors.error,
    };
    return colorMap[rarity || "common"] ?? theme.colors.textSecondary;
  };

  const getRarityLabel = (): string => {
    if (!rarity) return "Common";
    return rarity
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (variant === "compact") {
    return (
      <Card
        onPress={onPress}
        padding="none"
        variant="elevated"
        style={[styles.compactCard, style]}
      >
        <View style={styles.compactContent}>
          {(hasImageUrls || fallbackSource) && (
            <View style={styles.compactImage}>
              <CardImageCarousel
                imageUrls={hasImageUrls ? imageUrls : undefined}
                fallbackImage={hasImageUrls ? undefined : fallbackSource}
                style={styles.carouselFillCompact}
              />
            </View>
          )}
          <View style={styles.compactTextContainer}>
            <Text
              variant="title"
              size="small"
              weight="bold"
              numberOfLines={1}
              style={styles.compactTitle}
            >
              {displayName}
            </Text>
            {showScientificLine && displayScientific && (
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                numberOfLines={1}
                style={styles.scientificName}
              >
                {displayScientific}
              </Text>
            )}
          </View>
          {showFavorite && onFavoritePress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onFavoritePress();
              }}
              style={styles.favoriteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppImage
                key={isFavorite ? "star-filled" : "star-empty"}
                source={starSource}
                style={styles.starIconCompact}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card
      onPress={onPress}
      padding="none"
      variant="elevated"
      style={[styles.card, style]}
    >
      <View
        style={[
          styles.imageContainer,
          imageAspectRatio != null && {
            aspectRatio: imageAspectRatio,
            height: undefined,
          },
        ]}
      >
        <CardImageCarousel
          imageUrls={hasImageUrls ? imageUrls : undefined}
          fallbackImage={hasImageUrls ? undefined : fallbackSource}
          style={styles.carouselFill}
        />
        {showFavorite && onFavoritePress && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onFavoritePress();
            }}
            style={[
              styles.favoriteButton,
              styles.favoriteButtonAbsolute,
              { backgroundColor: theme.colors.surface },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppImage
              key={isFavorite ? "star-filled" : "star-empty"}
              source={starSource}
              style={styles.starIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        {rarity && (
          <View
            style={[styles.rarityBadge, { backgroundColor: getRarityColor() }]}
          >
            <Text
              variant="label"
              size="small"
              color="textInverse"
              weight="normal"
            >
              {getRarityLabel()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text
              variant="title"
              size="medium"
              weight="bold"
              numberOfLines={2}
              style={styles.titleText}
            >
              {displayName}
            </Text>
            {showScientificLine && displayScientific && (
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                style={styles.scientificName}
                numberOfLines={1}
              >
                {displayScientific}
              </Text>
            )}
          </View>
        </View>

        {description && (
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            numberOfLines={2}
            style={styles.description}
          >
            {description}
          </Text>
        )}

        {(hardness || color) && (
          <View style={styles.metadata}>
            {hardness && (
              <View style={styles.metadataItem}>
                <Icon name="layers" size={16} color={theme.colors.primary} />
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={styles.metadataText}
                >
                  {hardness}
                </Text>
              </View>
            )}
            {color && (
              <View style={styles.metadataItem}>
                <Icon name="droplet" size={16} color={theme.colors.warning} />
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={styles.metadataText}
                >
                  {color}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  compactCard: {
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 184,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
  },
  favoriteButtonAbsolute: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  starIcon: {
    width: 20,
    height: 20,
  },
  starIconCompact: {
    width: 18,
    height: 18,
  },
  rarityBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  content: {
    padding: 12,
  },
  header: {
    marginBottom: 6,
  },
  titleContainer: {
    marginBottom: 4,
  },
  /** Title: 16px, normal, 700, 24px line-height, Satoshi */
  titleText: {
    fontSize: 16,
    fontStyle: "normal",
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
  scientificName: {
    marginTop: 2,
    fontStyle: "italic",
  },
  description: {
    marginBottom: 12,
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[4],
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {
    marginLeft: 6,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    marginRight: 12,
    overflow: "hidden",
  },
  carouselFillCompact: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.sm,
  },
  carouselFill: {
    width: "100%",
    height: "100%",
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
});
