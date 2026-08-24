/**
 * Possible Matches Screen (post-identification)
 * Figma: Mushroom App — Possible matches (8672:87227), location banner (8728:31542)
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar } from "react-native";
import { CachedRemoteImage } from "@/components/AppImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { useBackHandler } from "../../../utils/backHandler";
import { useToast } from "../../../hooks/useToast";
import { useStrings } from "../../../hooks/useStrings";
import { Text, NavBackIcon } from "../../../atoms";
import { CameraStackParamList } from "../../../navigation/types";
import { Images } from "../../../assets";
import { getDisplayName } from "../../../utils/mushroomDisplayUtils";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import {
  getPossibleMatchThumbnailUri,
  POSSIBLE_MATCH_THUMBNAIL_HEIGHT,
  POSSIBLE_MATCH_THUMBNAIL_WIDTH,
} from "../../../utils/mushroomApiMappers";
import { prefetchRemoteImages } from "../../../utils/prefetchImages";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { Radius } from "../../../design";
import { useIdentificationResultsStore } from "../identificationResults.store";
import { IdentificationLocationBanner } from "../components/IdentificationLocationBanner";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { useBirdsStore } from "../../../features/catalogue/birds.store";
import { RemoveFromWishlistConfirmation } from "../../../components/RemoveFromWishlistConfirmation";

const CARD_IMAGE_WIDTH = POSSIBLE_MATCH_THUMBNAIL_WIDTH;
const CARD_IMAGE_HEIGHT = POSSIBLE_MATCH_THUMBNAIL_HEIGHT;
const LIST_HORIZONTAL_PADDING = 20;

function getMatchArchetypeId(item: any): string | null {
  const id =
    item?.id ??
    item?._id ??
    item?.match?._id ??
    item?.match?.archetypeId ??
    item?.match?.custom_id;
  if (id == null || String(id).length === 0) return null;
  return String(id);
}

type OtherPossibleMatchesScreenRouteProp = RouteProp<
  CameraStackParamList,
  "OtherPossibleMatches"
>;
type OtherPossibleMatchesScreenNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "OtherPossibleMatches"
>;

export const OtherPossibleMatchesScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const { showToast } = useToast();
  const strings = useStrings();
  const favorites = useBirdsStore((s) => s.favorites);
  const toggleFavorite = useBirdsStore((s) => s.toggleFavorite);
  const navigation = useNavigation<OtherPossibleMatchesScreenNavigationProp>();
  const route = useRoute<OtherPossibleMatchesScreenRouteProp>();
  const routeMatches = route.params?.matches ?? [];
  const storedMatches = useIdentificationResultsStore((s) => s.matches);
  const storedIdentificationImage = useIdentificationResultsStore(
    (s) => s.identificationImage
  );
  // Prefer in-memory store (set on analyze screen) for instant paint after navigation.
  const matches = storedMatches.length > 0 ? storedMatches : routeMatches;
  const screenTitle =
    route.params?.title ?? strings.camera.results.possibleMatchesHeading;
  const returnTo = route.params?.returnTo;
  const identificationImage =
    route.params?.identificationImage ?? storedIdentificationImage;
  const {
    location,
    locationLabel,
    permissionGranted: locationPermissionGranted,
    openCustomLocationSheet,
    syncPermission,
  } = useLocationToggleFlow();
  const showLocationBanner = returnTo?.tab !== "Catalogue";
  const showLocationAsGranted = shouldShowLocationBannerAsGranted(
    locationPermissionGranted,
    location
  );

  const handleLocationToggle = useCallback(
    (enabled: boolean) => {
      if (!enabled) return;
      openCustomLocationSheet();
    },
    [openCustomLocationSheet]
  );

  const handlePressSetLocation = useCallback(() => {
    openCustomLocationSheet();
  }, [openCustomLocationSheet]);
  const matchesRef = useRef(matches);
  const [imageErrorKeys, setImageErrorKeys] = useState<Set<string>>(new Set());
  const [showRemoveWishlistConfirm, setShowRemoveWishlistConfirm] =
    useState(false);
  const [pendingWishlistRemove, setPendingWishlistRemove] = useState<{
    archetypeId: string;
    name: string;
  } | null>(null);
  const wishlistToggleInFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  useEffect(() => {
    prefetchRemoteImages(
      matches.map((item) => getPossibleMatchThumbnailUri(item)),
      Math.max(matches.length, 8)
    );
  }, [matches]);

  useFocusEffect(
    useCallback(() => {
      void syncPermission();
    }, [syncPermission])
  );

  const optionsEnterTimeRef = useRef(0);
  useFocusEffect(
    useCallback(() => {
      optionsEnterTimeRef.current = Date.now();
      analyticsService.logEvent(EVENTS.identification_all_options_screen, {
        match_count: String(matches.length),
      });
      return () => {
        const durationSeconds = Math.round(
          (Date.now() - optionsEnterTimeRef.current) / 1000
        );
        if (durationSeconds > 0) {
          analyticsService.logEvent(EVENTS.identification_all_options_screen, {
            time_spent: String(durationSeconds),
          });
        }
      };
    }, [matches.length])
  );

  const getMatchDisplayName = (item: any): string => {
    const nested = item?.match ?? {};
    return (
      getDisplayName({
        commonNames: item?.commonNames ?? nested.commonNames,
        genusCommonNames: item?.genusCommonNames ?? nested.genusCommonNames,
        commonName: item?.commonName ?? nested.commonName,
        name: item?.name ?? nested.name,
        scientificName:
          item?.scientificName ??
          nested.scientificName ??
          nested.verbatimScientificName,
        canonicalName: item?.canonicalName ?? nested.canonicalName,
        verbatimScientificName: nested.verbatimScientificName,
      }) || "Unknown"
    );
  };

  const exitToCameraMain = useCallback(() => {
    if (typeof navigation.popToTop === "function") {
      navigation.popToTop();
      return;
    }
    navigation.navigate("CameraMain");
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (returnTo) {
      navigation.getParent()?.navigate("MainTabs", {
        screen: returnTo.tab,
        params: {
          screen: returnTo.screen,
          params: returnTo.params,
        },
      });
      return;
    }
    exitToCameraMain();
  }, [navigation, returnTo, exitToCameraMain]);

  useBackHandler({
    enabled: true,
    onBackPress: () => {
      handleBack();
      return true;
    },
    priority: 5,
  });

  const navigateToMatchDetails = useCallback(
    (item: any, index: number) => {
      const id = item.id ?? item._id;
      const acc =
        item.accuracy ??
        (item.similarityScore != null
          ? Math.round(
              item.similarityScore <= 1
                ? item.similarityScore * 100
                : item.similarityScore
            )
          : undefined);

      if (returnTo?.tab === "Catalogue") {
        navigation.getParent()?.navigate("MainTabs", {
          screen: "Catalogue",
          params: {
            screen: "BirdDetails",
            params: {
              mushroomId: String(id),
              source: "catalogue",
              otherMatches: matchesRef.current,
              fromOtherPossibleMatches: true,
              otherPossibleMatchesTitle: screenTitle,
              otherPossibleMatchesReturnTo: returnTo,
            },
          },
        });
        return;
      }

      navigation.getParent()?.navigate("MainTabs", {
        screen: "Collection",
        params: {
          screen: "BirdDetails",
          params: {
            mushroomId: String(id),
            source: "identification",
            initialMushroomData: item.match ?? item,
            otherMatches: matchesRef.current,
            fromOtherPossibleMatches: true,
            otherPossibleMatchesTitle: screenTitle,
            identificationAccuracy: acc,
            identificationImage,
          },
        },
      });
    },
    [navigation, returnTo, screenTitle, identificationImage]
  );

  const handleMatchPress = useCallback(
    (item: any, index: number) => {
      analyticsService.logEvent(EVENTS.identification_option_chosen, {
        option_number: String(index + 1),
        mushroom_name: getMatchDisplayName(item),
      });
      navigateToMatchDetails(item, index);
    },
    [navigateToMatchDetails]
  );

  const getMatchImageUri = (item: any): string | undefined =>
    getPossibleMatchThumbnailUri(item);

  const handleWishlistPress = useCallback(
    async (item: any) => {
      const archetypeId = getMatchArchetypeId(item);
      if (!archetypeId) {
        showToast(strings.collection.favorite.addFailed, "error");
        return;
      }
      if (wishlistToggleInFlight.current.has(archetypeId)) return;

      const wasFavorite = favorites.includes(archetypeId);
      if (wasFavorite) {
        setPendingWishlistRemove({
          archetypeId,
          name: getMatchDisplayName(item),
        });
        setShowRemoveWishlistConfirm(true);
        return;
      }

      wishlistToggleInFlight.current.add(archetypeId);
      try {
        const result = await toggleFavorite(archetypeId);
        if (result === "added") {
          showToast(strings.collection.favorite.added, "success");
        } else {
          showToast(strings.collection.favorite.addFailed, "error");
        }
      } finally {
        wishlistToggleInFlight.current.delete(archetypeId);
      }
    },
    [favorites, showToast, strings.collection.favorite, toggleFavorite]
  );

  const handleConfirmWishlistRemove = useCallback(async () => {
    const pending = pendingWishlistRemove;
    if (!pending) return;
    if (wishlistToggleInFlight.current.has(pending.archetypeId)) return;

    wishlistToggleInFlight.current.add(pending.archetypeId);
    try {
      const result = await toggleFavorite(pending.archetypeId);
      if (result === "removed") {
        showToast(strings.collection.favorite.removed, "success");
      } else {
        showToast(strings.collection.favorite.removeFailed, "error");
      }
    } finally {
      wishlistToggleInFlight.current.delete(pending.archetypeId);
      setPendingWishlistRemove(null);
    }
  }, [
    pendingWishlistRemove,
    showToast,
    strings.collection.favorite,
    toggleFavorite,
  ]);

  const renderMatchItem = ({ item, index }: { item: any; index: number }) => {
    const displayName = getMatchDisplayName(item);
    const accuracyPct =
      item.accuracy ??
      (item.similarityScore != null
        ? Math.round(
            item.similarityScore <= 1
              ? item.similarityScore * 100
              : item.similarityScore
          )
        : 0);
    const imageUri = getMatchImageUri(item);
    const itemKey = item.id ?? item._id ?? `match-${index}`;
    const archetypeId = getMatchArchetypeId(item);
    const isWishlisted =
      archetypeId != null && favorites.includes(archetypeId);
    const thumbnailError = imageErrorKeys.has(String(itemKey));
    const cardBg = isDark ? colors.surfacePrimary : APP_COLORS.surfaceWhite;
    const cardBorder = isDark ? colors.border0 : APP_COLORS.borderLight;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleMatchPress(item, index ?? 0)}
        style={styles.matchCardWrap}
      >
        <View
          collapsable={false}
          style={[
            styles.matchCard,
            {
              borderColor: cardBorder,
              backgroundColor: cardBg,
            },
          ]}
        >
          <View style={styles.matchInfo} collapsable={false}>
            <Text
              variant="body"
              size="medium"
              weight="bold"
              numberOfLines={2}
              style={[styles.matchName, { color: colors.textPrimary }]}
            >
              {displayName}
            </Text>
            <View style={styles.accuracyBlock}>
              <Text
                variant="body"
                size="small"
                weight="medium"
                style={{ color: colors.textPrimary }}
              >
                {accuracyPct}%
              </Text>
              <Text
                variant="body"
                size="small"
                style={{ color: colors.textSecondary }}
              >
                Accuracy Score
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.thumbnailWrap,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            {imageUri && !thumbnailError ? (
              <CachedRemoteImage
                uri={imageUri}
                style={styles.matchThumbnail}
                resizeMode="cover"
                priority="high"
                onError={() =>
                  setImageErrorKeys((prev) =>
                    new Set(prev).add(String(itemKey))
                  )
                }
              />
            ) : (
              <AppImage
                source={Images.card_image_placeholder}
                style={styles.matchThumbnail}
                resizeMode="cover"
              />
            )}
            <TouchableOpacity
              style={[
                styles.starBadge,
                { backgroundColor: isDark ? colors.surfacePrimary : APP_COLORS.surfaceWhite },
              ]}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                void handleWishlistPress(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              <AppImage
                key={isWishlisted ? "star-filled" : "star-empty"}
                source={
                  isWishlisted
                    ? Images.mushroomWishlistStarFilled
                    : Images.mushroomWishlistStar
                }
                style={styles.starIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="medium"
          weight="bold"
          style={[styles.headerTitle, { color: colors.textPrimary }]}
        >
          {screenTitle}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {showLocationBanner ? (
        <View style={styles.locationBannerWrap}>
          <IdentificationLocationBanner
            variant="results"
            permissionGranted={showLocationAsGranted}
            locationLabel={locationLabel}
            onToggleLocation={handleLocationToggle}
            onPressLocation={handlePressSetLocation}
          />
        </View>
      ) : null}

      <FlatList
        data={matches}
        extraData={favorites}
        keyExtractor={(item, index) => item.id ?? item._id ?? `match-${index}`}
        renderItem={renderMatchItem}
        contentContainerStyle={styles.list}
        style={styles.listFlex}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={8}
        removeClippedSubviews={false}
      />

    </SafeAreaView>

    <RemoveFromWishlistConfirmation
      visible={showRemoveWishlistConfirm}
      onClose={() => {
        setShowRemoveWishlistConfirm(false);
        setPendingWishlistRemove(null);
      }}
      onConfirm={handleConfirmWishlistRemove}
      mushroomName={pendingWishlistRemove?.name}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 52,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  locationBannerWrap: {
    paddingHorizontal: LIST_HORIZONTAL_PADDING,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: LIST_HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 24,
  },
  listFlex: {
    flex: 1,
  },
  matchCardWrap: {
    width: "100%",
    marginBottom: 16,
  },
  matchCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  matchInfo: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  matchName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  accuracyBlock: {
    alignItems: "flex-start",
    gap: 0,
  },
  thumbnailWrap: {
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: Radius.sm,
    overflow: "hidden",
    position: "relative",
  },
  matchThumbnail: {
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: Radius.sm,
  },
  starBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  starIcon: {
    width: 20,
    height: 20,
  },
});
