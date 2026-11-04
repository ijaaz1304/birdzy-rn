/**
 * Mushroom Details Screen
 * Displays detailed information about a mushroom species.
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, ActivityIndicator, KeyboardAvoidingView, Pressable, InteractionManager } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
  CompositeNavigationProp,
  CommonActions,
} from "@react-navigation/native";
import { NavigationService, navigateToSubscriptionMain } from "../../../utils/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import {
  CollectionStackParamList,
  RootStackParamList,
} from "../../../navigation/types";
import { ReportModal, REPORT_MODAL_KEYBOARD_COOLDOWN_MS } from "../../../molecules/ReportModal";
import { MushroomDetail } from "../../../types/mushrooms.types";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";
import { CardSkeleton } from "../../../components/skeleton";
import { shareMushroom } from "../../../utils/shareUtils";
import {
  getDisplayName,
  getMushroomDisplayScientificFromFields,
  getPrimaryCommonName,
  resolveCommonNameFieldsFromRaw,
} from "../../../utils/mushroomDisplayUtils";
import {
  getMushroomImageUrls,
} from "../../../config/mushroomImageUrls.config";
import { formatTitleCase } from "../../../utils";
import { resolveArchetypeId } from "../../../utils/navigationIds";
import { resolveMushroomImageUrlsForDisplay } from "../../../utils/mushroomCardUtils";
import { getSpecimenDisplayImageUrls } from "../collection.utils";
import {
  getArchetypeImageUrls,
  normalizeMushroomDetail,
} from "../../../utils/mushroomApiMappers";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import {
  LimitReachedBottomSheet,
  RemoveFromCollectionModal,
  UpgradeModal,
  IdentificationWarningPopup,
  LocationManageAccessPopup,
  LocationPermissionPopup,
  ChangeLocationBottomSheet,
  SoundCollectionNoteModal,
} from "../../../molecules/Modal";
import {
  hasSeenIdentificationSafetyWarning,
  markIdentificationSafetyWarningSeen,
} from "../../../services/session/identificationWarning.service";
import { useToast } from "../../../hooks";
import { useEditMushroomResultStore } from "../editMushroomResult.store";
import {
  buildMushroomSpecimenAddFromRaw,
  type SpecimenAddOptions,
} from "../editMushroomDetails.utils";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import {
  Images,
  RateMatchSad01Light,
  RateMatchSad01Dark,
  RateMatchSad02Light,
  RateMatchSad02Dark,
  RateMatchFlushedLight,
  RateMatchFlushedDark,
  RateMatchHappyLight,
  RateMatchHappyDark,
  RateMatchStarFaceLight,
  RateMatchStarFaceDark,
  DetailsMoreAddStarLight,
  DetailsMoreAddStarDark,
  DetailsMoreRemoveStarLight,
  DetailsMoreRemoveStarDark,
  DetailsMoreShareLight,
  DetailsMoreShareDark,
  DetailsMoreEditLight,
  DetailsMoreEditDark,
  DetailsMoreReportLight,
  DetailsMoreReportDark,
  DetailsMoreRemoveLight,
  DetailsMoreRemoveDark,
  CatalogueVolumeIcon,
} from "../../../assets";
import { coreApi } from "../../../services/api/features/core.api";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import { useBirdsStore } from "../../../features/catalogue/birds.store";
import {
  MUSHROOM_DETAILS_EXTRA,
  SCREEN_COLORS,
  ACCENT_COLORS,
  AI_DETAILS_SPEC,
  INTERACTIVE_COLORS,
  SHEET_COLORS,
  SUBSCRIPTION_COLORS,
} from "../../../constants/colorConstants";
import { typography } from "../../../design-system/typography";
import { CatalogueDetailCarousel } from "../components/CatalogueDetailCarousel";
import {
  BirdDetailsScrollSections,
  useCustomLocationSectionFlow,
  type BirdScrollSectionId,
} from "../components/BirdDetailsScrollSections";
import { DetailsTabPremiumBadge } from "../components/DetailsTabPremiumBadge";
import { RemoveFromWishlistConfirmation } from "../../../components/RemoveFromWishlistConfirmation";
import { useBackHandler } from "../../../utils/backHandler";
import { AddToCollectionBottomSheet } from "../../camera/components/AddToCollectionBottomSheet";
import { CreateCollectionBottomSheet } from "../../camera/components/CreateCollectionBottomSheet";
import { useIdentificationResultsStore } from "../../camera/identificationResults.store";
import { AddToAnotherCollectionBottomSheet } from "../components/AddToAnotherCollectionBottomSheet";
import { MoveToCollectionBottomSheet } from "../components/MoveToCollectionBottomSheet";
import {
  looksLikeMongoCollectionId,
  normalizeCollectionIds,
  resolveArchetypeIdFromSpecimen,
} from "../collection.utils";
import { findFirstCountryWithCoordinates } from "../../../utils/countryCoordinates";
import { prefetchRemoteImages } from "../../../utils/prefetchImages";
import { MODAL_STRINGS } from "../../../config/strings/modals.strings";
import { sendRatingFeedback } from "../../../services/rating/ratingFeedback.service";
import { collectionService } from "../../../services/collection/collection.service";
import {
  logCollectionUiGate,
  shouldShowCollectionLimitPaywall,
} from "../../../services/session/collectionLimit.service";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { UI_STATE_KEYS } from "../../../constants/storageConstants";
import { toAnalyticsSource } from "../../../services/analytics/analyticsParams";
import {
  COLLECTION_LIMITS,
  ADD_TO_COLLECTION_IDS,
  FREE_COLLECTION_LIMIT,
  FREE_SPECIMEN_LIMIT,
  isUserCreatedCollectionName,
} from "../../../constants/appConstants";
import { useStrings } from "../../../hooks/useStrings";
import { useWishlistInvalidationStore } from "../wishlistInvalidation.store";
import { useCollectionInvalidationStore } from "../collectionInvalidation.store";

import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";
import { FIGMA_TOKENS } from "../../../design-system/colors/figmaTokens";

/** Figma: Surface-brand 2 Accent — rgba(199, 99, 12, 0.16); radius/m 12px */
const RATE_MATCH_CARD_BG = FIGMA_TOKENS.surface.brand2Accent;
const RATE_MATCH_CARD_RADIUS = 12;
const RATE_MATCH_CARD_WIDTH = "100%";
const RATE_MATCH_SUBMIT_TEXT = APP_COLORS.surfaceDark;

type BirdDetailsScreenRouteProp = RouteProp<
  CollectionStackParamList,
  "BirdDetails"
>;
type BirdDetailsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CollectionStackParamList, "BirdDetails">,
  NativeStackNavigationProp<RootStackParamList>
>;

