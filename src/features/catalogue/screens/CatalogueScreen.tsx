import { getResponsiveGridColumns } from "@/utils/responsiveLayout";
/**
 * Catalogue Screen - Global item listing
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ViewToken,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
  useWindowDimensions,
} from "react-native";
import { Icon } from "../../../atoms";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Images } from "../../../assets";
import { Text } from "../../../atoms";
import { SearchBar, Tab } from "../../../molecules";
import FilterModal from "../../../organisms/FilterModal/FilterModal";
import { EmptyState } from "../components/EmptyState";
import { CatalogueStackParamList } from "../../../navigation/types";
import { useFeatureConfig } from "../../../config/context";
import { screenStyles } from "../../../styles/common";
import { FilterState } from "../../../organisms/FilterModal/types";
import { AppCard } from "../../../components/shared";
import { useCatalogueCardSound } from "../hooks/useCatalogueCardSound";
import { useBirdsStore } from "../birds.store";
import { CardSkeleton } from "../../../components/skeleton";
import { waitForAuthentication } from "../../../utils/authUtils";
import { useAuthStore } from "../../auth/auth.store";
import { CARD_COLORS, UI_COLORS } from "../../../constants/colorConstants";
import { APP_COLORS } from "../../../config/colors";
import {
  PAGINATION,
  AUTH_WAIT,
  CATEGORIES,
  SKELETON_COUNTS,
  FLATLIST_CONFIG,
} from "../../../constants/appConstants";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { useStrings } from "../../../hooks/useStrings";
import { useToast } from "../../../hooks";
import { RemoveFromWishlistConfirmation } from "../../../components/RemoveFromWishlistConfirmation";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { resolveBirdDiscoveryLocation } from "../../../utils/birdDiscoveryLocation.helpers";
import { isSessionExpiryError } from "../../../services/api/errors";

import { Radius } from "../../../design";
import { useExploreEntry } from "../../explore/useExploreEntry";
import { useLocationPermissionGranted } from "../../explore/useLocationPermissionGranted";
import { ExploreEntryButton } from "../../explore/components/ExploreEntryButton";
import { HomeExploreNearYouSection } from "../../explore/components/HomeExploreNearYouSection";

import {
  mapMushroomToCatalogueCard,
  type CatalogueCardItem,
  type MushroomLike,
} from "../../../utils/mushroomCardUtils";
import {
  prefetchRemoteImage,
  prefetchRemoteImages,
} from "../../../utils/prefetchImages";
import {
  CATALOGUE_IMAGE_PREFETCH_LIMIT,
  isCatalogueAllTabWarm,
  warmCatalogueListThumbnailCache,
} from "../warmCatalogueList";
import {
  getCatalogueTabFilters,
  normalizeArchetypeListItem,
} from "../../../utils/mushroomApiMappers";
import type { MushroomListItem } from "../../../types/mushrooms.types";

type CatalogueTabCache = {
  mushrooms: MushroomListItem[];
  totalCount: number;
  currentPage: number;
};

function getCatalogueTabCacheKey(
  tab: string,
  activeFilters: FilterState
): string {
  const filterKeys = Object.keys(activeFilters).filter(
    (key) => (activeFilters[key]?.length ?? 0) > 0
  );
  if (filterKeys.length > 0) {
    return `filters:${JSON.stringify(activeFilters)}`;
  }
  return `tab:${tab}`;
}

/** Format filter key or value for display (e.g. crystal_system → Crystal System). */
function formatFilterLabel(s: string): string {
  if (!s || typeof s !== "string") return s;
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Active filter chip: solid border (replaces linear gradient) */
const FILTER_CHIP_BORDER_WIDTH = 1;
const FILTER_CHIP_RADIUS = 20;
/** 2-column catalogue grid — fixed card width avoids odd-count stretch. */
const CATALOGUE_GRID_H_PADDING = 12;
const CATALOGUE_GRID_GAP = 12;

type CatalogueScreenNavigationProp = NativeStackNavigationProp<
  CatalogueStackParamList,
  "CatalogueMain"
>;
type CatalogueScreenRouteProp = RouteProp<
  CatalogueStackParamList,
  "CatalogueMain"
>;

export const CatalogueScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const gridColumns = getResponsiveGridColumns(windowWidth, fontScale);
  const catalogueCardWidth = Math.max(
    1,
    (windowWidth -
      CATALOGUE_GRID_H_PADDING * 2 -
      CATALOGUE_GRID_GAP * (gridColumns - 1)) /
      gridColumns
  );
  const navigation = useNavigation<CatalogueScreenNavigationProp>();
  const route = useRoute<CatalogueScreenRouteProp>();
  const catalogueConfig = useFeatureConfig("catalogue");
  // Initialize with category from route params if provided, otherwise use default
  const initialCategory =
    route.params?.category ||
    catalogueConfig.categories[0]?.value ||
    CATEGORIES.ALL;
  const [selectedTab, setSelectedTab] = useState(initialCategory);
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterApiData, setFilterApiData] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const strings = useStrings();
  const { openExplore, popups: explorePopups } = useExploreEntry();
  const locationPermissionGranted = useLocationPermissionGranted();
  const { showToast } = useToast();
  const { playingId, toggleSound } = useCatalogueCardSound();

  // Fetch filter options on first catalogue load so modal opens with list ready
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
  // Use minerals store
  const {
    mushrooms,
    isLoading,
    fetchMushrooms,
    filterMushrooms,
    currentPage,
    totalCount,
    favorites,
    toggleFavorite,
  } = useBirdsStore();
  const suppressedWishlistIds = useBirdsStore((s) => s.suppressedWishlistIds);
  const isFirstCatalogueFocus = useRef(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showRemoveWishlistConfirm, setShowRemoveWishlistConfirm] =
    useState(false);
  const [pendingWishlistRemove, setPendingWishlistRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<{
    all?: number;
    raptors?: number;
    songbirds?: number;
    waterBirds?: number;
    threatened?: number;
    soaring?: number;
  }>({});
  const tabCacheRef = useRef<Record<string, CatalogueTabCache>>({});
  const tabScrollRef = useRef<ScrollView>(null);
  const tabLayoutsRef = useRef<Record<string, { x: number; width: number }>>(
    {}
  );
  const flatListRef = useRef<FlatList<CatalogueCardItem>>(null);
  const loadGenerationRef = useRef(0);
  const catalogueContextRef = useRef({
    tab: initialCategory,
    filters: {} as FilterState,
  });

  // Fetch archetype stats for category tab counts (API catalogue chips)
  useEffect(() => {
    let cancelled = false;
    archetypeService
      .getArchetypeStats()
      .then((stats) => {
        if (!cancelled) setCategoryCounts(stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const persistTabCache = useCallback(
    (tab: string, activeFilters: FilterState) => {
      const state = useBirdsStore.getState();
      if (state.mushrooms.length === 0 && state.totalCount === 0) {
        return;
      }
      const key = getCatalogueTabCacheKey(tab, activeFilters);
      tabCacheRef.current[key] = {
        mushrooms: state.mushrooms,
        totalCount: state.totalCount,
        currentPage: state.currentPage,
      };
    },
    []
  );

  const restoreTabCache = useCallback((key: string): boolean => {
    const cached = tabCacheRef.current[key];
    if (!cached) {
      return false;
    }
    useBirdsStore.setState({
      mushrooms: cached.mushrooms,
      totalCount: cached.totalCount,
      currentPage: cached.currentPage,
      isLoading: false,
      error: null,
    });
    return true;
  }, []);

  const scrollTabIntoView = useCallback((tabValue: string, animated = true) => {
    const layout = tabLayoutsRef.current[tabValue];
    if (!layout || !tabScrollRef.current) return;
    const scrollX = Math.max(0, layout.x - 20);
    tabScrollRef.current.scrollTo({ x: scrollX, animated });
  }, []);

  // Update selectedTab when route params change (e.g., navigating from home with category)
  useEffect(() => {
    if (!route.params?.category) return;
    setSelectedTab(route.params.category);
    requestAnimationFrame(() => {
      scrollTabIntoView(route.params?.category ?? selectedTab, false);
    });
  }, [route.params?.category, scrollTabIntoView]);

  const handleTabPress = useCallback(
    (tabValue: string) => {
      if (tabValue === selectedTab) return;
      // Scroll tab chip immediately; list scroll is instant (no competing animations).
      scrollTabIntoView(tabValue, true);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      setSelectedTab(tabValue);
      if (Object.keys(filters).length > 0) {
        setFilters({});
      }
    },
    [filters, scrollTabIntoView, selectedTab]
  );

  // Load minerals function - reusable for refresh and pagination
  const loadMinerals = useCallback(
    async (
      pageNo: number = PAGINATION.INITIAL_PAGE,
      append: boolean = false,
      keepPrevious: boolean = false
    ) => {
      const generation = ++loadGenerationRef.current;

      // Check if auth is already ready (no need to wait)
      const authStore = useAuthStore.getState();
      const isAuthReady = !!authStore.token || !authStore.isLoading;

      if (!isAuthReady) {
        // Only wait if auth is not ready
        const isReady = await waitForAuthentication(
          AUTH_WAIT.MAX_WAIT_TIME_MS,
          AUTH_WAIT.CHECK_INTERVAL_MS
        );
        if (!isReady) {
          console.log("Auth not ready, skipping mineral load");
          return;
        }
      }

      // Drop stale responses from a previous tab/filter switch
      if (generation !== loadGenerationRef.current) {
        return;
      }

      try {
        if (append) {
          setLoadingMore(true);
        }

        if (hasActiveFilters) {
          // Apply filters with pagination
          await filterMushrooms(
            filters,
            pageNo,
            PAGINATION.CATALOGUE_PAGE_SIZE,
            append,
            keepPrevious
          );
        } else if (selectedTab === CATEGORIES.NEAR_YOU) {
          if (!append) useBirdsStore.setState({ isLoading: true, error: null });
          const discovery = await resolveBirdDiscoveryLocation();
          if (!discovery) {
            useBirdsStore.setState({
              mushrooms: [],
              totalCount: 0,
              isLoading: false,
              error:
                "Turn on location or choose a birding region in Settings to see birds near you.",
            });
            return;
          }
          const { data, pagination } = await archetypeService.stepByStep(
            {
              location: {
                lat: discovery.coords[0],
                lng: discovery.coords[1],
              },
              seenDate: new Date().toISOString().slice(0, 10),
              region:
                discovery.source !== "gps" ? discovery.regionId : undefined,
            },
            { pageNo: pageNo + 1, pageSize: 40 }
          );
          if (generation !== loadGenerationRef.current) return;
          const nextItems = data.map((item) =>
            normalizeArchetypeListItem(
              item as unknown as Record<string, unknown>
            )
          );
          useBirdsStore.setState((state) => {
            const items = new Map(
              (append ? state.mushrooms : []).map((item) => [
                item.archetypeId,
                item,
              ])
            );
            nextItems.forEach((item) => items.set(item.archetypeId, item));
            const mushrooms = [...items.values()];
            return {
              mushrooms,
              totalCount:
                append && mushrooms.length === state.mushrooms.length
                  ? mushrooms.length
                  : pagination.totalCount,
              currentPage: pageNo,
              isLoading: false,
              error: null,
            };
          });
        } else if (selectedTab === CATEGORIES.ALL) {
          await fetchMushrooms(
            pageNo,
            PAGINATION.CATALOGUE_PAGE_SIZE,
            append,
            keepPrevious
          );
        } else {
          const tabFilters = getCatalogueTabFilters(selectedTab);
          await filterMushrooms(
            tabFilters,
            pageNo,
            PAGINATION.CATALOGUE_PAGE_SIZE,
            append,
            keepPrevious
          );
        }

        if (generation !== loadGenerationRef.current) {
          return;
        }
        persistTabCache(selectedTab, filters);
      } catch (error) {
        if (
          selectedTab === CATEGORIES.NEAR_YOU &&
          generation === loadGenerationRef.current
        ) {
          useBirdsStore.setState({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load nearby birds. Please try again.",
          });
        }
        if (!isSessionExpiryError(error)) {
          console.error("Error loading minerals:", error);
        }
      } finally {
        if (append && generation === loadGenerationRef.current) {
          setLoadingMore(false);
        }
      }
    },
    [
      selectedTab,
      filters,
      hasActiveFilters,
      fetchMushrooms,
      filterMushrooms,
      persistTabCache,
    ]
  );

  // Load more minerals when reaching end of list
  const appendRequestRef = useRef(false);
  const handleLoadMore = useCallback(() => {
    if (appendRequestRef.current) return;
    if (!loadingMore && !isLoading && mushrooms.length < totalCount) {
      const nextPage = currentPage + 1;
      appendRequestRef.current = true;
      void loadMinerals(nextPage, true).then(
        () => {
          appendRequestRef.current = false;
        },
        () => {
          appendRequestRef.current = false;
        }
      );
    }
  }, [
    loadingMore,
    isLoading,
    mushrooms.length,
    totalCount,
    currentPage,
    loadMinerals,
  ]);

  // The previous behaviour truncated the list to the first page when the
  // screen lost focus (to show only 100 items). That logic was preventing
  // infinite-scroll from working correctly. With new API‑on‑scroll behaviour
  // we no longer clear pages on focus.
  //
  // useFocusEffect(
  //   useCallback(
  //     () => () => {
  //       if (currentPage > 0) clearPaginationBeyondFirstPage();
  //     },
  //     [currentPage, clearPaginationBeyondFirstPage],
  //   ),
  // );

  // Reset search/filter state when re-entering Catalogue (e.g. back from Home or from SearchFilter)
  // so that All Minerals shows the full list instead of stale search/filter results.
  // Only clear store + local state here; useEffect([selectedTab, filters]) will run loadMinerals when filters change (avoids infinite loop from effect deps).
  useFocusEffect(
    useCallback(() => {
      if (isFirstCatalogueFocus.current) {
        isFirstCatalogueFocus.current = false;
        return;
      }
      const state = useBirdsStore.getState();
      const hasSearch = (state.searchQuery ?? "").trim().length > 0;
      const hasFilters = Object.keys(state.activeFilters ?? {}).length > 0;
      if (hasSearch || hasFilters) {
        state.clearSearch();
        state.clearFilters();
        setFilters({});
      }
    }, [])
  );

  // Fetch minerals on mount and when filters/category change
  useEffect(() => {
    const previousContext = catalogueContextRef.current;
    const previousKey = getCatalogueTabCacheKey(
      previousContext.tab,
      previousContext.filters
    );
    const nextKey = getCatalogueTabCacheKey(selectedTab, filters);
    const isContextSwitch = previousKey !== nextKey;

    if (isContextSwitch) {
      persistTabCache(previousContext.tab, previousContext.filters);
    }
    catalogueContextRef.current = { tab: selectedTab, filters };

    if (restoreTabCache(nextKey)) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      return;
    }

    if (
      selectedTab === CATEGORIES.ALL &&
      !hasActiveFilters &&
      isCatalogueAllTabWarm()
    ) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      warmCatalogueListThumbnailCache();
      return;
    }

    // Keep previous cards visible during tab switches so the UI doesn't jump to skeletons.
    const keepPrevious =
      isContextSwitch &&
      useBirdsStore.getState().mushrooms.length > 0 &&
      !hasActiveFilters;

    loadMinerals(PAGINATION.INITIAL_PAGE, false, keepPrevious);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, filters]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMinerals(PAGINATION.INITIAL_PAGE, false);
    } finally {
      setRefreshing(false);
    }
  }, [loadMinerals]);

  const filteredItems = useMemo(() => {
    const items = mushrooms.map((mineral) =>
      mapMushroomToCatalogueCard(mineral as MushroomLike, selectedTab)
    );
    return [...items].sort((a, b) => a.name.length - b.name.length);
  }, [mushrooms, selectedTab]);

  const prevFilteredLengthRef = useRef(0);

  useEffect(() => {
    const thumbs = filteredItems.map(
      (item) => item.imageUrls?.[0] ?? item.image?.uri
    );
    prefetchRemoteImages(thumbs, CATALOGUE_IMAGE_PREFETCH_LIMIT);

    const prevLen = prevFilteredLengthRef.current;
    const len = filteredItems.length;
    if (len > prevLen && prevLen > 0) {
      prefetchRemoteImages(
        filteredItems
          .slice(prevLen)
          .map((item) => item.imageUrls?.[0] ?? item.image?.uri),
        50
      );
    }
    prevFilteredLengthRef.current = len;
  }, [filteredItems]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 35 }).current;

  const onViewableItemsChanged = useRef(
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

  const handleApplyFilters = (newFilters: FilterState, hasFilters: boolean) => {
    analyticsService.logEvent(EVENTS.filter_field_selected_catalogue, {
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

  const removeFilterValue = useCallback(
    (filterKey: string, value: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        const arr = (next[filterKey] || []).filter((v) => v !== value);
        if (arr.length === 0) delete next[filterKey];
        else next[filterKey] = arr;
        const hasActive = Object.keys(next).some(
          (k) => (next[k]?.length ?? 0) > 0
        );
        if (hasActive) {
          filterMushrooms(
            next,
            PAGINATION.INITIAL_PAGE,
            PAGINATION.CATALOGUE_PAGE_SIZE,
            false
          );
        }
        return next;
      });
    },
    [filterMushrooms]
  );

  const filterChipItems = useMemo(() => {
    const items: { filterKey: string; value: string; label: string }[] = [];
    Object.entries(filters).forEach(([key, values]) => {
      (values || []).forEach((value) => {
        items.push({
          filterKey: key,
          value,
          label: formatFilterLabel(value),
        });
      });
    });
    return items;
  }, [filters]);

  const handleItemPress = useCallback(
    (mushroomId: string, previewUri?: string) => {
      analyticsService.logEvent(EVENTS.global_catalogue_item, {
        collection_name: selectedTab,
      });
      void prefetchRemoteImage(previewUri);
      navigation.navigate("BirdDetails", {
        mushroomId,
        source: "catalogue",
        previewImageUri: previewUri,
      });
    },
    [navigation, selectedTab]
  );

  const isDark = useIsDark();
  const cardBorderColor = isDark
    ? CARD_COLORS.DARK.border
    : CARD_COLORS.LIGHT.border;
  const cardBg = isDark
    ? CARD_COLORS.DARK.background
    : CARD_COLORS.LIGHT.background;

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredItems)[0] }) => {
      const isStarred = suppressedWishlistIds.includes(item.id)
        ? false
        : favorites.includes(item.id) || item.isWishlisted === true;
      return (
        <AppCard
          image={item.image}
          imageUrls={item.imageUrls}
          title={item.name}
          subtitle={item.scientificName}
          enableImageCarousel={false}
          onPress={() =>
            handleItemPress(item.id, item.imageUrls?.[0] ?? item.image?.uri)
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
              width: catalogueCardWidth,
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
      handleItemPress,
      cardBorderColor,
      cardBg,
      catalogueCardWidth,
      favorites,
      suppressedWishlistIds,
      toggleFavorite,
      showToast,
      strings.collection.favorite,
      playingId,
      toggleSound,
    ]
  );

  const catalogueBg = colors.background;

  return (
    <SafeAreaView
      style={[screenStyles.safeArea, { backgroundColor: catalogueBg }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header: back + search bar */}
        <View
          style={[
            styles.headerWrapper,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <View
            style={[
              styles.header,
              styles.headerWithSearch,
              { paddingHorizontal: Space[4] },
            ]}
          >
            <View style={styles.headerTopRow}>
              <Text variant="title" size="large" weight="bold">
                {catalogueConfig.screenTitle}
              </Text>
              <ExploreEntryButton
                label={strings.catalogue.screen.exploreNearYou}
                onPress={() => void openExplore("growingNow")}
              />
            </View>
            <View style={styles.searchRow}>
              <View style={styles.searchBarInHeader}>
                <SearchBar
                  value=""
                  onChangeText={() => {}}
                  onClear={() => {}}
                  placeholder={catalogueConfig.searchPlaceholder}
                  editable={false}
                  showFilterButton={false}
                  leftIcon="search"
                  onPressBar={() => navigation.navigate("SearchFilter")}
                />
              </View>
              <View style={styles.filterButtonWrap}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: colors.surfacePrimary,
                      borderColor: colors.border0,
                    },
                  ]}
                  onPress={() => {
                    analyticsService.logEvent(EVENTS.filter_global_catalogue);
                    setShowFilterModal(true);
                  }}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="filter" size={24} color={colors.textPrimary} />
                  {totalFilterCount > 0 && (
                    <View
                      style={[
                        styles.filterButtonBadge,
                        {
                          backgroundColor: UI_COLORS.ERROR_RED,
                          borderColor: colors.surfacePrimary,
                        },
                      ]}
                    >
                      <RNText style={styles.filterButtonBadgeText}>
                        {totalFilterCount > 99 ? "99+" : totalFilterCount}
                      </RNText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Main content below header */}
        <View style={styles.contentBelowHeader}>
          {!hasActiveFilters && (
            <View
              style={[
                styles.exploreHeader,
                { paddingHorizontal: Space[4], marginBottom: Space[2] },
              ]}
            >
              <HomeExploreNearYouSection
                showRows={false}
                sideMargin={Space[4]}
                onExploreMap={() => void openExplore("growingNow")}
                onGrowingNow={() => void openExplore("growingNow")}
                onYearRound={() => void openExplore("yearRound")}
                locationGranted={locationPermissionGranted !== false}
              />
            </View>
          )}
          {/* Category Tabs – hidden when filters are active */}
          {!hasActiveFilters && (
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="normal"
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.tabsContainer,
                {
                  paddingHorizontal: Space[4],
                  marginBottom: Space[2],
                  flexGrow: 0,
                },
              ]}
            >
              {catalogueConfig.categories.map((tab) => {
                const baseLabel = tab.label.replace(/\s*\(\d+\)\s*$/, "");
                // Prefer stable archetype stats so tab chip widths don't jump on each fetch.
                const statsCount =
                  tab.value === "All"
                    ? categoryCounts?.all
                    : tab.value === "Raptors"
                    ? categoryCounts?.raptors
                    : tab.value === "Songbirds"
                    ? categoryCounts?.songbirds
                    : tab.value === "Water birds"
                    ? categoryCounts?.waterBirds
                    : tab.value === "Threatened"
                    ? categoryCounts?.threatened
                    : tab.value === "Soaring"
                    ? categoryCounts?.soaring
                    : undefined;
                const label =
                  statsCount !== undefined
                    ? `${baseLabel} (${statsCount})`
                    : baseLabel;
                return (
                  <View
                    key={tab.value}
                    onLayout={(e) => {
                      tabLayoutsRef.current[tab.value] = {
                        x: e.nativeEvent.layout.x,
                        width: e.nativeEvent.layout.width,
                      };
                    }}
                    style={{ marginRight: Space[2], flexShrink: 0 }}
                  >
                    <Tab
                      label={label}
                      active={selectedTab === tab.value}
                      onPress={() => handleTabPress(tab.value)}
                      variant="underline"
                      size="small"
                      activeColor={APP_COLORS.ctaPrimary}
                      inactiveColor={colors.textSecondary}
                      underlineColor={APP_COLORS.ctaPrimary}
                    />
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Filter Chips – one per selected value, gradient border, X to remove */}
          {totalFilterCount > 0 && (
            <View style={styles.filterChipsSection}>
              <Text
                variant="title"
                size="small"
                weight="bold"
                style={[
                  styles.filterResultsHeading,
                  { color: colors.textPrimary, paddingHorizontal: Space[4] },
                ]}
              >
                {strings.catalogue.screen.results}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.filterChipsScroll,
                  {
                    paddingHorizontal: Space[4],
                    paddingVertical: 6,
                    marginBottom: Space[1],
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: Radius.sm,
                  },
                ]}
                style={styles.filterChipsScrollView}
              >
                {filterChipItems.map(({ filterKey, value, label }, index) => (
                  <View
                    key={`${filterKey}-${value}-${index}`}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.surfacePrimary,
                        borderColor: APP_COLORS.ctaPrimary,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setShowFilterModal(true)}
                      activeOpacity={0.8}
                      style={styles.filterChipLabelTouch}
                    >
                      <Text
                        variant="label"
                        size="small"
                        weight="medium"
                        numberOfLines={1}
                        style={[
                          styles.filterChipLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeFilterValue(filterKey, value)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.filterChipClose}
                      activeOpacity={0.7}
                    >
                      <CloseIcon
                        isDark={isDark}
                        style={styles.filterChipCloseIcon}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Skeletons only on first empty load — tab switches keep previous cards until new data arrives */}
          {isLoading && filteredItems.length === 0 ? (
            <View
              style={[
                styles.skeletonContainer,
                { paddingHorizontal: Space[4] },
              ]}
            >
              {Array.from({ length: SKELETON_COUNTS.CATALOGUE }).map((_, i) => (
                <View key={i} style={styles.skeletonItem}>
                  <CardSkeleton height={220} borderRadius={12} />
                </View>
              ))}
            </View>
          ) : filteredItems.length === 0 ? (
            <ScrollView
              contentContainerStyle={styles.emptyStateContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={APP_COLORS.ctaPrimary}
                  colors={[APP_COLORS.ctaPrimary]}
                />
              }
            >
              <EmptyState
                image={Images.catalogueNoResults}
                title={
                  hasActiveFilters
                    ? strings.catalogue.filterEmptyState.title
                    : catalogueConfig.emptyState.title
                }
                subtitle={
                  hasActiveFilters
                    ? strings.catalogue.filterEmptyState.subtitle
                    : catalogueConfig.emptyState.subtitle
                }
              />
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              key={`${
                hasActiveFilters ? "catalogue-filtered" : "catalogue-tabs"
              }-${gridColumns}`}
              data={filteredItems}
              extraData={favorites}
              numColumns={gridColumns}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderItem}
              columnWrapperStyle={
                gridColumns > 1
                  ? [
                      styles.columnWrapper,
                      {
                        paddingHorizontal: CATALOGUE_GRID_H_PADDING,
                        marginBottom: CATALOGUE_GRID_GAP,
                        gap: CATALOGUE_GRID_GAP,
                      },
                    ]
                  : undefined
              }
              contentContainerStyle={[
                {
                  paddingHorizontal:
                    gridColumns === 1 ? CATALOGUE_GRID_H_PADDING : 0,
                },
                screenStyles.scrollContent,
                { paddingTop: 8, paddingBottom: 88 },
              ]}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={APP_COLORS.ctaPrimary}
                  colors={[APP_COLORS.ctaPrimary]}
                />
              }
              initialNumToRender={FLATLIST_CONFIG.INITIAL_NUM_TO_RENDER}
              maxToRenderPerBatch={FLATLIST_CONFIG.MAX_TO_RENDER_PER_BATCH}
              windowSize={FLATLIST_CONFIG.WINDOW_SIZE}
              removeClippedSubviews={FLATLIST_CONFIG.REMOVE_CLIPPED_SUBVIEWS}
              updateCellsBatchingPeriod={
                FLATLIST_CONFIG.UPDATE_CELLS_BATCHING_PERIOD
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text variant="body" size="small" color="textSecondary">
                      Loading more...
                    </Text>
                  </View>
                ) : null
              }
            />
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
      {explorePopups}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterChipsSection: {
    width: "100%",
  },
  filterResultsHeading: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterChipsScrollView: {
    flexGrow: 0,
  },
  filterChipsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterChip: {
    marginRight: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: FILTER_CHIP_BORDER_WIDTH,
    borderRadius: FILTER_CHIP_RADIUS,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 24,
  },
  filterChipLabelTouch: {
    flexShrink: 1,
    justifyContent: "center",
  },
  filterChipLabel: {
    flexShrink: 1,
  },
  filterChipClose: {
    marginLeft: 4,
    padding: 4,
    minWidth: 24,
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipCloseIcon: {
    width: 16,
    height: 16,
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
  emptyStateContainer: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  exploreHeader: {
    marginBottom: 16, // Space[4]
  },
  categoryCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12, // Space[3]
  },
  categoryCard: {
    width: "48%",
    marginBottom: 12, // Space[3]
  },
  categoryCardContent: {
    width: "100%",
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 8,
  },
  skeletonItem: {
    width: "48%",
    marginBottom: 8,
  },
  // New styles from SearchScreen
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
    paddingVertical: 16, // Space[4]
  },
  headerWithSearch: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    overflow: "visible",
  },
  titleContainer: {
    width: "100%",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    overflow: "visible",
  },
  searchBarInHeader: {
    flex: 1,
    minWidth: 0,
  },
  filterButtonWrap: {
    overflow: "visible",
    flexShrink: 0,
    paddingTop: 6,
    paddingRight: 6,
    marginTop: -6,
    marginRight: -6,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  filterButtonIcon: {
    width: 24,
    height: 24,
  },
  filterButtonBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
  },
  filterButtonBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },
});
