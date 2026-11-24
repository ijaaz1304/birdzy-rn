import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ExploreStackParamList } from "../../../navigation/types";
import { NavBackIcon, Text } from "../../../atoms";
import { FilterActionButton, SearchBar } from "../../../molecules";
import FilterModal from "../../../organisms/FilterModal/FilterModal";
import type { FilterState } from "../../../organisms/FilterModal/types";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { EXPLORE_COPY } from "../content/explore.strings";
import { useExploreStore } from "../explore.store";
import { exploreService } from "@/features/explore/services/explore.service";
import { ExploreFilterChips } from "../components/ExploreFilterChips";
import { ExploreResultCard } from "../components/ExploreResultList";
import { ExploreEmptyState } from "../components/ExploreEmptyState";
import { useNearbyBirdsForFilters } from "../hooks/useNearbyBirdsForFilters";
import {
  birdsLifeIdsFromGeoJSON,
  countFilterValues,
  filteredNearbyCards,
  withoutFilterValue,
} from "../utils/filteredNearbyResults";

/**
 * Figma 8947:19104 (Catalogue/Results), adapted to birds: shown after filters
 * are applied in Explore Near You. Lists nearby birds whose species appear in
 * the filtered map activity, with removable filter chips and a name search.
 */
export const ExploreFilterResultsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<ExploreStackParamList, "ExploreFilterResults">
    >();
  const {
    searchedLocation,
    filters,
    geoJSON,
    isMapDataLoading,
    mapDataError,
    applyFilters,
    retryMap,
  } = useExploreStore();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterData, setFilterData] = useState<Record<string, string[]>>();
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const filterCount = countFilterValues(filters);
  // Without filters this screen has nothing to show; the map lists every bird.
  useEffect(() => {
    if (!filterCount || !searchedLocation) navigation.goBack();
  }, [filterCount, searchedLocation, navigation]);

  const mapReady = !isMapDataLoading && !mapDataError;
  const matchingIds = useMemo(
    () => (mapReady ? birdsLifeIdsFromGeoJSON(geoJSON) : null),
    [mapReady, geoJSON]
  );
  const nearby = useNearbyBirdsForFilters(searchedLocation, matchingIds);
  const results = useMemo(
    () =>
      matchingIds ? filteredNearbyCards(nearby.cards, matchingIds, query) : [],
    [nearby.cards, matchingIds, query]
  );
  const resolving = !mapReady || (!nearby.complete && !nearby.error);
  const error = mapDataError ?? nearby.error;

  const updateFilters = useCallback(
    (next: FilterState) => {
      void applyFilters(next);
    },
    [applyFilters]
  );

  const openFilters = useCallback(async () => {
    if (filterLoading) return;
    if (filterData) {
      setShowFilters(true);
      return;
    }
    setFilterLoading(true);
    setFilterError(null);
    try {
      const options = await exploreService.getExploreFilterOptions();
      if (!mounted.current) return;
      setFilterData(options);
      setShowFilters(true);
    } catch {
      if (mounted.current) setFilterError(EXPLORE_COPY.filterFailed);
    } finally {
      if (mounted.current) setFilterLoading(false);
    }
  }, [filterLoading, filterData]);

  const header = (
    <View style={styles.listHeader}>
      {/* Figma: Title/20px/SemiBold, then chips 16 below, grid 16 below. */}
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[styles.title, { color: theme.colors.textPrimary }]}
      >
        {EXPLORE_COPY.results}
      </Text>
      <ExploreFilterChips
        filters={filters}
        onRemove={(key, value) =>
          updateFilters(withoutFilterValue(filters, key, value))
        }
      />
      {filterError && (
        <Text accessibilityRole="alert" color="error">
          {filterError}
        </Text>
      )}
      {error && (
        <View style={styles.message}>
          <Text accessibilityRole="alert" color="error">
            {error}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.retryBirds}
            onPress={() => (mapDataError ? retryMap() : nearby.retry())}
          >
            <Text color="primary">{EXPLORE_COPY.retry}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Figma 8947:19107: back (24) · search (flex) · filter (48) with count badge, gap 8. */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={EXPLORE_COPY.back}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.back}
        >
          <NavBackIcon color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={styles.search}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery("")}
            placeholder={EXPLORE_COPY.searchResults}
            accessibilityLabel={EXPLORE_COPY.searchResults}
            leftIcon="search"
            showFilterButton={false}
            returnKeyType="search"
          />
        </View>
        {filterLoading ? (
          <View style={styles.filterLoading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <FilterActionButton
            filterCount={filterCount}
            onPress={() => void openFilters()}
          />
        )}
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.archetypeId}
        numColumns={2}
        columnWrapperStyle={results.length ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={
          resolving ? (
            <ActivityIndicator
              accessibilityLabel={EXPLORE_COPY.loadingBirds}
              color={theme.colors.primary}
              style={styles.loader}
            />
          ) : error ? null : (
            <ExploreEmptyState filtered />
          )
        }
        ListFooterComponent={
          results.length && resolving ? (
            <ActivityIndicator
              accessibilityLabel={EXPLORE_COPY.moreBirds}
              color={theme.colors.primary}
              style={styles.loader}
            />
          ) : nearby.truncated ? (
            <Text color="textSecondary" style={styles.note}>
              {EXPLORE_COPY.resultsTruncated}
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <>
            <ExploreResultCard
              item={item}
              onPress={(id) =>
                navigation.navigate("BirdDetails", {
                  mushroomId: id,
                  source: "explore",
                })
              }
            />
            {/* Keep a lone last card at half width, as in the Figma grid. */}
            {index === results.length - 1 && results.length % 2 === 1 && (
              <View style={styles.cellFiller} />
            )}
          </>
        )}
      />
      {showFilters && filterData && (
        <FilterModal
          visible
          onClose={() => setShowFilters(false)}
          filterDataFromApi={filterData}
          defaultFilters={filters}
          onApplyFilters={(values, hasFilters) => {
            updateFilters(hasFilters ? values : {});
            setShowFilters(false);
          }}
          comingFrom="global_collection"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Figma: content px20, search row 8 below the status bar.
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  back: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  search: { flex: 1, minWidth: 0 },
  filterLoading: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  // Figma: results start 24 below the search row; cards 12 apart.
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  listHeader: { gap: 16, marginBottom: 16 },
  title: { fontFamily: FONTS.bold, fontSize: 20, lineHeight: 28 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  cellFiller: { flex: 1 },
  message: { gap: 8, alignItems: "center" },
  loader: { paddingVertical: 24 },
  note: { textAlign: "center", paddingVertical: 16 },
});
