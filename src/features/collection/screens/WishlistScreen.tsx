/**
 * Wishlist Screen
 * Search and filter match CollectionDetailsScreen (Identified) for consistent UX.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  CollectionStackParamList,
  RootStackParamList,
} from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import {
  SearchBar,
  ActiveFilterChips,
  FilterActionButton,
} from "../../../molecules";
import { AppCard } from "../../../components/shared";
import { RemoveFromWishlistConfirmation } from "../../../components/RemoveFromWishlistConfirmation";
import FilterModal from "../../../organisms/FilterModal/FilterModal";
import { FilterState } from "../../../organisms/FilterModal/types";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { CardSkeleton } from "../../../components/skeleton";
import { useBirdsStore } from "../../../features/catalogue/birds.store";
import { useWishlistInvalidationStore } from "../wishlistInvalidation.store";
import { EmptyCollectionContent } from "../components";
import { useStrings } from "../../../hooks/useStrings";
import { useToast } from "../../../hooks";
import {
  getDisplayName,
  getMushroomDisplayScientificFromFields,
} from "../../../utils/mushroomDisplayUtils";
import { getSpecimenDisplayImageUrls, resolveArchetypeIdFromSpecimen } from "../collection.utils";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { useBackHandler } from "../../../utils/backHandler";

import { spacing } from "../../../design-system/spacing";

type WishlistScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CollectionStackParamList, "Wishlist">,
  NativeStackNavigationProp<RootStackParamList>
>;

export const WishlistScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const tabBarHeight = useBottomTabBarHeight();
  const listBottomPadding = tabBarHeight + spacing[4];
  const strings = useStrings();
  const { showToast } = useToast();
  const navigation = useNavigation<WishlistScreenNavigationProp>();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    specimenId: string;
    archetypeId?: string;
    name: string;
  } | null>(null);
  const removedSpecimenIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedWishlistRef = useRef(false);

  // Search and filter (same UX as Identified in CollectionDetailsScreen)
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterApiData, setFilterApiData] = useState<
    Record<string, string[]> | undefined
  >(undefined);

  useEffect(() => {
    if (filterApiData) return;
    archetypeService
      .getFilterItems()
      .then((data) => {
        if (data && typeof data === "object") {
          const flat: Record<string, string[]> = {};
          Object.entries(data).forEach(([key, val]) => {
            if (Array.isArray(val) && val.length > 0) flat[key] = val;
          });
          setFilterApiData(flat);
        }
      })
      .catch(() => {});
  }, [filterApiData]);

  const apiFilterPayload = useMemo(() => {
    const f = filters ?? {};
    const hasAny = Object.keys(f).some((k) => (f[k]?.length ?? 0) > 0);
    if (!hasAny) return undefined;
    const payload: Record<string, string[]> = {};
    Object.entries(f).forEach(([key, val]) => {
      if (Array.isArray(val) && val.length > 0) payload[key] = val;
    });
    return payload;
  }, [filters]);

  const loadWishlist = useCallback(async () => {
    try {
      if (!hasLoadedWishlistRef.current) {
        setIsLoading(true);
      }
      const specimenFilters = {
        isWishlisted: [true],
        ...(apiFilterPayload || {}),
      };
      const response = await mushroomSpecimenService.fetchAllSpecimens(
        specimenFilters as any,
        { pageNo: 0, pageSize: 100 }
      );
      const mappedItems = response.data.map((specimen) => ({
        id: specimen.specimenId,
        specimenId: specimen.specimenId,
        archetypeId: resolveArchetypeIdFromSpecimen(
          specimen as unknown as Record<string, unknown>
        ),
        name: getDisplayName(specimen),
        scientificName: getMushroomDisplayScientificFromFields(specimen),
        image: (() => {
          const urls = getSpecimenDisplayImageUrls(specimen);
          return urls[0] ? { uri: urls[0] } : undefined;
        })(),
      }));
      const presentIds = new Set(
        mappedItems.map((item) => item.specimenId).filter(Boolean)
      );
      removedSpecimenIdsRef.current.forEach((id) => {
        if (!presentIds.has(id)) removedSpecimenIdsRef.current.delete(id);
      });
      const visibleItems = mappedItems.filter(
        (item) => !removedSpecimenIdsRef.current.has(item.specimenId)
      );
      setWishlistItems(visibleItems);
      setWishlistCount(
        Math.max(
          0,
          (response.pagination?.totalCount ?? mappedItems.length) -
            (mappedItems.length - visibleItems.length)
        )
      );
      hasLoadedWishlistRef.current = true;
    } catch (error) {
      console.error("Error loading wishlist:", error);
      setWishlistItems([]);
      setWishlistCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [apiFilterPayload]);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [loadWishlist])
  );

  useEffect(() => {
    loadWishlist();
  }, [apiFilterPayload]);

  const totalFilterCount = useMemo(
    () =>
      Object.values(filters).reduce(
        (sum, values) => sum + (values?.length ?? 0),
        0
      ),
    [filters]
  );

  const removeFilterValue = useCallback((filterKey: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      const arr = (next[filterKey] || []).filter((v) => v !== value);
      if (arr.length === 0) delete next[filterKey];
      else next[filterKey] = arr;
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("CollectionMain", {});
  }, [navigation]);

  useBackHandler({
    enabled: true,
    onBackPress: () => {
      handleBack();
      return true;
    },
    priority: 5,
  });

  const filteredMushrooms = useMemo(() => {
    if (!searchQuery.trim()) return wishlistItems;
    const q = searchQuery.toLowerCase();
    return wishlistItems.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.scientificName?.toLowerCase().includes(q)
    );
  }, [wishlistItems, searchQuery]);

  const handleApplyFilters = (newFilters: FilterState, hasFilters: boolean) => {
    analyticsService.logEvent(EVENTS.filter_field_selected_collection, {
      collection_name: "Wishlist",
      filter_fields: Object.keys(newFilters)
        .filter((k) => (newFilters[k]?.length ?? 0) > 0)
        .join(","),
    });
    setFilters(hasFilters ? newFilters : {});
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleEmptyCtaPress = useCallback(() => {
    navigation.navigate("MainTabs", {
      screen: "Catalogue",
      params: { screen: "CatalogueMain" },
    });
  }, [navigation]);

  const handleRemovePress = (item: {
    id: string;
    specimenId: string;
    archetypeId?: string;
    name: string;
  }) => {
    setSelectedItem(item);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedItem) return;
    const itemToRemove = selectedItem;
    try {
      let archetypeId =
        typeof itemToRemove.archetypeId === "string"
          ? itemToRemove.archetypeId.trim()
          : "";
      if (!archetypeId && itemToRemove.specimenId) {
        const specimenRes = await mushroomSpecimenService.getSpecimenDetails(
          itemToRemove.specimenId
        );
        archetypeId =
          resolveArchetypeIdFromSpecimen(
            specimenRes as unknown as Record<string, unknown>
          ) ?? "";
      }
      if (archetypeId) {
        await archetypeService.removeWishlistArchetype(archetypeId);
        useBirdsStore.getState().removeFavorite(archetypeId);
        analyticsService.logEvent(EVENTS.remove_wishlist, {
          mushroom_id: String(archetypeId),
        });
        analyticsService.logEvent(EVENTS.delete_wishlist, {
          mushroom_id: String(archetypeId),
        });
      } else if (itemToRemove.specimenId) {
        await mushroomSpecimenService.updateSpecimen(itemToRemove.specimenId, {
          isWishlisted: false,
        });
      } else {
        showToast(strings.collection.favorite.removeFailed, "error");
        return;
      }
      if (itemToRemove.specimenId) {
        removedSpecimenIdsRef.current.add(itemToRemove.specimenId);
      }
      setWishlistItems((prev) =>
        prev.filter(
          (item) =>
            item.specimenId !== itemToRemove.specimenId &&
            (!archetypeId || item.archetypeId !== archetypeId)
        )
      );
      setWishlistCount((prev) => Math.max(0, prev - 1));
      useWishlistInvalidationStore.getState().invalidate();
      showToast(strings.collection.favorite.removed, "success");
      setSelectedItem(null);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      showToast(strings.collection.favorite.removeFailed, "error");
    }
  };

  return (
    <>
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="medium"
          weight="semibold"
          style={{ color: colors.textPrimary }}
        >
          Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search and filter - hidden when wishlist is empty */}
      {wishlistItems.length > 0 && (
      <View
        style={{
          paddingHorizontal: spacing[6],
          marginBottom: spacing[2],
          flexDirection: "row",
          gap: spacing[2],
        }}
      >
        <View style={{ flex: 1 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Find mushroom by name"
            showFilterButton={false}
          />
        </View>
        <FilterActionButton
          filterCount={totalFilterCount}
          onPress={() => {
            analyticsService.logEvent(EVENTS.filter_sub_collection, {
              collection_name: "Wishlist",
            });
            setShowFilterModal(true);
          }}
        />
      </View>
      )}

      <ActiveFilterChips
        filters={filters}
        onOpenFilters={() => setShowFilterModal(true)}
        onRemoveFilterValue={removeFilterValue}
        resultsHeading={strings.catalogue.screen.results}
        contentPaddingHorizontal={spacing[6]}
      />

      <View style={styles.body}>
      {isLoading ? (
        <View
          style={[styles.skeletonContainer, { paddingHorizontal: spacing[6] }]}
        >
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <CardSkeleton height={200} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : filteredMushrooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          {wishlistItems.length === 0 ? (
            <EmptyCollectionContent
              title={strings.collection.emptyStates.noWishlist.title}
              subtitle={strings.collection.emptyStates.noWishlist.subtitle}
              ctaLabel={
                strings.collection.emptyStates.emptyCollection.addBird
              }
              onCtaPress={handleEmptyCtaPress}
            />
          ) : (
            <Text
              variant="body"
              size="medium"
              color="textSecondary"
              style={styles.emptyText}
            >
              {strings.collection.emptyStates.emptyCollection.noSearchResults}
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMushrooms}
          keyExtractor={(item, index) =>
            item.specimenId ?? `${item.id}-${index}`
          }
          numColumns={2}
          columnWrapperStyle={[
            styles.columnWrapper,
            { paddingHorizontal: spacing[6] },
          ]}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: 0, paddingBottom: listBottomPadding },
          ]}
          renderItem={({ item }) => (
            <View style={styles.mushroomCardWrapper}>
              <AppCard
                image={item.image}
                title={item.name}
                subtitle={item.scientificName}
                starred={true}
                onPress={() => {
                  analyticsService.logEvent(EVENTS.sub_collection_item, {
                    collection_name: "Wishlist",
                  });
                  const hasArchetypeId = !!item.archetypeId;
                  navigation.navigate("BirdDetails", {
                    mushroomId: hasArchetypeId
                      ? item.archetypeId!
                      : item.specimenId,
                    source: "collection",
                    collectionName: "Wishlist",
                    ...(hasArchetypeId ? {} : { idType: "specimen" as const }),
                    specimenId: item.specimenId,
                  });
                }}
                onStarPress={() => handleRemovePress(item)}
                style={styles.cardStyle}
              />
            </View>
          )}
        />
      )}
      </View>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filterDataFromApi={filterApiData}
        onApplyFilters={handleApplyFilters}
        clearAllFilters={handleClearFilters}
        defaultFilters={filters}
        comingFrom="global_collection"
      />

    </SafeAreaView>

    <RemoveFromWishlistConfirmation
      visible={showRemoveModal}
      onClose={() => {
        setShowRemoveModal(false);
        setSelectedItem(null);
      }}
      onConfirm={handleConfirmRemove}
      mushroomName={selectedItem?.name}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  placeholder: {
    width: 36,
  },
  list: {
    padding: spacing[4],
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mushroomCardWrapper: {
    width: "48%",
    flex: 0,
    maxWidth: "48%",
    marginBottom: 12,
  },
  cardStyle: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: 24,
    paddingBottom: spacing[10],
  },
  emptyText: {
    marginTop: 16,
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing[4],
    gap: 8,
  },
  skeletonItem: {
    width: "48%",
    marginBottom: 8,
  },
});
