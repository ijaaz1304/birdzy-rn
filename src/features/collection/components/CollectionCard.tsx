/**
 * Collection Card Component
 * 2-layer card: outer card → image card + title + subtitle.
 * Light/dark styling via COLLECTION_CARD constants only.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, ImageSourcePropType, ViewStyle } from "react-native";
import { AppImage, AppImageBackground } from "@/components/AppImage";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Icon } from "../../../atoms";
import { themes } from "../../../design-system/themes";
import { COLLECTION_CARD } from "../../../constants/colorConstants";

const TITLE_FONT_SIZE = 20;
const TITLE_LINE_HEIGHT = 30;
const TITLE_MAX_LINES = 2;

interface CollectionCardProps {
  item: {
    name: string;
    count?: number;
    createdAt?: string;
    images?: (string | ImageSourcePropType)[];
  };
  onPress?: () => void;
  style?: ViewStyle;
}

export const CollectionCard: React.FC<CollectionCardProps> = React.memo(
  ({ item, onPress, style }) => {
    const theme = useTheme();
    const colors = theme.colors;
    const isDark = theme === themes.dark;
    const spec = isDark ? COLLECTION_CARD.DARK : COLLECTION_CARD.LIGHT;

    // Get up to 4 images for the 2x2 grid
    const displayImages = item.images?.slice(0, 4) || [];
    const count = item.count ?? 0;
    // "+N" only when more than 4 specimens (4th tile summarizes overflow)
    const overflowCount = count > 4 ? count - 3 : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.outerCard,
          {
            padding: COLLECTION_CARD.outerPadding,
            gap: COLLECTION_CARD.outerGap,
            borderRadius: spec.outerBorderRadius,
            borderWidth: spec.outerBorderWidth,
            borderColor: spec.outerBorderColor,
            backgroundColor: spec.outerBackground,
          },
          style,
        ]}
      >
        {/* Image card (inner) – borderRadius 8, no border, overflow hidden */}
        <View
          style={[
            styles.imageCard,
            {
              height: COLLECTION_CARD.imageCardHeight,
              borderRadius: COLLECTION_CARD.imageCardBorderRadius,
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
        >
          {/* Always show partitioned 2x2 grid; empty cells when count is 0 */}
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, index) => {
              const image = displayImages[index];
              const isEmpty = !image;
              const isFourthWithMore = index === 3 && overflowCount > 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.gridItem,
                    isEmpty &&
                      !isFourthWithMore && {
                        backgroundColor: colors.surfaceTertiary,
                      },
                    isFourthWithMore && {
                      backgroundColor:
                        COLLECTION_CARD.FOURTH_TILE_PLACEHOLDER_BG,
                    },
                  ]}
                >
                  {isFourthWithMore ? (
                    <>
                      {image ? (
                        <AppImageBackground
                          source={
                            typeof image === "string" ? { uri: image } : image
                          }
                          style={styles.gridImage}
                          resizeMode="cover"
                        >
                          <LinearGradient
                            colors={[
                              COLLECTION_CARD.FOURTH_TILE_OVERLAY,
                              COLLECTION_CARD.FOURTH_TILE_OVERLAY,
                            ]}
                            style={styles.remainingOverlay}
                          >
                            <Text
                              variant="body"
                              size="small"
                              weight="semibold"
                              style={styles.remainingCountText}
                            >
                              + {overflowCount}
                            </Text>
                          </LinearGradient>
                        </AppImageBackground>
                      ) : (
                        <LinearGradient
                          colors={[
                            COLLECTION_CARD.FOURTH_TILE_OVERLAY,
                            COLLECTION_CARD.FOURTH_TILE_OVERLAY,
                          ]}
                          style={styles.remainingOverlay}
                        >
                          <Text
                            variant="body"
                            size="small"
                            weight="semibold"
                            style={styles.remainingCountText}
                          >
                            + {overflowCount}
                          </Text>
                        </LinearGradient>
                      )}
                    </>
                  ) : (
                    <>
                      {image ? (
                        <AppImage
                          source={
                            typeof image === "string" ? { uri: image } : image
                          }
                          style={styles.gridImage}
                          resizeMode="cover"
                        />
                      ) : null}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Title (primary text) */}
        <View style={styles.titleContainer}>
          <Text
            variant="title"
            size="small"
            weight="semibold"
            numberOfLines={TITLE_MAX_LINES}
            style={[styles.title, { color: spec.titleColor }]}
          >
            {item.name}
          </Text>
        </View>

        {/* Subtitle: item count + created date */}
        <View style={styles.subtitleRow}>
          <Icon name="clock" size={12} color={spec.subtitleColor} />
          <Text
            variant="body"
            size="small"
            numberOfLines={1}
            style={[styles.subtitle, { color: spec.subtitleColor }]}
          >
            {`${count} ${count === 1 ? "item" : "items"} · ${
              item.createdAt || "Recently"
            }`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.count === nextProps.item.count &&
      prevProps.item.createdAt === nextProps.item.createdAt &&
      prevProps.item.images === nextProps.item.images &&
      prevProps.onPress === nextProps.onPress &&
      prevProps.style === nextProps.style
    );
  }
);

CollectionCard.displayName = "CollectionCard";

const styles = StyleSheet.create({
  outerCard: {
    flexDirection: "column",
    alignItems: "stretch",
    width: "48%",
    marginBottom: 8,
  },
  imageCard: {
    width: "100%",
    overflow: "hidden",
  },
  grid: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  gridItem: {
    width: "48%",
    height: "48%",
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  remainingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  remainingCountText: {
    color: COLLECTION_CARD.CARD_ICON_ON_OVERLAY,
  },
  titleContainer: {
    width: "100%",
    minHeight: TITLE_LINE_HEIGHT * TITLE_MAX_LINES,
    justifyContent: "center",
  },
  title: {
    width: "100%",
    fontSize: TITLE_FONT_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    paddingVertical: 2,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "100%",
    minWidth: 0,
  },
  subtitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 18,
  },
});
