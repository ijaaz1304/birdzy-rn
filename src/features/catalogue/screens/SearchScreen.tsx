import { getResponsiveGridColumns } from "@/utils/responsiveLayout";
/**
 * Search Screen - Dedicated search page for catalogue
 */

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  InteractionManager,
  KeyboardAvoidingView,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import {
  SearchBar,
  type SearchBarRef,
  EmptyState,
  FilterActionButton,
  ActiveFilterChips,
} from "../../../molecules";
import FilterModal from "../../../organisms/FilterModal/FilterModal";
import { CatalogueStackParamList } from "../../../navigation/types";
import { useFeatureConfig } from "../../../config/context";
import { FilterState } from "../../../organisms/FilterModal/types";
import { Images } from "../../../assets";
import { useBirdsStore } from "../birds.store";
import { CardSkeleton } from "../../../components/skeleton";
import { SearchSuggestions } from "../../../components/SearchSuggestions";
import { getSearchSuggestionQuery } from "../../../services/localSearch";
import {
  mapMushroomToCatalogueCard,
  type CatalogueCardItem,
  type MushroomLike,
} from "../../../utils/mushroomCardUtils";
import { prefetchRemoteImages } from "../../../utils/prefetchImages";
import { FLATLIST_CONFIG } from "../../../constants/appConstants";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { useBackHandler } from "../../../utils/backHandler";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { AppCard } from "../../../components/shared";
import { useCatalogueCardSound } from "../hooks/useCatalogueCardSound";
import { CARD_COLORS } from "../../../constants/colorConstants";
import { useStrings } from "../../../hooks/useStrings";
import { useToast } from "../../../hooks";
import { RemoveFromWishlistConfirmation } from "../../../components/RemoveFromWishlistConfirmation";
import { Radius } from "../../../design";

import { FONTS } from "../../../common/typography";

import { APP_COLORS } from "../../../config/colors";
import { CATALOGUE_STRINGS } from "../../../config/strings/catalogue.strings";

const SEARCH_GRID_H_PADDING = 12;
const SEARCH_GRID_GAP = 12;

type SearchScreenNavigationProp = NativeStackNavigationProp<
  CatalogueStackParamList,
  "SearchFilter"
>;
type SearchScreenRouteProp = RouteProp<CatalogueStackParamList, "SearchFilter">;

function getActiveFilterPayload(
  filters: FilterState
): Record<string, string[]> {
  const payload: Record<string, string[]> = {};
  Object.entries(filters).forEach(([key, values]) => {
    if ((values?.length ?? 0) > 0) {
      payload[key] = values;
    }
  });
  return payload;
}

