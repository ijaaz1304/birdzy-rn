import { EXPLORE_COPY } from "../content/explore.strings";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCard } from "../../../components/shared";
import { Text } from "../../../atoms";
import { ExploreEmptyState } from "./ExploreEmptyState";
import { ExploreArchetypeCard } from "@/features/explore/services/explore.api.types";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { useTheme } from "../../../hooks/useTheme";
import { useBirdsStore } from "../../catalogue/birds.store";
import { useAuthStore } from "../../auth/auth.store";
import { useWishlistInvalidationStore } from "../../collection/wishlistInvalidation.store";

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
};

/** Own each item's pending state; serialize taps and reconcile with shared wishlist state. */
const ExploreResultCard = ({
  item,
  onPress,
}: {
  item: ExploreArchetypeCard;
  onPress: (id: string) => void;
}) => {
  const favorite = useBirdsStore((state) =>
    state.favorites.includes(item.archetypeId)
  );
  const suppressed = useBirdsStore((state) =>
    state.suppressedWishlistIds.includes(item.archetypeId)
  );
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const pendingRef = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const starred =
    optimistic ?? (suppressed ? false : favorite || item.isWishlisted);
  const toggle = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const account = useAuthStore.getState().user?.id;
    const token = useAuthStore.getState().token;
    const sameSession = () =>
      useAuthStore.getState().user?.id === account &&
      useAuthStore.getState().token === token;
    const next = !starred;
    setPending(true);
    setOptimistic(next);
    try {
      if (next) await archetypeService.addWishlistArchetype(item.archetypeId);
      else await archetypeService.removeWishlistArchetype(item.archetypeId);
      if (!sameSession()) return;
      const store = useBirdsStore.getState();
      if (next) store.addFavorite(item.archetypeId);
      else store.removeFavorite(item.archetypeId);
      useWishlistInvalidationStore.getState().invalidate();
    } catch {
      if (alive.current && sameSession())
        Alert.alert(EXPLORE_COPY.wishlist, EXPLORE_COPY.wishlistError);
    } finally {
      pendingRef.current = false;
      if (alive.current) {
        setPending(false);
        setOptimistic(null);
      }
    }
  };
  return (
    <AppCard
      imageUrls={item.defaultImageUrl ? [item.defaultImageUrl] : item.imageUrls}
      title={item.scientificName}
      subtitle={item.commonName ?? undefined}
      enableImageCarousel={false}
      starred={starred}
      starDisabled={pending}
      hasSound={false}
      onStarPress={() => toggle()}
      onPress={() => {
        if (!pendingRef.current) onPress(item.archetypeId);
      }}
      style={styles.card}
    />
  );
};

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
}) => {
  const theme = useTheme();
  return (
    <FlatList
      data={data}
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
          <ExploreEmptyState />
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
      renderItem={({ item }) => (
        <ExploreResultCard item={item} onPress={onCardPress} />
      )}
    />
  );
};
const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  emptyContent: { flexGrow: 1, justifyContent: "center", paddingTop: 40 },
  footerLoader: { paddingVertical: 16 },
  card: { flex: 1 },
  message: { padding: 16, gap: 8, alignItems: "center" },
});
