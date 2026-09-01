/**
 * Collection Main Screen
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { useStrings } from "../../../hooks/useStrings";
import { Icon } from "../../../atoms";
import { FloatingActionButton } from "../../../atoms";
import { Card } from "../../../molecules";
import { Modal } from "../../../molecules";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import {
  CollectionStackParamList,
  RootStackParamList,
} from "../../../navigation/types";
// Reminders removed - empty case now shows partitioned grid (Identified, Wishlist, Owned) - not needed for rocks/minerals app
import { CollectionCard } from "../components";
import { RouteProp, CompositeNavigationProp } from "@react-navigation/native";
import type { Collection as ApiCollection } from "../../../services/api/features/core.api.types";
import { collectionService } from "../../../services/collection/collection.service";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";
import { useAuthStore } from "../../auth/auth.store";
import {
  COLLECTION_SCREEN_COLORS,
} from "../../../constants/colorConstants";
import { useIsDark } from "../../../hooks/useTheme";
import { CardSkeleton } from "../../../components/skeleton";
import {
  PAGINATION,
  SKELETON_COUNTS,
  FLATLIST_CONFIG,
  FREE_COLLECTION_LIMIT,
  isUserCreatedCollectionName,
  CATEGORIES,
} from "../../../constants/appConstants";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { useWishlistInvalidationStore } from "../wishlistInvalidation.store";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../subscription/subscription.store";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import {
  getCollectionPreviewImages,
  pickCollectionCardPreviewImages,
  resolveCollectionPreviewUrls,
  resolveSystemCollectionCardPreview,
  toSpecimenPreviewImages,
  NEAR_YOU_COLLECTION_NAME,
  fetchNearYouCollectionPreview,
} from "../collection.utils";
import { runFeedNotificationsOnCollectionFocus } from "../../../services/notifications/feedNotificationsOnCollectionFocus.service";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import {
  logCollectionUiGate,
  shouldShowCollectionLimitPaywall,
} from "../../../services/session/collectionLimit.service";

import { Radius } from "../../../design";

const COL_LOG = "[CollectionsScreen]";
const COLLECTION_PREVIEW_SPECIMEN_PAGE_SIZE = 20;


import { spacing } from "../../../design-system/spacing";

type CollectionScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CollectionStackParamList, "CollectionMain">,
  NativeStackNavigationProp<RootStackParamList>
>;
type CollectionScreenRouteProp = RouteProp<
  CollectionStackParamList,
  "CollectionMain"
>;

interface CollectionScreenProps {
  route: CollectionScreenRouteProp;
}

interface Collection {
  collectionId?: string;
  name: string;
  description?: string;
  count: number;
  createdAt?: string;
  images?: (string | number)[];
}

export const CollectionScreen: React.FC<CollectionScreenProps> = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const navigation = useNavigation<CollectionScreenNavigationProp>();
  const { user } = useAuthStore();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const strings = useStrings();
  const isDark = useIsDark();

  // Reminders removed - only collections tab now
  const [_tab] = useState<"collections">("collections");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoProSheet, setShowGoProSheet] = useState(false);
  const isPremium = useSubscriptionStore(selectIsPremium);

  // Default collections: Identified, Wishlist, Near You (Owned hidden for now)
  const DEFAULT_COLLECTION_NAMES = [
    "Identified",
    "Wishlist",
    NEAR_YOU_COLLECTION_NAME,
  ] as const;
  const defaultCollectionPlaceholder = (name: string): Collection => ({
    name,
    count: 0,
    createdAt:
      name === NEAR_YOU_COLLECTION_NAME
        ? strings.collection.collections.nearYouSubtitle
        : "Recently",
    images: [],
  });
  const emptyCasePlaceholders: Collection[] = useMemo(
    () =>
      DEFAULT_COLLECTION_NAMES.map((name) =>
        defaultCollectionPlaceholder(name)
      ),
    []
  );
  const displayCollections =
    collections.length > 0 ? collections : emptyCasePlaceholders;

  // Load collections function - reusable for refresh. When not logged in or empty, still show partitioned grid (Identified, Wishlist, Owned).
  const loadCollections = useCallback(async () => {
    const log = useAppLogsStore.getState();
    // Wait for persisted auth to rehydrate (reinstall / cold start); avoids skipping API while user/token are still restoring.
    if (!hasHydrated) {
      log.debug(`${COL_LOG} loadCollections skipped (auth not hydrated yet)`);
      return;
    }

    if (!user?.id) {
      log.info(`${COL_LOG} loadCollections: no user id — placeholders only`);
      const placeholders = DEFAULT_COLLECTION_NAMES.map((name) =>
        defaultCollectionPlaceholder(name)
      );
      setCollections(placeholders);
      setIsLoading(false);
      return;
    }

    log.info(`${COL_LOG} loadCollections start`, {
      userIdSuffix: user.id.slice(-8),
      isPremium,
    });

    try {
      setIsLoading(true);
      let listResult = await collectionService.fetchAllCollections({
        pageNo: PAGINATION.INITIAL_PAGE,
        pageSize: PAGINATION.COLLECTION_PAGE_SIZE,
      });
      let didStatsRetry = false;
      // Reinstall / cold login: list can briefly be empty while session is ready, or shape mismatched until normalized.
      // If stats say the user has collections but the list is empty, retry once after a short delay.
      if (listResult.data.length === 0 && user?.id) {
        try {
          const stats = await collectionService.getCollectionStats();
          log.info(`${COL_LOG} empty list — stats check`, {
            totalCollections: stats.totalCollections,
            willRetry: stats.totalCollections > 0,
          });
          if (stats.totalCollections > 0) {
            didStatsRetry = true;
            await new Promise<void>((resolve) => setTimeout(resolve, 500));
            listResult = await collectionService.fetchAllCollections({
              pageNo: PAGINATION.INITIAL_PAGE,
              pageSize: PAGINATION.COLLECTION_PAGE_SIZE,
            });
            log.info(`${COL_LOG} stats retry fetch done`, {
              count: listResult.data.length,
            });
          }
        } catch (e) {
          log.warn(`${COL_LOG} stats/retry branch failed`, {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }

      const response = listResult;
      const mappedFromApi: Collection[] = response.data.map((col) => ({
        collectionId: col.collectionId,
        name: col.name,
        description: col.description,
        count: col.specimenCount || 0,
        createdAt: col.createdAt
          ? new Date(col.createdAt).toLocaleDateString()
          : "Recently",
        images: getCollectionPreviewImages(col),
      }));
      // Order: Identified first, Wishlist second, then rest; merge defaults if API didn't return them
      const byName = new Map<string, Collection>();
      mappedFromApi.forEach((c) => byName.set(c.name, c));
      const merged: Collection[] = DEFAULT_COLLECTION_NAMES.map(
        (name) => byName.get(name) ?? defaultCollectionPlaceholder(name)
      );
      const others = mappedFromApi.filter(
        (c) => !DEFAULT_COLLECTION_NAMES.includes(c.name as any)
      );
      const userCreatedCount = [...merged, ...others].filter((c) =>
        isUserCreatedCollectionName(c.name)
      ).length;
      log.info(`${COL_LOG} loadCollections mapped`, {
        apiRowCount: mappedFromApi.length,
        othersCount: others.length,
        userCreatedCount,
        didStatsRetry,
      });

      // Identified, Wishlist & Near You: specimen / location APIs for card previews.
      try {
        const [identifiedRes, wishlistRes, nearYouPreview] = await Promise.all([
          mushroomSpecimenService.fetchAllSpecimens(
            { isIdentified: [true] },
            { pageNo: 0, pageSize: COLLECTION_PREVIEW_SPECIMEN_PAGE_SIZE }
          ),
          mushroomSpecimenService.fetchAllSpecimens(
            { isWishlisted: [true] },
            { pageNo: 0, pageSize: COLLECTION_PREVIEW_SPECIMEN_PAGE_SIZE }
          ),
          fetchNearYouCollectionPreview(),
        ]);
        const identifiedSpecimenImages = toSpecimenPreviewImages(
          identifiedRes.data as unknown as Parameters<
            typeof toSpecimenPreviewImages
          >[0]
        );
        const wishlistSpecimenImages = toSpecimenPreviewImages(
          wishlistRes.data as unknown as Parameters<
            typeof toSpecimenPreviewImages
          >[0]
        );
        const identifiedPreview = resolveSystemCollectionCardPreview({
          specimenTotalCount: identifiedRes.pagination?.totalCount,
          specimenRowCount: identifiedRes.data.length,
          specimenImages: identifiedSpecimenImages,
        });
        const wishlistPreview = resolveSystemCollectionCardPreview({
          specimenTotalCount: wishlistRes.pagination?.totalCount,
          specimenRowCount: wishlistRes.data.length,
          specimenImages: wishlistSpecimenImages,
        });
        merged[0] =
          merged[0].name === "Identified"
            ? {
                ...merged[0],
                count: identifiedPreview.count,
                images: identifiedPreview.images,
              }
            : merged[0];
        merged[1] =
          merged[1].name === "Wishlist"
            ? {
                ...merged[1],
                count: wishlistPreview.count,
                images: wishlistPreview.images,
              }
            : merged[1];
        merged[2] =
          merged[2]?.name === NEAR_YOU_COLLECTION_NAME
            ? {
                ...merged[2],
                count: nearYouPreview.count,
                images: nearYouPreview.images,
                createdAt: strings.collection.collections.nearYouSubtitle,
              }
            : merged[2];
      } catch (_) {}

      // User-created collections only: pass both collectionId (query) and _collections (body)
      let enrichedOthers = others;
      if (others.length > 0) {
        try {
          enrichedOthers = await Promise.all(
            others.map(async (c) => {
              if (!c.collectionId) return c;
              const res = await mushroomSpecimenService.fetchAllSpecimens(
                { _collections: [c.collectionId] },
                {
                  pageNo: 0,
                  pageSize: COLLECTION_PREVIEW_SPECIMEN_PAGE_SIZE,
                  collectionId: c.collectionId,
                }
              );
              const specimenImages = toSpecimenPreviewImages(
                res.data as unknown as Parameters<
                  typeof toSpecimenPreviewImages
                >[0]
              );
              return {
                ...c,
                count: res.pagination?.totalCount ?? c.count,
                images: pickCollectionCardPreviewImages(
                  specimenImages,
                  resolveCollectionPreviewUrls(c.images as string[] | undefined)
                ),
              };
            })
          );
        } catch (_) {}
      }

      setCollections([...merged, ...enrichedOthers]);
      log.info(`${COL_LOG} loadCollections success`, {
        totalCards: merged.length + enrichedOthers.length,
        customWithMissingId: enrichedOthers.filter(
          (o) => !o.collectionId?.trim()
        ).length,
      });
    } catch (error) {
      console.error("Error loading collections:", error);
      useAppLogsStore.getState().error(`${COL_LOG} loadCollections error`, {
        message: error instanceof Error ? error.message : String(error),
      });
      // Set default collections on error: Identified, Wishlist; then fetch counts from specimen API
      let defaults = DEFAULT_COLLECTION_NAMES.map((name) =>
        defaultCollectionPlaceholder(name)
      );
      try {
        const [identifiedRes, wishlistRes, nearYouPreview] = await Promise.all([
          mushroomSpecimenService.fetchAllSpecimens(
            { isIdentified: [true] },
            { pageNo: 0, pageSize: COLLECTION_PREVIEW_SPECIMEN_PAGE_SIZE }
          ),
          mushroomSpecimenService.fetchAllSpecimens(
            { isWishlisted: [true] },
            { pageNo: 0, pageSize: COLLECTION_PREVIEW_SPECIMEN_PAGE_SIZE }
          ),
          fetchNearYouCollectionPreview(),
        ]);
        defaults = defaults.map((c) => {
          if (c.name === "Identified")
            return {
              ...c,
              count: identifiedRes.pagination?.totalCount ?? 0,
              images: toSpecimenPreviewImages(
                identifiedRes.data as unknown as Parameters<
                  typeof toSpecimenPreviewImages
                >[0]
              ),
            };
          if (c.name === "Wishlist")
            return {
              ...c,
              count: wishlistRes.pagination?.totalCount ?? 0,
              images: toSpecimenPreviewImages(
                wishlistRes.data as unknown as Parameters<
                  typeof toSpecimenPreviewImages
                >[0]
              ),
            };
          if (c.name === NEAR_YOU_COLLECTION_NAME)
            return {
              ...c,
              count: nearYouPreview.count,
              images: nearYouPreview.images,
              createdAt: strings.collection.collections.nearYouSubtitle,
            };
          return c;
        });
      } catch (_) {}
      setCollections(defaults);
      // Retry after delay (reinstall/login: token or network may not be ready on first attempt)
      if (user?.id) {
        setTimeout(() => loadCollections(), 1500);
        setTimeout(() => loadCollections(), 4000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, hasHydrated, isPremium, strings.collection.collections.nearYouSubtitle]);

  // Fetch collections from API on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Refetch collection counts (including wishlist) when screen gains focus so count updates after add/remove from other screens
  useFocusEffect(
    useCallback(() => {
      // Refresh subscription mirror from auth so premium is current after purchase / restore.
      useSubscriptionStore.getState().syncFromAuthStore();
      if (hasHydrated && user?.id) {
        loadCollections();
        void runFeedNotificationsOnCollectionFocus(user.id);
      }
    }, [hasHydrated, user?.id, loadCollections])
  );

  // Refetch when wishlist is added/removed from any screen so count updates immediately
  const wishlistInvalidationVersion = useWishlistInvalidationStore(
    (s) => s.version
  );
  useEffect(() => {
    if (hasHydrated && user?.id && wishlistInvalidationVersion > 0)
      loadCollections();
  }, [hasHydrated, user?.id, wishlistInvalidationVersion, loadCollections]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCollections();
    } finally {
      setRefreshing(false);
    }
  }, [loadCollections]);

  // Helper function to get collection minerals (for navigation)
  const _getCollectionMinerals = async (collectionId: string) => {
    try {
      const details = await collectionService.getCollectionDetails(
        collectionId
      );
      return details.specimens || [];
    } catch (error) {
      console.error("Error fetching collection minerals:", error);
      return [];
    }
  };

  const renderCollectionItem = useCallback(
    ({ item }: { item: Collection }) => {
      const handlePress = () => {
        analyticsService.logEvent(EVENTS.collection_clicked, {
          collection_name: item.name,
        });
        analyticsService.logEvent(EVENTS.sub_collection_screen, {
          collection_name: item.name,
        });
        if (item.name === NEAR_YOU_COLLECTION_NAME) {
          navigation.navigate("MainTabs", {
            screen: "Catalogue",
            params: {
              screen: "CatalogueMain",
              params: { category: CATEGORIES.NEAR_YOU },
            },
          });
          return;
        }
        if (item.name === "Wishlist") {
          navigation.navigate("Wishlist");
          return;
        }
        const id = item.collectionId?.trim() || item.name;
        navigation.navigate("CollectionDetails", {
          collectionId: id,
          collectionName: item.name,
          collectionData: {
            minerals: [],
            count: item.count,
            description: item.description,
          },
        });
      };

      // Identified, Wishlist, Owned: same card style (CollectionCard with grid)
      return <CollectionCard item={item} onPress={handlePress} />;
    },
    [navigation]
  );

  const handleGoToSoundLibrary = useCallback(() => {
    navigation.navigate("MainTabs", {
      screen: "Home",
      params: { screen: "AudioGallery" },
    });
  }, [navigation]);

  const [showCreate, setShowCreate] = useState(false);
  const [showAddMineral, setShowAddMineral] = useState(false);
  const [name, setName] = useState("");
  const [_error, setError] = useState("");

  const _handleSave = async () => {
    if (!name.trim()) {
      setError(strings.collection.forms.collectionName.required);
      return;
    }
    if (!user?.id) {
      setError(strings.collection.errors.notAuthenticated);
      return;
    }

    // Check for duplicate
    const isDuplicate = collections.some(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setError(strings.collection.forms.collectionName.duplicate);
      return;
    }

    try {
      const authTokenBeforeCreate = useAuthStore.getState().token;
      useAppLogsStore
        .getState()
        .info(`${COL_LOG} create_collection token debug`, {
          phase: "before_request",
          hasToken:
            typeof authTokenBeforeCreate === "string" &&
            authTokenBeforeCreate.length > 0,
          tokenLen:
            typeof authTokenBeforeCreate === "string"
              ? authTokenBeforeCreate.length
              : null,
          tokenLast4:
            typeof authTokenBeforeCreate === "string"
              ? authTokenBeforeCreate.slice(-4)
              : null,
          userIdSuffix: user?.id?.slice(-8) ?? null,
        });
      // Create collection via API
      const newCollection = await collectionService.addCollection({
        name: name.trim(),
        description: "",
      });

      setCollections([
        ...collections,
        {
          collectionId: newCollection.collectionId,
          name: newCollection.name,
          count: newCollection.specimenCount || 0,
          createdAt: new Date(newCollection.createdAt).toLocaleDateString(),
          images: newCollection.representativeImages?.slice(0, 4) || [],
        },
      ]);
      setShowCreate(false);
      setName("");
      setError("");
    } catch (err: any) {
      console.error("Error creating collection:", err);
      const authTokenOnCreateError = useAuthStore.getState().token;
      const status = err?.status ?? err?.statusCode ?? err?.response?.status;
      useAppLogsStore
        .getState()
        .warn(`${COL_LOG} create_collection token debug`, {
          phase: "request_failed",
          status,
          reason: err?.reason ?? err?.response?.data?.reason ?? null,
          message: err?.message ?? err?.response?.data?.message ?? null,
          hasToken:
            typeof authTokenOnCreateError === "string" &&
            authTokenOnCreateError.length > 0,
          tokenLen:
            typeof authTokenOnCreateError === "string"
              ? authTokenOnCreateError.length
              : null,
          tokenLast4:
            typeof authTokenOnCreateError === "string"
              ? authTokenOnCreateError.slice(-4)
              : null,
          userIdSuffix: user?.id?.slice(-8) ?? null,
        });
      const message = (err?.message ||
        err?.reason ||
        err?.response?.data?.message ||
        "") as string;
      const msgLower = message.toLowerCase().trim();
      const userCreatedCount = collections.filter((c) =>
        isUserCreatedCollectionName(c.name)
      ).length;
      const isLimitOrSubscription =
        /subscription|premium|limit|upgrade|plan|paywall/i.test(message) ||
        msgLower.includes("collection limit") ||
        msgLower.includes("maximum collection") ||
        (userCreatedCount >= FREE_COLLECTION_LIMIT &&
          /fail|failed|error|forbidden|limit/i.test(msgLower));
      // Only redirect to paywall when user already has their free collection cap and create failed (e.g. limit). Don't use collections.length – it includes Identified/Wishlist placeholders.
      const alreadyAtLimitAndFailed = userCreatedCount >= FREE_COLLECTION_LIMIT;
      if (
        (isLimitOrSubscription || alreadyAtLimitAndFailed) &&
        shouldShowCollectionLimitPaywall()
      ) {
        setShowCreate(false);
        setName("");
        setError("");
        // Refetch so existing collections (e.g. after reinstall) are shown; then navigate to paywall
        await loadCollections();
        navigateToSubscriptionMain();
        return;
      }
      setError(strings.collection.errors.createFailed);
    }
  };

  const handleCollectionCreated = useCallback((newCollection: ApiCollection) => {
    setCollections((prev) => [
      ...prev,
      {
        collectionId: newCollection.collectionId,
        name: newCollection.name,
        count: newCollection.specimenCount ?? 0,
        createdAt: new Date(newCollection.createdAt).toLocaleDateString(),
        images: [],
      },
    ]);
    setName("");
    setError("");
  }, []);

  const handleCreateLimitReached = useCallback(() => {
    if (!shouldShowCollectionLimitPaywall()) {
      logCollectionUiGate("sheet_on_limit_reached_premium_skip_paywall", {
        allowed: false,
        reason: "create_collection_api_rejected_but_client_is_premium",
      });
      return;
    }
    logCollectionUiGate("sheet_on_limit_reached_callback", {
      allowed: false,
      reason: "create_collection_flow_signaled_limit_from_api_or_parser",
    });
    setName("");
    setError("");
    setShowGoProSheet(true);
  }, []);

  const handleCreateSheetClose = useCallback(() => {
    setShowCreate(false);
    setName("");
    setError("");
  }, []);

  const createCollectionPayload = useMemo(
    () => ({
      onCreated: handleCollectionCreated,
      onLimitReached: handleCreateLimitReached,
    }),
    [handleCollectionCreated, handleCreateLimitReached]
  );

  const handleFABPress = () => {
    const log = useAppLogsStore.getState();
    if (!user?.id) {
      log.info(`${COL_LOG} FAB → Login (no user)`);
      (navigation as any)
        ?.getParent()
        ?.getParent()
        ?.navigate("AuthStack", { screen: "Login" });
      return;
    }
    useSubscriptionStore.getState().syncFromAuthStore();
    const premiumFresh = selectIsPremium(useSubscriptionStore.getState());
    const userCreatedCount = collections.filter((c) =>
      isUserCreatedCollectionName(c.name)
    ).length;
    if (!premiumFresh && userCreatedCount >= FREE_COLLECTION_LIMIT) {
      logCollectionUiGate("fab_blocked_free_limit", {
        allowed: false,
        userCreatedCount,
        reason: "non_premium_and_at_or_over_free_collection_cap",
        hookIsPremiumSnapshot: isPremium,
        premiumAfterSyncFromAuth: premiumFresh,
      });
      setShowGoProSheet(true);
      return;
    }
    logCollectionUiGate("fab_open_create_sheet", {
      allowed: true,
      userCreatedCount,
      reason: premiumFresh
        ? "premium_unlimited_client_side"
        : "under_free_collection_cap",
      hookIsPremiumSnapshot: isPremium,
      premiumAfterSyncFromAuth: premiumFresh,
    });
    setShowCreate(true);
  };

  const collectionBgLight = COLLECTION_SCREEN_COLORS.LIGHT.collectionBg;
  const collectionBgDark = COLLECTION_SCREEN_COLORS.DARK.collectionBg;
  const screenBgLight = COLLECTION_SCREEN_COLORS.LIGHT.screenBg;
  const screenBgDark = COLLECTION_SCREEN_COLORS.DARK.screenBg;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? collectionBgDark : collectionBgLight,
        },
      ]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? collectionBgDark : collectionBgLight}
      />
      {/* Header — title + Sound Library pill (Figma 8609:59587) */}
      <View
        style={[
          styles.header,
          {
            paddingLeft: 20,
            paddingRight: 8,
            backgroundColor: isDark ? collectionBgDark : collectionBgLight,
          },
        ]}
      >
        <Text variant="title" size="large" weight="bold">
          Collection
        </Text>
        <TouchableOpacity
          style={[
            styles.headerPill,
            styles.headerPillSecondary,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.border0,
            },
          ]}
          onPress={handleGoToSoundLibrary}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={strings.collection.buttons.goToSoundLibrary}
        >
          <Text
            variant="body"
            size="small"
            weight="medium"
            style={{ color: colors.textPrimary }}
          >
            {strings.collection.buttons.goToSoundLibrary}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Partitioned grid: 4 boxes (Identified, Wishlist, Owned + others) - always shown; bg F6F6F6 light / 171717 dark */}
      <View
        style={[
          styles.gridSection,
          {
            backgroundColor: isDark ? collectionBgDark : collectionBgLight,
          },
        ]}
      >
        {isLoading ? (
          <View
            style={[styles.skeletonContainer, { paddingHorizontal: Space[6] }]}
          >
            {Array.from({ length: SKELETON_COUNTS.COLLECTION }).map((_, i) => (
              <View key={i} style={styles.skeletonItem}>
                <CardSkeleton height={180} borderRadius={12} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={displayCollections}
            numColumns={2}
            keyExtractor={(item, i) => `${item.name ?? "collection"}-${i}`}
            renderItem={renderCollectionItem}
            columnWrapperStyle={[
              styles.columnWrapper,
              { paddingHorizontal: Space[6] },
            ]}
            contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            initialNumToRender={FLATLIST_CONFIG.INITIAL_NUM_TO_RENDER}
            maxToRenderPerBatch={FLATLIST_CONFIG.MAX_TO_RENDER_PER_BATCH}
            windowSize={FLATLIST_CONFIG.WINDOW_SIZE}
            removeClippedSubviews={FLATLIST_CONFIG.REMOVE_CLIPPED_SUBVIEWS}
            updateCellsBatchingPeriod={
              FLATLIST_CONFIG.UPDATE_CELLS_BATCHING_PERIOD
            }
          />
        )}
      </View>

      <FloatingActionButton
        icon="plus"
        label={strings.collection.buttons.createCollection}
        position="bottom-right"
        variant="feed"
        size="medium"
        onPress={handleFABPress}
        bottomOffset={20}
        rightOffset={16}
      />

      {/* Add New Mineral Modal */}
      <Modal
        visible={showAddMineral}
        onClose={() => setShowAddMineral(false)}
        animationType="fade"
        contentStyle={styles.modalContent}
      >
        <Card variant="elevated" padding="large" style={styles.addBirdCard}>
          <View style={styles.modalHeader}>
            <Text variant="title" size="medium" weight="bold">
              {strings.collection.forms.addNewMineral.title}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddMineral(false)}
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              activeOpacity={0.7}
            >
              <Icon name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={{ marginTop: Space[2], marginBottom: Space[4] }}
          >
            {strings.collection.forms.addNewMineral.subtitle}
          </Text>

          <View style={styles.addMineralButtons}>
            <TouchableOpacity
              style={[styles.addMineralButton, { borderColor: colors.border }]}
              onPress={() => {
                setShowAddMineral(false);
                navigation.getParent()?.navigate("MainTabs", {
                  screen: "Camera",
                  params: { screen: "CameraMain" },
                });
              }}
              activeOpacity={0.7}
            >
              <Text variant="body" size="medium" weight="medium">
                {strings.collection.forms.addNewMineral.identifyByPhoto}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addMineralButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                setShowAddMineral(false);
                navigation.getParent()?.navigate("MainTabs", {
                  screen: "Catalogue",
                  params: { screen: "SearchFilter" },
                });
              }}
              activeOpacity={0.7}
            >
              <Text
                variant="body"
                size="medium"
                weight="medium"
                style={{ color: colors.onPrimary }}
              >
                {strings.collection.forms.addNewMineral.searchByName}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </Modal>

      <AppSheet
        visible={showCreate}
        onClose={handleCreateSheetClose}
        type="createCollection"
        payload={createCollectionPayload}
      />

      <LimitReachedBottomSheet
        visible={showGoProSheet}
        onClose={() => setShowGoProSheet(false)}
        onUpgrade={() => {
          setShowGoProSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="collection"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    gap: 8,
  },
  headerPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerPillSecondary: {
    borderWidth: 1,
  },
  gridSection: {
    flex: 1,
    zIndex: 0,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
  },
  list: {
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addBirdCard: {
    width: "100%",
  },
  addMineralButtons: {
    gap: 12,
  },
  addMineralButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheetContent: {
    padding: spacing[4],
  },
  createSheetContent: {
    paddingHorizontal: spacing[4],
    paddingTop: 8,
  },
  createSheetTopic: {
    marginBottom: 8,
  },
  createSheetInput: {
    marginBottom: 20,
  },
  createSheetActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  createSheetButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
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
});
