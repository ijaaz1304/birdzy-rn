import { EXPLORE_COLORS } from "../content/explore.colors";
import { EXPLORE_MAP_FILTERS } from "../content/explore.config";
import { EXPLORE } from "../content/explore.config";
import {
  EXPLORE_SCOPE_DESCRIPTION,
  EXPLORE_COPY,
} from "../content/explore.strings";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ExploreStackParamList } from "../../../navigation/types";
import { Text, NavBackIcon, Icon } from "../../../atoms";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { ExploreMapView } from "../components/ExploreMapView";
import { ExploreLocationSearchBar } from "../components/ExploreLocationSearchBar";

import { ExploreResultList } from "../components/ExploreResultList";
import { AppCard } from "../../../components/shared";
import FilterModal from "../../../organisms/FilterModal/FilterModal";

import { useExploreStore } from "../explore.store";
import { cardsForMapSelection } from "../exploreSelection";
import { useExploreLocation } from "../useExploreLocation";
import { exploreService } from "@/features/explore/services/explore.service";

const FILTER_FIELDS = EXPLORE_MAP_FILTERS;
export const ExploreMapScreen: React.FC = () => {
  const theme = useTheme();
  const isDark = useIsDark();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<ExploreStackParamList, "ExploreMap">
    >();
  const route = useRoute<RouteProp<ExploreStackParamList, "ExploreMap">>();
  const locationFlow = useExploreLocation(route.params?.initialLocation);
  const {
    location,
    selectLocation,
    instant,
    isLocating,
    error: locationError,
    retryLocation,
  } = locationFlow;
  const {
    activeTab,
    searchedLocation,
    filters,
    data,
    geoJSON,
    isMapDataLoading,
    mapDataError,
    retryMap,
    tabs,
    pagination,
    isLoading,
    isLoadingMore,
    hasSearched,
    error,
    searchLocation,
    setTab,
    applyFilters,
    loadMore,
    retry,
    reset,
  } = useExploreStore();
  const [showFilters, setShowFilters] = useState(false);
  const [filterData, setFilterData] = useState<
    Record<string, string[]> | undefined
  >();
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const mounted = useRef(false);
  const [selectedBirdsLifeIds, setSelectedBirdsLifeIds] = useState<
    string[] | null
  >(null);
  const [clearSignal, setClearSignal] = useState(0);
  const queryMatchesLocation =
    !!location &&
    searchedLocation?.lat === location.latitude &&
    searchedLocation?.lng === location.longitude;
  const selection = useMemo(
    () => (selectedBirdsLifeIds ? new Set(selectedBirdsLifeIds) : null),
    [selectedBirdsLifeIds]
  );
  const displayedData = useMemo(
    () => (!queryMatchesLocation ? [] : cardsForMapSelection(data, selection)),
    [data, selection, queryMatchesLocation]
  );
  const mapCenter = useMemo<[number, number] | undefined>(
    () => (location ? [location.longitude, location.latitude] : undefined),
    [location]
  );
  // Each entry owns its query lifecycle; leaving aborts queued and in-flight reads.
  useEffect(() => {
    reset();
    return reset;
  }, [reset]);
  const initialTab = route.params?.initialTab;
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab, setTab]);
  useEffect(() => {
    if (location)
      searchLocation({ lat: location.latitude, lng: location.longitude });
  }, [location, searchLocation]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const openFilters = useCallback(async () => {
    if (filterLoading) return;
    if (filterData) {
      setShowFilters(true);
      return;
    }
    setFilterLoading(true);
    setFilterError(null);
    try {
      const options = await exploreService.getFilterItems();
      if (!mounted.current) return;
      const scoped = Object.fromEntries(
        FILTER_FIELDS.flatMap((key) => {
          const values = options?.[key];
          return Array.isArray(values) && values.length ? [[key, values]] : [];
        })
      );
      if (!Object.keys(scoped).length)
        throw new Error(
          "Filter options are unavailable. Tap Filters to retry."
        );
      setFilterData(scoped);
      setShowFilters(true);
    } catch {
      if (mounted.current)
        setFilterError("Unable to load filter options. Tap Filters to retry.");
    } finally {
      if (mounted.current) setFilterLoading(false);
    }
  }, [filterLoading, filterData]);
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={EXPLORE_COPY.back}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          {EXPLORE_COPY.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.mapContainer}>
        <ExploreMapView
          center={mapCenter}
          instant={instant}
          geoJSON={queryMatchesLocation ? geoJSON : undefined}
          onSelectionChange={setSelectedBirdsLifeIds}
          clearSelectionSignal={clearSignal}
          headerOverlay={
            <ExploreLocationSearchBar
              locationLabel={location?.label}
              onSelectLocation={selectLocation}
            />
          }
          selectionOverlay={
            <View style={styles.selectionPanel}>
              <Text weight="semibold" style={styles.selectionPanelTitle}>
                Birds in This Area ({displayedData.length})
              </Text>
              <FlatList
                data={displayedData}
                keyExtractor={(item) => item.archetypeId}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectionPanelList}
                renderItem={({ item }) => (
                  <AppCard
                    imageUrls={
                      item.defaultImageUrl
                        ? [item.defaultImageUrl]
                        : item.imageUrls
                    }
                    hasSound={false}
                    title={item.scientificName}
                    subtitle={item.commonName ?? undefined}
                    enableImageCarousel={false}
                    onPress={() =>
                      navigation.navigate("BirdDetails", {
                        mushroomId: item.archetypeId,
                        source: "explore",
                      })
                    }
                    style={styles.selectionPanelCard}
                  />
                )}
              />
            </View>
          }
        />
        <View style={styles.searchOverlay}>
          <View style={styles.container}>
            <ExploreLocationSearchBar
              locationLabel={location?.label}
              onSelectLocation={selectLocation}
            />
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.mapFilters}
            accessibilityState={{ busy: filterLoading }}
            disabled={filterLoading}
            style={[
              styles.filterButton,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: theme.colors.border0,
              },
            ]}
            onPress={() => openFilters()}
          >
            {filterLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Icon name="filter" size={20} color={theme.colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, styles.activitySwatch]} />
            <Text variant="body" size="small">
              {EXPLORE_COPY.activityAreas}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, styles.selectedSwatch]} />
            <Text variant="body" size="small">
              {EXPLORE_COPY.selectedArea}
            </Text>
          </View>
        </View>
        {location && (
          <View
            style={[
              styles.currentLocation,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: theme.colors.border0,
              },
            ]}
          >
            <Text variant="body" size="small" color="textSecondary">
              {EXPLORE_COPY.currentLocation}
            </Text>
            <Text
              variant="body"
              size="small"
              weight="semibold"
              numberOfLines={1}
              style={styles.currentLocationValue}
            >
              {location.label}
            </Text>
          </View>
        )}
        {queryMatchesLocation && isMapDataLoading && (
          <ActivityIndicator
            accessibilityLabel={EXPLORE_COPY.loadingActivity}
            color={theme.colors.primary}
          />
        )}
        {queryMatchesLocation && mapDataError && (
          <View style={styles.mapDataError}>
            <Text accessibilityRole="alert" color="error">
              {mapDataError}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={EXPLORE_COPY.retryMapActivity}
              onPress={() => retryMap()}
            >
              <Text color="primary">{EXPLORE_COPY.retryMapActivity}</Text>
            </TouchableOpacity>
          </View>
        )}
        {filterError && (
          <Text accessibilityRole="alert" color="error">
            {filterError}
          </Text>
        )}
      </View>
      <Text style={styles.scopeDescription} size="small" color="textSecondary">
        {EXPLORE_SCOPE_DESCRIPTION(EXPLORE.SEARCH_RADIUS_KM)}
      </Text>
      <View style={styles.tabs}>
        {(["growingNow", "yearRound"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            style={[
              styles.tab,
              activeTab === tab && {
                borderBottomColor: isDark
                  ? theme.colors.textBrand
                  : EXPLORE_COLORS.activeTab,
              },
            ]}
            onPress={() => setTab(tab)}
          >
            <Text
              variant="body"
              weight={activeTab === tab ? "medium" : "normal"}
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab
                      ? isDark
                        ? theme.colors.textBrand
                        : EXPLORE_COLORS.activeTab
                      : isDark
                      ? theme.colors.textSecondary
                      : EXPLORE_COLORS.inactiveTab,
                },
              ]}
            >
              {tab === "growingNow"
                ? EXPLORE_COPY.spottedNow
                : EXPLORE_COPY.yearRound}
              {tabs && queryMatchesLocation
                ? ` (${
                    tab === "growingNow"
                      ? tabs.spottedNowCount
                      : tabs.yearRoundCount
                  })`
                : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedBirdsLifeIds && queryMatchesLocation && (
        <View style={styles.selection}>
          <Text variant="body" size="small" color="textSecondary">
            {displayedData.length} loaded birds in selected group
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.clearSelection}
            onPress={() => setClearSignal((value) => value + 1)}
            hitSlop={8}
          >
            <Text color="primary">{EXPLORE_COPY.clear}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.container}>
        {!location ? (
          <View style={styles.locationState}>
            {isLocating ? (
              <>
                <ActivityIndicator color={theme.colors.primary} />
                <Text>{EXPLORE_COPY.locating}</Text>
              </>
            ) : (
              <>
                <Text accessibilityRole="alert" color="textSecondary">
                  {locationError ?? EXPLORE_COPY.searchToExplore}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={EXPLORE_COPY.retryLocation}
                  onPress={() => retryLocation()}
                >
                  <Text color="primary">{EXPLORE_COPY.retryLocation}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <ExploreResultList
            data={displayedData}
            isLoading={isLoading || !queryMatchesLocation}
            isLoadingMore={isLoadingMore}
            hasSearched={hasSearched && queryMatchesLocation}
            error={queryMatchesLocation ? error : null}
            onRetry={retry}
            selectionActive={!!selectedBirdsLifeIds}
            hasMore={data.length < (pagination?.totalCount ?? 0)}
            onEndReached={loadMore}
            onCardPress={(id) =>
              navigation.navigate("BirdDetails", {
                mushroomId: id,
                source: "explore",
              })
            }
          />
        )}
      </View>
      {showFilters && filterData && (
        <FilterModal
          visible
          onClose={() => setShowFilters(false)}
          filterDataFromApi={filterData}
          defaultFilters={filters}
          onApplyFilters={(values, hasFilters) => {
            applyFilters(hasFilters ? values : {});
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
  headerSpacer: { width: 24 },
  scopeDescription: { paddingHorizontal: 16 },
  activitySwatch: {
    backgroundColor: EXPLORE_COLORS.sightingsBackground,
    borderColor: EXPLORE_COLORS.sightingsStroke,
  },
  selectedSwatch: {
    backgroundColor: EXPLORE_COLORS.selectedBackground,
    borderColor: EXPLORE_COLORS.selectedStroke,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  mapContainer: { height: 280 },
  searchOverlay: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapDataError: { gap: 4 },
  selectionPanel: { maxHeight: 220, paddingBottom: 8 },
  selectionPanelTitle: { paddingHorizontal: 16, paddingBottom: 8 },
  selectionPanelList: { paddingHorizontal: 16, gap: 12 },
  selectionPanelCard: { width: 140 },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1 },
  legend: { paddingHorizontal: 16, paddingTop: 8, gap: 4 },
  currentLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 4,
  },
  currentLocationValue: { flex: 1 },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  selection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  locationState: {
    flex: 1,
    padding: 24,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