export const SearchScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const isDark = useIsDark();
  const {
    width: windowWidth,
    height: windowHeight,
    fontScale,
  } = useWindowDimensions();
  const gridColumns = getResponsiveGridColumns(windowWidth, fontScale);
  const searchCardWidth = Math.max(
    1,
    (windowWidth -
      SEARCH_GRID_H_PADDING * 2 -
      SEARCH_GRID_GAP * (gridColumns - 1)) /
      gridColumns
  );
  const suggestionsMaxHeight = useMemo(
    () => Math.min(300, Math.round(windowHeight * 0.38)),
    [windowHeight]
  );
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const route = useRoute<SearchScreenRouteProp>();
  const catalogueConfig = useFeatureConfig("catalogue");
  const strings = useStrings();
  const { showToast } = useToast();
  const { playingId, toggleSound } = useCatalogueCardSound();

  const initialQueryFromParams = route.params?.initialQuery;

  const [query, setQuery] = useState(initialQueryFromParams ?? "");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const suggestionsHideTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterApiData, setFilterApiData] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const {
    mushrooms,
    searchMushrooms,
    filterMushrooms,
    favorites,
    toggleFavorite,
  } = useBirdsStore();
  const [searchResults, setSearchResults] = useState<CatalogueCardItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  /** Show results after user commits search or applies filters */
  const [resultsRequested, setResultsRequested] = useState(false);
  const lastSearchQueryRef = useRef<string | null>(null);
  const searchBarRef = useRef<SearchBarRef>(null);
  const [showRemoveWishlistConfirm, setShowRemoveWishlistConfirm] =
    useState(false);
  const [pendingWishlistRemove, setPendingWishlistRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const clearSuggestionsHideTimeout = useCallback(() => {
    if (suggestionsHideTimeoutRef.current) {
      clearTimeout(suggestionsHideTimeoutRef.current);
      suggestionsHideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideSuggestions = useCallback(() => {
    clearSuggestionsHideTimeout();
    suggestionsHideTimeoutRef.current = setTimeout(() => {
      setSuggestionsVisible(false);
      suggestionsHideTimeoutRef.current = null;
    }, 200);
  }, [clearSuggestionsHideTimeout]);

  useEffect(
    () => () => clearSuggestionsHideTimeout(),
    [clearSuggestionsHideTimeout]
  );
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const task = InteractionManager.runAfterInteractions(() => {
      searchBarRef.current?.focus();
    });
    return () => task.cancel();
  }, []);

  const handleBackToCatalogue = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If SearchFilter was opened as the initial screen of the Catalogue stack (deep link),
      // ensure back returns to the Catalogue list instead of switching tabs/exiting.
      navigation.navigate("CatalogueMain");
    }
  }, [navigation]);

  // Android hardware back
  useBackHandler({
    enabled: true,
    onBackPress: () => {
      handleBackToCatalogue();
      return true;
    },
    priority: 5,
  });

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(filters).forEach((key) => {
      const count = filters[key]?.length ?? 0;
      if (count > 0) {
        counts[key] = count;
      }
    });
    return counts;
  }, [filters]);

  const totalFilterCount = Object.values(filterCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const hasActiveFilters = totalFilterCount > 0;

  const runCatalogueQuery = useCallback(
    async (searchText: string, nextFilters: FilterState) => {
      const trimmedQuery = searchText.trim();
      const filterPayload = getActiveFilterPayload(nextFilters);
      const hasFilters = Object.keys(filterPayload).length > 0;

      if (!trimmedQuery && !hasFilters) {
        setResultsRequested(false);
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setResultsRequested(true);
      setIsSearching(true);

      try {
        if (trimmedQuery) {
          lastSearchQueryRef.current = trimmedQuery;
          await searchMushrooms(
            trimmedQuery,
            hasFilters ? filterPayload : undefined
          );
        } else {
          lastSearchQueryRef.current = null;
          await filterMushrooms(filterPayload);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [filterMushrooms, searchMushrooms]
  );

  // When opened with initialQuery (e.g. from Home search), run search once
  useEffect(() => {
    if (!initialQueryFromParams?.trim()) return;
    void runCatalogueQuery(initialQueryFromParams, filters);
    navigation.setParams({ initialQuery: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showFilterModal && !filterApiData) {
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
    }
  }, [showFilterModal, filterApiData]);

  const handleApplyFilters = (newFilters: FilterState, hasFilters: boolean) => {
    const nextFilters = hasFilters ? newFilters : {};
    setFilters(nextFilters);
    setShowFilterModal(false);
    void runCatalogueQuery(query, nextFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    void runCatalogueQuery(query, {});
  };

  const removeFilterValue = useCallback(
    (filterKey: string, value: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        const arr = (next[filterKey] || []).filter((v) => v !== value);
        if (arr.length === 0) delete next[filterKey];
        else next[filterKey] = arr;
        void runCatalogueQuery(query, next);
        return next;
      });
    },
    [query, runCatalogueQuery]
  );

  // Clear results when query is cleared and no filters remain
  useEffect(() => {
    if (!query.trim() && !hasActiveFilters) {
      setSearchResults([]);
      setIsSearching(false);
      setResultsRequested(false);
    }
  }, [query, hasActiveFilters]);

  // Update search results when minerals change only after search/filter was requested.
  useEffect(() => {
    if (!resultsRequested) {
      return;
    }
    if (mushrooms && mushrooms.length > 0) {
      const mappedResults = mushrooms.map((mineral) =>
        mapMushroomToCatalogueCard(mineral as MushroomLike)
      );
      setSearchResults(mappedResults);
      if (lastSearchQueryRef.current) {
        analyticsService.logEvent(EVENTS.search_used, {
          search_term: lastSearchQueryRef.current,
          screen_name: "catalogue",
          result_count: String(mushrooms.length),
        });
        lastSearchQueryRef.current = null;
      }
    } else {
      setSearchResults([]);
      if (lastSearchQueryRef.current) {
        analyticsService.logEvent(EVENTS.search_used, {
          search_term: lastSearchQueryRef.current,
          screen_name: "catalogue",
          result_count: "0",
        });
        lastSearchQueryRef.current = null;
      }
    }
  }, [mushrooms, resultsRequested]);

  useEffect(() => {
    if (searchResults.length === 0) return;
    prefetchRemoteImages(
      searchResults.map((item) => item.imageUrls?.[0] ?? item.image?.uri),
      40
    );
  }, [searchResults]);

  const searchViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 35,
  }).current;

  const onSearchViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      prefetchRemoteImages(
        viewableItems.map((token) => {
          const item = token.item as CatalogueCardItem;
          return item.imageUrls?.[0] ?? item.image?.uri;
        }),
        20
      );
    }
  ).current;

  const hasResults = searchResults.length > 0;
  const hasQuery = query.trim().length > 0;
  const showResultsArea = resultsRequested && (hasQuery || hasActiveFilters);
  const emptyStateTitle = hasActiveFilters
    ? CATALOGUE_STRINGS.filterEmptyState.title
    : CATALOGUE_STRINGS.emptyState.title;
  const emptyStateSubtitle = hasActiveFilters
    ? CATALOGUE_STRINGS.filterEmptyState.subtitle
    : CATALOGUE_STRINGS.searchEmptyState.message;

  const showDropdown = suggestionsVisible && query.trim().length >= 1;

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim().length >= 1) {
        clearSuggestionsHideTimeout();
        setSuggestionsVisible(true);
      }
    },
    [clearSuggestionsHideTimeout]
  );

  const cardBorderColor = isDark
    ? CARD_COLORS.DARK.border
    : CARD_COLORS.LIGHT.border;
  const cardBg = isDark
    ? CARD_COLORS.DARK.background
    : CARD_COLORS.LIGHT.background;

  const renderItem = useCallback(
    ({ item }: { item: CatalogueCardItem }) => {
      const isStarred =
        favorites.includes(item.id) || item.isWishlisted === true;
      return (
        <AppCard
          image={item.image}
          imageUrls={item.imageUrls}
          title={item.name}
          subtitle={item.scientificName}
          enableImageCarousel={false}
          onPress={() =>
            navigation.navigate("BirdDetails", {
              mushroomId: item.id,
              source: "catalogue",
            })
          }
          starred={isStarred}
          showSoundButton
          hasSound={(item.soundUrls?.length ?? 0) > 0}
          soundPlaying={playingId === item.id}
          onSoundPress={() => {
            void toggleSound(item.id, item.soundUrls);
          }}
          onStarPress={() => {
            void (async () => {
              if (isStarred) {
                setPendingWishlistRemove({ id: item.id, name: item.name });
                setShowRemoveWishlistConfirm(true);
                return;
              }
              const result = await toggleFavorite(item.id);
              if (result === "added") {
                showToast(strings.collection.favorite.added, "success");
              } else if (result === "removed") {
                showToast(strings.collection.favorite.removed, "success");
              } else {
                showToast(strings.collection.favorite.addFailed, "error");
              }
            })();
          }}
          style={[
            styles.itemCardWrapper,
            {
              width: searchCardWidth,
              borderWidth: 1,
              borderColor: cardBorderColor,
              borderRadius: Radius.md,
              backgroundColor: cardBg,
            },
          ]}
        />
      );
    },
    [
      favorites,
      toggleFavorite,
      navigation,
      showToast,
      strings.collection.favorite,
      searchCardWidth,
      cardBorderColor,
      cardBg,
      playingId,
      toggleSound,
    ]
  );

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Header: back + search bar; dropdown below when focused (high zIndex so dropdown isn't covered by content below) */}
          <View
            style={[
              styles.headerWrapper,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            {/* Figma 8025:101790 — back (24) · search bar (flex 1) · filter (48), 8pt gaps, 20pt side margin */}
            <View style={[styles.header, styles.headerWithSearch]}>
              <TouchableOpacity
                onPress={handleBackToCatalogue}
                style={styles.backButton}
                hitSlop={BACK_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <NavBackIcon color={colors.textPrimary} size={24} />
              </TouchableOpacity>
              <View style={styles.searchBarInHeader}>
                <SearchBar
                  ref={searchBarRef}
                  value={query}
                  onChangeText={handleQueryChange}
                  onClear={() => {
                    setQuery("");
                    clearSuggestionsHideTimeout();
                    setSuggestionsVisible(false);
                    if (hasActiveFilters) {
                      void runCatalogueQuery("", filters);
                    }
                  }}
                  placeholder={
                    catalogueConfig.searchPlaceholder?.replace(/\?/g, "") ??
                    "Find birds by name or traits..."
                  }
                  showFilterButton={false}
                  leftIcon="search"
                  autoFocus={Platform.OS !== "ios"}
                  onFocus={() => {
                    clearSuggestionsHideTimeout();
                    setSuggestionsVisible(true);
                  }}
                  onBlur={() => {
                    scheduleHideSuggestions();
                  }}
                  onSubmitEditing={() => {
                    const q = query.trim();
                    if (q) {
                      clearSuggestionsHideTimeout();
                      setSuggestionsVisible(false);
                      void runCatalogueQuery(q, filters);
                    }
                  }}
                />
              </View>
              <FilterActionButton
                filterCount={totalFilterCount}
                onPress={() => setShowFilterModal(true)}
              />
            </View>
            {/* Inline dropdown below bar (no modal = input stays focusable); show when focused + 1+ char */}
            {showDropdown && (
              <View
                style={[
                  styles.suggestionsWrap,
                  {
                    top: SEARCH_HEADER_TOP + SEARCH_BAR_HEIGHT + 4,
                    left: SEARCH_SIDE_MARGIN,
                    right: SEARCH_SIDE_MARGIN,
                  },
                ]}
              >
                <SearchSuggestions
                  query={query}
                  visible={true}
                  maxHeight={suggestionsMaxHeight}
                  onInteractionStart={clearSuggestionsHideTimeout}
                  onSelect={(item) => {
                    const value = getSearchSuggestionQuery(item);
                    clearSuggestionsHideTimeout();
                    setSuggestionsVisible(false);
                    setQuery(value);
                    requestAnimationFrame(() => {
                      void runCatalogueQuery(value, filters);
                    });
                  }}
                />
              </View>
            )}
          </View>

          {/* Main content below header (lower zIndex so dropdown stays on top) */}
          <View
            style={styles.contentBelowHeader}
            pointerEvents={showDropdown ? "none" : "auto"}
          >
            {hasActiveFilters ? (
              <ActiveFilterChips
                filters={filters}
                onOpenFilters={() => setShowFilterModal(true)}
                onRemoveFilterValue={removeFilterValue}
                resultsHeading={CATALOGUE_STRINGS.screen.results}
                contentPaddingHorizontal={Space[4]}
              />
            ) : showResultsArea && !isSearching && hasResults ? (
              <Text
                variant="title"
                size="small"
                weight="bold"
                style={[styles.resultsHeading, { color: colors.textPrimary }]}
              >
                {CATALOGUE_STRINGS.screen.results}
              </Text>
            ) : null}

            {/* Results or Empty State */}
            {showResultsArea ? (
              isSearching ? (
                <View
                  style={[
                    styles.skeletonContainer,
                    { paddingHorizontal: SEARCH_GRID_H_PADDING },
                  ]}
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <View key={i} style={styles.skeletonItem}>
                      <CardSkeleton height={220} borderRadius={12} />
                    </View>
                  ))}
                </View>
              ) : hasResults ? (
                <FlatList
                  data={searchResults}
                  extraData={favorites}
                  numColumns={gridColumns}
                  key={`search-results-grid-${gridColumns}`}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  columnWrapperStyle={
                    gridColumns > 1
                      ? [
                          styles.columnWrapper,
                          {
                            paddingHorizontal: SEARCH_GRID_H_PADDING,
                            marginBottom: SEARCH_GRID_GAP,
                            gap: SEARCH_GRID_GAP,
                          },
                        ]
                      : undefined
                  }
                  contentContainerStyle={[
                    {
                      paddingHorizontal:
                        gridColumns === 1 ? SEARCH_GRID_H_PADDING : 0,
                    },
                    styles.list,
                    { paddingBottom: 120 },
                  ]}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={FLATLIST_CONFIG.INITIAL_NUM_TO_RENDER}
                  maxToRenderPerBatch={FLATLIST_CONFIG.MAX_TO_RENDER_PER_BATCH}
                  windowSize={FLATLIST_CONFIG.WINDOW_SIZE}
                  removeClippedSubviews={
                    FLATLIST_CONFIG.REMOVE_CLIPPED_SUBVIEWS
                  }
                  updateCellsBatchingPeriod={
                    FLATLIST_CONFIG.UPDATE_CELLS_BATCHING_PERIOD
                  }
                  viewabilityConfig={searchViewabilityConfig}
                  onViewableItemsChanged={onSearchViewableItemsChanged}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <EmptyState
                    image={
                      hasActiveFilters ? Images.emptyFilter : Images.emptyResult
                    }
                    title={emptyStateTitle}
                    subtitle={emptyStateSubtitle}
                  />
                </View>
              )
            ) : (
              /* Figma 8025:101794 — single centred hint 24pt below the bar (Body/14px/Regular, text-secondary) */
              <View style={styles.searchHintWrap}>
                <Text
                  style={[styles.searchHint, { color: colors.textSecondary }]}
                >
                  Partial words will not be searched.
                </Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filterDataFromApi={filterApiData}
          onApplyFilters={handleApplyFilters}
          clearAllFilters={handleClearFilters}
          defaultFilters={filters}
          comingFrom="global_collection"
        />
        <RemoveFromWishlistConfirmation
          visible={showRemoveWishlistConfirm}
          onClose={() => {
            setShowRemoveWishlistConfirm(false);
            setPendingWishlistRemove(null);
          }}
          onConfirm={async () => {
            const pending = pendingWishlistRemove;
            if (!pending) return;
            const result = await toggleFavorite(pending.id);
            if (result === "removed") {
              showToast(strings.collection.favorite.removed, "success");
            } else {
              showToast(strings.collection.favorite.removeFailed, "error");
            }
          }}
          mushroomName={pendingWishlistRemove?.name}
        />
      </SafeAreaView>
    </>
  );
};

/** Figma 8025:101789 search header layout */
const SEARCH_SIDE_MARGIN = 20;
const SEARCH_HEADER_TOP = 8;
const SEARCH_BAR_HEIGHT = 48;
const BACK_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  contentBelowHeader: {
    flex: 1,
    zIndex: 0,
  },
  headerWrapper: {
    position: "relative",
    overflow: "visible",
    zIndex: 9999,
    elevation: 9999,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SEARCH_SIDE_MARGIN,
    paddingTop: SEARCH_HEADER_TOP,
    /** 8 here + 16 hint padding = Figma's 24pt gap; also spaces results/chips below */
    paddingBottom: 8,
  },
  searchHintWrap: {
    paddingTop: 16,
    paddingHorizontal: SEARCH_SIDE_MARGIN,
    alignItems: "center",
  },
  /** Figma Body/14px/Regular: Satoshi Regular 14/20, text-secondary (#5D5D5D) */
  searchHint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  suggestionsWrap: {
    position: "absolute",
    zIndex: 1000,
    elevation: 10,
    shadowColor: APP_COLORS.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  /** Figma: 24pt back icon (touch area extended with hitSlop) */
  backButton: {
    width: 24,
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsHeading: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    paddingTop: 8,
  },
  headerWithSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBarInHeader: {
    flex: 1,
    minWidth: 0,
  },
  itemCardWrapper: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "column",
    alignItems: "stretch",
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SEARCH_GRID_GAP,
    paddingTop: 8,
  },
  skeletonItem: {
    width: "48%",
    marginBottom: 8,
  },
});
