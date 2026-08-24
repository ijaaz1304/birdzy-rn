/**
 * Collection Details Screen
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { useStrings } from "../../../hooks/useStrings";
import { Text, NavBackIcon } from "../../../atoms";
import { SearchBar, ActiveFilterChips, FilterActionButton } from "../../../molecules";
import FilterModal from "../../../organisms/FilterModal/FilterModal";
import {
  CollectionStackParamList,
  RootStackParamList,
} from "../../../navigation/types";
import { screenStyles } from "../../../styles/common";
import { Images } from "../../../assets";
import { AppImage } from "@/components/AppImage";
import { EmptyState } from "../../../molecules";
import {
  EmptyCollectionContent,
  RenameCollectionBottomSheet,
} from "../components";
import { useIdentificationEntryStore } from "../../camera/identificationEntry.store";
import { AppCard } from "../../../components/shared";
import { FilterState } from "../../../organisms/FilterModal/types";
import { useFeatureConfig } from "../../../config/context";
import { collectionService } from "../../../services/collection/collection.service";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";
import { archetypeService } from "../../../services/archetype/archetype.service";
import {
  getDisplayName,
  getMushroomDisplayScientificFromFields,
} from "../../../utils/mushroomDisplayUtils";
import { CardSkeleton } from "../../../components/skeleton";
import { useCollectionInvalidationStore } from "../collectionInvalidation.store";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";
import { DeleteCollectionConfirmation } from "../../../components/DeleteCollectionConfirmation";
import {
  getSpecimenDisplayImageUrls,
  isSystemCollectionName,
  looksLikeMongoCollectionId,
  resolveArchetypeIdFromSpecimen,
} from "../collection.utils";
import { useBackHandler } from "../../../utils/backHandler";

type CollectionDetailsScreenRouteProp = RouteProp<
  CollectionStackParamList,
  "CollectionDetails"
>;
type CollectionDetailsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CollectionStackParamList, "CollectionDetails">,
  NativeStackNavigationProp<RootStackParamList>
>;

export const CollectionDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const Space = theme.spacing;
  const tabBarHeight = useBottomTabBarHeight();
  const listBottomPadding = tabBarHeight + Space[4];
  const navigation = useNavigation<CollectionDetailsScreenNavigationProp>();
  const route = useRoute<CollectionDetailsScreenRouteProp>();
  const { collectionId, collectionName, collectionData } = route.params || {};
  const _catalogueConfig = useFeatureConfig("catalogue");

  const [allMinerals, setAllMinerals] = useState<any[]>([]);
  const initialCount = (collectionData as { count?: number })?.count ?? 0;
  const [totalItemCount, setTotalItemCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteCollection, setShowDeleteCollection] = useState(false);
  const [showRenameCollection, setShowRenameCollection] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);
  const displayName = resolvedTitle ?? collectionName ?? "Collection";
  const strings = useStrings();

  const isSystemCollection = isSystemCollectionName(displayName);
  const canDeleteCollection =
    !isSystemCollection &&
    !!collectionId &&
    looksLikeMongoCollectionId(collectionId);
  const canRenameCollection = canDeleteCollection;

  // Map API specimen to mineral item for list (display name + image from utils).
  // Resolve relative imageUrls (e.g. "aquamarine_0.jpg") to full URLs via getMushroomImageUrlFromMatch so list images load.
  const mapSpecimenToMushroom = useCallback((specimen: any) => {
    const specimenId = specimen.specimenId ?? specimen._id;
    const archetypeId = resolveArchetypeIdFromSpecimen(
      specimen as Record<string, unknown>
    );
    const canonicalName =
      (specimen as { canonicalName?: string }).canonicalName ??
      specimen.scientificName;
    const resolvedUris = getSpecimenDisplayImageUrls({
      ...specimen,
      canonicalName,
    });
    const firstResolved = resolvedUris[0];
    return {
      id: specimenId,
      specimenId,
      archetypeId,
      name: getDisplayName(specimen),
      scientificName:
        getMushroomDisplayScientificFromFields(specimen) ?? "",
      image: firstResolved ? { uri: firstResolved } : undefined,
      imageUrls: resolvedUris.length > 0 ? resolvedUris : undefined,
      isWishlisted: !!specimen.isWishlisted,
    };
  }, []);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const collectionInvalidationVersion = useCollectionInvalidationStore(
    (s) => s.version
  );
  const [filterApiData, setFilterApiData] = useState<
    Record<string, string[]> | undefined
  >(undefined);

  // Fetch filter options (same as catalogue) so collection filter modal has same options
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

  // Build API filter payload from FilterState (same keys as MushroomSpecimenFilterRequest)
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

  // Fetch collection details: system collections use specimen filters; user-created use fetchAll + getDetails + specimens.
  useEffect(() => {
    const resolveUserCollectionId = async (
      name: string,
      idHint?: string
    ): Promise<string | undefined> => {
      if (idHint && looksLikeMongoCollectionId(idHint)) return idHint;
      const listResult = await collectionService.fetchAllCollections({
        pageNo: 0,
        pageSize: 50,
        search: name.trim() || undefined,
      });
      const match =
        listResult.data.find((c) => c.name === name) ??
        listResult.data.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
      return match?.collectionId;
    };

    const loadCollection = async () => {
      if (!collectionId && !collectionName) {
        setIsLoading(false);
        return;
      }

      const name = (collectionName || collectionId || "") as string;

      try {
        setIsLoading(true);
        setResolvedTitle(null);

        // Identified, Wishlist, Owned: specimen filters (not GET /collections/getDetails)
        if (name === "Identified") {
          const response = await mushroomSpecimenService.fetchAllSpecimens(
            { isIdentified: [true], ...(apiFilterPayload || {}) } as any,
            { pageNo: 0, pageSize: 500 }
          );
          const mapped = response.data.map((s: any) =>
            mapSpecimenToMushroom(s)
          );
          setAllMinerals(mapped);
          setTotalItemCount(response.pagination?.totalCount ?? mapped.length);
          return;
        }
        if (name === "Wishlist") {
          const response = await mushroomSpecimenService.fetchAllSpecimens(
            { isWishlisted: [true], ...(apiFilterPayload || {}) } as any,
            { pageNo: 0, pageSize: 500 }
          );
          const mapped = response.data.map((s: any) =>
            mapSpecimenToMushroom(s)
          );
          setAllMinerals(mapped);
          setTotalItemCount(response.pagination?.totalCount ?? mapped.length);
          return;
        }
        if (name === "Owned") {
          const response = await mushroomSpecimenService.fetchAllSpecimens(
            { isWishlisted: [false], ...(apiFilterPayload || {}) } as any,
            { pageNo: 0, pageSize: 500 }
          );
          const ownedOnly = response.data.filter(
            (s: any) => s.isWishlisted !== true
          );
          const mapped = ownedOnly.map((s: any) => mapSpecimenToMushroom(s));
          setAllMinerals(mapped);
          setTotalItemCount(response.pagination?.totalCount ?? mapped.length);
          return;
        }

        // User-created: resolve id via GET /core/collections/fetchAll, then GET /core/collections/getDetails/:id
        const resolvedId = await resolveUserCollectionId(name, collectionId);
        if (!resolvedId) {
          setAllMinerals(collectionData?.minerals || []);
          setTotalItemCount((collectionData as { count?: number })?.count ?? 0);
          return;
        }

        const details = await collectionService.getCollectionDetails(
          resolvedId
        );
        if (details.name) setResolvedTitle(details.name);

        const specimensFromDetails = Array.isArray(details.specimens)
          ? details.specimens
          : [];

        if (specimensFromDetails.length > 0) {
          const mappedMushrooms = specimensFromDetails.map((s: any) =>
            mapSpecimenToMushroom(s)
          );
          setAllMinerals(mappedMushrooms);
          setTotalItemCount(details.specimenCount ?? mappedMushrooms.length);
          return;
        }

        const specimenResponse =
          await mushroomSpecimenService.fetchAllSpecimens(
            {
              _collections: [resolvedId],
              ...(apiFilterPayload || {}),
            } as any,
            { pageNo: 0, pageSize: 500, collectionId: resolvedId }
          );
        const specimens = specimenResponse.data || [];
        const mappedMushrooms = specimens.map((s: any) =>
          mapSpecimenToMushroom(s)
        );
        setAllMinerals(mappedMushrooms);
        setTotalItemCount(
          specimenResponse.pagination?.totalCount ??
            details.specimenCount ??
            mappedMushrooms.length ??
            (collectionData as { count?: number })?.count ??
            0
        );
      } catch (error) {
        console.error("Error loading collection:", error);
        setAllMinerals(collectionData?.minerals || []);
        const fallbackCount =
          (collectionData as { count?: number })?.count ?? 0;
        setTotalItemCount(fallbackCount);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollection();
  }, [
    collectionId,
    collectionName,
    collectionData,
    mapSpecimenToMushroom,
    apiFilterPayload,
    refreshKey,
    collectionInvalidationVersion,
  ]);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, [])
  );

  // Calculate active filter count
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

  // Filter minerals based on search and filters
  const minerals = useMemo(() => {
    let filtered = allMinerals;

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters (in real app, this would filter based on item properties)
    // For now, just return filtered by query

    return filtered;
  }, [allMinerals, searchQuery, filters]);

  // From collection details: behave like identification (Identified / created / Owned) or like catalogue (Wishlist) so Go Pro and UI match.
  const handleItemPress = useCallback(
    (item: (typeof allMinerals)[0]) => {
      analyticsService.logEvent(EVENTS.sub_collection_item, {
        collection_name: displayName,
      });
      const hasArchetypeId = !!item.archetypeId;
      const isFromWishlist = displayName === "Wishlist";
      const isUserCreatedCollection =
        !isFromWishlist &&
        displayName !== "Identified" &&
        displayName !== "Owned";
      // User-created collection: always pass specimen id so MineralDetails calls specimen getDetails API
      const useSpecimenId = isUserCreatedCollection || !hasArchetypeId;
      navigation.navigate("BirdDetails", {
        mushroomId: useSpecimenId
          ? item.specimenId ?? item.id
          : item.archetypeId!,
        source: isFromWishlist ? "catalogue" : "collection",
        collectionName: displayName,
        collectionId: collectionId,
        fromCollectionDetails: true,
        ...(useSpecimenId ? { idType: "specimen" as const } : {}),
        specimenId: item.specimenId ?? item.id,
      });
    },
    [navigation, displayName]
  );

  const renderItem = useCallback(
    ({ item, index: _index }: { item: (typeof allMinerals)[0]; index: number }) => {
      // Note: Reminders removed - not needed for rocks/minerals app
      // This is kept for backward compatibility with AppCard component
      const remindersCount = 0; // Always 0 for minerals

      return (
        <View style={styles.itemCardWrapper}>
          <AppCard
            image={
              item.image
                ? typeof item.image === "object" &&
                  item.image !== null &&
                  "uri" in item.image
                  ? (item.image as { uri: string })
                  : { uri: String(item.image) }
                : undefined
            }
            imageUrls={item.imageUrls}
            title={item.name}
            subtitle={item.scientificName}
            remindersCount={remindersCount}
            onPress={() => handleItemPress(item)}
            style={styles.cardFill}
          />
        </View>
      );
    },
    [handleItemPress, allMinerals]
  );

  const handleApplyFilters = (newFilters: FilterState, hasFilters: boolean) => {
    analyticsService.logEvent(EVENTS.filter_field_selected_collection, {
      collection_name: displayName,
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

  const handleDeleteCollection = useCallback(() => {
    setShowMenu(false);
    setShowDeleteCollection(true);
  }, []);

  const handleRenameCollection = useCallback(() => {
    setShowMenu(false);
    setShowRenameCollection(true);
  }, []);

  const handleCollectionRenamed = useCallback(
    (name: string) => {
      setResolvedTitle(name);
      useCollectionInvalidationStore.getState().invalidate();
      analyticsService.logEvent(EVENTS.collection_action, {
        action: "rename",
        collection_id: collectionId,
      });
      analyticsService.logEvent(EVENTS.rename_collection, {
        collection_id: collectionId,
      });
    },
    [collectionId]
  );

  const handleConfirmDeleteCollection = useCallback(async () => {
    if (!collectionId) return;
    setIsDeleting(true);
    try {
      await collectionService.deleteCollection(collectionId);
      analyticsService.logEvent(EVENTS.collection_action, {
        action: "delete",
        collection_id: collectionId,
      });
      analyticsService.logEvent(EVENTS.delete_collection, {
        collection_id: collectionId,
      });
      setShowDeleteCollection(false);
      navigation.goBack();
    } catch (err) {
      if (__DEV__) console.error("Delete collection failed:", err);
      setIsDeleting(false);
    }
  }, [collectionId, navigation]);

  // Show search/filter for Identified, Owned, Wishlist, or any collection with more than two rocks (use max of totalItemCount and allMinerals.length so filter shows even when one source is stale)
  const effectiveItemCount = Math.max(totalItemCount, allMinerals.length);
  const showSearchFilter =
    displayName === "Identified" ||
    displayName === "Owned" ||
    displayName === "Wishlist" ||
    effectiveItemCount >= 2;

  const isWishlistCollection = displayName === "Wishlist";
  const isCollectionEmpty = allMinerals.length === 0;

  const handleEmptyCtaPress = useCallback(() => {
    if (isWishlistCollection) {
      navigation.getParent()?.navigate("MainTabs", {
        screen: "Catalogue",
        params: { screen: "CatalogueMain" },
      });
      return;
    }
    const startEntry = useIdentificationEntryStore.getState().startEntryHandler;
    if (startEntry) {
      startEntry();
      return;
    }
    navigation.getParent()?.navigate("MainTabs", {
      screen: "Camera",
      params: { screen: "CameraMain" },
    });
  }, [navigation, isWishlistCollection]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[screenStyles.header, { paddingHorizontal: Space[6] }]}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="large"
          weight="medium"
          style={{ flex: 1, marginLeft: Space[4] }}
        >
          {`${displayName} (${totalItemCount})`}
        </Text>
        {canDeleteCollection ? (
          <TouchableOpacity
            onPress={() => setShowMenu((prev) => !prev)}
            style={styles.menuButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={isDeleting}
          >
            <MaterialIcons
              name="more-horiz"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Three-dots menu overlay + dropdown */}
      {showMenu && canRenameCollection && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          <View
            style={[
              styles.menuDropdown,
              {
                backgroundColor: colors.surfacePrimary,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleRenameCollection}
              activeOpacity={0.7}
            >
              <AppImage
                source={Images.iconEdit}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text
                variant="body"
                size="medium"
                style={{ marginLeft: Space[2] }}
              >
                {strings.collection.buttons.renameCollection}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteCollection}
              activeOpacity={0.7}
            >
              <AppImage
                source={isDark ? Images.trashDark : Images.mushroomTrash}
                style={[
                  styles.menuDeleteIcon,
                  isDark ? { tintColor: colors.textPrimary } : undefined,
                ]}
                resizeMode="contain"
                preferRNImage
              />
              <Text
                variant="body"
                size="medium"
                style={{ color: colors.error, marginLeft: Space[2] }}
              >
                {strings.collection.buttons.deleteCollection}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {collectionId && (
        <RenameCollectionBottomSheet
          visible={showRenameCollection}
          onClose={() => setShowRenameCollection(false)}
          collectionId={collectionId}
          initialName={displayName}
          onRenamed={handleCollectionRenamed}
        />
      )}

      <DeleteCollectionConfirmation
        visible={showDeleteCollection}
        onClose={() => setShowDeleteCollection(false)}
        onConfirm={handleConfirmDeleteCollection}
        isLoading={isDeleting}
      />

      {/* Search Bar and Filter - hidden when collection has no items yet */}
      {showSearchFilter && !isCollectionEmpty && (
        <>
          <View
            style={{
              paddingHorizontal: Space[6],
              marginBottom: Space[2],
              flexDirection: "row",
              gap: Space[2],
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
                  collection_name: displayName,
                });
                setShowFilterModal(true);
              }}
            />
          </View>

          <ActiveFilterChips
            filters={filters}
            onOpenFilters={() => setShowFilterModal(true)}
            onRemoveFilterValue={removeFilterValue}
            resultsHeading={strings.catalogue.screen.results}
            contentPaddingHorizontal={Space[6]}
          />
        </>
      )}

      <View style={styles.body}>
      {/* Minerals Grid - Same layout as Catalogue */}
      {isLoading ? (
        <View
          style={[styles.skeletonContainer, { paddingHorizontal: Space[6] }]}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <CardSkeleton height={220} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : minerals.length === 0 ? (
        <View style={styles.emptyContainer}>
          {isCollectionEmpty ? (
            <EmptyCollectionContent
              subtitle={
                isWishlistCollection
                  ? strings.collection.emptyStates.noWishlist.subtitle
                  : strings.collection.emptyStates.emptyCollection.message
              }
              ctaLabel={
                strings.collection.emptyStates.emptyCollection.addBird
              }
              onCtaPress={handleEmptyCtaPress}
            />
          ) : (
            <EmptyState
              title={
                strings.collection.emptyStates.emptyCollection.noSearchResults
              }
            />
          )}
        </View>
      ) : (
        <FlatList
          data={minerals}
          numColumns={2}
          keyExtractor={(item, index) => item.id ?? `mineral-${index}`}
          renderItem={renderItem}
          columnWrapperStyle={[
            styles.columnWrapper,
            { paddingHorizontal: Space[6] },
          ]}
          contentContainerStyle={[
            screenStyles.scrollContent,
            { paddingTop: 8, paddingBottom: listBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      )}
      </View>

      {/* Filter Modal */}
      {showSearchFilter && (
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filterDataFromApi={filterApiData}
          onApplyFilters={handleApplyFilters}
          clearAllFilters={handleClearFilters}
          defaultFilters={filters}
          comingFrom="global_collection"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  itemCardWrapper: {
    width: "48%",
    flex: 0,
    maxWidth: "48%",
    marginBottom: 12,
  },
  cardFill: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: 24,
    paddingBottom: spacing[10],
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
  menuButton: {
    padding: 4,
    marginRight: 4,
  },
  menuDropdown: {
    position: "absolute",
    top: 48,
    right: 24,
    minWidth: 180,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 100,
    elevation: 8,
    shadowColor: APP_COLORS.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemIcon: {
    width: 20,
    height: 20,
  },
  menuDeleteIcon: {
    width: 20,
    height: 20,
  },
});
