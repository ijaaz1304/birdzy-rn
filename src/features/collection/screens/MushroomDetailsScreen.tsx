/**
 * Mushroom Details Screen
 * Displays detailed information about a mushroom species.
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, TextInput, ActivityIndicator, KeyboardAvoidingView, Pressable, InteractionManager } from "react-native";
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
import { Text, InfoText, InfoRow, NavBackIcon } from "../../../atoms";
import {
  SectionCard as BaseSectionCard,
  ExpandableList,
  MohsHardnessBar,
  MapPreview,
} from "../../../molecules";
import { Toggle } from "../../../atoms";
import {
  CollectionStackParamList,
  RootStackParamList,
} from "../../../navigation/types";
import { ReportModal, REPORT_MODAL_KEYBOARD_COOLDOWN_MS } from "../../../molecules/ReportModal";
import { MushroomDetail } from "../../../types/mushrooms.types";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";
import {
  ENTRY_TYPE_LABELS,
  METAPHYSICAL_DISCLAIMER,
} from "../../../constants/mushroomDisplayConstants";
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
import { formulaToDisplay } from "../../../utils/formulaUtils";
import { formatTitleCase } from "../../../utils";
import { resolveMushroomImageUrlsForDisplay } from "../../../utils/mushroomCardUtils";
import { getSpecimenDisplayImageUrls } from "../collection.utils";
import {
  getArchetypeImageUrls,
  isMushroomRecord,
  normalizeMushroomDetail,
} from "../../../utils/mushroomApiMappers";
import { isBirdRecord } from "../../../utils/birdApiMappers";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import { MushroomStatusChips } from "../../../components/mushroom/MushroomStatusChips";
import { MushroomWarningBanner } from "../../../components/mushroom/MushroomWarningBanner";
import {
  LimitReachedBottomSheet,
  RemoveFromCollectionModal,
  UpgradeModal,
  IdentificationWarningPopup,
  LocationManageAccessPopup,
  LocationPermissionPopup,
  ChangeLocationBottomSheet,
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
} from "../../../assets";
import { coreApi } from "../../../services/api/features/core.api";
import { archetypeService } from "../../../services/archetype/archetype.service";
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
import { SubscribeToPremiumCard } from "../components/SubscribeToPremiumCard";
import {
  MushroomDetailsScrollSections,
  useCustomLocationSectionFlow,
  type MushroomScrollSectionId,
} from "../components/MushroomDetailsScrollSections";
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
import {
  findFirstCountryWithCoordinates,
  COUNTRY_MAP_ZOOM_LEVEL,
} from "../../../utils/countryCoordinates";
import { BlurOverlay } from "../../../components/BlurOverlay";
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

type MushroomDetailsScreenRouteProp = RouteProp<
  CollectionStackParamList,
  "BirdDetails"
>;
type MushroomDetailsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CollectionStackParamList, "BirdDetails">,
  NativeStackNavigationProp<RootStackParamList>
>;

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

/** CamelCase to "Title Case With Spaces" e.g. lightStability → Light Stability */
function formatStabilityLabel(camelKey: string): string {
  const withSpaces = camelKey.replace(/([A-Z])/g, " $1").trim();
  return withSpaces.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Value: first letter caps, rest lowercase e.g. MODERATELY_STABLE → Moderately stable */
function formatStabilityValue(value: string): string {
  const withSpaces = value.replace(/_/g, " ").trim();
  if (!withSpaces) return "Unknown";
  return withSpaces.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Shorten image URLs for app logs (avoid huge strings). */
function summarizeImageUrlsForLog(urls: unknown[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.slice(0, 3).map((u) => {
    const s = typeof u === "string" ? u : String(u);
    return s.length > 96 ? `${s.slice(0, 96)}…` : s;
  });
}

/** Derive Gem Care Yes/No from stability: light → Avoid direct sunlight, heat → Temperature control, waterOrHumidity → Humidity control. Yes when MODERATELY_STABLE or UNSTABLE. */
function deriveGemCareFromStability(
  stability: Record<string, unknown> | null | undefined,
  key: "lightStability" | "heatStability" | "waterOrHumidityStability"
): "Yes" | "No" {
  if (!stability || typeof stability !== "object") return "No";
  const raw = stability[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const s = typeof value === "string" ? value.toUpperCase() : "";
  return s === "UNSTABLE" || s === "MODERATELY_STABLE" ? "Yes" : "No";
}

export const MushroomDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const navigation = useNavigation<MushroomDetailsScreenNavigationProp>();
  const route = useRoute<MushroomDetailsScreenRouteProp>();
  const {
    mushroomId,
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
  } = route.params || { mushroomId: "" };
  const isFromIdentification =
    source === "identification" || fromOtherPossibleMatches === true;
  const isMushroomOfTheDay = source === "birdOfTheDay";

  useEffect(() => {
    if (isFromIdentification) {
      analyticsService.logEvent(EVENTS.identification_details_screen, {
        mushroom_id: String(mushroomId),
      });
    }
    if (isMushroomOfTheDay) {
      analyticsService.logEvent(EVENTS.bird_of_the_day_screen, {
        mushroom_id: String(mushroomId),
      });
    }
  }, [isFromIdentification, isMushroomOfTheDay, mushroomId]);

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

  /** Flat layout (Figma): section title, property label above value, no cards — Satoshi */
  const SECTION_TITLE_FLAT = {
    ...typography.title.xsmallBold,
    fontSize: 18,
    color: isDark ? spec.PRIMARY_TEXT : APP_COLORS.surfaceDark,
    marginBottom: 12,
  };
  const PROP_LABEL_FLAT = {
    ...typography.body.largeSemibold,
    color: isDark ? spec.PRIMARY_TEXT : APP_COLORS.surfaceDark,
    marginBottom: 12,
  };
  /** Gem care / cleaning tips: labels normal weight */
  const PROP_LABEL_NORMAL = {
    ...typography.body.large,
    color: isDark ? spec.PRIMARY_TEXT : APP_COLORS.surfaceDark,
    marginBottom: 12,
  };
  const PROP_VALUE_FLAT = {
    ...typography.body.small,
    fontSize: 14,
    lineHeight: 24,
    color: isDark ? spec.SECONDARY_TEXT : APP_COLORS.textSecondaryGray,
    marginBottom: 10,
  };
  /** Maintenance (Stability, Gem Care, Cleaning Tips): Body/16px/Regular — label and value same spec, 12px gap between rows */
  const MAINTENANCE_ROW_LABEL = {
    ...typography.body.large,
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: isDark ? spec.SECONDARY_TEXT : APP_COLORS.textSecondaryGray,
  };
  const MAINTENANCE_ROW_VALUE = {
    ...typography.body.large,
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: isDark ? spec.PRIMARY_TEXT : APP_COLORS.surfaceDark,
  };
  const MAINTENANCE_ROW_GAP = 12;
  const SECTION_TOP_GAP = 32;
  const PROP_BOTTOM_GAP = 10;
  const LABEL_VALUE_GAP = 12;
  const ROW_DIVIDER_FLAT = {
    height: 1,
    backgroundColor: SCREEN_COLORS.LIGHT.border,
    marginVertical: 8,
  };

  /** SectionCard: 100% width, light #FFF / dark #111 */
  const SECTION_CARD_BG = isDark
    ? APP_COLORS.surfaceDark
    : APP_COLORS.modalTextOnPrimary;
  // eslint-disable-next-line react/no-unstable-nested-components
  const SectionCard = (props: any) => (
    <BaseSectionCard
      {...props}
      backgroundColor={SECTION_CARD_BG}
      containerStyle={{
        width: "100%",
        alignSelf: "stretch",
      }}
    />
  );

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
  const [activeTab, setActiveTab] = useState("overview");
  const [showSpirituality, setShowSpirituality] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const sectionRefs = useRef<{ [key: string]: View | null }>({});
  /** Section Y offsets (from onLayout) for tab scroll — avoids measureLayout ref errors on Fabric */
  const sectionYOffsets = useRef<Record<string, number>>({
    overview: 0,
    physical: 0,
    chemical: 0,
    maintenance: 0,
    spirituality: 0,
    safety: 0,
    similar: 0,
    morphology: 0,
    habitat: 0,
  });
  const mushroomSectionsOffsetY = useRef(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
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
    source === "catalogue" &&
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
      if (source === "catalogue") return;

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
      isMushroomOfTheDay,
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
    log("[MushroomDetails] section: physical", {
      mushroomId: effectiveArchetypeId,
      hasCrystalSystem: !!mushroomData.crystalSystem?.length,
      hasColor: !!mushroomData.color?.length,
      hasMohs: mushroomData.mohsHardness != null || d.mohs_hardness != null,
      hasLuster: !!mushroomData.lusture?.length,
      hasTransparency: !!mushroomData.transparency?.length,
      hasDensity: !!mushroomData.density,
      images: {
        count: imageUrlCount,
        sample: imageUrlsSample,
      },
    });
    log("[MushroomDetails] section: chemical", {
      mushroomId: effectiveArchetypeId,
      hasFormula: !!mushroomData.formula,
      hasElements: !!mushroomData.elements?.length,
    });
    log("[MushroomDetails] section: maintenance", {
      mushroomId: effectiveArchetypeId,
      hasDurability: !!d.durability,
      hasScratchResistance: !!mushroomData.scratchResistance,
      hasToughness: !!(
        mushroomData.toughness && mushroomData.toughness !== "UNKNOWN"
      ),
      hasStability: typeof d.stability === "object" && d.stability != null,
      hasStorage: !!mushroomData.storage,
      hasCleaningTips: !!(
        mushroomData.cleaningTips ||
        (typeof d.cleaningTips === "object" && d.cleaningTips != null)
      ),
    });
    log("[MushroomDetails] section: gem_care (from API)", {
      mushroomId: effectiveArchetypeId,
      storage: mushroomData.storage
        ? {
            storeSeprately: mushroomData.storage.storeSeprately,
            reason: mushroomData.storage.reason,
          }
        : null,
      gemCareGuide: d.gemCareGuide
        ? {
            avoidDirectSunlight: !!d.gemCareGuide.avoidDirectSunlight,
            temperatureControl: !!d.gemCareGuide.temperatureControl,
            humidityControl: !!d.gemCareGuide.humidityControl,
          }
        : null,
    });
    log("[MushroomDetails] section: cleaning_tips (from API)", {
      mushroomId: effectiveArchetypeId,
      cleaningTips:
        typeof d.cleaningTips === "object" && d.cleaningTips != null
          ? {
              cleaningMethods: d.cleaningTips.cleaningMethods
                ? Object.keys(d.cleaningTips.cleaningMethods)
                : [],
              cleaningNotes: !!d.cleaningTips.cleaningNotes,
            }
          : null,
      cleaningTipsString:
        typeof mushroomData.cleaningTips === "string"
          ? (mushroomData.cleaningTips as string).length > 80
            ? (mushroomData.cleaningTips as string).slice(0, 80) + "..."
            : (mushroomData.cleaningTips as string)
          : null,
    });
    log("[MushroomDetails] section: spirituality", {
      mushroomId: effectiveArchetypeId,
      hasHealthRisks: !!mushroomData.healthRisks,
      hasAmplification: !!mushroomData.amplification,
      hasRevitalizeCharging: !!mushroomData.revitalizeCharging,
      hasRevitalizeCleansing: !!mushroomData.revitalizeCleansing,
      hasWorksWellWith: !!mushroomData.worksWellWith?.length,
      hasMetaphysicalQualities: !!mushroomData.metaphysicalQualities?.length,
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
    if (source === "catalogue" || source === "birdOfTheDay") {
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
  const isCatalogueFreeUser = source === "catalogue" && !isPremium;
  const isFromIdentificationFreeUser =
    source === "identification" && !isPremium;
  const isFromCollectionFreeUser = source === "collection" && !isPremium;
  const showGoProForFreeUser =
    isCatalogueFreeUser ||
    isFromIdentificationFreeUser ||
    isFromCollectionFreeUser;
  /** Identification/collection free: show only Overview up to Commonly found in + Add to collection; tabs stay but no section content after Overview in scroll. */
  const showSectionsAfterOverview = !(
    (source === "identification" || source === "collection") &&
    !isPremium
  );

  const isMushroomData = isMushroomRecord(
    mushroomData as unknown as Record<string, unknown>
  );
  const isBirdData =
    isMushroomData &&
    isBirdRecord(mushroomData as unknown as Record<string, unknown>);
  const birdDetailStrings = COLLECTION_STRINGS.birdDetails;

  const mushroomViewLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mushroomData || !isMushroomData || !mushroomId) return;
    if (mushroomViewLoggedRef.current === mushroomId) return;
    mushroomViewLoggedRef.current = mushroomId;
    analyticsService.logEvent(EVENTS.bird_view, {
      mushroom_id: mushroomId,
      source: toAnalyticsSource(source),
      collection_name: collectionName,
    });
  }, [collectionName, isMushroomData, mushroomData, mushroomId, source]);

  // Scroll to section when tab is selected (use onLayout offsets to avoid measureLayout ref errors)
  // Free user (catalogue, identification, or collection), not rock of the day: do not scroll to Physical/Chemical (they see Go Pro prompt instead)
  useEffect(() => {
    const scrollTabs = isMushroomData
      ? isBirdData
        ? [
            "overview",
            "sounds",
            "range",
            "similar",
            "morphology",
            "habitat",
          ]
        : ["overview", "safety", "similar", "morphology", "habitat"]
      : ["overview", "physical", "chemical", "maintenance", "spirituality"];
    if (!scrollTabs.includes(activeTab)) return;
    const skipScrollToSection =
      !isMushroomOfTheDay &&
      showGoProForFreeUser &&
      (activeTab === "physical" ||
        activeTab === "chemical" ||
        activeTab === "maintenance" ||
        activeTab === "spirituality");
    if (skipScrollToSection) return;
    const timer = setTimeout(() => {
      if (activeTab === "overview") {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      const y = sectionYOffsets.current[activeTab] ?? 0;
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab, source, isPremium, showGoProForFreeUser, isMushroomData, isBirdData]);

  const birdHasSounds = React.useMemo(() => isBirdData, [isBirdData]);

  const birdHasRange = React.useMemo(() => {
    if (!mushroomData || !isBirdData) return false;
    const range = (mushroomData as MushroomDetail).rangeDetails;
    if (!range) return false;
    return Boolean(
      range.yearRound || range.breeding || range.migration || range.nonBreeding
    );
  }, [isBirdData, mushroomData]);

  const mushroomGpsCoords = React.useMemo(() => {
    if (!mushroomData || !isMushroomData) return null;
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
  }, [isMushroomData, mushroomData]);

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
    isMushroomData ? mushroomMapCoords : null,
    !!mushroomGpsCoords
  );

  const similarSpeciesCount = React.useMemo(() => {
    if (!mushroomData || !isMushroomData) return 0;
    const lookAlikes = (mushroomData as MushroomDetail).lookAlikes;
    return Array.isArray(lookAlikes) ? lookAlikes.length : 0;
  }, [isMushroomData, mushroomData]);

  const tabs = isMushroomData
    ? isBirdData
      ? [
          { id: "overview", label: "Overview" },
          ...(birdHasSounds
            ? [{ id: "sounds", label: birdDetailStrings.sections.sounds }]
            : []),
          ...(birdHasRange
            ? [{ id: "range", label: birdDetailStrings.sections.range }]
            : []),
          {
            id: "similar",
            label: birdDetailStrings.sections.similarBirds,
          },
          {
            id: "morphology",
            label: birdDetailStrings.sections.identification,
          },
          { id: "habitat", label: birdDetailStrings.sections.habitat },
        ]
      : [
          { id: "overview", label: "Overview" },
          { id: "safety", label: "Safety" },
          { id: "similar", label: "Similar species" },
          { id: "morphology", label: "Physical Traits" },
          { id: "habitat", label: "Habitat and distribution" },
        ]
    : [
        { id: "overview", label: "Overview" },
        { id: "physical", label: "Physical Properties" },
        { id: "chemical", label: "Chemical Properties" },
        { id: "maintenance", label: "Maintenance" },
        { id: "spirituality", label: "Spirituality" },
      ];

  /** Source behaviour: Catalogue free = AI layout + Go Pro on tabs. Identification/collection free = Overview to Commonly found in + Add to collection; tabs visible, no section content after Overview. Rock of the day = full content. */
  /** Rock of the day (and any source): show Maintenance tab only when we have maintenance-related data; Spirituality only when we have spirituality-related data. */
  const hasMaintenanceData =
    mushroomData &&
    (!!(mushroomData as any).durability ||
      !!mushroomData.scratchResistance ||
      (!!mushroomData.toughness && mushroomData.toughness !== "UNKNOWN") ||
      (typeof (mushroomData as any).stability === "object" &&
        (mushroomData as any).stability != null) ||
      !!mushroomData.storage ||
      !!mushroomData.cleaningTips ||
      (typeof (mushroomData as any).cleaningTips === "object" &&
        (mushroomData as any).cleaningTips != null));
  const hasSpiritualityData =
    mushroomData &&
    (!!mushroomData.healthRisks ||
      !!mushroomData.amplification ||
      !!mushroomData.revitalizeCharging ||
      !!mushroomData.revitalizeCleansing ||
      (!!mushroomData.worksWellWith && mushroomData.worksWellWith.length > 0) ||
      (!!mushroomData.metaphysicalQualities &&
        mushroomData.metaphysicalQualities.length > 0));
  const tabsToShow = isMushroomData
    ? tabs.filter((t) => {
        if (t.id === "similar") return similarSpeciesCount > 0;
        if (t.id === "sounds") return birdHasSounds;
        if (t.id === "range") return birdHasRange;
        return true;
      })
    : isMushroomOfTheDay && mushroomData
    ? tabs.filter(
        (t) =>
          t.id === "overview" ||
          t.id === "physical" ||
          t.id === "chemical" ||
          (t.id === "maintenance" && hasMaintenanceData) ||
          (t.id === "spirituality" && hasSpiritualityData)
      )
    : tabs;

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
            No mushroom data available
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
    if (!isFromIdentification || mushroomData?.isGem) return null;
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
                      domain: "Mushrooms",
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

  /** Flat property block: label above value — shared by overview taxonomy & physical traits */
  const FlatProp = ({
    label,
    value,
    style,
    compact,
  }: {
    label: string;
    value: string;
    style?: object;
    compact?: boolean;
  }) => (
    <View style={[{ marginBottom: PROP_BOTTOM_GAP, width: "100%" }, style]}>
      <Text style={PROP_LABEL_FLAT}>{label}</Text>
      <Text style={[PROP_VALUE_FLAT, compact && { marginBottom: 2 }]}>
        {value}
      </Text>
    </View>
  );

  const renderTabContent = () => {
    // Free user (catalogue, identification, or collection), not rock of the day: on Physical/Chemical/Maintenance/Spirituality tabs show Go Pro. Rock of the day always sees full content.
    if (
      !isMushroomOfTheDay &&
      showGoProForFreeUser &&
      (activeTab === "physical" ||
        activeTab === "chemical" ||
        activeTab === "maintenance" ||
        activeTab === "spirituality")
    ) {
      const unlockMessageByTab: Record<string, string> = {
        physical: "Unlock Physical properties with Premium",
        chemical: "Unlock Chemical properties with Premium",
        maintenance: "Unlock Maintenance with Premium",
        spirituality: "Unlock Symbolism & Spirituality with Premium",
      };
      const unlockMessage =
        unlockMessageByTab[activeTab] ?? "Unlock with Premium";
      return (
        <View
          style={{
            marginTop: TABS_TO_CONTENT_GAP,
            marginHorizontal: LAYOUT_MARGIN,
            alignItems: "center",
            paddingVertical: spacing[8],
            backgroundColor: SECTION_CARD_BG,
            height: 380,
          }}
        >
          <SubscribeToPremiumCard
            isDark={isDark}
            onPress={() => {
              navigation.getParent()?.navigate("SubscriptionStack", {
                screen: "SubscriptionMain",
              });
            }}
          />
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={{ marginTop: spacing[3], textAlign: "center" }}
          >
            {unlockMessage}
          </Text>
        </View>
      );
    }
    if (isMushroomData && mushroomData) {
      return (
        <>
          <View
            onLayout={(e) => {
              mushroomSectionsOffsetY.current = e.nativeEvent.layout.y;
            }}
          >
            <MushroomDetailsScrollSections
              mushroomData={mushroomData}
              detailedDescription={detailedDescription}
              isDark={isDark}
              isPremium={isPremium}
              isMushroomOfTheDay={isMushroomOfTheDay}
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
              onSectionLayout={(sectionId: MushroomScrollSectionId, y) => {
                sectionYOffsets.current[sectionId] =
                  mushroomSectionsOffsetY.current + y;
              }}
            />
          </View>
          {isFromIdentification ? renderAllContent({ extrasOnly: true }) : null}
        </>
      );
    }
    // All tabs show the same full content; Physical/Chemical sections hidden for free user in renderAllContent
    return renderAllContent();
  };

  /**
   * PHYSICAL TAB — flat layout (no cards)
   * Order: Crystal system, Color, Transparency, Luster, Density, Mohs, Tenacity, Radioactivity, Magnetism; then Optical; then Other.
   */
  const renderPhysicalTab = () => {
    const mohsVal =
      mushroomData.mohsHardness ?? (mushroomData as any).mohs_hardness;
    const mohsDisplay = mohsVal ?? "—";
    const physicalRowGap = 12;
    return (
      <View style={{ paddingTop: 20 }}>
        {mushroomData.crystalSystem &&
          mushroomData.crystalSystem.length > 0 && (
            <FlatProp
              label="Crystal system"
              value={mushroomData.crystalSystem.join(", ")}
              style={{ marginBottom: physicalRowGap }}
              compact
            />
          )}
        {mushroomData.color && mushroomData.color.length > 0 && (
          <FlatProp
            label="Color"
            value={mushroomData.color.join(", ")}
            style={{ marginBottom: physicalRowGap }}
            compact
          />
        )}
        {mushroomData.transparency && mushroomData.transparency.length > 0 && (
          <FlatProp
            label="Transparency"
            value={mushroomData.transparency.join(", ")}
            style={{ marginBottom: physicalRowGap }}
            compact
          />
        )}
        {((mushroomData as any).lusture?.length > 0 ||
          (mushroomData as any).luster?.length > 0) && (
          <FlatProp
            label="Luster"
            value={(
              (mushroomData as any).lusture ||
              (mushroomData as any).luster ||
              []
            ).join(", ")}
            style={{ marginBottom: physicalRowGap }}
            compact
          />
        )}
        {mushroomData.density && (
          <FlatProp
            label="Density"
            value={`${mushroomData.density} g/cm³`}
            style={{ marginBottom: physicalRowGap }}
            compact
          />
        )}

        {/* Mohs: label + value text, then bar (value, scale labels, gradient, arrow) */}
        <View style={{ marginBottom: mohsVal ? 0 : physicalRowGap }}>
          <Text style={PROP_LABEL_FLAT}>Mohs hardness</Text>
          {!mohsVal && <Text style={PROP_VALUE_FLAT}>{mohsDisplay}</Text>}
          {mohsVal && (
            <MohsHardnessBar
              value={String(mohsVal)}
              mhMin={(mushroomData as any).mhMin}
              mhMax={(mushroomData as any).mhMax}
              numberColor={
                isDark ? spec.PRIMARY_TEXT : APP_COLORS.brandLightBlue
              }
              indicatorColor={
                isDark ? spec.PRIMARY_TEXT : APP_COLORS.shadowBlack
              }
            />
          )}
        </View>

        {mushroomData.tenacity && mushroomData.tenacity.length > 0 && (
          <FlatProp
            label="Tenacity"
            value={mushroomData.tenacity.join(", ")}
            style={{ marginBottom: physicalRowGap }}
            compact
          />
        )}
        {mushroomData.radioactivity &&
          mushroomData.radioactivity !== "UNKNOWN" && (
            <FlatProp
              label="Radioactivity"
              value={formatTitleCase(mushroomData.radioactivity)}
              style={{ marginBottom: physicalRowGap }}
              compact
            />
          )}
        {mushroomData.magnetism && mushroomData.magnetism !== "UNKNOWN" && (
          <FlatProp
            label="Magnetism"
            value={formatTitleCase(mushroomData.magnetism)}
            style={{ marginBottom: physicalRowGap }}
            compact
          />
        )}

        {(mushroomData.rimin || mushroomData.rimax) && (
          <View style={{ marginTop: 16 }}>
            <Text style={SECTION_TITLE_FLAT}>Optical Properties</Text>
            {mushroomData.rimin && mushroomData.rimax && (
              <FlatProp
                label="Refractive Index"
                value={`${mushroomData.rimin} - ${mushroomData.rimax}`}
                style={{ marginBottom: physicalRowGap }}
                compact
              />
            )}
          </View>
        )}
      </View>
    );
  };

  /**
   * CHEMICAL TAB — flat layout: single "Chemical Properties" section, no cards.
   */
  const renderChemicalTab = () => {
    const classificationParts: string[] = [];
    if (mushroomData.danaClass)
      classificationParts.push(`Dana: ${mushroomData.danaClass}`);
    if (mushroomData.strunzClass)
      classificationParts.push(`Strunz: ${mushroomData.strunzClass}`);
    const classificationValue = classificationParts.join("; ");
    const formulaValue = formulaToDisplay(mushroomData.formula);
    const commonImpurities =
      (mushroomData as any).commonImpurities ??
      (mushroomData as any).common_impurities;

    return (
      <View style={{ paddingTop: 20 }}>
        {classificationValue ? (
          <FlatProp
            label="Chemical classification"
            value={classificationValue}
          />
        ) : null}
        {formulaValue ? (
          <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
            <Text style={PROP_LABEL_FLAT}>Formula</Text>
            <Text style={[PROP_VALUE_FLAT, { fontFamily: "monospace" }]}>
              {formulaValue}
            </Text>
          </View>
        ) : null}
        {mushroomData.elements && mushroomData.elements.length > 0 && (
          <FlatProp label="Elements" value={mushroomData.elements.join(", ")} />
        )}
        {commonImpurities != null &&
          (Array.isArray(commonImpurities)
            ? commonImpurities.length > 0
            : String(commonImpurities)) && (
            <FlatProp
              label="Common impurities"
              value={
                Array.isArray(commonImpurities)
                  ? commonImpurities.join(", ")
                  : String(commonImpurities)
              }
            />
          )}

        {((mushroomData.varieties && mushroomData.varieties.length > 0) ||
          (mushroomData.synonyms && mushroomData.synonyms.length > 0) ||
          (mushroomData.confusedWith &&
            mushroomData.confusedWith.length > 0)) && (
          <View>
            <Text style={SECTION_TITLE_FLAT}>Related Information</Text>
            {mushroomData.varieties && mushroomData.varieties.length > 0 && (
              <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                <ExpandableList
                  title="Varieties"
                  items={(mushroomData.varieties as string[]).map((v) =>
                    typeof v === "string" ? v : String(v)
                  )}
                />
              </View>
            )}
            {mushroomData.synonyms && mushroomData.synonyms.length > 0 && (
              <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                <ExpandableList
                  title="Synonyms"
                  items={mushroomData.synonyms.map((s: any) => {
                    if (typeof s === "string") return s;
                    if (
                      typeof s === "object" &&
                      s !== null &&
                      "synonymName" in s
                    )
                      return s.synonymName || "";
                    return String(s);
                  })}
                />
              </View>
            )}
            {mushroomData.confusedWith &&
              mushroomData.confusedWith.length > 0 && (
                <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                  <ExpandableList
                    title="Often Confused With"
                    items={mushroomData.confusedWith.map((c) =>
                      typeof c === "string" ? c : String(c)
                    )}
                  />
                </View>
              )}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render ALL content - Overview shows all, other tabs scroll to sections
   */
  const renderAllContent = (opts?: { extrasOnly?: boolean }) => {
    if (opts?.extrasOnly) {
      return (
        <>
          {isFromIdentification && !mushroomData?.isGem
            ? renderIdentificationRateMatch()
            : null}
        </>
      );
    }

    if (isMushroomData) {
      return null;
    }

    const mineral = mushroomData as any;

    const categoryRows: { label: string; value: string }[] = [];
    if (isMushroomData) {
      if (mineral.edibility) {
        categoryRows.push({
          label: "Edibility",
          value: String(mineral.edibility),
        });
      }
      if (mineral.toxicitySeverity && mineral.toxicitySeverity !== "none") {
        categoryRows.push({
          label: "Toxicity",
          value: String(mineral.toxicitySeverity),
        });
      }
      if (mineral.psychoactive) {
        categoryRows.push({
          label: "Psychoactive",
          value: mineral.psychoactive === "yes" ? "Yes" : "No",
        });
      }
      if (mineral.capShape) {
        categoryRows.push({
          label: "Cap shape",
          value: String(mineral.capShape),
        });
      }
      if (mineral.undersideType) {
        categoryRows.push({
          label: "Underside",
          value: String(mineral.undersideType),
        });
      }
    } else {
      if (mushroomData.entryType != null) {
        categoryRows.push({
          label: "Entry Type",
          value: ENTRY_TYPE_LABELS[mushroomData.entryType] || "Species",
        });
      }
      if (mushroomData.isGem != null) {
        categoryRows.push({
          label: "Gem",
          value: mushroomData.isGem ? "Yes" : "No",
        });
      }
      if ((mushroomData.crystalSystem?.length ?? 0) > 0) {
        categoryRows.push({
          label: "Crystal system",
          value: mushroomData.crystalSystem!.join(", "),
        });
      }
      if ((mushroomData.transparency?.length ?? 0) > 0) {
        categoryRows.push({
          label: "Transparency",
          value: mushroomData.transparency!.join(", "),
        });
      }
      if (mineral.lusture?.length > 0 || mineral.luster?.length > 0) {
        categoryRows.push({
          label: "Luster",
          value: (mineral.lusture || mineral.luster || []).join(", "),
        });
      }
      if ((mushroomData.color?.length ?? 0) > 0) {
        categoryRows.push({
          label: "Color",
          value: mushroomData.color!.slice(0, 2).join(", "),
        });
      }
    }
    const hasCategoryData = categoryRows.length > 0;

    // Custom Location: show section only when we have location data (text or map)
    const loc = mineral.gpsLocation ?? mineral.gps_location;
    const lat = loc?.latitude ?? loc?.lat;
    const lng = loc?.longitude ?? loc?.lng ?? loc?.lon;
    const hasGps =
      lat != null &&
      lng != null &&
      !Number.isNaN(Number(lat)) &&
      !Number.isNaN(Number(lng));
    const mapCoords = hasGps
      ? { lat: Number(lat), lng: Number(lng) }
      : countryMapCoords
      ? { lat: countryMapCoords.latitude, lng: countryMapCoords.longitude }
      : null;
    const hasCustomLocationData =
      !!mineral.customLocation || (!hasGps && !!mapCoords) || countryMapLoading;

    const hasCommonlyFoundIn = !!mushroomData.commonlyFoundIn?.length;

    const sectionWrapperStyle = {
      marginBottom: CONTENT_TO_HEADING_GAP,
      width: "100%" as const,
    };
    const firstSectionStyle = {
      ...sectionWrapperStyle,
      paddingTop: 0,
    };

    return (
      <>
        {/* Single section: Hero to Commonly Found in — 100% width */}
        <View
          ref={(ref) => {
            sectionRefs.current.overview = ref;
          }}
          onLayout={(e) => {
            sectionYOffsets.current.overview = e.nativeEvent.layout.y;
          }}
          collapsable={false}
          style={[firstSectionStyle, { width: "100%" }]}
        >
          <SectionCard
            title=""
            showArrow={false}
            containerStyle={{ marginBottom: 0 }}
          >
            <Text style={SECTION_TITLE_FLAT}>Overview</Text>
            <View
              style={{
                gap: ROW_SPACING,
                backgroundColor: isDark
                  ? APP_COLORS.surfaceAuthDark
                  : APP_COLORS.surfaceAuthLight,
                borderRadius: Radius.md,
                padding: spacing[4],
              }}
            >
              {detailedDescription ? (
                <Text
                  style={{
                    fontSize: 16,
                    lineHeight: 24,
                    fontFamily: FONTS.regular,
                    color: isDark ? TEXT_PRIMARY : APP_COLORS.surfaceDark,
                  }}
                >
                  {detailedDescription}
                </Text>
              ) : null}
              {(mushroomData.wikipediaUrl ||
                (mushroomData as { wikipediaLink?: string }).wikipediaLink) && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      mushroomData.wikipediaUrl ||
                        (mushroomData as { wikipediaLink?: string })
                          .wikipediaLink!
                    )
                  }
                  style={styles.externalLink}
                >
                  <Text
                    variant="body"
                    size="medium"
                    style={{
                      color: APP_COLORS.linkBlue,
                      textDecorationLine: "underline",
                      marginLeft: 8,
                    }}
                  >
                    Wikipedia
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {hasCategoryData && (
              <View style={{ marginTop: 20 }}>
                <Text style={SECTION_TITLE_FLAT}>Category</Text>
                {categoryRows.map((row, index) => (
                  <View
                    key={row.label}
                    style={
                      index < categoryRows.length - 1
                        ? { marginBottom: 12 }
                        : undefined
                    }
                  >
                    <InfoRow
                      labelColor={TEXT_SECONDARY}
                      valueColor={TEXT_PRIMARY}
                      rowPaddingVertical={2}
                      labelStyle={{ fontSize: 16, fontFamily: FONTS.regular }}
                      valueStyle={{
                        fontSize: 16,
                        fontFamily: FONTS.regular,
                        lineHeight: 24,
                        textAlign: "right",
                      }}
                      label={row.label}
                      value={row.value}
                    />
                    {index < categoryRows.length - 1 && (
                      <View style={ROW_DIVIDER_FLAT} />
                    )}
                  </View>
                ))}
              </View>
            )}

            {hasGps && mapCoords && (
              <View
                ref={(ref) => {
                  sectionRefs.current["overview-location"] = ref;
                }}
                collapsable={false}
                style={{ marginTop: 20 }}
              >
                <Text style={SECTION_TITLE_FLAT}>Location</Text>
                <View
                  style={{
                    minHeight: 200,
                    borderRadius: Radius.md,
                    overflow: "hidden",
                    backgroundColor: SECTION_CARD_BG,
                    marginBottom: 0,
                  }}
                >
                  <MapPreview
                    latitude={mapCoords.lat}
                    longitude={mapCoords.lng}
                    hasLocationPermission={true}
                    isUserPlant={false}
                  />
                </View>
              </View>
            )}

            {!hasGps && hasCustomLocationData && (
              <View
                ref={(ref) => {
                  sectionRefs.current["overview-location"] = ref;
                }}
                collapsable={false}
                style={{ marginTop: 20 }}
              >
                {mineral.customLocation && (
                  <View style={{ marginBottom: ROW_SPACING }}>
                    <InfoText text={mineral.customLocation} />
                  </View>
                )}
                {mapCoords &&
                  (() => {
                    const isCountryBasedMap = countryMapCoords != null;
                    return (
                      <>
                        <Text style={SECTION_TITLE_FLAT}>Custom Location</Text>
                        <View
                          style={{
                            minHeight: 200,
                            borderRadius: Radius.md,
                            overflow: "hidden",
                            backgroundColor: SECTION_CARD_BG,
                            marginBottom: 0,
                          }}
                        >
                          <MapPreview
                            latitude={mapCoords.lat}
                            longitude={mapCoords.lng}
                            hasLocationPermission={true}
                            isUserPlant={false}
                            zoom={
                              isCountryBasedMap
                                ? COUNTRY_MAP_ZOOM_LEVEL
                                : undefined
                            }
                            singleMarkerOnly={isCountryBasedMap}
                          />
                        </View>
                      </>
                    );
                  })()}
                {!mapCoords &&
                  (countryMapLoading ? (
                    <View
                      style={{
                        minHeight: 200,
                        borderRadius: Radius.md,
                        borderWidth: 1,
                        borderColor: spec.MAP_CARD_BORDER,
                        backgroundColor: SECTION_CARD_BG,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: spacing[4],
                        marginBottom: spacing[2],
                      }}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={40}
                        color={spec.SECONDARY_TEXT}
                        style={{ marginBottom: spacing[2] }}
                      />
                      <Text
                        variant="body"
                        size="small"
                        color="textSecondary"
                        style={{ textAlign: "center" }}
                      >
                        Loading location…
                      </Text>
                    </View>
                  ) : null)}
              </View>
            )}

            {hasCommonlyFoundIn && (
              <View style={{ marginTop: 20 }}>
                <Text style={SECTION_TITLE_FLAT}>Commonly Found in</Text>
                <View
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: Radius.sm,
                    marginTop: 12,
                    ...(!isPremium && !isMushroomOfTheDay ? { minHeight: 120 } : {}),
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: FONTS.regular,
                      lineHeight: 24,
                      color: isDark
                        ? TEXT_SECONDARY
                        : APP_COLORS.textSecondaryGray,
                    }}
                  >
                    {mushroomData.commonlyFoundIn!.join(", ")}
                  </Text>
                  {!isPremium && !isMushroomOfTheDay && (
                    <>
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          {
                            borderRadius: Radius.sm,
                            overflow: "hidden",
                          },
                        ]}
                        pointerEvents="box-none"
                      >
                        <BlurOverlay
                          variant="premiumGate"
                          pointerEvents="none"
                          style={StyleSheet.absoluteFill}
                        />
                        {!isDark ? (
                          <View
                            pointerEvents="none"
                            style={[
                              StyleSheet.absoluteFillObject,
                              {
                                borderRadius: Radius.sm,
                                borderWidth: 1,
                                borderColor: APP_COLORS.blurOverlayBorder,
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                      <View
                        pointerEvents="box-none"
                        style={[
                          StyleSheet.absoluteFillObject,
                          {
                            justifyContent: "center",
                            alignItems: "center",
                          },
                        ]}
                      >
                        <SubscribeToPremiumCard
                          isDark={isDark}
                          onPress={() =>
                            navigation
                              .getParent()
                              ?.navigate("SubscriptionStack", {
                                screen: "SubscriptionMain",
                              })
                          }
                        />
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}
          </SectionCard>
        </View>

        {showSectionsAfterOverview &&
          !isMushroomData &&
          !isCatalogueFreeUser &&
          (!isFromIdentification || isPremium || isMushroomOfTheDay) && (
            <View
              ref={(ref) => {
                sectionRefs.current.physical = ref;
              }}
              onLayout={(e) => {
                sectionYOffsets.current.physical = e.nativeEvent.layout.y;
              }}
              collapsable={false}
              style={[sectionWrapperStyle, { width: "100%" }]}
            >
              <SectionCard title="Physical Properties" showArrow={false}>
                {!isPremium && !isMushroomOfTheDay && (
                  <View
                    style={{
                      paddingVertical: spacing[4],
                      alignItems: "center",
                    }}
                  >
                    <Text variant="body" size="small" color="textTertiary">
                      Unlock with Premium
                    </Text>
                  </View>
                )}
                {(isPremium || isMushroomOfTheDay) && renderPhysicalTab()}
              </SectionCard>
            </View>
          )}

        {/* Section: Chemical Properties — alone, 100% width */}
        {showSectionsAfterOverview &&
          !isMushroomData &&
          !isCatalogueFreeUser &&
          (!isFromIdentification || isPremium || isMushroomOfTheDay) && (
            <View
              ref={(ref) => {
                sectionRefs.current.chemical = ref;
              }}
              onLayout={(e) => {
                sectionYOffsets.current.chemical = e.nativeEvent.layout.y;
              }}
              collapsable={false}
              style={[sectionWrapperStyle, { width: "100%" }]}
            >
              <SectionCard title="Chemical Properties" showArrow={false}>
                {!isPremium && !isMushroomOfTheDay && (
                  <View
                    style={{
                      paddingVertical: spacing[4],
                      alignItems: "center",
                    }}
                  >
                    <Text variant="body" size="small" color="textTertiary">
                      Unlock with Premium
                    </Text>
                  </View>
                )}
                {(isPremium || isMushroomOfTheDay) && renderChemicalTab()}
              </SectionCard>
            </View>
          )}

        {/* Section: Maintenance — includes Stability (sub) and Gem Care Guide (sub); 100% width */}
        {showSectionsAfterOverview &&
          (isPremium || isMushroomOfTheDay) &&
          (mushroomData.isGem ||
            mushroomData.storage ||
            isMushroomOfTheDay ||
            isPremium ||
            mushroomData.cleaningTips ||
            (typeof mineral.cleaningTips === "object" &&
              mineral.cleaningTips)) && (
            <View
              ref={(ref) => {
                sectionRefs.current["overview-care"] = ref;
                sectionRefs.current.maintenance = ref;
              }}
              onLayout={(e) => {
                sectionYOffsets.current.maintenance = e.nativeEvent.layout.y;
              }}
              collapsable={false}
              style={[sectionWrapperStyle, { width: "100%" }]}
            >
              <SectionCard title="Maintenance" showArrow={false}>
                <View style={{ paddingTop: 20 }}>
                  {(mushroomData.isGem || isMushroomOfTheDay || isPremium) &&
                    (mushroomData as any).durability && (
                      <FlatProp
                        label="Durability"
                        value={formatTitleCase(
                          String((mushroomData as any).durability)
                        )}
                      />
                    )}
                  {(mushroomData.isGem || isMushroomOfTheDay || isPremium) &&
                    mushroomData.scratchResistance && (
                      <FlatProp
                        label="Scratch Resistance"
                        value={formatTitleCase(mushroomData.scratchResistance)}
                      />
                    )}
                  {(mushroomData.isGem || isMushroomOfTheDay || isPremium) &&
                    mushroomData.toughness &&
                    mushroomData.toughness !== "UNKNOWN" && (
                      <FlatProp
                        label="Toughness"
                        value={formatTitleCase(mushroomData.toughness)}
                      />
                    )}
                  {(mushroomData.isGem || isMushroomOfTheDay || isPremium) &&
                    (mushroomData as any).stability &&
                    typeof (mushroomData as any).stability === "object" && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={PROP_LABEL_FLAT}>Stability</Text>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            marginHorizontal: -6,
                          }}
                        >
                          {(
                            [
                              ["lightStability", "lightStability"],
                              ["heatStability", "heatStability"],
                              ["chemicalsStability", "chemicalsStability"],
                              [
                                "waterOrHumidityStability",
                                "waterOrHumidityStability",
                              ],
                              [
                                "thermalShockStability",
                                "thermalShockStability",
                              ],
                            ] as const
                          ).map(([key, label], index, arr) => {
                            const raw = (mushroomData as any).stability?.[key];
                            const value = Array.isArray(raw) ? raw[0] : raw;
                            const display =
                              typeof value === "string" && value.length > 0
                                ? formatStabilityValue(value)
                                : "Unknown";
                            return (
                              <View
                                key={key}
                                style={{
                                  width: "100%",
                                  paddingHorizontal: 6,
                                  paddingVertical: 4,
                                  marginBottom: MAINTENANCE_ROW_GAP,
                                  borderBottomWidth:
                                    index === arr.length - 1 ? 0 : 1,
                                  borderBottomColor:
                                    colors.border ?? SCREEN_COLORS.LIGHT.border,
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    alignSelf: "stretch",
                                  }}
                                >
                                  <Text
                                    style={[
                                      MAINTENANCE_ROW_LABEL,
                                      {
                                        marginBottom: 0,
                                        flex: 0.6,
                                        paddingRight: 8,
                                        textAlign: "left",
                                      },
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {formatStabilityLabel(label)}
                                  </Text>
                                  <Text
                                    style={[
                                      MAINTENANCE_ROW_VALUE,
                                      {
                                        marginBottom: 0,
                                        flex: 0.4,
                                        textAlign: "right",
                                      },
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {display}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}

                  {/* Gem Care — static labels, values from API (storage); rest No for now */}
                  {(mushroomData.isGem || isMushroomOfTheDay || isPremium) && (
                    <View style={{ marginTop: 20 }}>
                      <Text
                        style={[
                          PROP_LABEL_FLAT,
                          { marginBottom: 12, fontSize: 14 },
                        ]}
                      >
                        Gem Care Guide
                      </Text>
                      <View style={{ gap: 0 }}>
                        <View
                          style={{
                            paddingVertical: 6,
                            marginBottom: MAINTENANCE_ROW_GAP,
                            borderBottomWidth: 1,
                            borderBottomColor:
                              colors.border ?? SCREEN_COLORS.LIGHT.border,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              alignSelf: "stretch",
                            }}
                          >
                            <Text
                              style={[
                                MAINTENANCE_ROW_LABEL,
                                {
                                  marginBottom: 0,
                                  flex: 0.6,
                                  paddingRight: 8,
                                  textAlign: "left",
                                },
                              ]}
                              numberOfLines={2}
                            >
                              Separate storage
                            </Text>
                            <Text
                              style={[
                                MAINTENANCE_ROW_VALUE,
                                {
                                  marginBottom: 0,
                                  flex: 0.4,
                                  textAlign: "right",
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {mushroomData.storage?.storeSeprately === "YES"
                                ? "Yes"
                                : "No"}
                            </Text>
                          </View>
                          {mushroomData.storage?.reason &&
                            mushroomData.storage.reason.length > 0 &&
                            mushroomData.storage.reason.map((reason, index) => (
                              <Text
                                key={index}
                                style={[
                                  MAINTENANCE_ROW_VALUE,
                                  { marginLeft: 8 },
                                ]}
                              >
                                • {formatTitleCase(reason)}
                              </Text>
                            ))}
                        </View>
                        {(
                          [
                            ["Avoid direct sunlight", "lightStability"],
                            ["Temperature control", "heatStability"],
                            ["Humidity control", "waterOrHumidityStability"],
                          ] as const
                        ).map(([label, key], index, arr) => (
                          <View
                            key={key}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              alignSelf: "stretch",
                              paddingVertical: 6,
                              marginBottom: MAINTENANCE_ROW_GAP,
                              borderBottomWidth:
                                index === arr.length - 1 ? 0 : 1,
                              borderBottomColor:
                                colors.border ?? SCREEN_COLORS.LIGHT.border,
                            }}
                          >
                            <Text
                              style={[
                                MAINTENANCE_ROW_LABEL,
                                {
                                  marginBottom: 0,
                                  flex: 0.6,
                                  paddingRight: 8,
                                  textAlign: "left",
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {label}
                            </Text>
                            <Text
                              style={[
                                MAINTENANCE_ROW_VALUE,
                                {
                                  marginBottom: 0,
                                  flex: 0.4,
                                  textAlign: "right",
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {deriveGemCareFromStability(
                                (mushroomData as any).stability,
                                key
                              )}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Cleaning Tips — 60-40 width, 2-column layout */}
                  {(mushroomData.cleaningTips ||
                    (typeof mineral.cleaningTips === "object" &&
                      mineral.cleaningTips)) && (
                    <View style={{ marginTop: 20 }}>
                      <Text
                        style={[
                          PROP_LABEL_FLAT,
                          { marginBottom: 12, fontSize: 14 },
                        ]}
                      >
                        Cleaning Tips
                      </Text>
                      {!isPremium && !isMushroomOfTheDay && (
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            marginBottom: spacing[2],
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              navigation
                                .getParent()
                                ?.navigate("SubscriptionStack", {
                                  screen: "SubscriptionMain",
                                });
                            }}
                            style={{ padding: spacing[1] }}
                          />
                        </View>
                      )}
                      {typeof mushroomData.cleaningTips === "string" ? (
                        <InfoText text={mushroomData.cleaningTips} />
                      ) : (typeof mineral.cleaningTips === "object" &&
                          mineral.cleaningTips?.cleaningMethods) ||
                        (typeof mushroomData.cleaningTips === "object" &&
                          (mushroomData.cleaningTips as any)
                            ?.cleaningMethods) ? (
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            marginHorizontal: -6,
                          }}
                        >
                          {Object.entries(
                            mineral.cleaningTips?.cleaningMethods ??
                              (mushroomData.cleaningTips as any)
                                ?.cleaningMethods ??
                              {}
                          ).map(
                            ([method, details]: [string, any], index, arr) => (
                              <View
                                key={method}
                                style={{
                                  width: "100%",
                                  paddingHorizontal: 6,
                                  paddingVertical: 4,
                                  marginBottom: MAINTENANCE_ROW_GAP,
                                  borderBottomWidth:
                                    index === arr.length - 1 ? 0 : 1,
                                  borderBottomColor:
                                    colors.border ?? SCREEN_COLORS.LIGHT.border,
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    alignSelf: "stretch",
                                  }}
                                >
                                  <Text
                                    style={[
                                      MAINTENANCE_ROW_LABEL,
                                      {
                                        marginBottom: 0,
                                        flex: 0.6,
                                        paddingRight: 8,
                                        textAlign: "left",
                                      },
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {formatTitleCase(method)}
                                  </Text>
                                  <Text
                                    style={[
                                      MAINTENANCE_ROW_VALUE,
                                      {
                                        marginBottom: 0,
                                        flex: 0.4,
                                        textAlign: "right",
                                      },
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {details.status
                                      ? formatTitleCase(details.status)
                                      : "Unknown"}
                                  </Text>
                                </View>
                                {details.note && (
                                  <Text
                                    variant="body"
                                    size="small"
                                    color="textTertiary"
                                    style={{
                                      fontStyle: "italic",
                                      marginLeft: 0,
                                      marginTop: spacing[1],
                                    }}
                                    numberOfLines={2}
                                  >
                                    Note: {details.note}
                                  </Text>
                                )}
                              </View>
                            )
                          )}
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </SectionCard>
            </View>
          )}

        {/* Section: Pricing & Rarity (Gem only) — premium or Rock of the Day only */}
        {showSectionsAfterOverview &&
          (isPremium || isMushroomOfTheDay) &&
          mushroomData.isGem &&
          (mushroomData.avgPricePerCarat ||
            mushroomData.rarityScore !== undefined) && (
            <View
              ref={(ref) => {
                sectionRefs.current["overview-pricing"] = ref;
              }}
              style={sectionWrapperStyle}
            >
              <SectionCard title="Pricing & Rarity" showArrow={false}>
                <View style={{ gap: 4 }}>
                  {mushroomData.avgPricePerCarat && (
                    <InfoRow
                      labelColor={TEXT_SECONDARY}
                      valueColor={TEXT_SECONDARY}
                      rowPaddingVertical={ROW_PADDING_VERTICAL}
                      label="Average Price per Carat"
                      value={mushroomData.avgPricePerCarat}
                    />
                  )}
                  {mushroomData.rarityScore !== undefined && (
                    <InfoRow
                      labelColor={TEXT_SECONDARY}
                      valueColor={TEXT_SECONDARY}
                      rowPaddingVertical={ROW_PADDING_VERTICAL}
                      label="Rarity Score"
                      value={`${mushroomData.rarityScore}/10`}
                    />
                  )}
                </View>
              </SectionCard>
            </View>
          )}

        {/* Section: Gem Treatment (Gem only) — premium or Rock of the Day only */}
        {showSectionsAfterOverview &&
          (isPremium || isMushroomOfTheDay) &&
          mushroomData.isGem &&
          mushroomData.gemTreatment && (
            <View
              ref={(ref) => {
                sectionRefs.current["overview-treatment"] = ref;
              }}
              style={sectionWrapperStyle}
            >
              <SectionCard title="Gem Treatment" showArrow={false}>
                <View style={{ gap: 4 }}>
                  {mushroomData.gemTreatment.notes && (
                    <InfoText text={mushroomData.gemTreatment.notes} />
                  )}
                  {mushroomData.gemTreatment.common_treatments?.length > 0 &&
                    mushroomData.gemTreatment.common_treatments.map(
                      (treatment, index) => (
                        <Text
                          key={index}
                          variant="body"
                          size="small"
                          style={{ color: TEXT_SECONDARY, marginLeft: 8 }}
                        >
                          • {treatment}
                        </Text>
                      )
                    )}
                </View>
              </SectionCard>
            </View>
          )}

        {/* Section: Symbolism & Spirituality — premium or Rock of the Day only (free catalogue/collection/identification cannot see) */}
        {showSectionsAfterOverview &&
          (isPremium || isMushroomOfTheDay) &&
          (mushroomData.isGem || isMushroomOfTheDay || isPremium) && (
            <View
              ref={(ref) => {
                sectionRefs.current.symbolism = ref;
                sectionRefs.current.spirituality = ref;
              }}
              onLayout={(e) => {
                sectionYOffsets.current.spirituality = e.nativeEvent.layout.y;
              }}
              collapsable={false}
              style={[sectionWrapperStyle, { width: "100%" }]}
            >
              <SectionCard title="" showArrow={false}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    variant="title"
                    size="medium"
                    weight="semibold"
                    style={{
                      color: isDark
                        ? spec.PRIMARY_TEXT
                        : APP_COLORS.surfaceDark,
                    }}
                  >
                    Symbolism & Spirituality
                  </Text>
                  <Toggle
                    value={showSpirituality}
                    onToggle={setShowSpirituality}
                    trackColor={{ active: colors.primary }}
                  />
                </View>

                {/* Disclaimer */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    padding: 12,
                    borderRadius: Radius.md,
                    backgroundColor: APP_COLORS.errorBgAlpha,
                    marginBottom: 20,
                    gap: 8,
                  }}
                >
                  <AppImage
                    source={Images.informationCircle}
                    style={{ width: 16, height: 16, marginTop: 2 }}
                    resizeMode="contain"
                  />
                  <Text
                    variant="body"
                    size="small"
                    style={{
                      color: isDark
                        ? spec.DISCLAIMER_TEXT
                        : APP_COLORS.errorDark,
                      flex: 1,
                      lineHeight: 20,
                    }}
                  >
                    {METAPHYSICAL_DISCLAIMER}
                  </Text>
                </View>

                {/* Properties: label + value, no dividers, no inner cards */}
                {showSpirituality && (
                  <>
                    {mushroomData.healthRisks &&
                      mushroomData.healthRisks !== "NONE" && (
                        <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                          <Text style={PROP_LABEL_FLAT}>Health risks</Text>
                          <View
                            style={{
                              marginTop: LABEL_VALUE_GAP,
                              marginBottom: 20,
                            }}
                          >
                            <InfoText
                              text={formatTitleCase(mushroomData.healthRisks)}
                            />
                          </View>
                        </View>
                      )}

                    {mushroomData.amplification && (
                      <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                        <Text style={PROP_LABEL_FLAT}>Amplification</Text>
                        <View style={{ marginTop: LABEL_VALUE_GAP }}>
                          <InfoText text={mushroomData.amplification} />
                        </View>
                      </View>
                    )}

                    {mushroomData.revitalizeCharging && (
                      <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                        <Text style={PROP_LABEL_FLAT}>
                          Revitalize - Charging
                        </Text>
                        <View style={{ marginTop: LABEL_VALUE_GAP }}>
                          <InfoText
                            text={mushroomData.revitalizeCharging}
                            variant="primary"
                          />
                        </View>
                      </View>
                    )}

                    {mushroomData.revitalizeCleansing && (
                      <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                        <Text style={PROP_LABEL_FLAT}>
                          Revitalize - Cleansing
                        </Text>
                        <View style={{ marginTop: LABEL_VALUE_GAP }}>
                          <InfoText
                            text={mushroomData.revitalizeCleansing}
                            variant="primary"
                          />
                        </View>
                      </View>
                    )}

                    {mushroomData.worksWellWith &&
                      mushroomData.worksWellWith.length > 0 && (
                        <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                          <Text style={PROP_LABEL_FLAT}>Works Well With</Text>
                          <Text
                            style={[
                              PROP_VALUE_FLAT,
                              { marginTop: LABEL_VALUE_GAP },
                            ]}
                          >
                            {mushroomData.worksWellWith.join(", ")}
                          </Text>
                        </View>
                      )}

                    {mushroomData.metaphysicalQualities &&
                      mushroomData.metaphysicalQualities.length > 0 && (
                        <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                          <Text style={PROP_LABEL_FLAT}>
                            Metaphysical Qualities
                          </Text>
                          <Text
                            style={[
                              PROP_VALUE_FLAT,
                              { marginTop: LABEL_VALUE_GAP },
                            ]}
                          >
                            {mushroomData.metaphysicalQualities.join(", ")}
                          </Text>
                        </View>
                      )}

                    {mushroomData.chakra && mushroomData.chakra.length > 0 && (
                      <View style={{ marginBottom: PROP_BOTTOM_GAP }}>
                        <Text style={PROP_LABEL_FLAT}>Chakra</Text>
                        <Text
                          style={[
                            PROP_VALUE_FLAT,
                            { marginTop: LABEL_VALUE_GAP },
                          ]}
                        >
                          {mushroomData.chakra.join(", ")}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* Rate this match — inside Symbolism when identification + gem; non-gem uses standalone block below to avoid duplicate */}
                {isFromIdentification && mushroomData.isGem && (
                  <View
                    style={[
                      styles.rateMatchSection,
                      {
                        marginTop: 24,
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
                          style={[
                            styles.rateMatchSuccessTitle,
                            { color: TEXT_PRIMARY },
                          ]}
                        >
                          {
                            MODAL_STRINGS.identificationFeedback
                              .confirmationTitle
                          }
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text
                          variant="headline"
                          size="medium"
                          weight="bold"
                          style={[
                            styles.rateMatchTitle,
                            { color: TEXT_PRIMARY },
                          ]}
                        >
                          {MODAL_STRINGS.identificationFeedback.title}
                        </Text>
                        <Text
                          variant="body"
                          size="medium"
                          color="textSecondary"
                          style={[
                            styles.rateMatchSubtitle,
                            { color: TEXT_SECONDARY },
                          ]}
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
                            MODAL_STRINGS.identificationFeedback
                              .messagePlaceholder
                          }
                          placeholderTextColor={colors.textTertiary}
                          multiline
                          style={[
                            styles.rateMatchInput,
                            {
                              backgroundColor: isDark
                                ? APP_COLORS.surfaceDark
                                : APP_COLORS.modalTextOnPrimary,
                              borderColor: isDark
                                ? APP_COLORS.borderBrown
                                : SCREEN_COLORS.LIGHT.border,
                              color: TEXT_PRIMARY,
                              borderRadius: theme.radius.md,
                            },
                          ]}
                        />
                        <TouchableOpacity
                          style={[
                            styles.rateMatchSendBtn,
                            {
                              backgroundColor: isDark
                                ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
                                : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT,
                              borderWidth: 0,
                              borderRadius: theme.radius["2xl"],
                              opacity:
                                rateMatchRating !== null && !rateMatchSubmitting
                                  ? 1
                                  : 0.5,
                            },
                          ]}
                          onPress={async () => {
                            if (rateMatchRating === null || rateMatchSubmitting)
                              return;
                            setRateMatchSubmitting(true);
                            try {
                              await sendRatingFeedback({
                                domain: "Mushrooms",
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
                          disabled={
                            rateMatchRating === null || rateMatchSubmitting
                          }
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
                )}
              </SectionCard>
            </View>
          )}

        {renderIdentificationRateMatch()}
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
    : isMushroomOfTheDay &&
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
            {isIdentificationOverlay ? "Best matches" : "Mushroom details"}
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
                      isMushroomOfTheDay,
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

        {isMushroomData ? (
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
        ) : null}

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
                domain: "Mushrooms",
                message: `Mushroom: ${getDisplayName(mushroomData ?? {})}\n${message}`,
              });
              showToast("Report submitted successfully", "success");
            } catch (error) {
              // Error already logged by service
              showToast("Failed to submit report. Please try again.", "error");
            }
          }}
          plantName={getDisplayName(mushroomData ?? {})}
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
                  if (source === "catalogue") {
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
                {
                  collectionIds: targetCollectionId,
                  isIdentified: false,
                  isWishlisted: false,
                }
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
                    { isIdentified: true, isWishlisted: false }
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
                scheduleNavigateToAddedCollection(
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
                scheduleNavigateToAddedCollection(
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
                scheduleNavigateToAddedCollection(
                  collectionId,
                  addedDisplayName
                );
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
                {
                  collectionIds: collectionId,
                  isIdentified: false,
                  isWishlisted: false,
                }
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
              scheduleNavigateToAddedCollection(
                collectionId,
                addedDisplayNameNew
              );
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
                    {isMushroomData ? (
                      <Text
                        style={{
                          ...NAME_HEADING,
                          color: isDark ? TEXT_PRIMARY : NAME_HEADING.color,
                        }}
                      >
                        {formatTitleCase(getDisplayName(mushroomData))}
                        {getMushroomDisplayScientificFromFields(mushroomData) ? (
                          <Text
                            style={{
                              fontFamily: FONTS.regular,
                              fontStyle: "italic",
                              fontSize: NAME_HEADING.fontSize,
                              lineHeight: NAME_HEADING.lineHeight,
                              color: isDark ? TEXT_PRIMARY : NAME_HEADING.color,
                            }}
                          >
                            {" "}
                            (
                            {formatTitleCase(
                              getMushroomDisplayScientificFromFields(
                                mushroomData
                              )!
                            )}
                            )
                          </Text>
                        ) : null}
                      </Text>
                    ) : (
                      <>
                        <Text
                          style={{
                            ...NAME_HEADING,
                            color: isDark ? TEXT_PRIMARY : NAME_HEADING.color,
                          }}
                        >
                          {formatTitleCase(getDisplayName(mushroomData))}
                        </Text>
                        {getMushroomDisplayScientificFromFields(mushroomData) ? (
                          <Text style={[styles.aiSynonym, SYNONYM_AND_UNIT]}>
                            {formatTitleCase(
                              getMushroomDisplayScientificFromFields(
                                mushroomData
                              )!
                            )}
                          </Text>
                        ) : null}
                      </>
                    )}
                    {mushroomData.avgPricePerCarat ? (
                      <View style={styles.aiPriceRow}>
                        <Text
                          style={{
                            fontSize: 26,
                            fontFamily: FONTS.bold,
                            color: isDark
                              ? colors.primaryCTA
                              : APP_COLORS.surfaceDark,
                          }}
                        >
                          {mushroomData.avgPricePerCarat}
                        </Text>
                        <Text style={[styles.aiUnit, SYNONYM_AND_UNIT]}>
                          /Carat
                        </Text>
                      </View>
                    ) : null}
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
                    {isMushroomData && (
                      <>
                        <MushroomStatusChips
                          edibility={(mushroomData as any).edibility}
                          toxicitySeverity={
                            (mushroomData as any).toxicitySeverity
                          }
                          psychoactive={(mushroomData as any).psychoactive}
                        />
                        <MushroomWarningBanner
                          edibility={(mushroomData as any).edibility}
                          toxicitySeverity={
                            (mushroomData as any).toxicitySeverity
                          }
                          psychoactive={(mushroomData as any).psychoactive}
                          warningBanner={(mushroomData as any).warningBanner}
                          isDark={isDark}
                        />
                      </>
                    )}
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
                        onPress={() => {
                          setActiveTab(tab.id);
                          if (tab.id === "overview") {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({
                                y: 0,
                                animated: true,
                              });
                            }, 0);
                          }
                        }}
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
                        {(() => {
                          const mushroomPremiumTabs = [
                            "safety",
                            "similar",
                            "morphology",
                            "habitat",
                          ];
                          const showLock =
                            !isPremium &&
                            !isMushroomOfTheDay &&
                            tab.id !== "overview" &&
                            (!isMushroomData ||
                              mushroomPremiumTabs.includes(tab.id));
                          return showLock ? (
                            <AppImage
                              source={Images.mushroomGoPro}
                              style={styles.aiTabBadge}
                              resizeMode="contain"
                            />
                          ) : null;
                        })()}
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
        {isMushroomOfTheDay &&
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
                    return `Show more mushrooms (${viewingResult}/${totalResults})`;
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
        limitType="mushroomOfDay"
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
