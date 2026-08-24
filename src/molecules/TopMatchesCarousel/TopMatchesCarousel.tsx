/**
 * Top Matches Carousel
 * Swipeable carousel showing top 3 mineral identification matches
 */

import { AppImage, CachedRemoteImage } from "@/components/AppImage";
import React, { useRef, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text, Chip } from "../../atoms";
import { Card } from "../Card";
import { useStrings } from "../../hooks/useStrings";
import { Images } from "../../assets";

import { spacing } from "../../design-system/spacing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = 16;

export interface MushroomMatch {
  id: string;
  name: string;
  scientificName: string;
  accuracy: number;
  imageUri?: string;
  image?: any;
}

export interface TopMatchesCarouselProps {
  matches: MushroomMatch[];
  onMatchPress?: (match: MushroomMatch) => void;
}

export const TopMatchesCarousel: React.FC<TopMatchesCarouselProps> = ({
  matches,
  onMatchPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderMatch = ({
    item,
    index,
  }: {
    item: MushroomMatch;
    index: number;
  }) => (
    <TouchableOpacity
      onPress={() => onMatchPress?.(item)}
      activeOpacity={0.8}
      style={[
        styles.matchCard,
        {
          width: CARD_WIDTH,
          marginRight: index < matches.length - 1 ? CARD_SPACING : 0,
        },
      ]}
    >
      <Card variant="elevated" padding="large" style={styles.card}>
        <View style={styles.matchHeader}>
          <Chip
            label={`#${index + 1}`}
            variant="filled"
            size="small"
            color="primary"
            style={styles.rankChip}
          />
          <Chip
            label={`${item.accuracy}%`}
            variant="filled"
            size="small"
            color="success"
            style={styles.accuracyChip}
          />
        </View>

        {item.imageUri ? (
          <CachedRemoteImage
            uri={item.imageUri}
            style={[styles.matchImage, { borderRadius: radius.md }]}
            borderRadius={radius.md}
            resizeMode="cover"
          />
        ) : item.image ? (
          <AppImage
            source={item.image}
            style={[styles.matchImage, { borderRadius: radius.md }]}
            resizeMode="cover"
          />
        ) : (
          <AppImage
            source={Images.card_image_placeholder}
            style={[styles.placeholderImage, { borderRadius: radius.md }]}
            resizeMode="cover"
          />
        )}

        <View style={styles.matchInfo}>
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={styles.matchName}
          >
            {item.name}
          </Text>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.scientificName}
          >
            {item.scientificName}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" size="medium" weight="semibold">
          {strings.collection?.legacyDetailSections?.topMatches?.title ||
            "Top Matches"}
        </Text>
        <Text variant="body" size="small" color="textSecondary">
          {strings.collection?.legacyDetailSections?.topMatches?.subtitle ||
            "Swipe to see other possible matches"}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={matches.slice(0, 3)}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Pagination Dots */}
      {matches.length > 1 && (
        <View style={styles.pagination}>
          {matches.slice(0, 3).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? colors.dotSelected
                      : colors.dotUnselected,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  carouselContent: {
    paddingHorizontal: spacing[4],
  },
  matchCard: {
    height: 280,
  },
  card: {
    height: "100%",
    justifyContent: "space-between",
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rankChip: {
    marginRight: 0,
  },
  accuracyChip: {
    marginLeft: 0,
  },
  matchImage: {
    width: "100%",
    height: 150,
    marginBottom: 12,
  },
  placeholderImage: {
    width: "100%",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    marginBottom: 4,
  },
  scientificName: {
    fontStyle: "italic",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