function remoteHttpUrls(urls?: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls ?? []) {
    const url = typeof raw === "string" ? raw.trim() : "";
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Sound-identify recording URLs to store on the specimen (Identified sound library). */
function identificationRecordingUrls(
  source: string | undefined
): string[] {
  if (source !== "identification") return [];
  return remoteHttpUrls(
    useIdentificationResultsStore.getState().uploadedSoundUrls
  );
}

function withIdentificationRecording(
  source: string | undefined,
  options: SpecimenAddOptions
): SpecimenAddOptions {
  const recorded = identificationRecordingUrls(source);
  if (!recorded.length || options.userCapturedSounds?.length) return options;
  return { ...options, userCapturedSounds: recorded };
}

function identificationRecordingPatch(source: string | undefined): {
  userCapturedSounds?: string[];
} {
  const recorded = identificationRecordingUrls(source);
  return recorded.length ? { userCapturedSounds: recorded } : {};
}

async function addMushroomSpecimenFromDetail(
  archetypeId: string,
  detail: MushroomDetail,
  options: SpecimenAddOptions
): Promise<string> {
  const payload = buildMushroomSpecimenAddFromRaw(
    detail as unknown as Record<string, unknown>,
    archetypeId,
    options
  );
  const specimen = await mushroomSpecimenService.addSpecimen(payload);
  const sid = specimen?.id ?? (specimen as { _id?: string } | undefined)?._id;
  if (!sid) {
    throw new Error("Failed to create specimen");
  }
  return String(sid);
}

/** Shorten image URLs for app logs (avoid huge strings). */
function summarizeImageUrlsForLog(urls: unknown[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.slice(0, 3).map((u) => {
    const s = typeof u === "string" ? u : String(u);
    return s.length > 96 ? `${s.slice(0, 96)}…` : s;
  });
}

export const BirdDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const navigation = useNavigation<BirdDetailsScreenNavigationProp>();
  const route = useRoute<BirdDetailsScreenRouteProp>();
  const routeParams = route.params;
  const mushroomId = resolveArchetypeId(routeParams) ?? "";
  const {
    source,
    collectionName,
    collectionId: routeCollectionId,
    idType,
    specimenId: routeSpecimenId,
    otherMatches,
    fromOtherPossibleMatches,
    otherPossibleMatchesTitle,
    otherPossibleMatchesReturnTo,
    fromCollectionDetails,
    birdOfTheDayIds,
    birdOfTheDayClickCount,
    identificationAccuracy: _identificationAccuracy,
    identificationImage,
    initialMushroomData,
    previewImageUri,
  } = routeParams || {};
  const isFromIdentification =
    source === "identification" || fromOtherPossibleMatches === true;
  const isBirdOfTheDay = source === "birdOfTheDay";

  useEffect(() => {
    if (isFromIdentification) {
      analyticsService.logEvent(EVENTS.identification_details_screen, {
        mushroom_id: String(mushroomId),
      });
    }
    if (isBirdOfTheDay) {
      analyticsService.logEvent(EVENTS.bird_of_the_day_screen, {
        mushroom_id: String(mushroomId),
      });
    }
  }, [isFromIdentification, isBirdOfTheDay, mushroomId]);

  useEffect(() => {
    if (__DEV__ && otherMatches && otherMatches.length > 0) {
      console.log(
        "[MushroomDetails] Other Possible Matches:",
        otherMatches.length,
        JSON.stringify(
          otherMatches.map((m: any) => ({
            id: m.id,
            name: m.name,
            similarityScore: m.similarityScore,
            accuracy: m.accuracy,
            image: m.image ? "(present)" : undefined,
          }))
        )
      );
    }
  }, [otherMatches]);
  /** Edit only for: identified via scan (identification) or identified from collection (Identified tab) */
  const canEdit =
    source === "identification" ||
    (source === "collection" && collectionName === "Identified");
  const favorites = useBirdsStore((s) => s.favorites);
  const suppressedWishlistIds = useBirdsStore(
    (s) => s.suppressedWishlistIds
  );
  const isDark = useIsDark();

  const screenColors = isDark ? SCREEN_COLORS.DARK : SCREEN_COLORS.LIGHT;
  /** AI Details Page spec: exact light/dark colors for page, cards, tabs, CTA */
  const spec = isDark ? AI_DETAILS_SPEC.DARK : AI_DETAILS_SPEC.LIGHT;
  /** Surface: light #F6F6F6, dark #171717; cards/views: light #FFF, dark #111 */
  const PRIMARY_BG = spec.PAGE_BG;
  /** Name origin block */
  const nameOriginBg = isDark
    ? MUSHROOM_DETAILS_EXTRA.NAME_ORIGIN_BG_DARK
    : MUSHROOM_DETAILS_EXTRA.NAME_ORIGIN_BG_LIGHT;
  const SECONDARY_SURFACE = spec.CARD_BG;
  const DIVIDER = spec.ROW_DIVIDER;
  const TEXT_PRIMARY = spec.PRIMARY_TEXT;
  const TEXT_SECONDARY = spec.SECONDARY_TEXT;
  const TEXT_MUTED = spec.SECONDARY_TEXT;

  /** Clean layout spacing (fixed px) — do not mix with spacing[n] */
  const LAYOUT_MARGIN = 20;
  const SECTION_GAP = 12;
  const CONTENT_TO_HEADING_GAP = 20;
  const TITLE_TO_CONTENT = 12;
  const ROW_SPACING = 16;
  const HEADER_TO_TABS = 24;
  const HEADER_TABS_MARGIN_TOP = 24;
  const TABS_TO_CONTENT_GAP = 20;
  const ROW_PADDING_VERTICAL = 8;
  const TEXT_LINE_GAP = 8;
  const NAME_ORIGIN_TOP = 16;
  const TAB_BAR_BORDER = INTERACTIVE_COLORS.TAB_BAR_BORDER;

  /** Design spec (match Rock Details image): name/synonym/price/description — Satoshi from design system */
  const NAME_HEADING = {
    ...typography.title.large,
    fontSize: 26,
    lineHeight: 32,
    color: APP_COLORS.surfaceDark,
  };
  /** Synonym and unit text (e.g. "/Carat") — 15px, regular, secondary */
  const SYNONYM_AND_UNIT = {
    ...typography.body.large,
    fontSize: 15,
    color: isDark ? spec.SECONDARY_TEXT : APP_COLORS.textSecondaryGray,
  };
  const SECTION_HEADING_SPEC = {
    ...typography.title.xsmallBold,
    color: isDark ? spec.PRIMARY_TEXT : APP_COLORS.surfaceDark,
  };
  const SUB_TEXT_SPEC = {
    ...typography.body.large,
    letterSpacing: -0.16,
    color: isDark ? spec.SECONDARY_TEXT : APP_COLORS.textSecondaryGray,
  };

  const SECTION_CARD_BG = isDark
    ? APP_COLORS.surfaceDark
    : APP_COLORS.modalTextOnPrimary;

  const [mushroomData, setMushroomData] = useState<MushroomDetail | null>(null);
  /** When opened with idType=specimen, this is the resolved archetype ID for wishlist/API calls */
  const [resolvedArchetypeId, setResolvedArchetypeId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  /** Increment to refetch details (e.g. after returning from Edit with saved result) */
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const effectiveArchetypeId =
    (typeof resolvedArchetypeId === "string" && resolvedArchetypeId.trim()) ||
    (typeof mushroomId === "string" ? mushroomId : "");
  const [activeTab, setActiveTab] = useState("sounds");
  const [nameSoundPlaying, setNameSoundPlaying] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  /** Section Y offsets (from onLayout) for tab scroll — avoids measureLayout ref errors on Fabric */
  const sectionYOffsets = useRef<Record<string, number>>({
    overview: 0,
    similar: 0,
    morphology: 0,
    habitat: 0,
    sounds: 0,
    range: 0,
    behavior: 0,
    feeding: 0,
    breeding: 0,
  });
  const mushroomSectionsOffsetY = useRef(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSoundCollectionNote, setShowSoundCollectionNote] = useState(false);
  /** Prevents KeyboardAvoidingView from resizing while report modal closes. */
  const [reportModalKeyboardCooldown, setReportModalKeyboardCooldown] =
    useState(false);
  const [showRemoveFromCollection, setShowRemoveFromCollection] =
    useState(false);
  const [showAddToCollectionSheet, setShowAddToCollectionSheet] =
    useState(false);
  const [showAddToAnotherCollectionSheet, setShowAddToAnotherCollectionSheet] =
    useState(false);
  const [showMoveToCollectionSheet, setShowMoveToCollectionSheet] =
    useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [showCreateCollectionSheet, setShowCreateCollectionSheet] =
    useState(false);
  const [createFlowMushroomId, setCreateFlowMushroomId] = useState<
    string | null
  >(null);
  const [createFlowTarget, setCreateFlowTarget] = useState<
    "add" | "addAnother" | "move" | null
  >(null);
  const [showCollectionLimitSheet, setShowCollectionLimitSheet] =
    useState(false);
  const [collectionLimitSheetType, setCollectionLimitSheetType] = useState<
    "collection" | "collectionAlt"
  >("collection");
  const [refreshAddSheetTrigger, setRefreshAddSheetTrigger] = useState(0);
  const [refreshAddAnotherTrigger, setRefreshAddAnotherTrigger] = useState(0);
  const [refreshMoveTrigger, setRefreshMoveTrigger] = useState(0);
  /** After adding from Add-to-Collection flow, show Remove until user leaves (or we navigate them to the collection). */
  const [addedToCollectionInSession, setAddedToCollectionInSession] =
    useState(false);
  /** Name of collection last added to (identification flow) so Remove modal can show it */
  const [lastAddedCollectionName, setLastAddedCollectionName] = useState<
    string | null
  >(null);
  /** Collection id last added to — seeds Remove modal when list fetch is slow or empty */
  const [lastAddedCollectionId, setLastAddedCollectionId] = useState<
    string | null
  >(null);
  /** MushroomSpecimen id from add-identified / add-wishlist API (identification flow has no route specimenId) */
  const [
    sessionSpecimenIdFromArchetypeAdd,
    setSessionSpecimenIdFromArchetypeAdd,
  ] = useState<string | null>(null);
  /** When set, Add-to-Collection sheet re-opens with this collection pre-selected (e.g. after creating new) */
  const [newlyCreatedCollectionId, setNewlyCreatedCollectionId] = useState<
    string | null
  >(null);
  const [
    newlyCreatedCollectionIdForAnother,
    setNewlyCreatedCollectionIdForAnother,
  ] = useState<string | null>(null);
  const [newlyCreatedCollectionIdForMove, setNewlyCreatedCollectionIdForMove] =
    useState<string | null>(null);
  const [showRemoveFromWishlistConfirm, setShowRemoveFromWishlistConfirm] =
    useState(false);
  const [showIdentificationSafetyWarning, setShowIdentificationSafetyWarning] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isFromIdentification || !fromOtherPossibleMatches) return;
      let cancelled = false;
      void (async () => {
        const seen = await hasSeenIdentificationSafetyWarning();
        if (!cancelled && !seen) {
          setShowIdentificationSafetyWarning(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [isFromIdentification, fromOtherPossibleMatches])
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        void soundRecordingService.stopPlayback();
        setNameSoundPlaying(false);
      };
    }, [])
  );

  const canAddToAnotherCollection =
    (source === "collection" &&
      !!collectionName &&
      isUserCreatedCollectionName(collectionName)) ||
    (addedToCollectionInSession &&
      !!lastAddedCollectionId &&
      looksLikeMongoCollectionId(lastAddedCollectionId));
  const canMoveToCollection = canAddToAnotherCollection;
  const isInCollectionFromDetails =
    mushroomData?.isIdentified === true || addedToCollectionInSession;
  const canAddToCollectionFromCatalogue =
    (source === "catalogue" || source === "explore") &&
    collectionName !== "Wishlist" &&
    !isInCollectionFromDetails;
  const canRemoveFromCollectionFromDetails =
    collectionName !== "Wishlist" &&
    (source === "collection" ||
      source === "identification" ||
      isInCollectionFromDetails);
  const excludeFromAnotherCollection = React.useMemo(() => {
    const ids: string[] = [];
    if (routeCollectionId && looksLikeMongoCollectionId(routeCollectionId)) {
      ids.push(routeCollectionId);
    } else if (
      lastAddedCollectionId &&
      looksLikeMongoCollectionId(lastAddedCollectionId)
    ) {
      ids.push(lastAddedCollectionId);
    }
    return ids;
  }, [routeCollectionId, lastAddedCollectionId]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showMoreRocksClicks, setShowMoreRocksClicks] = useState(
    () => birdOfTheDayClickCount ?? 0
  );
  const [showShowMoreRocksUpgradeModal, setShowShowMoreRocksUpgradeModal] =
    useState(false);

  useEffect(() => {
    setShowMoreRocksClicks(birdOfTheDayClickCount ?? 0);
  }, [mushroomId, birdOfTheDayClickCount]);
  /** Rate this match (identification flow only): 1–5, message, submitting, success */
  const [rateMatchRating, setRateMatchRating] = useState<number | null>(null);
  const [rateMatchMessage, setRateMatchMessage] = useState("");
  const [rateMatchSubmitting, setRateMatchSubmitting] = useState(false);
  const [rateMatchSent, setRateMatchSent] = useState(false);
  const { showToast } = useToast();
  const strings = useStrings();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const insets = useSafeAreaInsets();
  /** Resolved coords from country name(s) when API has no gpsLocation (premium map). Predefined or one-time cached geocode. */
  const [countryMapCoords, setCountryMapCoords] = useState<{
    latitude: number;
    longitude: number;
    displayName?: string;
  } | null>(null);
  const [countryMapLoading, setCountryMapLoading] = useState(false);

  /**
   * Prefer resetting the Collection stack to CollectionMain when this screen lives in that stack.
   * That fully unmounts MineralDetails (and RN Modals), which avoids ghost overlays after remove.
   * Otherwise switch tabs via the root navigator (Catalogue/Home MineralDetails).
   */
  const navigateToCollectionMain = React.useCallback(() => {
    const st = navigation.getState();
    const routeNames = st?.routeNames;
    if (routeNames?.includes("CollectionMain")) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "CollectionMain",
              params: { initialTab: "collections" },
            },
          ],
        })
      );
      return;
    }

    const root = NavigationService.getNavigationRef();
    if (root?.isReady()) {
      root.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: {
            screen: "Collection",
            params: {
              screen: "CollectionMain",
              params: { initialTab: "collections" },
            },
          },
        })
      );
      return;
    }

    navigation.navigate("MainTabs", {
      screen: "Collection",
      params: {
        screen: "CollectionMain",
        params: { initialTab: "collections" },
      },
    });
  }, [navigation]);

  const closeReportModal = React.useCallback(() => {
    setShowReportModal(false);
    setReportModalKeyboardCooldown(true);
    setTimeout(
      () => setReportModalKeyboardCooldown(false),
      REPORT_MODAL_KEYBOARD_COOLDOWN_MS
    );
  }, []);

  /** Close menus/sheets/modals so nothing stays visible over the next screen after navigation. */
  const dismissMushroomDetailsOverlays = React.useCallback(() => {
    setShowMenu(false);
    setShowReportModal(false);
    setReportModalKeyboardCooldown(false);
    setShowRemoveFromCollection(false);
    setShowAddToCollectionSheet(false);
    setShowAddToAnotherCollectionSheet(false);
    setShowMoveToCollectionSheet(false);
    setShowCreateCollectionSheet(false);
    setShowCollectionLimitSheet(false);
    setShowRemoveFromWishlistConfirm(false);
    setShowShowMoreRocksUpgradeModal(false);
  }, []);

  const openRemoveFromWishlistConfirm = React.useCallback(() => {
    setShowMenu(false);
    const open = () => setShowRemoveFromWishlistConfirm(true);
    if (showMenu) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(open, Platform.OS === "ios" ? 350 : 50);
      });
      return;
    }
    open();
  }, [showMenu]);

  const resolveSpecimenIdForMove = React.useCallback(async (): Promise<
    string | undefined
  > => {
    const direct =
      routeSpecimenId ?? sessionSpecimenIdFromArchetypeAdd ?? undefined;
    if (direct) return direct;
    const collectionHint =
      routeCollectionId ??
      (looksLikeMongoCollectionId(lastAddedCollectionId ?? "")
        ? lastAddedCollectionId
        : undefined);
    if (!effectiveArchetypeId || !collectionHint) return undefined;
    try {
      const { data } = await mushroomSpecimenService.fetchAllSpecimens(
        { _collections: [collectionHint] },
        { pageNo: 0, pageSize: 500, collectionId: collectionHint }
      );
      const match = (data || []).find(
        (s: any) =>
          String(s._archetype ?? s.archetypeId) === String(effectiveArchetypeId)
      );
      const sid = match?.specimenId ?? (match as { _id?: string })?._id;
      return sid ? String(sid) : undefined;
    } catch {
      return undefined;
    }
  }, [
    routeSpecimenId,
    sessionSpecimenIdFromArchetypeAdd,
    effectiveArchetypeId,
    routeCollectionId,
    lastAddedCollectionId,
  ]);

  const openCreateCollectionFromPicker = React.useCallback(
    async (target: "add" | "addAnother" | "move") => {
      useSubscriptionStore.getState().syncFromAuthStore();
      const premiumNow = selectIsPremium(useSubscriptionStore.getState());
      const closePickers = () => {
        setShowAddToCollectionSheet(false);
        setShowAddToAnotherCollectionSheet(false);
        setShowMoveToCollectionSheet(false);
      };
      if (premiumNow) {
        setCreateFlowMushroomId(effectiveArchetypeId);
        setCreateFlowTarget(target);
        closePickers();
        setShowCreateCollectionSheet(true);
        return;
      }
      try {
        const res = await collectionService.fetchAllCollections({
          pageNo: 0,
          pageSize: 100,
        });
        const defaultNames = ["Identified", "Wishlist", "Owned"];
        const userCreatedCount = (res.data || []).filter(
          (c) => !defaultNames.includes(c.name)
        ).length;
        if (userCreatedCount >= FREE_COLLECTION_LIMIT) {
          closePickers();
          setCollectionLimitSheetType("collection");
          setShowCollectionLimitSheet(true);
          return;
        }
      } catch (_) {
        // Proceed; backend will enforce if fetch fails
      }
      setCreateFlowMushroomId(effectiveArchetypeId);
      setCreateFlowTarget(target);
      closePickers();
      setShowCreateCollectionSheet(true);
    },
    [effectiveArchetypeId]
  );

  /** When already viewing this mineral from the same collection, don't jump away after add. */
  const isSameCollectionAsRoute = React.useCallback(
    (addedCollectionId: string) => {
      if (source !== "collection") return false;
      if (addedCollectionId === ADD_TO_COLLECTION_IDS.IDENTIFIED) {
        return collectionName === "Identified";
      }
      if (addedCollectionId === ADD_TO_COLLECTION_IDS.WISHLIST) {
        return collectionName === "Wishlist";
      }
      return (
        routeCollectionId != null &&
        String(routeCollectionId) === String(addedCollectionId)
      );
    },
    [source, collectionName, routeCollectionId]
  );

  const isMountedRef = React.useRef(true);
  const navigateAfterAddTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const pendingCreatedCollectionRef = React.useRef<{
    collectionId: string;
    target: "add" | "addAnother" | "move" | null;
  } | null>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (navigateAfterAddTimeoutRef.current) {
        clearTimeout(navigateAfterAddTimeoutRef.current);
        navigateAfterAddTimeoutRef.current = null;
      }
    };
  }, []);

  const navigateToCollectionTabScreen = React.useCallback(
    (
      screen: "CollectionDetails" | "Wishlist",
      params?: { collectionId: string; collectionName?: string }
    ) => {
      const root = NavigationService.getNavigationRef();
      if (!root?.isReady()) return;
      root.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: {
            screen: "Collection",
            params: params ? { screen, params } : { screen },
          },
        })
      );
    },
    []
  );

  /**
   * After Add to Collection, land on that collection (reset stack when on Collection — unmounts this screen / AppSheets).
   * Skips when user was already in that collection context.
   */
  const scheduleNavigateToAddedCollection = React.useCallback(
    (addedCollectionId: string, addedCollectionDisplayName: string | null) => {
      if (isSameCollectionAsRoute(addedCollectionId)) return;
      // Catalogue details stays on this screen so Add / Remove from Collection can be used here.
      if (source === "catalogue" || source === "explore") return;

      if (navigateAfterAddTimeoutRef.current) {
        clearTimeout(navigateAfterAddTimeoutRef.current);
      }

      const dismissMs = Platform.OS === "android" ? 320 : 220;
      navigateAfterAddTimeoutRef.current = setTimeout(() => {
        navigateAfterAddTimeoutRef.current = null;
        if (!isMountedRef.current) return;

        dismissMushroomDetailsOverlays();

        const st = navigation.getState();
        const inCollectionStack = st?.routeNames?.includes("CollectionMain");

        const detailsParams =
          addedCollectionId === ADD_TO_COLLECTION_IDS.IDENTIFIED
            ? {
                collectionId: ADD_TO_COLLECTION_IDS.IDENTIFIED,
                collectionName: "Identified" as const,
              }
            : {
                collectionId: addedCollectionId,
                collectionName: addedCollectionDisplayName ?? undefined,
              };

        if (addedCollectionId === ADD_TO_COLLECTION_IDS.WISHLIST) {
          if (inCollectionStack) {
            navigation.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [
                  {
                    name: "CollectionMain",
                    params: { initialTab: "collections" },
                  },
                  { name: "Wishlist" },
                ],
              })
            );
          } else {
            navigateToCollectionTabScreen("Wishlist");
          }
          return;
        }

        if (inCollectionStack) {
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                {
                  name: "CollectionMain",
                  params: { initialTab: "collections" },
                },
                {
                  name: "CollectionDetails",
                  params: detailsParams,
                },
              ],
            })
          );
        } else {
          navigateToCollectionTabScreen("CollectionDetails", detailsParams);
        }
      }, dismissMs);
    },
    [
      navigation,
      dismissMushroomDetailsOverlays,
      isSameCollectionAsRoute,
      navigateToCollectionTabScreen,
      source,
    ]
  );

  const pendingSoundNoteNavRef = useRef<{
    collectionId: string;
    collectionName: string | null;
  } | null>(null);

  const presentAddedCollection = React.useCallback(
    async (collectionId: string, collectionName: string | null) => {
      const uploaded =
        useIdentificationResultsStore.getState().uploadedSoundUrls ?? [];
      const hasRecording = uploaded.some(
        (url) => typeof url === "string" && url.trim().length > 0
      );
      if (source === "identification" && hasRecording) {
        const seen = await AsyncStorage.getItem(
          UI_STATE_KEYS.HAS_SEEN_SOUND_COLLECTION_NOTE
        );
        if (seen !== "true") {
          pendingSoundNoteNavRef.current = { collectionId, collectionName };
          setShowSoundCollectionNote(true);
          return;
        }
      }
      scheduleNavigateToAddedCollection(collectionId, collectionName);
    },
    [scheduleNavigateToAddedCollection, source]
  );

  const handleBack = React.useCallback(() => {
    // If we came from Other Possible Matches screen, return there instead of Collection
    if (fromOtherPossibleMatches && otherMatches && otherMatches.length > 0) {
      useIdentificationResultsStore
        .getState()
        .setResults(otherMatches as any[], identificationImage);
      if (source === "catalogue" && otherPossibleMatchesReturnTo) {
        navigation
          .getParent()
          ?.getParent()
          ?.navigate("MainTabs", {
            screen: "Camera",
            params: {
              screen: "OtherPossibleMatches",
              params: {
                matches: [],
                title: otherPossibleMatchesTitle ?? "Similar species",
                returnTo: otherPossibleMatchesReturnTo,
              },
            },
          });
        return;
      }

      navigation
        .getParent()
        ?.getParent()
        ?.navigate("MainTabs", {
          screen: "Camera",
          params: {
            screen: "OtherPossibleMatches",
            params: {
              matches: [],
              title: otherPossibleMatchesTitle ?? "Possible Matches",
              ...(otherPossibleMatchesReturnTo
                ? { returnTo: otherPossibleMatchesReturnTo }
                : {}),
            },
          },
        });
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // When opened from Collection Details, return there even if stack history is missing.
    if (fromCollectionDetails) {
      if (routeCollectionId || collectionName) {
        navigation.navigate("CollectionDetails", {
          collectionId: routeCollectionId ?? collectionName ?? "",
          collectionName: collectionName ?? "Collection",
        });
        return;
      }
      navigateToCollectionMain();
      return;
    }

    if (source === "explore") {
      navigation.goBack();
      return;
    }

    // If this screen was opened as the initial route of a tab stack (deep link),
    // ensure Back goes to the correct tab root instead of bouncing to Home / exiting.
    if (source === "catalogue") {
      navigation.navigate("MainTabs", {
        screen: "Catalogue",
        params: { screen: "CatalogueMain" },
      });
      return;
    }

    if (source === "birdOfTheDay") {
      navigation.navigate("MainTabs", { screen: "Home" });
      return;
    }

    // From collection / identification: same as remove-success — reset stack when possible.
    if (source === "collection" || source === "identification") {
      navigateToCollectionMain();
      return;
    }

    // Final fallback: go to MainTabs home
    navigation.navigate("MainTabs", { screen: "Home" });
  }, [
    navigation,
    source,
    fromOtherPossibleMatches,
    otherPossibleMatchesTitle,
    otherPossibleMatchesReturnTo,
    fromCollectionDetails,
    otherMatches,
    identificationImage,
    navigateToCollectionMain,
    routeCollectionId,
    collectionName,
  ]);

  const maybeExitToCollectionAfterWishlistRemove = React.useCallback(() => {
    const isWishlistListContext =
      collectionName === "Wishlist" &&
      (source === "collection" || source === "catalogue");
    if (!isWishlistListContext) return;

    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }
        navigation.navigate("Wishlist");
      });
    });
  }, [source, collectionName, navigation]);

  const handleConfirmRemoveFromWishlist = React.useCallback(async () => {
    const fromData = mushroomData
      ? resolveArchetypeIdFromSpecimen(
          mushroomData as unknown as Record<string, unknown>
        )
      : undefined;
    const archetypeId =
      (typeof resolvedArchetypeId === "string" &&
        resolvedArchetypeId.trim()) ||
      fromData ||
      (idType === "specimen"
        ? ""
        : typeof mushroomId === "string"
          ? mushroomId.trim()
          : "");
    const specimenId =
      routeSpecimenId ??
      sessionSpecimenIdFromArchetypeAdd ??
      (idType === "specimen" ? mushroomId : undefined);

    if (!archetypeId && !specimenId) {
      showToast("Failed to remove from wishlist", "error");
      return;
    }

    try {
      if (archetypeId) {
        await archetypeService.removeWishlistArchetype(archetypeId);
        useBirdsStore.getState().removeFavorite(archetypeId);
      } else if (specimenId) {
        await mushroomSpecimenService.updateSpecimen(String(specimenId), {
          isWishlisted: false,
        });
      }
      useWishlistInvalidationStore.getState().invalidate();
      setIsWishlisted(false);
      setMushroomData((prev) =>
        prev ? { ...prev, isWishlisted: false } : null
      );
      showToast("Removed from wishlist", "success");
      maybeExitToCollectionAfterWishlistRemove();
    } catch (e: any) {
      showToast(
        e?.message ||
          e?.response?.data?.reason ||
          "Failed to remove from wishlist",
        "error"
      );
    }
  }, [
    mushroomData,
    resolvedArchetypeId,
    idType,
    mushroomId,
    routeSpecimenId,
    sessionSpecimenIdFromArchetypeAdd,
    showToast,
    maybeExitToCollectionAfterWishlistRemove,
  ]);

  // Android hardware back
  useBackHandler({
    enabled: true,
    onBackPress: () => {
      if (showRemoveFromWishlistConfirm) {
        setShowRemoveFromWishlistConfirm(false);
        return true;
      }
      if (showMenu) {
        setShowMenu(false);
        return true;
      }
      handleBack();
      return true;
    },
    priority: 5,
  });

  const handleShare = async () => {
    const log = useAppLogsStore.getState();
    const data = mushroomData as Record<string, unknown> | null | undefined;
    const displayName = data ? getDisplayName(data) : "";
    log.info("[MushroomDetails] handleShare", {
      source,
      isBirdOfTheDay,
      mushroomIdSuffix: mushroomId?.slice(-8),
      hasData: !!data,
      displayNameLen: displayName.length,
    });
    if (!data || !displayName) {
      log.warn(
        "[MushroomDetails] handleShare blocked — no data or display name"
      );
      showToast("Unable to share: details not loaded", "warning");
      return;
    }
    try {
      const imageUrls =
        (data.imageUrls as string[] | undefined) ??
        (data.images as string[] | undefined);
      const imageUri =
        Array.isArray(imageUrls) && imageUrls.length > 0
          ? imageUrls[0]
          : undefined;
      log.info("[MushroomDetails] handleShare → shareMushroom", {
        hasImageUri: !!imageUri?.trim(),
      });
      await shareMushroom(
        displayName,
        data.scientificName as string | undefined,
        imageUri
      );
      log.info("[MushroomDetails] handleShare finished OK");
    } catch (e) {
      log.error("[MushroomDetails] handleShare failed", {
        message: e instanceof Error ? e.message : String(e),
      });
      showToast("Failed to open share", "error");
    }
  };

  // Reset "added to collection" when viewing a different mineral (e.g. after scanning a second rock).
  useEffect(() => {
    setAddedToCollectionInSession(false);
    setSessionSpecimenIdFromArchetypeAdd(null);
  }, [mushroomId, source]);

  // When returning from Edit Mineral Details, apply saved result so the details page reflects the save.
  useFocusEffect(
    React.useCallback(() => {
      const state = useEditMushroomResultStore.getState();
      const specimenId = state.specimenId;
      const mushroomIdFromStore = state.mushroomId;
      const specimenData = state.specimenData;
      useEditMushroomResultStore.getState().clear();

      if (!specimenId && !mushroomIdFromStore) return;

      // From collection: same specimen was updated — merge saved data immediately, then refetch.
      if (specimenId && routeSpecimenId && specimenId === routeSpecimenId) {
        if (specimenData) {
          const s = specimenData as Record<string, unknown>;
          setMushroomData((prev) => {
            if (!prev) return prev;
            const commonFields = resolveCommonNameFieldsFromRaw(s);
            return {
              ...prev,
              ...commonFields,
              scientificName: (s.scientificName ??
                s.scientific_name ??
                prev.scientificName) as string,
              canonicalName: (s.canonicalName ??
                s.canonical_name ??
                prev.canonicalName) as string,
              detailedDescription: (s.detailedDescription ??
                s.detailed_description ??
                prev.detailedDescription) as string,
              userNotes: (s.userNotes ??
                s.user_notes ??
                (prev as any).userNotes) as string | undefined,
              customLocation: (s.customLocation ??
                s.custom_location ??
                (prev as any).customLocation) as string | undefined,
              imageUrls: (s.imageUrls ??
                s.image_urls ??
                s.images ??
                prev.imageUrls ??
                []) as string[],
            };
          });
        }
        setRefreshTrigger((t) => t + 1);
        return;
      }

      // From identification: add or edit — merge saved specimen into current mineral data.
      if (
        mushroomIdFromStore &&
        mushroomId === mushroomIdFromStore &&
        source === "identification" &&
        specimenData
      ) {
        const s = specimenData as Record<string, unknown>;
        setMushroomData((prev) => {
          if (!prev) return prev;
          const imageUrls = (s.imageUrls ??
            s.image_urls ??
            s.images ??
            prev.imageUrls) as string[] | undefined;
          return {
            ...prev,
            ...resolveCommonNameFieldsFromRaw(s),
            scientificName: (s.scientificName ??
              s.scientific_name ??
              prev.scientificName) as string,
            canonicalName: (s.canonicalName ??
              s.canonical_name ??
              prev.canonicalName) as string,
            detailedDescription: (s.detailedDescription ??
              s.detailed_description ??
              prev.detailedDescription) as string,
            userNotes: (s.userNotes ??
              s.user_notes ??
              (prev as any).userNotes) as string | undefined,
            customLocation: (s.customLocation ??
              s.custom_location ??
              (prev as any).customLocation) as string | undefined,
            isIdentified: (s.isIdentified ??
              s.is_identified ??
              prev.isIdentified) as boolean,
            isWishlisted: (s.isWishlisted ??
              s.is_wishlisted ??
              prev.isWishlisted) as boolean,
            ...(imageUrls && { imageUrls }),
          } as MushroomDetail;
        });
        if (specimenId) {
          setSessionSpecimenIdFromArchetypeAdd(String(specimenId));
        }
      }
    }, [mushroomId, routeSpecimenId, source])
  );

  // Fetch mushroom details: identification = use initialMushroomData (no API); collection = specimen getDetails; catalogue/mushroomOfTheDay = archetype getDetails.
  useEffect(() => {
    const fetchMushroomDetails = async () => {
      try {
        setLoading(true);
        if (!mushroomId && !initialMushroomData) {
          setMushroomData(null);
          return;
        }
        // From identification: use inline identify payload when provided; otherwise fetch archetype getDetails.
        if (source === "identification") {
          if (initialMushroomData) {
            setMushroomData(
              normalizeMushroomDetail(
                initialMushroomData as unknown as Record<string, unknown>
              )
            );
            setResolvedArchetypeId(mushroomId || null);
            return;
          }
          if (mushroomId) {
            const detail = await archetypeService.getArchetypeDetails(mushroomId);
            if (detail) {
              const matchRow = otherMatches?.find(
                (m: { id?: string; _id?: string }) =>
                  String(m.id ?? m._id) === String(mushroomId)
              );
              const matchPayload = (
                matchRow as { match?: Record<string, unknown> } | undefined
              )?.match;
              const mergedRaw = {
                ...(matchPayload ?? {}),
                ...(detail as unknown as Record<string, unknown>),
              };
              setMushroomData(normalizeMushroomDetail(mergedRaw));
            } else {
              setMushroomData(null);
            }
            setResolvedArchetypeId(mushroomId);
            return;
          }
          setMushroomData(null);
          return;
        }
        // From collection / specimen: fetch specimen getDetails, then fill gaps from archetype if needed.
        if (source === "collection" || idType === "specimen") {
          const idToFetch = routeSpecimenId ?? mushroomId;
          if (!idToFetch) {
            setMushroomData(null);
            return;
          }
          const specimen = await mushroomSpecimenService.getSpecimenDetails(
            idToFetch
          );
          const s = specimen as unknown as Record<string, unknown>;
          const archetypeId =
            resolveArchetypeIdFromSpecimen(s) ??
            (typeof mushroomId === "string" && idType !== "specimen"
              ? mushroomId
              : null);
          setResolvedArchetypeId(archetypeId);

          const pick = (
            obj: Record<string, unknown>,
            camel: string,
            snake?: string
          ) => (obj[camel] ?? (snake ? obj[snake] : undefined)) as unknown;

          // 1) Normalize specimen: snake_case → camelCase for Overview/Category/Name Origin
          const fromSpecimen = {
            ...specimen,
            ...(archetypeId
              ? { archetypeId, _archetype: archetypeId }
              : {}),
            mindatId: pick(s, "mindatId", "mindat_id") ?? s.mindatId,
            scientificName:
              pick(s, "scientificName", "scientific_name") ?? s.scientificName,
            canonicalName:
              pick(s, "canonicalName", "canonical_name") ?? s.canonicalName,
            ...resolveCommonNameFieldsFromRaw(s),
            detailedDescription:
              pick(s, "detailedDescription", "detailed_description") ??
              s.detailedDescription,
            nameOrigin: pick(s, "nameOrigin", "name_origin") ?? s.nameOrigin,
            wikipediaUrl:
              pick(s, "wikipediaUrl", "wikipedia_url") ?? s.wikipediaUrl,
            entryType: pick(s, "entryType", "entry_type") ?? s.entryType,
            isGem: pick(s, "isGem", "is_gem") ?? s.isGem,
            crystalSystem:
              (pick(s, "crystalSystem", "crystal_system") as
                | string[]
                | undefined) ??
              s.crystalSystem ??
              [],
            recordType:
              (pick(s, "recordType", "record_type") as string[] | undefined) ??
              s.recordType ??
              [],
            transparency:
              (pick(s, "transparency") as string[] | undefined) ??
              s.transparency ??
              [],
            color: (pick(s, "color") as string[] | undefined) ?? s.color ?? [],
            lusture:
              (pick(s, "lusture") as string[] | undefined) ?? s.lusture ?? [],
            luster: (s.lusture ?? s.luster ?? []) as string[],
            danaClass: pick(s, "danaClass", "dana_class") ?? s.danaClass,
            strunzClass:
              pick(s, "strunzClass", "strunz_class") ?? s.strunzClass,
            commonlyFoundIn:
              (pick(s, "commonlyFoundIn", "commonly_found_in") as
                | string[]
                | undefined) ??
              s.commonlyFoundIn ??
              [],
            customLocation:
              pick(s, "customLocation", "custom_location") ?? s.customLocation,
            gpsLocation:
              pick(s, "gpsLocation", "gps_location") ?? s.gpsLocation,
            imageUrls: (s.images ??
              s.imageUrls ??
              s.image_urls ??
              []) as string[],
          } as Record<string, unknown>;

          // 2) If backend returned populated _archetype (object), merge its fields as fallbacks
          const archetypeObj = s._archetype as
            | Record<string, unknown>
            | string
            | null
            | undefined;
          if (
            archetypeObj &&
            typeof archetypeObj === "object" &&
            !Array.isArray(archetypeObj)
          ) {
            const a = archetypeObj as Record<string, unknown>;
            if (fromSpecimen.entryType == null)
              fromSpecimen.entryType =
                pick(a, "entryType", "entry_type") ?? a.entryType;
            if (fromSpecimen.isGem == null)
              fromSpecimen.isGem = pick(a, "isGem", "is_gem") ?? a.isGem;
            if (!(fromSpecimen.crystalSystem as string[]).length)
              fromSpecimen.crystalSystem =
                (pick(a, "crystalSystem", "crystal_system") as
                  | string[]
                  | undefined) ??
                a.crystalSystem ??
                [];
            if (!(fromSpecimen.recordType as string[]).length)
              fromSpecimen.recordType =
                (pick(a, "recordType", "record_type") as
                  | string[]
                  | undefined) ??
                a.recordType ??
                [];
            if (!(fromSpecimen.transparency as string[]).length)
              fromSpecimen.transparency =
                (pick(a, "transparency") as string[] | undefined) ??
                a.transparency ??
                [];
            if (!(fromSpecimen.color as string[]).length)
              fromSpecimen.color =
                (pick(a, "color") as string[] | undefined) ?? a.color ?? [];
            if (
              !(fromSpecimen.lusture as string[]).length &&
              !(fromSpecimen.luster as string[]).length
            )
              fromSpecimen.lusture =
                (pick(a, "lusture") as string[] | undefined) ?? a.lusture ?? [];
            if (!fromSpecimen.detailedDescription)
              fromSpecimen.detailedDescription =
                pick(a, "detailedDescription", "detailed_description") ??
                a.detailedDescription;
            if (!fromSpecimen.nameOrigin)
              fromSpecimen.nameOrigin =
                pick(a, "nameOrigin", "name_origin") ?? a.nameOrigin;
            if (!fromSpecimen.wikipediaUrl)
              fromSpecimen.wikipediaUrl =
                pick(a, "wikipediaUrl", "wikipedia_url") ?? a.wikipediaUrl;
            if (!fromSpecimen.danaClass)
              fromSpecimen.danaClass =
                pick(a, "danaClass", "dana_class") ?? a.danaClass;
            if (!fromSpecimen.strunzClass)
              fromSpecimen.strunzClass =
                pick(a, "strunzClass", "strunz_class") ?? a.strunzClass;
            if (!(fromSpecimen.commonlyFoundIn as string[]).length)
              fromSpecimen.commonlyFoundIn =
                (pick(a, "commonlyFoundIn", "commonly_found_in") as
                  | string[]
                  | undefined) ??
                a.commonlyFoundIn ??
                [];
            if (
              getArchetypeImageUrls(fromSpecimen as Record<string, unknown>)
                .length === 0
            ) {
              const archetypeImages = getArchetypeImageUrls(a);
              if (archetypeImages.length > 0) {
                fromSpecimen.imageUrls = archetypeImages;
              }
            }
          }

          // 3) If still missing key display fields and we have archetype ID, fetch archetype and merge
          const hasOverview =
            fromSpecimen.entryType != null ||
            (fromSpecimen.crystalSystem as string[])?.length > 0 ||
            !!fromSpecimen.detailedDescription ||
            !!fromSpecimen.nameOrigin;
          if (!hasOverview && archetypeId) {
            try {
              const archetypeRes = await coreApi.getArchetypeDetails(
                archetypeId
              );
              if (!archetypeRes.error && archetypeRes.data) {
                const a = archetypeRes.data as unknown as Record<
                  string,
                  unknown
                >;
                if (fromSpecimen.entryType == null)
                  fromSpecimen.entryType = a.entryType;
                if (fromSpecimen.isGem == null) fromSpecimen.isGem = a.isGem;
                if (!(fromSpecimen.crystalSystem as string[]).length)
                  fromSpecimen.crystalSystem = (a.crystalSystem ??
                    []) as string[];
                if (!(fromSpecimen.recordType as string[]).length)
                  fromSpecimen.recordType = (a.recordType ?? []) as string[];
                if (!(fromSpecimen.transparency as string[]).length)
                  fromSpecimen.transparency = (a.transparency ??
                    []) as string[];
                if (!(fromSpecimen.color as string[]).length)
                  fromSpecimen.color = (a.color ?? []) as string[];
                if (
                  !(fromSpecimen.lusture as string[]).length &&
                  !(fromSpecimen.luster as string[]).length
                )
                  fromSpecimen.lusture = (a.lusture ??
                    a.luster ??
                    []) as string[];
                if (!fromSpecimen.detailedDescription)
                  fromSpecimen.detailedDescription = a.detailedDescription;
                if (!fromSpecimen.nameOrigin)
                  fromSpecimen.nameOrigin = a.nameOrigin;
                if (!fromSpecimen.wikipediaUrl)
                  fromSpecimen.wikipediaUrl = a.wikipediaUrl;
                if (!fromSpecimen.danaClass)
                  fromSpecimen.danaClass = a.danaClass;
                if (!fromSpecimen.strunzClass)
                  fromSpecimen.strunzClass = a.strunzClass;
                if (!(fromSpecimen.commonlyFoundIn as string[]).length)
                  fromSpecimen.commonlyFoundIn = (a.commonlyFoundIn ??
                    []) as string[];
                if (
                  getArchetypeImageUrls(fromSpecimen as Record<string, unknown>)
                    .length === 0
                ) {
                  const archetypeImages = getArchetypeImageUrls(a);
                  if (archetypeImages.length > 0) {
                    fromSpecimen.imageUrls = archetypeImages;
                  }
                }
              }
            } catch (_) {
              // keep specimen-only data
            }
          }

          fromSpecimen.luster = (fromSpecimen.lusture ??
            fromSpecimen.luster ??
            []) as string[];
          const canonicalForImages =
            (fromSpecimen.canonicalName as string | undefined) ??
            (fromSpecimen.scientificName as string | undefined) ??
            (getPrimaryCommonName(fromSpecimen as Record<string, unknown>) ||
              undefined);
          fromSpecimen.imageUrls = getSpecimenDisplayImageUrls({
            ...(fromSpecimen as object),
            canonicalName: canonicalForImages,
          });
          setMushroomData(
            normalizeMushroomDetail(fromSpecimen as Record<string, unknown>)
          );
          return;
        }
        // Catalogue / mushroomOfTheDay: fetch archetype getDetails only.
        const detail = await archetypeService.getArchetypeDetails(mushroomId);
        if (detail) {
          setMushroomData(
            normalizeMushroomDetail(detail as unknown as Record<string, unknown>)
          );
        } else {
          setMushroomData(null);
        }
        setResolvedArchetypeId(mushroomId || null);
      } catch (error) {
        setMushroomData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMushroomDetails();
  }, [
    mushroomId,
    idType,
    source,
    initialMushroomData,
    routeSpecimenId,
    refreshTrigger,
  ]);

  // Log each section and whether we have data for it (for API/screen debugging)
  useEffect(() => {
    if (!mushroomData) return;
    const log = useAppLogsStore.getState().info;
    const d = mushroomData as any;
    const imageUrlsFromData =
      mushroomData.imageUrls ??
      (Array.isArray(d.image_urls) ? d.image_urls : undefined) ??
      (Array.isArray(d.images) ? d.images : undefined);
    const imageUrlsResolved = resolveMushroomImageUrlsForDisplay(
      mushroomData.canonicalName,
      imageUrlsFromData,
      mushroomData.scientificName
    );
    prefetchRemoteImages(imageUrlsResolved, 6);
    const imageUrlCount = imageUrlsResolved.length;
    const imageUrlsSample = summarizeImageUrlsForLog(imageUrlsResolved);
    log("[MushroomDetails] section: overview", {
      mushroomId: effectiveArchetypeId,
      hasImage: imageUrlsResolved.length > 0,
      hasCommonName: !!getPrimaryCommonName(mushroomData ?? {}),
      hasScientificName: !!mushroomData.scientificName,
      hasCommonlyFoundIn: !!(
        mushroomData.commonlyFoundIn?.length ??
        (d.commonly_found_in as string[] | undefined)?.length
      ),
      hasDescription: !!mushroomData.description,
    });
    log("[MushroomDetails] section: images", {
      mushroomId: effectiveArchetypeId,
      images: {
        count: imageUrlCount,
        sample: imageUrlsSample,
      },
    });
  }, [mushroomData, effectiveArchetypeId]);

  // Map: use only countries we have lat/long for. Don't take the first — check each and use the one we have coordinates for. Load for both premium and free so map can show.
  useEffect(() => {
    if (!mushroomData) {
      setCountryMapCoords(null);
      setCountryMapLoading(false);
      return;
    }
    const places =
      mushroomData.commonlyFoundIn ??
      (mushroomData as { commonly_found_in?: string[] }).commonly_found_in;
    if (!places?.length) {
      setCountryMapCoords(null);
      setCountryMapLoading(false);
      return;
    }
    const locationNames = places
      .map((p) => (typeof p === "string" ? p : String(p)).trim())
      .filter(Boolean);
    if (!locationNames.length) {
      setCountryMapCoords(null);
      setCountryMapLoading(false);
      return;
    }
    const coords = findFirstCountryWithCoordinates(locationNames);
    setCountryMapCoords(coords);
    setCountryMapLoading(false);
  }, [mushroomId, mushroomData]);

  // UI state: keep wishlist indicator in sync with store/API detail.
  // (Fixes: wishlisted rocks showing "Add to Wishlist" + empty icon after coming back / reload.)
  // Rock of the Day: same as catalogue — sync from favorites so button updates after add.
  // Local removals win over a stale API isWishlisted flag after leaving and returning.
  useEffect(() => {
    if (!mushroomId) return;
    if (suppressedWishlistIds.includes(effectiveArchetypeId)) {
      setIsWishlisted(false);
      return;
    }
    if (source === "catalogue" || source === "explore" || source === "birdOfTheDay") {
      setIsWishlisted(
        favorites.includes(effectiveArchetypeId) ||
          mushroomData?.isWishlisted === true
      );
    } else {
      setIsWishlisted(mushroomData?.isWishlisted === true);
    }
  }, [
    favorites,
    suppressedWishlistIds,
    mushroomData?.isWishlisted,
    mushroomId,
    source,
    effectiveArchetypeId,
  ]);

  /** Free vs premium by source (defined early for scroll effect below). */
  const birdDetailStrings = COLLECTION_STRINGS.birdDetails;

  const mushroomViewLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mushroomData || !mushroomId) return;
    if (mushroomViewLoggedRef.current === mushroomId) return;
    mushroomViewLoggedRef.current = mushroomId;
    analyticsService.logEvent(EVENTS.bird_view, {
      mushroom_id: mushroomId,
      source: toAnalyticsSource(source),
      collection_name: collectionName,
    });
  }, [collectionName, mushroomData, mushroomId, source]);

  useEffect(() => {
    setActiveTab("sounds");
  }, [mushroomId]);

  const dismissSoundCollectionNote = useCallback(async () => {
    setShowSoundCollectionNote(false);
    await AsyncStorage.setItem(
      UI_STATE_KEYS.HAS_SEEN_SOUND_COLLECTION_NOTE,
      "true"
    );
    const pending = pendingSoundNoteNavRef.current;
    pendingSoundNoteNavRef.current = null;
    if (pending) {
      scheduleNavigateToAddedCollection(
        pending.collectionId,
        pending.collectionName
      );
    }
  }, [scheduleNavigateToAddedCollection]);

  // Scroll to section when tab is selected (use onLayout offsets to avoid measureLayout ref errors)
  useEffect(() => {
    const scrollTabs = [
      "sounds",
      "overview",
      "similar",
      "morphology",
      "behavior",
      "habitat",
      "feeding",
      "breeding",
      "range",
    ];
    if (!scrollTabs.includes(activeTab)) return;
    const timer = setTimeout(() => {
      const y = sectionYOffsets.current[activeTab] ?? 0;
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const birdHasRange = React.useMemo(() => {
    if (!mushroomData) return false;
    const range = (mushroomData as MushroomDetail).rangeDetails;
    if (!range) return false;
    return Boolean(
      range.yearRound || range.breeding || range.migration || range.nonBreeding
    );
  }, [mushroomData]);

  const mushroomGpsCoords = React.useMemo(() => {
    if (!mushroomData) return null;
    const mineral = mushroomData as any;
    const loc = mineral.gpsLocation ?? mineral.gps_location;
    const lat = loc?.latitude ?? loc?.lat;
    const lng = loc?.longitude ?? loc?.lng ?? loc?.lon;
    const hasGps =
      lat != null &&
      lng != null &&
      !Number.isNaN(Number(lat)) &&
      !Number.isNaN(Number(lng));
    if (hasGps) return { lat: Number(lat), lng: Number(lng) };
    return null;
  }, [mushroomData]);

  const mushroomMapCoords = React.useMemo(() => {
    if (mushroomGpsCoords) return mushroomGpsCoords;
    if (countryMapCoords) {
      return {
        lat: countryMapCoords.latitude,
        lng: countryMapCoords.longitude,
      };
    }
    return null;
  }, [countryMapCoords, mushroomGpsCoords]);

  const detailsLocationFlow = useCustomLocationSectionFlow(
    mushroomMapCoords,
    !!mushroomGpsCoords
  );

  const tabs = [
    { id: "sounds", label: birdDetailStrings.sections.sounds },
    { id: "overview", label: birdDetailStrings.sections.overview },
    {
      id: "morphology",
      label: birdDetailStrings.sections.characteristics,
    },
    { id: "behavior", label: birdDetailStrings.sections.behavior },
    { id: "habitat", label: birdDetailStrings.sections.habitat },
    { id: "feeding", label: birdDetailStrings.sections.feeding },
    { id: "breeding", label: birdDetailStrings.sections.breeding },
    { id: "range", label: birdDetailStrings.sections.migration },
  ];
  const premiumDetailTabIds = new Set([
    "morphology",
    "behavior",
    "habitat",
    "feeding",
    "breeding",
    "range",
  ]);
  const showPremiumTabBadge = !isPremium && !isBirdOfTheDay;
  const tabsToShow = tabs.filter((t) => {
    if (t.id === "range") return birdHasRange;
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: PRIMARY_BG }]}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <CardSkeleton width="100%" height={220} />
          <View style={{ marginTop: 16, width: "100%", gap: 12 }}>
            <CardSkeleton width="70%" height={28} />
            <CardSkeleton width="100%" height={16} />
            <CardSkeleton width="90%" height={16} />
            <CardSkeleton width="100%" height={120} borderRadius={12} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!mushroomData) {
    // From identification: still show Overview/Physical/Chemical tab bar (no details)
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: PRIMARY_BG }]}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <Text variant="body" size="medium" style={{ marginBottom: 16 }}>
            No bird data available
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              backgroundColor: colors.primary,
              borderRadius: Radius.sm,
            }}
          >
            <Text
              variant="body"
              size="medium"
              style={{ color: colors.onPrimary }}
            >
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Convert imageUrls to carousel format; bare filenames → Firebase URLs (same as fetchAll full URLs)
  const mushroomDataAny = mushroomData as unknown as Record<string, unknown>;
  const rawImageListForDisplay =
    mushroomData.imageUrls ??
    (Array.isArray(mushroomDataAny.image_urls)
      ? mushroomDataAny.image_urls
      : undefined) ??
    (Array.isArray(mushroomDataAny.images)
      ? mushroomDataAny.images
      : undefined);
  const resolvedImageUrls = resolveMushroomImageUrlsForDisplay(
    mushroomData.canonicalName,
    rawImageListForDisplay as unknown[] | undefined,
    mushroomData.scientificName
  );
  const rawBase = resolvedImageUrls.map((url, index) => ({
    id: `img-${index}`,
    uri: url,
  }));
  const fallbackFromCanonical =
    getMushroomImageUrls(mushroomData.canonicalName) ?? [];
  const baseImages =
    rawBase.length > 0
      ? rawBase
      : fallbackFromCanonical.map((url, index) => ({
          id: `fb-${index}`,
          uri: url,
        }));
  const images =
    isFromIdentification && identificationImage?.uri
      ? [{ id: "identification", uri: identificationImage.uri }, ...baseImages]
      : baseImages;

  // Support both camelCase and snake_case from API so detailed description and name origin always show when present
  const detailedDescription =
    mushroomData.detailedDescription ??
    (mushroomData as { summary?: string }).summary ??
    (mushroomData as { detailed_description?: string }).detailed_description ??
    "";
  const nameOrigin =
    mushroomData.nameOrigin ??
    (mushroomData as { name_origin?: string }).name_origin ??
    "";

  const renderIdentificationRateMatch = () => {
    if (!isFromIdentification) return null;
    const rateMatchInputBg = isDark
      ? APP_COLORS.surfaceDark
      : APP_COLORS.modalTextOnPrimary;
    const rateMatchBorderColor = isDark
      ? APP_COLORS.borderBrown
      : SCREEN_COLORS.LIGHT.border;
    const rateMatchSubmitBg = isDark
      ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
      : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT;
    const sectionWrapperStyle = {
      marginBottom: 0,
      width: "100%" as const,
      paddingHorizontal: LAYOUT_MARGIN,
      marginTop: 16,
    };
    return (
      <View style={[sectionWrapperStyle, { width: "100%" }]}>
        <View
          style={[
            styles.rateMatchSection,
            {
              borderRadius: RATE_MATCH_CARD_RADIUS,
              backgroundColor: RATE_MATCH_CARD_BG,
              width: RATE_MATCH_CARD_WIDTH,
              alignSelf: "stretch",
            },
          ]}
        >
          {rateMatchSent ? (
            <View style={styles.rateMatchSuccess}>
              <View
                style={[
                  styles.rateMatchSuccessIconWrap,
                  { backgroundColor: colors.success },
                ]}
              >
                <AppImage
                  source={Images.rateUsSent}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                variant="headline"
                size="medium"
                weight="bold"
                style={[styles.rateMatchSuccessTitle, { color: TEXT_PRIMARY }]}
              >
                {MODAL_STRINGS.identificationFeedback.confirmationTitle}
              </Text>
            </View>
          ) : (
            <>
              <Text
                variant="headline"
                size="medium"
                weight="bold"
                style={[styles.rateMatchTitle, { color: TEXT_PRIMARY }]}
              >
                {MODAL_STRINGS.identificationFeedback.title}
              </Text>
              <Text
                variant="body"
                size="medium"
                color="textSecondary"
                style={[styles.rateMatchSubtitle, { color: TEXT_SECONDARY }]}
              >
                {MODAL_STRINGS.identificationFeedback.subtitle}
              </Text>
              <View style={styles.rateMatchEmojiRow}>
                {[1, 2, 3, 4, 5].map((value, i) => {
                  const Icon = isDark
                    ? [
                        RateMatchSad01Dark,
                        RateMatchSad02Dark,
                        RateMatchFlushedDark,
                        RateMatchHappyDark,
                        RateMatchStarFaceDark,
                      ][i]
                    : [
                        RateMatchSad01Light,
                        RateMatchSad02Light,
                        RateMatchFlushedLight,
                        RateMatchHappyLight,
                        RateMatchStarFaceLight,
                      ][i];
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.rateMatchEmojiBtn,
                        rateMatchRating === value && {
                          backgroundColor: isDark
                            ? APP_COLORS.blurOverlayWhite15
                            : APP_COLORS.overlayBlack06,
                          borderRadius: theme.radius.full,
                        },
                      ]}
                      onPress={() => setRateMatchRating(value)}
                      activeOpacity={0.7}
                    >
                      <Icon width={24} height={24} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text
                variant="body"
                size="small"
                weight="medium"
                style={[
                  styles.rateMatchMessageLabel,
                  { color: TEXT_SECONDARY },
                ]}
              >
                {MODAL_STRINGS.identificationFeedback.messageLabel}
              </Text>
              <TextInput
                value={rateMatchMessage}
                onChangeText={setRateMatchMessage}
                placeholder={
                  MODAL_STRINGS.identificationFeedback.messagePlaceholder
                }
                placeholderTextColor={colors.textTertiary}
                multiline
                style={[
                  styles.rateMatchInput,
                  {
                    backgroundColor: rateMatchInputBg,
                    borderColor: rateMatchBorderColor,
                    color: TEXT_PRIMARY,
                    borderRadius: theme.radius.md,
                  },
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.rateMatchSendBtn,
                  {
                    backgroundColor: rateMatchSubmitBg,
                    borderWidth: 0,
                    borderRadius: theme.radius["2xl"],
                    opacity:
                      rateMatchRating !== null && !rateMatchSubmitting
                        ? 1
                        : 0.5,
                  },
                ]}
                onPress={async () => {
                  if (rateMatchRating === null || rateMatchSubmitting) return;
                  setRateMatchSubmitting(true);
                  try {
                    await sendRatingFeedback({
                      domain: "Birds",
                      message:
                        rateMatchMessage.trim() ||
                        `Rating: ${rateMatchRating}/5`,
                      rating: rateMatchRating,
                      source: "rate_us",
                    });
                    setRateMatchSent(true);
                    setRateMatchRating(null);
                    setRateMatchMessage("");
                  } catch (e: any) {
                    showToast(
                      e?.message ||
                        "Failed to send feedback. Please try again.",
                      "error"
                    );
                  } finally {
                    setRateMatchSubmitting(false);
                  }
                }}
                disabled={rateMatchRating === null || rateMatchSubmitting}
                activeOpacity={0.8}
              >
                {rateMatchSubmitting ? (
                  <ActivityIndicator
                    size="small"
                    color={RATE_MATCH_SUBMIT_TEXT}
                    style={styles.rateMatchSpinner}
                  />
                ) : null}
                <Text
                  variant="label"
                  size="medium"
                  weight="medium"
                  style={[
                    styles.rateMatchSendText,
                    { color: RATE_MATCH_SUBMIT_TEXT },
                    rateMatchSubmitting && { marginLeft: 8 },
                  ]}
                >
                  {rateMatchSubmitting
                    ? MODAL_STRINGS.identificationFeedback.sending
                    : MODAL_STRINGS.identificationFeedback.submit}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    if (!mushroomData) return null;
    return (
      <>
        <View
          onLayout={(e) => {
            mushroomSectionsOffsetY.current = e.nativeEvent.layout.y;
          }}
        >
          <BirdDetailsScrollSections
            mushroomData={mushroomData}
            detailedDescription={detailedDescription}
            isDark={isDark}
            isPremium={isPremium}
            isBirdOfTheDay={isBirdOfTheDay}
            customLocation={
              (mushroomData as { customLocation?: string }).customLocation
            }
            countryMapLoading={countryMapLoading}
            locationFlow={detailsLocationFlow}
            textPrimary={isDark ? TEXT_PRIMARY : APP_COLORS.surfaceDark}
            textSecondary={
              isDark ? TEXT_SECONDARY : APP_COLORS.textSecondaryGray
            }
            surfacePrimary={isDark ? SHEET_COLORS.DARK : SHEET_COLORS.LIGHT}
            surfaceSecondary={
              isDark
                ? APP_COLORS.surfaceAuthDark
                : APP_COLORS.surfaceAuthLight
            }
            onNavigatePremium={() =>
              navigation.getParent()?.navigate("SubscriptionStack", {
                screen: "SubscriptionMain",
              })
            }
            onLookAlikePress={(lookAlike) => {
              if (!lookAlike.speciesId) return;
              navigation.push("BirdDetails", {
                mushroomId: String(lookAlike.speciesId),
                source: "catalogue",
              });
            }}
            onSeeAllSimilarPress={() => {
              const lookAlikes =
                (mushroomData as MushroomDetail).lookAlikes ?? [];
              if (!lookAlikes.length) return;
              const matches = lookAlikes.map((item) => {
                const similarityScore =
                  item.similarityScore != null
                    ? item.similarityScore <= 1
                      ? item.similarityScore
                      : item.similarityScore / 100
                    : undefined;
                return {
                  id: item.speciesId ?? "",
                  _id: item.speciesId,
                  commonNames: item.commonNames,
                  genusCommonNames: item.genusCommonNames,
                  commonName: getPrimaryCommonName(item),
                  scientificName: item.scientificName,
                  name: getDisplayName(item) || item.scientificName,
                  similarityScore,
                  image: item.imageUrls?.[0],
                  images: item.imageUrls,
                  match: item,
                };
              });
              useIdentificationResultsStore.getState().setResults(
                matches as unknown as import("../../../utils/mushroomApiMappers").PossibleMatchListItem[]
              );
              analyticsService.logEvent(EVENTS.identification_view_all, {
                mushroom_id: String(mushroomId),
                source: String(source ?? "unknown"),
              });
              navigation
                .getParent()
                ?.getParent()
                ?.navigate("MainTabs", {
                  screen: "Camera",
                  params: {
                    screen: "OtherPossibleMatches",
                    params: {
                      matches: [],
                      title: "Similar species",
                      ...(source === "catalogue"
                        ? {
                            returnTo: {
                              tab: "Catalogue" as const,
                              screen: "BirdDetails" as const,
                              params: {
                                mushroomId: String(mushroomId),
                                source: "catalogue" as const,
                              },
                            },
                          }
                        : {}),
                    },
                  },
                });
            }}
            onSectionLayout={(sectionId: BirdScrollSectionId, y) => {
              sectionYOffsets.current[sectionId] =
                mushroomSectionsOffsetY.current + y;
            }}
          />
        </View>
        {isFromIdentification ? renderIdentificationRateMatch() : null}
      </>
    );
  };

  const isIdentificationOverlay = source === "identification";
  const showStickyAddToCollection =
    source === "identification" &&
    !!mushroomData &&
    !mushroomData.isIdentified &&
    !addedToCollectionInSession;
  const isWishlistListContext =
    collectionName === "Wishlist" &&
    (source === "collection" || source === "catalogue");
  const showInlineWishlistButton =
    (source === "catalogue" && collectionName === "Wishlist") ||
    (source === "collection" && collectionName === "Wishlist");
  const showInlineWishlistCta =
    showInlineWishlistButton &&
    !showRemoveFromWishlistConfirm &&
    (!isWishlistListContext || isWishlisted);
  const stickyAddToCollectionBarInset = 56 + Math.max(insets.bottom, 12);
  const scrollBottomSurface = isDark ? SHEET_COLORS.DARK : SHEET_COLORS.LIGHT;
  const scrollBottomSpacerHeight = showStickyAddToCollection
    ? stickyAddToCollectionBarInset
    : isBirdOfTheDay &&
      showMoreRocksClicks < 3 &&
      birdOfTheDayIds &&
      birdOfTheDayIds.length > 1
    ? 30 + Math.max(insets.bottom, 16)
    : 0;

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: PRIMARY_BG }]}
        edges={["top"]}
      >
        {/* Header — same layout for catalogue and identification (hero below, not overlaid). */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: spacing[4],
              backgroundColor: isDark
                ? APP_COLORS.surfaceAuthDark
                : APP_COLORS.surfaceAuthLight,
              borderBottomWidth: 0,
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <NavBackIcon color={colors.textPrimary} />
          </TouchableOpacity>
          <Text
            variant="title"
            size="medium"
            weight="semibold"
            style={styles.headerCenter}
          >
            {isIdentificationOverlay ? "Best matches" : "Bird details"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              onPress={() => setShowMenu(!showMenu)}
              style={styles.menuIcon}
            >
              <MaterialIcons
                name="more-horiz"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overflow menu overlay (not a Modal — a nested Modal blocks the confirm popup on iOS). */}
        {showMenu && (
          <View
            style={[StyleSheet.absoluteFillObject, styles.menuOverlay]}
            pointerEvents="box-none"
          >
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setShowMenu(false)}
            />
            <View style={[styles.menu, { backgroundColor: SECTION_CARD_BG }]}>
              {/* Edit: only for Owned / Identified; hidden when from catalogue or Wishlist */}
              {canEdit && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const d = mushroomData as any;
                    const rawEdit = d?.imageUrls ?? d?.images ?? [];
                    const imageUrls = resolveMushroomImageUrlsForDisplay(
                      mushroomData.canonicalName,
                      rawEdit,
                      mushroomData.scientificName
                    );
                    const initialData = mushroomData
                      ? {
                          ...mushroomData,
                          images: imageUrls.map((uri: string, i: number) => ({
                            id: `img-${i}`,
                            uri,
                            isNew: false,
                            isDeleted: false,
                          })),
                        }
                      : undefined;
                    navigation.navigate("EditBirdDetails", {
                      mushroomId: effectiveArchetypeId,
                      specimenId:
                        routeSpecimenId ??
                        sessionSpecimenIdFromArchetypeAdd ??
                        (idType === "specimen" ? mushroomId : undefined),
                      initialData,
                      source:
                        source === "identification" || source === "collection"
                          ? source
                          : undefined,
                    });
                    setShowMenu(false);
                  }}
                >
                  {(() => {
                    const EditIcon = isDark
                      ? DetailsMoreEditDark
                      : DetailsMoreEditLight;
                    return <EditIcon width={20} height={20} />;
                  })()}
                  <Text
                    variant="body"
                    size="medium"
                    style={{ marginLeft: spacing[2] }}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              )}

              {/*
                Wishlist list context + already wishlisted: only the dedicated "Remove from Wishlist"
                row below (with confirmation). Omit star row here to avoid two identical removes.
              */}
              {!isFromIdentification &&
                !(
                  ((source === "collection" && collectionName === "Wishlist") ||
                    (source === "catalogue" &&
                      collectionName === "Wishlist")) &&
                  isWishlisted
                ) && (
                  <>
                    {/* Add to Wishlist / Remove from Wishlist */}
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={async () => {
                        if (addingToCollection) return;
                        if (isWishlisted) {
                          openRemoveFromWishlistConfirm();
                          return;
                        }
                        setShowMenu(false);
                        setAddingToCollection(true);
                        try {
                          await archetypeService.addWishlistArchetype(
                            effectiveArchetypeId
                          );
                          setIsWishlisted(true);
                          setMushroomData((prev) =>
                            prev ? { ...prev, isWishlisted: true } : null
                          );
                          useBirdsStore
                            .getState()
                            .addFavorite(effectiveArchetypeId);
                          useWishlistInvalidationStore
                            .getState()
                            .invalidate();
                          showToast("Added to wishlist", "success");
                        } catch (e: any) {
                          showToast(
                            e?.response?.data?.reason ||
                              "Failed to add to wishlist",
                            "error"
                          );
                        }
                        setAddingToCollection(false);
                      }}
                    >
                      {(() => {
                        const AddStarIcon = isDark
                          ? DetailsMoreAddStarDark
                          : DetailsMoreAddStarLight;
                        const RemoveStarIcon = isDark
                          ? DetailsMoreRemoveStarDark
                          : DetailsMoreRemoveStarLight;
                        const StarIcon = isWishlisted
                          ? RemoveStarIcon
                          : AddStarIcon;
                        return <StarIcon width={20} height={20} />;
                      })()}
                      <Text
                        variant="body"
                        size="medium"
                        style={{ marginLeft: spacing[2] }}
                      >
                        {isWishlisted
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

              {/* Collection actions */}
              {canAddToCollectionFromCatalogue && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    InteractionManager.runAfterInteractions(() => {
                      requestAnimationFrame(() => {
                        setShowAddToCollectionSheet(true);
                        setRefreshAddSheetTrigger((t) => t + 1);
                      });
                    });
                  }}
                >
                  <MaterialIcons
                    name="add"
                    size={20}
                    color={colors.textPrimary}
                  />
                  <Text
                    variant="body"
                    size="medium"
                    style={{ marginLeft: spacing[2] }}
                  >
                    Add to Collection
                  </Text>
                </TouchableOpacity>
              )}
              {canMoveToCollection && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    InteractionManager.runAfterInteractions(() => {
                      requestAnimationFrame(() =>
                        setShowMoveToCollectionSheet(true)
                      );
                    });
                  }}
                >
                  <AppImage
                    source={Images.iconMove}
                    style={styles.menuItemIcon}
                    resizeMode="contain"
                  />
                  <Text
                    variant="body"
                    size="medium"
                    style={{ marginLeft: spacing[2] }}
                  >
                    {strings.collection.moveToCollection.title}
                  </Text>
                </TouchableOpacity>
              )}
              {canAddToAnotherCollection && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    InteractionManager.runAfterInteractions(() => {
                      requestAnimationFrame(() =>
                        setShowAddToAnotherCollectionSheet(true)
                      );
                    });
                  }}
                >
                  <MaterialIcons
                    name="library-add"
                    size={20}
                    color={colors.textPrimary}
                  />
                  <Text
                    variant="body"
                    size="medium"
                    style={{ marginLeft: spacing[2] }}
                  >
                    {strings.collection.addToAnotherCollection.title}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Share & Report: always show (Catalogue, Rock of the day, Collection, etc.) */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  useAppLogsStore
                    .getState()
                    .info("[MushroomDetails] Share menu tapped", {
                      source,
                      isBirdOfTheDay,
                      mushroomIdSuffix: mushroomId?.slice(-8),
                    });
                  setShowMenu(false);
                  void handleShare();
                }}
              >
                {(() => {
                  const ShareIcon = isDark
                    ? DetailsMoreShareDark
                    : DetailsMoreShareLight;
                  return <ShareIcon width={20} height={20} />;
                })()}
                <Text
                  variant="body"
                  size="medium"
                  style={{ marginLeft: spacing[2] }}
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
                {(() => {
                  const ReportIcon = isDark
                    ? DetailsMoreReportDark
                    : DetailsMoreReportLight;
                  return <ReportIcon width={20} height={20} />;
                })()}
                <Text
                  variant="body"
                  size="medium"
                  style={{ marginLeft: spacing[2] }}
                >
                  Report
                </Text>
              </TouchableOpacity>

              {/* Remove from Collection / Wishlist: when opening from collection Wishlist or catalogue with Wishlist context */}
              {(source === "collection" && collectionName === "Wishlist") ||
              (source === "catalogue" && collectionName === "Wishlist") ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={openRemoveFromWishlistConfirm}
                >
                  <MaterialIcons
                    name="remove-circle-outline"
                    size={20}
                    color={colors.textPrimary}
                  />
                  <Text
                    variant="body"
                    size="medium"
                    style={{ marginLeft: spacing[2] }}
                  >
                    Remove from Wishlist
                  </Text>
                </TouchableOpacity>
              ) : (
                canRemoveFromCollectionFromDetails && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      InteractionManager.runAfterInteractions(() => {
                        requestAnimationFrame(() =>
                          setShowRemoveFromCollection(true)
                        );
                      });
                    }}
                  >
                    {(() => {
                      const RemoveIcon = isDark
                        ? DetailsMoreRemoveDark
                        : DetailsMoreRemoveLight;
                      return <RemoveIcon width={20} height={20} />;
                    })()}
                    <Text
                      variant="body"
                      size="medium"
                      style={{ marginLeft: spacing[2] }}
                    >
                      Remove from Collection
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        <IdentificationWarningPopup
          visible={showIdentificationSafetyWarning}
          onClose={() => setShowIdentificationSafetyWarning(false)}
          onUnderstood={async () => {
            await markIdentificationSafetyWarningSeen();
            setShowIdentificationSafetyWarning(false);
          }}
        />

        <>
            <LocationPermissionPopup
              visible={detailsLocationFlow.showLocationPopup}
              onClose={detailsLocationFlow.closeLocationPopups}
              onAllowLocation={() =>
                void detailsLocationFlow.handleAllowLocation()
              }
              onCustomLocation={detailsLocationFlow.openCustomLocationSheet}
              loading={detailsLocationFlow.locationLoading}
            />
            <LocationManageAccessPopup
              visible={detailsLocationFlow.showManagePopup}
              onClose={detailsLocationFlow.closeLocationPopups}
              onCustomLocation={detailsLocationFlow.openCustomLocationSheet}
              onGoToSettings={detailsLocationFlow.handleOpenSettings}
            />
            <ChangeLocationBottomSheet
              visible={detailsLocationFlow.showChangeLocationSheet}
              onClose={detailsLocationFlow.closeChangeLocationSheet}
              initialQuery={
                detailsLocationFlow.appliedCustomLocationAddress ??
                (mushroomData as { customLocation?: string } | null)
                  ?.customLocation ??
                ""
              }
              variant={
                (mushroomData as { customLocation?: string } | null)
                  ?.customLocation ||
                detailsLocationFlow.appliedCustomLocationAddress
                  ? "custom"
                  : "add"
              }
              onConfirm={(location) => {
                detailsLocationFlow.applyCustomLocation(location);
                setMushroomData((prev) => {
                  if (!prev) return prev;
                  const next = {
                    ...prev,
                    customLocation: location.address,
                    gpsLocation:
                      Number.isFinite(location.latitude) &&
                      Number.isFinite(location.longitude)
                        ? {
                            latitude: location.latitude,
                            longitude: location.longitude,
                          }
                        : (prev as { gpsLocation?: unknown }).gpsLocation,
                  } as typeof prev;
                  return next;
                });
                const specimenId =
                  routeSpecimenId ??
                  sessionSpecimenIdFromArchetypeAdd ??
                  undefined;
                if (specimenId) {
                  void mushroomSpecimenService
                    .updateSpecimen(specimenId, {
                      customLocation: location.address,
                      gpsLocation:
                        Number.isFinite(location.latitude) &&
                        Number.isFinite(location.longitude)
                          ? {
                              latitude: location.latitude,
                              longitude: location.longitude,
                            }
                          : undefined,
                    })
                    .catch(() => {
                      // Local UI already updated; persist can retry from edit.
                    });
                }
              }}
            />
        </>

        {/* Report Modal */}
        <ReportModal
          visible={showReportModal}
          variant="mushroom"
          onClose={closeReportModal}
          onSubmit={async (message) => {
            try {
              // Report sent via feedback API (mushroom_report domain)
              const {
                sendRatingFeedback,
              } = require("../../../services/rating/ratingFeedback.service");
              await sendRatingFeedback({
                domain: "Birds",
                message: `Bird: ${getDisplayName(mushroomData ?? {})}\n${message}`,
              });
              showToast("Report submitted successfully", "success");
            } catch (error) {
              // Error already logged by service
              showToast("Failed to submit report. Please try again.", "error");
            }
          }}
          plantName={getDisplayName(mushroomData ?? {})}
        />
        <SoundCollectionNoteModal
          visible={showSoundCollectionNote}
          onClose={() => {
            void dismissSoundCollectionNote();
          }}
        />

        {/* Remove From Collection Modal (Popup) */}
        {mushroomData && (
          <RemoveFromCollectionModal
            visible={showRemoveFromCollection}
            mushroomId={effectiveArchetypeId ?? undefined}
            specimenId={
              routeSpecimenId ?? sessionSpecimenIdFromArchetypeAdd ?? undefined
            }
            mushroomName={getDisplayName(mushroomData)}
            initialCollectionName={
              source === "collection" && collectionName !== "Wishlist"
                ? collectionName
                : lastAddedCollectionName ??
                  (mushroomData?.isIdentified ? "Identified" : undefined)
            }
            initialCollectionId={
              source === "collection" && collectionName !== "Wishlist"
                ? routeCollectionId ?? undefined
                : lastAddedCollectionId ??
                  (mushroomData?.isIdentified
                    ? ADD_TO_COLLECTION_IDS.IDENTIFIED
                    : undefined)
            }
            onClose={() => setShowRemoveFromCollection(false)}
            onSuccess={() => {
              setAddedToCollectionInSession(false);
              setSessionSpecimenIdFromArchetypeAdd(null);
              setLastAddedCollectionName(null);
              setLastAddedCollectionId(null);
              const favs = useBirdsStore.getState().favorites;
              const stillWishlisted =
                effectiveArchetypeId != null &&
                effectiveArchetypeId !== "" &&
                favs.includes(effectiveArchetypeId);
              setMushroomData((prev) =>
                prev
                  ? {
                      ...prev,
                      isIdentified: false,
                      isWishlisted: stillWishlisted,
                    }
                  : null
              );
              setIsWishlisted(stillWishlisted);
              setShowRemoveFromCollection(false);
              InteractionManager.runAfterInteractions(() => {
                requestAnimationFrame(() => {
                  dismissMushroomDetailsOverlays();
                  if (source === "catalogue" || source === "explore") {
                    return;
                  }
                  if (collectionName === "Wishlist") {
                    navigation.navigate("Wishlist");
                  } else if (
                    routeCollectionId != null &&
                    routeCollectionId !== ""
                  ) {
                    navigation.navigate("CollectionDetails", {
                      collectionId: routeCollectionId,
                      collectionName: collectionName ?? undefined,
                    });
                  } else {
                    // Never goBack here — stack is often only MineralDetails (identify / deep links), which freezes.
                    navigateToCollectionMain();
                  }
                });
              });
            }}
          />
        )}

        {/* Move to collection - when mushroom is in a user collection */}
        <MoveToCollectionBottomSheet
          visible={showMoveToCollectionSheet}
          onClose={() => {
            setShowMoveToCollectionSheet(false);
            setNewlyCreatedCollectionIdForMove(null);
          }}
          excludeCollectionIds={excludeFromAnotherCollection}
          initialSelectedCollectionId={
            newlyCreatedCollectionIdForMove ?? undefined
          }
          refreshTrigger={refreshMoveTrigger}
          onRequestCreateNew={() => openCreateCollectionFromPicker("move")}
          onConfirm={async (targetCollectionId) => {
            if (!targetCollectionId) return;
            setAddingToCollection(true);
            try {
              try {
                const collectionDetails =
                  await collectionService.getCollectionDetails(
                    targetCollectionId
                  );
                const count = collectionDetails?.specimenCount ?? 0;
                if (count >= COLLECTION_LIMITS.MAX_ITEMS_PER_COLLECTION) {
                  showToast(
                    strings.collection.addToCollection.collectionFull,
                    "error"
                  );
                  return;
                }
              } catch (_) {
                // Proceed if we can't fetch
              }

              const specimenId = await resolveSpecimenIdForMove();
              if (!specimenId) {
                showToast(
                  strings.collection.moveToCollection.noSpecimen,
                  "error"
                );
                return;
              }

              await mushroomSpecimenService.updateSpecimen(specimenId, {
                _collections: normalizeCollectionIds(targetCollectionId),
                isIdentified: false,
                isWishlisted: false,
              });
              useCollectionInvalidationStore.getState().invalidate();
              setNewlyCreatedCollectionIdForMove(null);
              let movedDisplayName: string | null = null;
              try {
                const details = await collectionService.getCollectionDetails(
                  targetCollectionId
                );
                movedDisplayName = details?.name ?? null;
              } catch {
                movedDisplayName = null;
              }
              showToast(strings.collection.moveToCollection.moved, "success");
              setShowMoveToCollectionSheet(false);
              scheduleNavigateToAddedCollection(
                targetCollectionId,
                movedDisplayName
              );
            } catch (error: any) {
              console.error("Error moving to collection:", error);
              showToast(
                error?.response?.data?.reason ||
                  strings.collection.moveToCollection.moveFailed,
                "error"
              );
            } finally {
              setAddingToCollection(false);
            }
          }}
        />

        {/* Add to another collection - when mushroom is already in a user collection */}
        <AddToAnotherCollectionBottomSheet
          visible={showAddToAnotherCollectionSheet}
          onClose={() => {
            setShowAddToAnotherCollectionSheet(false);
            setNewlyCreatedCollectionIdForAnother(null);
          }}
          excludeCollectionIds={excludeFromAnotherCollection}
          initialSelectedCollectionId={
            newlyCreatedCollectionIdForAnother ?? undefined
          }
          refreshTrigger={refreshAddAnotherTrigger}
          onRequestCreateNew={() =>
            openCreateCollectionFromPicker("addAnother")
          }
          onConfirm={async (targetCollectionId) => {
            if (!effectiveArchetypeId || !targetCollectionId || !mushroomData) {
              return;
            }
            setAddingToCollection(true);
            try {
              try {
                const collectionDetails =
                  await collectionService.getCollectionDetails(
                    targetCollectionId
                  );
                const count = collectionDetails?.specimenCount ?? 0;
                if (count >= COLLECTION_LIMITS.MAX_ITEMS_PER_COLLECTION) {
                  showToast(
                    strings.collection.addToCollection.collectionFull,
                    "error"
                  );
                  return;
                }
              } catch (_) {
                // Proceed if we can't fetch
              }

              if (!isPremium) {
                try {
                  const res = await mushroomSpecimenService.fetchAllSpecimens(
                    {},
                    { pageNo: 0, pageSize: 1 }
                  );
                  const totalSpecimens = res.pagination?.totalCount ?? 0;
                  if (totalSpecimens >= FREE_SPECIMEN_LIMIT) {
                    setShowAddToAnotherCollectionSheet(false);
                    setCollectionLimitSheetType("collectionAlt");
                    setShowCollectionLimitSheet(true);
                    return;
                  }
                } catch (_) {
                  // Proceed; backend will enforce if fetch fails
                }
              }

              await addMushroomSpecimenFromDetail(
                effectiveArchetypeId,
                mushroomData,
                withIdentificationRecording(source, {
                  collectionIds: targetCollectionId,
                  isIdentified: false,
                  isWishlisted: false,
                })
              );
              useCollectionInvalidationStore.getState().invalidate();
              setNewlyCreatedCollectionIdForAnother(null);
              showToast(
                strings.collection.addToAnotherCollection.added,
                "success"
              );
              setShowAddToAnotherCollectionSheet(false);
            } catch (error: any) {
              console.error("Error adding to another collection:", error);
              showToast(
                error?.response?.data?.reason ||
                  strings.collection.addToAnotherCollection.addFailed,
                "error"
              );
            } finally {
              setAddingToCollection(false);
            }
          }}
        />

        {/* Add to Collection - select collection bottom sheet */}
        <AddToCollectionBottomSheet
          visible={showAddToCollectionSheet}
          onClose={() => {
            setShowAddToCollectionSheet(false);
            setNewlyCreatedCollectionId(null);
          }}
          mushroomId={effectiveArchetypeId}
          initialSelectedCollectionId={newlyCreatedCollectionId ?? undefined}
          mushroomName={mushroomData ? getDisplayName(mushroomData) : undefined}
          refreshTrigger={refreshAddSheetTrigger}
          onRequestCreateNew={async () => {
            useSubscriptionStore.getState().syncFromAuthStore();
            const isPremium = selectIsPremium(useSubscriptionStore.getState());
            if (isPremium) {
              logCollectionUiGate("mushroom_details_add_sheet_create_new", {
                allowed: true,
                reason: "premium_skip_preflight_same_as_identify_feed_gate",
              });
              setCreateFlowMushroomId(effectiveArchetypeId);
              setCreateFlowTarget("add");
              setShowAddToCollectionSheet(false);
              setShowCreateCollectionSheet(true);
              return;
            }
            try {
              const res = await collectionService.fetchAllCollections({
                pageNo: 0,
                pageSize: 100,
              });
              const defaultNames = ["Identified", "Wishlist", "Owned"];
              const userCreatedCount = (res.data || []).filter(
                (c) => !defaultNames.includes(c.name)
              ).length;
              if (userCreatedCount >= FREE_COLLECTION_LIMIT) {
                logCollectionUiGate(
                  "mushroom_details_add_sheet_create_new_blocked",
                  {
                    allowed: false,
                    userCreatedCount,
                    reason: "frontend_preflight_free_collection_cap",
                  }
                );
                setShowAddToCollectionSheet(false);
                setCollectionLimitSheetType("collection");
                setShowCollectionLimitSheet(true);
                return;
              }
            } catch (_) {
              // On fetch error still allow opening create sheet; API will return 403 if at limit
            }
            logCollectionUiGate("mushroom_details_add_sheet_create_new", {
              allowed: true,
              reason: "under_free_cap_or_preflight_fetch_failed",
            });
            setCreateFlowMushroomId(effectiveArchetypeId);
            setCreateFlowTarget("add");
            setShowAddToCollectionSheet(false);
            setShowCreateCollectionSheet(true);
          }}
          onConfirm={async (collectionId) => {
            if (!effectiveArchetypeId || !collectionId) return;
            setAddingToCollection(true);
            const resolvedSpecimenId =
              routeSpecimenId ?? sessionSpecimenIdFromArchetypeAdd ?? undefined;

            try {
              if (collectionId === ADD_TO_COLLECTION_IDS.IDENTIFIED) {
                if (resolvedSpecimenId) {
                  await mushroomSpecimenService.updateSpecimen(
                    resolvedSpecimenId,
                    {
                      isIdentified: true,
                      isWishlisted: false,
                      ...identificationRecordingPatch(source),
                    }
                  );
                  useCollectionInvalidationStore.getState().invalidate();
                } else {
                  if (!mushroomData) {
                    showToast("Failed to add to collection", "error");
                    return;
                  }
                  const sid = await addMushroomSpecimenFromDetail(
                    effectiveArchetypeId,
                    mushroomData,
                    withIdentificationRecording(source, {
                      isIdentified: true,
                      isWishlisted: false,
                    })
                  );
                  setSessionSpecimenIdFromArchetypeAdd(sid);
                  useCollectionInvalidationStore.getState().invalidate();
                }
                setAddedToCollectionInSession(true);
                setLastAddedCollectionName("Identified");
                setLastAddedCollectionId(ADD_TO_COLLECTION_IDS.IDENTIFIED);
                setNewlyCreatedCollectionId(null);
                setMushroomData((prev) =>
                  prev ? { ...prev, isIdentified: true } : null
                );
                showToast("Added to Identified", "success");
                setShowAddToCollectionSheet(false);
                void presentAddedCollection(
                  ADD_TO_COLLECTION_IDS.IDENTIFIED,
                  "Identified"
                );
                return;
              }
              if (collectionId === ADD_TO_COLLECTION_IDS.WISHLIST) {
                const wishlistSpecimen =
                  await archetypeService.addWishlistArchetype(
                    effectiveArchetypeId
                  );
                const wishlistSpecimenId = wishlistSpecimen?._id;
                if (wishlistSpecimenId) {
                  setSessionSpecimenIdFromArchetypeAdd(String(wishlistSpecimenId));
                  const recorded = identificationRecordingUrls(source);
                  if (recorded.length) {
                    await mushroomSpecimenService.updateSpecimen(
                      String(wishlistSpecimenId),
                      { userCapturedSounds: recorded }
                    );
                  }
                }
                useBirdsStore.getState().addFavorite(effectiveArchetypeId);
                useWishlistInvalidationStore.getState().invalidate();
                setAddedToCollectionInSession(true);
                setLastAddedCollectionName("Wishlist");
                setLastAddedCollectionId(ADD_TO_COLLECTION_IDS.WISHLIST);
                setNewlyCreatedCollectionId(null);
                setIsWishlisted(true);
                setMushroomData((prev) =>
                  prev ? { ...prev, isWishlisted: true } : null
                );
                showToast("Added to Wishlist", "success");
                setShowAddToCollectionSheet(false);
                void presentAddedCollection(
                  ADD_TO_COLLECTION_IDS.WISHLIST,
                  "Wishlist"
                );
                return;
              }

              // User-created / non-default collection
              try {
                const collectionDetails =
                  await collectionService.getCollectionDetails(collectionId);
                const count = collectionDetails?.specimenCount ?? 0;
                if (count >= COLLECTION_LIMITS.MAX_ITEMS_PER_COLLECTION) {
                  showToast(
                    strings.collection.addToCollection.collectionFull,
                    "error"
                  );
                  return;
                }
              } catch (_) {
                // Proceed if we can't fetch (e.g. network); backend may still enforce
              }

              if (resolvedSpecimenId) {
                await mushroomSpecimenService.updateSpecimen(
                  resolvedSpecimenId,
                  {
                    _collections: normalizeCollectionIds(collectionId),
                    isIdentified: false,
                    isWishlisted: false,
                    ...identificationRecordingPatch(source),
                  }
                );
                useCollectionInvalidationStore.getState().invalidate();
                setAddedToCollectionInSession(true);
                setLastAddedCollectionId(collectionId);
                setNewlyCreatedCollectionId(null);
                let addedDisplayName: string | null = null;
                try {
                  const details = await collectionService.getCollectionDetails(
                    collectionId
                  );
                  addedDisplayName = details?.name ?? null;
                  setLastAddedCollectionName(addedDisplayName);
                } catch {
                  setLastAddedCollectionName(null);
                }
                showToast("Added to collection", "success");
                setShowAddToCollectionSheet(false);
                void presentAddedCollection(collectionId, addedDisplayName);
                return;
              }

              // No specimen yet — create via identified/add then assign custom collection
              if (!isPremium) {
                try {
                  const res = await mushroomSpecimenService.fetchAllSpecimens(
                    {},
                    { pageNo: 0, pageSize: 1 }
                  );
                  const totalSpecimens = res.pagination?.totalCount ?? 0;
                  if (totalSpecimens >= FREE_SPECIMEN_LIMIT) {
                    setShowAddToCollectionSheet(false);
                    setCollectionLimitSheetType("collectionAlt");
                    setShowCollectionLimitSheet(true);
                    setAddingToCollection(false);
                    return;
                  }
                } catch (_) {
                  // Proceed; backend will enforce if fetch fails
                }
              }
              if (!mushroomData) {
                showToast("Failed to add to collection", "error");
                return;
              }
              const sid = await addMushroomSpecimenFromDetail(
                effectiveArchetypeId,
                mushroomData,
                withIdentificationRecording(source, {
                  collectionIds: collectionId,
                  isIdentified: false,
                  isWishlisted: false,
                })
              );
              setSessionSpecimenIdFromArchetypeAdd(sid);
              useCollectionInvalidationStore.getState().invalidate();
              setAddedToCollectionInSession(true);
              setLastAddedCollectionId(collectionId);
              setNewlyCreatedCollectionId(null);
              let addedDisplayNameNew: string | null = null;
              try {
                const details = await collectionService.getCollectionDetails(
                  collectionId
                );
                addedDisplayNameNew = details?.name ?? null;
                setLastAddedCollectionName(addedDisplayNameNew);
              } catch {
                setLastAddedCollectionName(null);
              }
              showToast("Added to collection", "success");
              setShowAddToCollectionSheet(false);
              void presentAddedCollection(collectionId, addedDisplayNameNew);
            } catch (error: any) {
              console.error("Error adding to collection:", error);
              const reason =
                error?.response?.data?.reason || error?.message || "";
              const isLimitError = /limit|maximum|100|full/i.test(reason);
              showToast(
                isLimitError
                  ? strings.collection.addToCollection.limitReached
                  : reason || "Failed to add to collection",
                "error"
              );
            } finally {
              setAddingToCollection(false);
            }
          }}
        />

        {/* Create Collection - from Add to Collection flow */}
        <CreateCollectionBottomSheet
          visible={showCreateCollectionSheet}
          onClose={() => {
            setShowCreateCollectionSheet(false);
            setCreateFlowMushroomId(null);
            const pending = pendingCreatedCollectionRef.current;
            pendingCreatedCollectionRef.current = null;
            if (!pending) return;
            const { collectionId, target } = pending;
            const openNext = () => {
              if (!isMountedRef.current) return;
              if (target === "addAnother") {
                setRefreshAddAnotherTrigger((t) => t + 1);
                setNewlyCreatedCollectionIdForAnother(collectionId);
                setShowAddToAnotherCollectionSheet(true);
                return;
              }
              if (target === "move") {
                setRefreshMoveTrigger((t) => t + 1);
                setNewlyCreatedCollectionIdForMove(collectionId);
                setShowMoveToCollectionSheet(true);
                return;
              }
              setRefreshAddSheetTrigger((t) => t + 1);
              setNewlyCreatedCollectionId(collectionId);
              setShowAddToCollectionSheet(true);
            };
            // Wait for the create sheet Modal to unmount before opening the next one.
            setTimeout(openNext, 80);
          }}
          onCreated={(collection) => {
            pendingCreatedCollectionRef.current = {
              collectionId: collection.collectionId,
              target: createFlowTarget,
            };
            setCreateFlowMushroomId(null);
            setCreateFlowTarget(null);
          }}
          onLimitReached={() => {
            setCreateFlowMushroomId(null);
            setCreateFlowTarget(null);
            if (!shouldShowCollectionLimitPaywall()) {
              return;
            }
            setCollectionLimitSheetType("collection");
            setShowCollectionLimitSheet(true);
          }}
        />

        <LimitReachedBottomSheet
          visible={showCollectionLimitSheet}
          onClose={() => setShowCollectionLimitSheet(false)}
          onUpgrade={() => {
            setShowCollectionLimitSheet(false);
            navigateToSubscriptionMain();
          }}
          limitType={collectionLimitSheetType}
        />

        <KeyboardAvoidingView
          style={[styles.keyboardAvoid, { backgroundColor: PRIMARY_BG }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          enabled={!showReportModal && !reportModalKeyboardCooldown}
          keyboardVerticalOffset={
            Platform.OS === "ios" ? Math.max(insets.top + 60, 100) : 0
          }
        >
          <ScrollView
            ref={scrollViewRef}
            style={[styles.scrollView, { backgroundColor: PRIMARY_BG }]}
            bounces={!isFromIdentification}
            overScrollMode={isFromIdentification ? "never" : "auto"}
            contentContainerStyle={[
              styles.scrollContent,
              isFromIdentification && { paddingTop: 0 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* AI layout: hero → rock title → tabs → tab content. Identification: header overlays hero and scrolls with it. */}
            {mushroomData ? (
              <View ref={scrollContentRef} collapsable={false}>
                {/* Hero — catalogue-style carousel for all sources (rounded, inset). */}
                {images.length > 0 && (
                  <View
                    style={[
                      { backgroundColor: SECTION_CARD_BG },
                      { marginTop: 16 },
                    ]}
                  >
                    <View style={styles.aiCarouselWrap}>
                      <CatalogueDetailCarousel
                        images={images}
                        isDark={isDark}
                        widthPercent={100}
                        autoScrollInterval={4000}
                      />
                    </View>
                  </View>
                )}

                <View style={{ backgroundColor: SECTION_CARD_BG }}>
                  <View
                    style={[styles.aiRockTitleContainer, { marginTop: 16 }]}
                  >
                      <View style={styles.birdNameRow}>
                        <View style={styles.birdNameCopy}>
                          <Text
                            style={{
                              ...NAME_HEADING,
                              fontSize: 24,
                              color: isDark
                                ? TEXT_PRIMARY
                                : NAME_HEADING.color,
                            }}
                          >
                            {formatTitleCase(getDisplayName(mushroomData))}
                          </Text>
                          {getMushroomDisplayScientificFromFields(
                            mushroomData
                          ) ? (
                            <Text
                              style={[
                                styles.aiSynonym,
                                {
                                  ...SYNONYM_AND_UNIT,
                                  fontSize: 16,
                                  lineHeight: 24,
                                  marginTop: 4,
                                },
                              ]}
                            >
                              (
                              {formatTitleCase(
                                getMushroomDisplayScientificFromFields(
                                  mushroomData
                                )!
                              )}
                              )
                            </Text>
                          ) : null}
                        </View>
                        {(mushroomData.soundUrls?.length ?? 0) > 0 ? (
                          <TouchableOpacity
                            style={styles.birdNameSoundButton}
                            onPress={() => {
                              const url = mushroomData.soundUrls?.find(
                                (item) =>
                                  typeof item === "string" && item.trim()
                              );
                              if (!url) return;
                              void (async () => {
                                if (nameSoundPlaying) {
                                  setNameSoundPlaying(false);
                                  void soundRecordingService.stopPlayback();
                                  return;
                                }
                                setNameSoundPlaying(true);
                                try {
                                  await soundRecordingService.play(url, {
                                    onEnd: () => setNameSoundPlaying(false),
                                  });
                                } catch {
                                  setNameSoundPlaying(false);
                                }
                              })();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={
                              nameSoundPlaying
                                ? COLLECTION_STRINGS.birdDetails
                                    .nameSoundStopA11y
                                : COLLECTION_STRINGS.birdDetails.nameSoundA11y
                            }
                          >
                            <CatalogueVolumeIcon
                              width={24}
                              height={24}
                              color={
                                isDark
                                  ? TEXT_PRIMARY
                                  : APP_COLORS.surfaceDark
                              }
                            />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    {/*
                      Name-origin chip hidden for now (Figma polish).
                    {nameOrigin ? (
                      <View style={styles.aiNameOriginWrapper}>
                        <View
                          style={[
                            styles.aiNameOrigin,
                            { backgroundColor: nameOriginBg },
                          ]}
                        >
                          <Text style={SUB_TEXT_SPEC}>{nameOrigin}</Text>
                          <AppImage
                            source={Images.detailPinned}
                            style={styles.aiNameOriginPinnedIcon}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    ) : null}
                    */}
                  </View>
                </View>

                {/* Tab bar — outside card so no surface strip between tab and overview */}
                <View
                  style={[
                    styles.aiTabBar,
                    {
                      borderBottomColor: isDark
                        ? spec.TAB_DIVIDER
                        : TAB_BAR_BORDER,
                      backgroundColor: isDark
                        ? SHEET_COLORS.DARK
                        : SHEET_COLORS.LIGHT,
                    },
                  ]}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.aiTabBarScrollContent}
                    style={styles.aiTabBarScroll}
                  >
                    {tabsToShow.map((tab) => (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        style={[
                          styles.aiTab,
                          styles.aiTabScrollable,
                          activeTab === tab.id && {
                            borderBottomWidth: 2,
                            borderBottomColor:
                              spec.TAB_ACTIVE_UNDERLINE ?? theme.colors.primary,
                          },
                        ]}
                      >
                        <Text
                          variant="body"
                          size="medium"
                          weight={activeTab === tab.id ? "bold" : "normal"}
                          numberOfLines={1}
                          style={[
                            styles.aiTabLabel,
                            activeTab === tab.id
                              ? {
                                  fontSize: 14,
                                  color:
                                    spec.TAB_ACTIVE_TEXT ??
                                    theme.colors.primary,
                                }
                              : {
                                  fontSize: 14,
                                  color:
                                    spec.TAB_INACTIVE_TEXT ??
                                    theme.colors.textSecondary,
                                },
                          ]}
                        >
                          {tab.label}
                        </Text>
                        {showPremiumTabBadge &&
                        premiumDetailTabIds.has(tab.id) ? (
                          <DetailsTabPremiumBadge />
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Tab content */}
                <View>{renderTabContent()}</View>

                {/* Add to Wishlist — wishlist collection/catalogue contexts only */}
                {showInlineWishlistCta && (
                  <View
                    style={{
                      paddingHorizontal: 20,
                      marginTop: 16,
                      paddingBottom: showStickyAddToCollection
                        ? 16
                        : Math.max(insets.bottom, 16),
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (addingToCollection) return;
                        if (isWishlisted) {
                          openRemoveFromWishlistConfirm();
                          return;
                        }
                        void (async () => {
                          setAddingToCollection(true);
                          try {
                            await archetypeService.addWishlistArchetype(
                              effectiveArchetypeId
                            );
                            setIsWishlisted(true);
                            setMushroomData((prev) =>
                              prev ? { ...prev, isWishlisted: true } : null
                            );
                            useBirdsStore
                              .getState()
                              .addFavorite(effectiveArchetypeId);
                            useWishlistInvalidationStore
                              .getState()
                              .invalidate();
                            showToast("Added to wishlist", "success");
                          } catch (e: any) {
                            showToast(
                              e?.response?.data?.reason ||
                                "Failed to add to wishlist",
                              "error"
                            );
                          } finally {
                            setAddingToCollection(false);
                          }
                        })();
                      }}
                      style={[
                        styles.wishlistButton,
                        {
                          backgroundColor: isWishlisted
                            ? colors.error
                            : colors.primary,
                          borderRadius: Radius.md,
                          alignSelf: "stretch",
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        variant="label"
                        size="medium"
                        weight="normal"
                        style={{
                          color: colors.onPrimary,
                          fontFamily: FONTS.regular,
                        }}
                      >
                        {isWishlisted
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {scrollBottomSpacerHeight > 0 ? (
                  <View
                    style={{
                      backgroundColor: scrollBottomSurface,
                      height: scrollBottomSpacerHeight,
                    }}
                  />
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        {showStickyAddToCollection && (
          <View
            style={[
              styles.showMoreRocksBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                paddingHorizontal: 20,
                backgroundColor: isDark
                  ? APP_COLORS.surfaceAuthDark
                  : APP_COLORS.surfaceAuthLight,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAddToCollectionSheet(true);
                setRefreshAddSheetTrigger((t) => t + 1);
              }}
              style={[
                styles.wishlistButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 30,
                  alignSelf: "stretch",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                },
              ]}
              activeOpacity={0.8}
            >
              <AppImage
                source={
                  isDark ? Images.addCollectionDark : Images.addCollectionLight
                }
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
              <Text
                variant="label"
                size="medium"
                weight="normal"
                style={{
                  color: colors.onPrimary,
                  fontFamily: FONTS.regular,
                }}
              >
                Add to collection
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rock of the day: sticky "Show more rocks (1/3)" for everyone; no blur, full data. Counter starts at 1. */}
        {isBirdOfTheDay &&
          showMoreRocksClicks < 3 &&
          birdOfTheDayIds &&
          birdOfTheDayIds.length > 1 && (
            <View
              style={[
                styles.showMoreRocksBar,
                {
                  paddingBottom: Math.max(insets.bottom, 12),
                  paddingHorizontal: spacing[4],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  const isPremiumNow = selectIsPremium(
                    useSubscriptionStore.getState()
                  );
                  if (!isPremiumNow) {
                    setShowShowMoreRocksUpgradeModal(true);
                    return;
                  }
                  if (showMoreRocksClicks >= 2) {
                    setShowMoreRocksClicks(3);
                    return;
                  }
                  const ids = birdOfTheDayIds;
                  if (!ids?.length) return;
                  const currentIndex = ids.indexOf(mushroomId);
                  const nextIndex =
                    currentIndex >= 0 && currentIndex < ids.length - 1
                      ? currentIndex + 1
                      : (showMoreRocksClicks + 1) % ids.length;
                  const nextId = ids[nextIndex];
                  if (!nextId || nextId === mushroomId) return;
                  navigation.replace("BirdDetails", {
                    mushroomId: nextId,
                    source: "birdOfTheDay",
                    birdOfTheDayIds: ids,
                    birdOfTheDayClickCount: showMoreRocksClicks + 1,
                  } as any);
                }}
                style={[
                  styles.showMoreRocksButton,
                  {
                    backgroundColor: spec.CTA_BG,
                    borderRadius: spec.CTA_RADIUS,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  variant="label"
                  size="medium"
                  weight="semibold"
                  style={{ color: spec.CTA_TEXT }}
                >
                  {(() => {
                    const ids = birdOfTheDayIds ?? [];
                    const currentIndex = ids.indexOf(mushroomId);
                    const totalResults = Math.max(1, ids.length);
                    const viewingResult =
                      currentIndex >= 0
                        ? currentIndex + 1
                        : Math.max(1, showMoreRocksClicks + 1);
                    return `Show more birds (${viewingResult}/${totalResults})`;
                  })()}
                </Text>
              </TouchableOpacity>
            </View>
          )}

      </SafeAreaView>

      <UpgradeModal
        visible={showShowMoreRocksUpgradeModal}
        onClose={() => setShowShowMoreRocksUpgradeModal(false)}
        onUpgrade={() => {
          setShowShowMoreRocksUpgradeModal(false);
          navigateToSubscriptionMain();
        }}
        limitType="birdOfDay"
        height="72%"
      />

      <RemoveFromWishlistConfirmation
        visible={showRemoveFromWishlistConfirm}
        onClose={() => setShowRemoveFromWishlistConfirm(false)}
        onConfirm={handleConfirmRemoveFromWishlist}
        mushroomName={
          mushroomData ? getDisplayName(mushroomData) : undefined
        }
      />
    </>
  );
};

/** @deprecated Use BirdDetailsScreen */
export const MushroomDetailsScreen = BirdDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    textAlign: "center",
  },
  menuIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselWrap: {
    position: "relative",
    width: "100%",
  },
  catalogueFreeTabBar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingVertical: 2,
    marginTop: 24,
  },
  catalogueFreeTabScrollContent: {
    flexGrow: 0,
    alignItems: "center",
  },
  catalogueFreeTab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  catalogueFreeTabScrollable: {
    flex: 0,
    paddingHorizontal: 12,
  },
  catalogueFreeOverviewCard: {
    alignSelf: "stretch",
  },
  menuOverlay: {
    zIndex: 1000,
    elevation: 1000,
  },
  menu: {
    position: "absolute",
    top: 48,
    right: 16,
    borderRadius: Radius.sm,
    padding: 8,
    minWidth: 150,
    zIndex: 1000,
    shadowColor: ACCENT_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  nameSection: {
    // backgroundColor set inline from theme (colors.background) for dark mode
  },
  wishlistButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing[4],
    borderRadius: Radius.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gradientWrapper: {
    borderRadius: Radius.lg,
    padding: 2,
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chipContainer: {
    borderRadius: 14,
    overflow: "hidden",
  },
  chipInner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  locationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  externalLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  altHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: {
    textDecorationLine: "underline",
  },
  altScroll: {
    marginBottom: 0,
  },
  altCard: {
    width: 268,
    height: 100,
    paddingRight: 12,
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 12,
  },
  altCardContent: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    paddingLeft: 12,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  altImage: {
    width: 72,
    height: 72,
  },
  altName: {
    marginBottom: 4,
    textAlign: "left",
  },
  addToCollectionButton: {
    paddingVertical: 18,
    paddingHorizontal: 26,
    minHeight: 52,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  rateMatchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: RATE_MATCH_CARD_RADIUS,
  },
  rateMatchSuccess: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
  },
  rateMatchSuccessIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  rateMatchSuccessTitle: {
    textAlign: "center",
  },
  rateMatchTitle: {
    marginBottom: 8,
  },
  rateMatchSubtitle: {
    marginBottom: 20,
  },
  rateMatchEmojiRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  rateMatchEmojiBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  rateMatchEmoji: {
    fontSize: 32,
  },
  rateMatchMessageLabel: {
    marginBottom: 8,
  },
  rateMatchInput: {
    minHeight: 100,
    padding: spacing[4],
    borderWidth: 1,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 16,
  },
  rateMatchSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 32,
    borderWidth: 1,
    alignSelf: "flex-end",
  },
  rateMatchSendText: {},
  rateMatchSpinner: {
    marginRight: 0,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  blurCta: {
    paddingVertical: 12,
    paddingHorizontal: spacing[4],
  },
  stickyWishlistBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    overflow: "hidden",
  },
  stickyWishlistBarBlur: {
    minHeight: 206,
    backgroundColor: APP_COLORS.promoCardGradientStart,
  },
  stickyWishlistBarContent: {
    flex: 1,
    minHeight: 206,
    paddingHorizontal: 93,
    justifyContent: "center",
    alignItems: "center",
  },
  showMoreRocksBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    zIndex: 20,
  },
  // AI layout — static inline styles (hero, rock title, tabs)
  aiCarouselWrap: {
    position: "relative" as const,
    width: "100%",
  },
  aiRockTitleContainer: {
    marginHorizontal: 20,
    marginTop: 0,
    alignItems: "flex-start",
  },
  birdNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    width: "100%",
  },
  birdNameCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  birdNameSoundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  aiSynonym: {
    marginTop: 8,
    fontStyle: "italic",
    alignSelf: "stretch",
    textAlign: "left",
  },
  aiPriceRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    alignSelf: "flex-start",
  },
  aiUnit: {
    marginLeft: 4,
  },
  aiNameOriginWrapper: {
    marginTop: 16,
    position: "relative",
    overflow: "visible",
    marginBottom: 16,
  },
  aiNameOrigin: {
    borderRadius: Radius.md,
    padding: 12,
    overflow: "visible",
  },
  aiNameOriginPinnedIcon: {
    position: "absolute",
    top: -12,
    right: -8,
    width: 24,
    height: 24,
  },
  aiTabBar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingVertical: 2,
    marginTop: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  aiTabBarScrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 4,
  },
  aiTabBarScroll: {
    width: "100%",
  },
  aiTab: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  aiTabScrollable: {
    flexShrink: 0,
    paddingHorizontal: 12,
  },
  aiTabLabel: {
    fontSize: 14,
  },
  aiTabBadge: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  aiTabGoProWrap: {
    marginLeft: 12,
    alignSelf: "center",
    paddingVertical: 4,
  },
  aiTabGoProImage: {
    width: 100,
    height: 32,
  },
  showMoreRocksButton: {
    alignSelf: "stretch",
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
