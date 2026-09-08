/**
 * Possible Matches Screen (post-identification)
 * Figma: Mushroom App — Possible matches (8672:87227), location banner (8728:31542)
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar, Pressable } from "react-native";
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
import { Images, SoundLibraryEditIcon, DetailsMoreShareLight, DetailsMoreShareDark, DetailsMoreReportLight, DetailsMoreReportDark } from "../../../assets";
import { getDisplayName, getMushroomDisplayScientificFromFields } from "../../../utils/mushroomDisplayUtils";
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
import { SoundSampleCard } from "../components/SoundSampleCard";
import { SoundMatchesFooter, SoundCantFindSection } from "../components/SoundMatchesFooter";
import { SoundPlayButton } from "../components/SoundPlayButton";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { useBirdsStore } from "../../../features/catalogue/birds.store";
import { RemoveFromWishlistConfirmation } from "../../../components/RemoveFromWishlistConfirmation";
import { WizardAnswersFooter, WizardCantFindSection, WizardSectionDivider } from "../../discovery/components/WizardAnswersFooter";
import { useStepByStepStore } from "../../discovery/stepByStep.store";
import { buildWizardAnswerRows } from "../../discovery/utils/stepByStepAnswers";
import type { WizardQuestion } from "../../discovery/stepByStep.types";
import { ReportModal } from "../../../molecules/ReportModal";
import { AddSoundNotePopup } from "../../../molecules/Modal";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { useIdentificationEntryStore } from "../identificationEntry.store";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourBirdBackground";
import { useCatalogueCardSound } from "../../catalogue/hooks/useCatalogueCardSound";
import { formatSoundStamp } from "../utils/soundCrop";
import { canAddAudioGalleryClip } from "../../../services/session/audioGalleryLimit.service";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { saveUnknownSoundRecording } from "../utils/saveSoundRecording";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { shareMushroom } from "../../../utils/shareUtils";

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
  const uploadedSoundUrls = useIdentificationResultsStore(
    (s) => s.uploadedSoundUrls
  );
  const uploadedImageUrls = useIdentificationResultsStore(
    (s) => s.uploadedImageUrls
  );
  // Prefer in-memory store (set on analyze screen) for instant paint after navigation.
  const matches = storedMatches.length > 0 ? storedMatches : routeMatches;
  const fromStepByStep = route.params?.fromStepByStep === true;
  const fromSound = route.params?.fromSound === true;
  const audioUri = route.params?.audioUri;
  const audioDurationSec = route.params?.audioDurationSec ?? 0;
  const recordedAt = route.params?.recordedAt ?? Date.now();
  const soundCopy = CAMERA_STRINGS.sound;
  const wizardAnswers = useStepByStepStore((s) => s.answers);
  const wizardAnswerRows = fromStepByStep
    ? buildWizardAnswerRows(wizardAnswers)
    : [];
  const wizardCopy = HOME_STRINGS.discovery.stepByStep;
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [recordingNote, setRecordingNote] = useState("");
  const [savedToUnknown, setSavedToUnknown] = useState(false);
  const [savingRecording, setSavingRecording] = useState(false);
  const { playingId, toggleSound } = useCatalogueCardSound();
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
  const showLocationBanner = returnTo?.tab !== "Catalogue" && !fromSound;
  const showLocationAsGranted = shouldShowLocationBannerAsGranted(
    locationPermissionGranted,
    location
  );
  const pinCantFindFooter =
    matches.length <= 2 && (fromStepByStep || fromSound);

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
    if (fromStepByStep) {
      useIdentificationEntryStore.getState().setSuppressFtueAutoNavigation(true);
      navigation.getParent()?.navigate("Home", { screen: "HomeMain" });
      return;
    }
    exitToCameraMain();
  }, [navigation, returnTo, fromStepByStep, exitToCameraMain]);

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

  const handleEditAnswer = useCallback(
    (question: WizardQuestion) => {
      useStepByStepStore.getState().setEditQuestion(question);
      navigation.getParent()?.navigate("Home", {
        screen: "StepByStep",
        params: { editQuestion: question },
      });
    },
    [navigation]
  );

  const handleAddManually = useCallback(() => {
    navigation.getParent()?.navigate("Catalogue", {
      screen: "SearchFilter",
    });
  }, [navigation]);

  const handleShareTopMatch = useCallback(async () => {
    setShowMenu(false);
    const top = matches[0];
    if (!top) {
      showToast("No matches to share yet.", "warning");
      return;
    }
    const displayName = getMatchDisplayName(top);
    const nested = top?.match ?? {};
    const imageUri = getPossibleMatchThumbnailUri(top);
    try {
      await shareMushroom(
        displayName,
        nested.scientificName ?? top.scientificName,
        imageUri
      );
    } catch {
      showToast("Failed to open share", "error");
    }
  }, [matches, showToast]);

  const soundStamp = formatSoundStamp(new Date(recordedAt));
  const soundPlace =
    showLocationAsGranted && locationLabel?.trim()
      ? locationLabel.trim()
      : soundCopy.noLocation;

  const handleSaveRecording = useCallback(async () => {
    if (savingRecording) return;
    const allowed = await canAddAudioGalleryClip();
    if (!allowed) {
      navigateToSubscriptionMain();
      return;
    }
    const uploaded =
      uploadedSoundUrls?.find(
        (uri) => typeof uri === "string" && /^https?:\/\//i.test(uri.trim())
      ) ?? "";
    if (!uploaded) {
      showToast(
        "The recording could not be saved. Please identify again.",
        "error"
      );
      return;
    }
    const imageUrlsFromMatches = matches
      .map((item) => getPossibleMatchThumbnailUri(item))
      .filter((uri): uri is string => !!uri && /^https?:\/\//i.test(uri));
    const imageUrls = [
      ...(uploadedImageUrls ?? []).filter((uri) =>
        /^https?:\/\//i.test(uri.trim())
      ),
      ...imageUrlsFromMatches,
    ];
    const uniqueImageUrls = [...new Set(imageUrls)];
    if (!uniqueImageUrls.length) {
      showToast(
        "Could not find a reference image for this recording. Try identifying again or pick a match first.",
        "error"
      );
      return;
    }
    setShowAddNote(true);
  }, [savingRecording, uploadedSoundUrls, uploadedImageUrls, matches, showToast]);

  const handleNoteContinue = useCallback(
    async (note: string) => {
      if (savingRecording) return;
      const uploaded =
        uploadedSoundUrls?.find(
          (uri) => typeof uri === "string" && /^https?:\/\//i.test(uri.trim())
        ) ?? "";
      const imageUrlsFromMatches = matches
        .map((item) => getPossibleMatchThumbnailUri(item))
        .filter((uri): uri is string => !!uri && /^https?:\/\//i.test(uri));
      const imageUrls = [
        ...(uploadedImageUrls ?? []).filter((uri) =>
          /^https?:\/\//i.test(uri.trim())
        ),
        ...imageUrlsFromMatches,
      ];
      const uniqueImageUrls = [...new Set(imageUrls)];
      try {
        setSavingRecording(true);
        await saveUnknownSoundRecording({
          uploadedSoundUrl: uploaded,
          note,
          imageUrls: uniqueImageUrls,
        });
        setRecordingNote(note);
        setShowAddNote(false);
        setSavedToUnknown(true);
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Could not save this recording.",
          "error"
        );
      } finally {
        setSavingRecording(false);
      }
    },
    [savingRecording, uploadedSoundUrls, uploadedImageUrls, matches, showToast]
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

  const renderSoundMatchItem = ({ item, index }: { item: any; index: number }) => {
    const displayName = getMatchDisplayName(item);
    const nested = item?.match ?? {};
    const scientific = getMushroomDisplayScientificFromFields({
      commonNames: item?.commonNames ?? nested.commonNames,
      genusCommonNames: item?.genusCommonNames ?? nested.genusCommonNames,
      commonName: item?.commonName ?? nested.commonName,
      name: item?.name ?? nested.name,
      scientificName:
        item?.scientificName ??
        nested.scientificName ??
        nested.verbatimScientificName,
      verbatimScientificName: nested.verbatimScientificName,
    });
    const imageUri = getMatchImageUri(item);
    const itemKey = String(item.id ?? item._id ?? `match-${index}`);
    const thumbnailError = imageErrorKeys.has(itemKey);
    const cardBg = isDark ? colors.surfacePrimary : APP_COLORS.surfaceWhite;
    const cardBorder = isDark ? colors.border0 : APP_COLORS.borderLight;
    const soundUrls: string[] | undefined =
      item?.match?.soundUrls ?? item?.soundUrls;
    const isPlaying = playingId === itemKey;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleMatchPress(item, index ?? 0)}
        style={styles.matchCardWrap}
      >
        <View
          style={[
            styles.soundMatchCard,
            { borderColor: cardBorder, backgroundColor: cardBg },
          ]}
        >
          <View
            style={[
              styles.soundThumbWrap,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            {imageUri && !thumbnailError ? (
              <CachedRemoteImage
                uri={imageUri}
                style={styles.soundThumb}
                resizeMode="cover"
                priority="high"
                onError={() =>
                  setImageErrorKeys((prev) => new Set(prev).add(itemKey))
                }
              />
            ) : (
              <AppImage
                source={Images.card_image_placeholder}
                style={styles.soundThumb}
                resizeMode="cover"
              />
            )}
          </View>
          <View style={styles.soundMatchCopy}>
            <Text
              numberOfLines={1}
              style={[styles.matchName, { color: colors.textPrimary }]}
            >
              {displayName}
            </Text>
            {scientific ? (
              <Text
                numberOfLines={1}
                style={[styles.soundScientific, { color: colors.textSecondary }]}
              >
                {scientific}
              </Text>
            ) : null}
            <Text
              numberOfLines={1}
              style={[styles.soundMeta, { color: colors.textSecondary }]}
            >
              {soundStamp}  •  {soundPlace}
            </Text>
          </View>
          {soundUrls?.length ? (
            <SoundPlayButton
              isPlaying={isPlaying}
              onPress={() => {
                void toggleSound(itemKey, soundUrls);
              }}
            />
          ) : (
            <View style={styles.soundPlaySpacer} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
                    ? Images.wishlistStarFilled
                    : Images.wishlistStar
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {fromSound ? <FindYourBirdBackground /> : null}
    <SafeAreaView
      style={styles.safe}
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
        {fromSound ? (
          <View style={styles.headerSpacer} />
        ) : (
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={[styles.headerTitle, { color: colors.textPrimary }]}
          >
            {screenTitle}
          </Text>
        )}
        {fromSound ? (
          <TouchableOpacity
            onPress={() => setShowMenu((open) => !open)}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <MaterialIcons
              name="more-horiz"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {fromSound && showMenu ? (
        <View style={[StyleSheet.absoluteFillObject, styles.menuOverlay]} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowMenu(false)}
          />
          <View
            style={[
              styles.menu,
              {
                backgroundColor: isDark
                  ? colors.surfacePrimary
                  : APP_COLORS.surfaceWhite,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                void handleShareTopMatch();
              }}
            >
              {isDark ? (
                <DetailsMoreShareDark width={20} height={20} />
              ) : (
                <DetailsMoreShareLight width={20} height={20} />
              )}
              <Text
                variant="body"
                size="medium"
                style={[styles.menuItemLabel, { color: colors.textPrimary }]}
              >
                Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowReportModal(true);
              }}
            >
              {isDark ? (
                <DetailsMoreReportDark width={20} height={20} />
              ) : (
                <DetailsMoreReportLight width={20} height={20} />
              )}
              <Text
                variant="body"
                size="medium"
                style={[styles.menuItemLabel, { color: colors.textPrimary }]}
              >
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
        extraData={[favorites, wizardAnswerRows, playingId, recordingNote]}
        keyExtractor={(item, index) => item.id ?? item._id ?? `match-${index}`}
        renderItem={fromSound ? renderSoundMatchItem : renderMatchItem}
        contentContainerStyle={styles.list}
        style={styles.listFlex}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={8}
        removeClippedSubviews={false}
        ListHeaderComponent={
          fromSound ? (
            <View style={styles.soundHeader}>
              {audioUri ? (
                <SoundSampleCard
                  durationSec={audioDurationSec}
                  stamp={soundStamp}
                  place={soundPlace}
                  birdCount={matches.length}
                  isPlaying={playingId === "user-recording"}
                  onTogglePlay={() => {
                    void toggleSound("user-recording", [audioUri]);
                  }}
                />
              ) : null}
              <IdentificationLocationBanner
                variant="results"
                permissionGranted={showLocationAsGranted}
                locationLabel={locationLabel}
                prompt={soundCopy.enableLocation}
                onToggleLocation={handleLocationToggle}
                onPressLocation={handlePressSetLocation}
              />
              {recordingNote ? (
                <View
                  style={[
                    styles.noteCard,
                    { backgroundColor: `${colors.primaryCTA}14` },
                  ]}
                >
                  <View style={styles.noteHeader}>
                    <Text
                      style={[styles.noteLabel, { color: colors.textPrimary }]}
                    >
                      {soundCopy.noteLabel}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAddNote(true)}
                      hitSlop={HIT_SLOP.SMALL}
                    >
                      <SoundLibraryEditIcon
                        width={16}
                        height={16}
                        color={colors.primaryCTA}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[styles.noteBody, { color: colors.textPrimary }]}
                  >
                    {recordingNote}
                  </Text>
                </View>
              ) : null}
              <Text
                style={[styles.soundSectionTitle, { color: colors.textPrimary }]}
              >
                {soundCopy.possibleMatches.replace(
                  "{count}",
                  String(matches.length)
                )}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          fromStepByStep ? (
            <>
              <WizardSectionDivider />
              <WizardAnswersFooter
              rows={wizardAnswerRows}
              answersTitle={wizardCopy.yourAnswers}
              answersSubtitle={wizardCopy.yourAnswersSubtitle}
              editLabel={wizardCopy.edit}
              cantFindTitle={wizardCopy.cantFindTitle}
              cantFindBody={wizardCopy.cantFindBody}
              addManuallyLabel={wizardCopy.addManually}
              reportLabel={wizardCopy.reportNoMatches}
              onEdit={handleEditAnswer}
              onAddManually={handleAddManually}
              onReport={() => setShowReportModal(true)}
              hideCantFind={pinCantFindFooter}
            />
            </>
          ) : fromSound ? (
            <SoundMatchesFooter
              onSave={() => {
                void handleSaveRecording();
              }}
              onReport={() => setShowReportModal(true)}
              hideCantFind={pinCantFindFooter}
            />
          ) : null
        }
      />

      {pinCantFindFooter ? (
        <View style={styles.pinnedCantFindWrap}>
          {fromStepByStep ? (
            <WizardCantFindSection
              cantFindTitle={wizardCopy.cantFindTitle}
              cantFindBody={wizardCopy.cantFindBody}
              addManuallyLabel={wizardCopy.addManually}
              reportLabel={wizardCopy.reportNoMatches}
              onAddManually={handleAddManually}
              onReport={() => setShowReportModal(true)}
            />
          ) : (
            <SoundCantFindSection
              onSave={() => {
                void handleSaveRecording();
              }}
              onReport={() => setShowReportModal(true)}
            />
          )}
        </View>
      ) : null}

    </SafeAreaView>
    {fromSound && savedToUnknown ? (
      <View
        style={[
          styles.savedBanner,
          {
            borderColor: colors.success,
            backgroundColor: colors.surfaceSuccess,
          },
        ]}
      >
        <Text style={[styles.savedText, { color: colors.success }]}>
          {soundCopy.savedToUnknown}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSavedToUnknown(false);
            setRecordingNote("");
          }}
          hitSlop={HIT_SLOP.SMALL}
        >
          <Text style={[styles.savedUndo, { color: colors.success }]}>
            {soundCopy.undo}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSavedToUnknown(false)}
          hitSlop={HIT_SLOP.SMALL}
        >
          <Text style={[styles.savedClose, { color: colors.success }]}>
            ×
          </Text>
        </TouchableOpacity>
      </View>
    ) : null}
    </View>

    <RemoveFromWishlistConfirmation
      visible={showRemoveWishlistConfirm}
      onClose={() => {
        setShowRemoveWishlistConfirm(false);
        setPendingWishlistRemove(null);
      }}
      onConfirm={handleConfirmWishlistRemove}
      mushroomName={pendingWishlistRemove?.name}
    />
    <ReportModal
      visible={showReportModal}
      variant="mushroom"
      title={fromSound ? soundCopy.reportTitle : wizardCopy.reportTitle}
      description={
        fromSound ? soundCopy.reportDescription : wizardCopy.reportDescription
      }
      onClose={() => setShowReportModal(false)}
      onSubmit={async () => {
        setShowReportModal(false);
        showToast(
          fromSound ? soundCopy.reportSent : wizardCopy.reportSent,
          "success"
        );
      }}
    />
    <AddSoundNotePopup
      visible={showAddNote}
      initialNote={recordingNote}
      busy={savingRecording}
      onClose={() => {
        if (savingRecording) return;
        setShowAddNote(false);
      }}
      onContinue={(note) => {
        void handleNoteContinue(note);
      }}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  safe: {
    flex: 1,
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
  pinnedCantFindWrap: {
    paddingHorizontal: LIST_HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 12,
  },
  menuOverlay: {
    zIndex: 20,
  },
  menu: {
    position: "absolute",
    top: 52,
    right: 12,
    minWidth: 180,
    borderRadius: Radius.md,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  menuItemLabel: {
    marginLeft: 4,
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
  soundHeader: {
    gap: 12,
    paddingBottom: 12,
  },
  noteCard: {
    borderRadius: Radius.md,
    padding: 12,
    gap: 4,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteLabel: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  noteBody: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  soundSectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 4,
  },
  soundMatchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  soundThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  soundThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
  },
  soundMatchCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  soundScientific: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    fontStyle: "italic",
  },
  soundMeta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  soundPlaySpacer: {
    width: 40,
    height: 40,
  },
  savedBanner: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  savedText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  savedUndo: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: "underline",
  },
  savedClose: {
    fontFamily: FONTS.medium,
    fontSize: 20,
    lineHeight: 20,
  },
});
