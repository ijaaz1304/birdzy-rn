import { EXPLORE_COPY } from "../content/explore.strings";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { AppCard } from "../../../components/shared";
import { Text } from "../../../atoms";
import { ExploreEmptyState } from "./ExploreEmptyState";
import { ExploreArchetypeCard } from "@/features/explore/services/explore.api.types";
import { useTheme } from "../../../hooks/useTheme";

import { ExploreFastPhoto } from "./ExploreFastPhoto";
import { prefetchExplorePhotos } from "../services/exploreImages";
import { useExploreWishlist } from "../useExploreWishlist";

export const EXPLORE_LIST_WINDOW = {
  initialNumToRender: 3,
  maxToRenderPerBatch: 4,
  windowSize: 3,
} as const;

type Props = {
  data: ExploreArchetypeCard[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasSearched: boolean;
  error: string | null;
  onRetry: () => Promise<void>;
  onCardPress: (archetypeId: string) => void;
  onEndReached?: () => Promise<void>;
  selectionActive?: boolean;
  hasMore?: boolean;
  /** Filters are applied, so the empty state suggests changing them. */
  filtered?: boolean;
};

/** Every mounted/recycled instance observes one shared pending operation. */
export const ExploreResultCard = React.memo(function ExploreResultCard({
  item,
  onPress,
}: {
  item: ExploreArchetypeCard;
  onPress: (id: string) => void;
}) {
  const { starred, pending, pendingRef, toggle } = useExploreWishlist(item);
  const commonName = item.commonName?.trim();
  return (
    <AppCard
      imageUrls={item.defaultImageUrl ? [item.defaultImageUrl] : item.imageUrls}
      imageSlot={
        <ExploreFastPhoto
          uri={
            item.defaultImageUrl ||
            item.imageUrls?.find((uri) => typeof uri === "string")
          }
          style={StyleSheet.absoluteFillObject}
        />
      }
      title={commonName || item.scientificName}
      subtitle={commonName ? item.scientificName : undefined}
      enableImageCarousel={false}
      starred={starred}
      starDisabled={pending}
      hasSound={false}
      onStarPress={toggle}
      onPress={() => {
        if (!pendingRef.current) onPress(item.archetypeId);
      }}
      style={styles.card}
    />
  );
});

export const ExploreResultList: React.FC<Props> = ({
  data,
  isLoading,
  isLoadingMore,
  hasSearched,
  error,
  onRetry,
  onCardPress,
  onEndReached,
  selectionActive,
  hasMore,
  filtered = false,
}) => {
  const theme = useTheme();
  const cardsRef = useRef(data);
  cardsRef.current = data;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const indexes = viewableItems.flatMap((token) =>
        token.index == null ? [] : [token.index]
      );
      if (!indexes.length) return;
      prefetchExplorePhotos(
        cardsRef.current
          .slice(Math.min(...indexes), Math.max(...indexes) + 3)
          .map((card) => card.defaultImageUrl || card.imageUrls?.[0])
      );
    }
  ).current;
  const renderCard = useCallback(
    ({ item }: { item: ExploreArchetypeCard }) => (
      <ExploreResultCard item={item} onPress={onCardPress} />
    ),
    [onCardPress]
  );
  return (
    <FlatList
      data={data}
      onViewableItemsChanged={onViewableItemsChanged}
      keyExtractor={(item) => item.archetypeId}
      numColumns={2}
      columnWrapperStyle={data.length ? styles.columnWrapper : undefined}
      contentContainerStyle={[
        styles.content,
        !data.length && styles.emptyContent,
      ]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        error ? (
          <View style={styles.message}>
            <Text accessibilityRole="alert" color="error">
              {error}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={EXPLORE_COPY.retryBirds}
              onPress={() => onRetry()}
            >
              <Text color="primary">{EXPLORE_COPY.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator
            accessibilityLabel={EXPLORE_COPY.loadingBirds}
            color={theme.colors.primary}
          />
        ) : error || !hasSearched ? null : selectionActive ? (
          <View style={styles.message}>
            <Text>{EXPLORE_COPY.selectionEmpty}</Text>
          </View>
        ) : (
          <ExploreEmptyState filtered={filtered} />
        )
      }
      onEndReached={
        selectionActive || error || isLoading || isLoadingMore
          ? undefined
          : onEndReached
      }
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator
            accessibilityLabel={EXPLORE_COPY.moreBirds}
            style={styles.footerLoader}
            color={theme.colors.primary}
          />
        ) : selectionActive && hasMore && !error ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.loadSelection}
            style={styles.message}
            onPress={() => onEndReached?.()}
          >
            <Text color="primary">{EXPLORE_COPY.loadSelectionText}</Text>
          </TouchableOpacity>
        ) : null
      }
      renderItem={renderCard}
      {...EXPLORE_LIST_WINDOW}
    />
  );
};
const styles = StyleSheet.create({
  // Figma: grid px20, starts 16 below the tabs (tab bar supplies the 16).
  content: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 24 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  emptyContent: { flexGrow: 1, justifyContent: "center", paddingTop: 40 },
  footerLoader: { paddingVertical: 16 },
  card: { flex: 1 },
  message: { padding: 16, gap: 8, alignItems: "center" },
});
