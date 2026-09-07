/**
 * AppSheet – single dynamic component for all bottom sheets and popups.
 * One shared chrome (backdrop, sheet panel, background, handle, close); content by type.
 * Add new types in SHEET_CONFIG and renderContentForType. No separate modal per flow.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon, type CloseIconVariant } from "@/components/shared/CloseIcon";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, ImageSourcePropType, Platform, Modal as RNModal, ScrollView, TextInput, Keyboard, KeyboardAvoidingView, ActivityIndicator, ViewStyle } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button, Icon } from "../../atoms";
import { Images } from "../../assets";
import {
  OVERLAY_COLORS,
  SUBSCRIPTION_COLORS,
} from "../../constants/colorConstants";
import { useToast } from "../../hooks";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  MODAL_STRINGS,
} from "../../config/strings/modals.strings";
import { COLLECTION_STRINGS } from "../../config/strings/collection.strings";
import { formatString, getOrdinal } from "../../config/strings/utils";
import { commonFeedStyles } from "../../features/feed/styles/commonStyles";
import {
  getCarouselItemForLimitType,
  type LimitType,
  SUBSCRIPTION_TEXTS,
} from "../../config/subscription.config";
import { UPGRADE_MODAL } from "../../constants/modals.constants";
import { getSubscriptionCtaLabel } from "../../features/post-auth-onboarding/utils/planDisplay";
import { useSubscriptionPlansWithPrices } from "../../features/subscription/hooks/useSubscriptionPlansWithPrices";
import { getBottomSheetChromeStyle } from "../../design-system/modalTokens";
import { collectionService } from "../../services/collection/collection.service";
import { mushroomSpecimenService } from "../../services/specimen/mushroomSpecimen.service";
import type { FeedConfig } from "../../features/feed/config/feedConfig.types";
import type { Collection } from "../../services/api/features/core.api.types";
import {
  ADD_TO_COLLECTION_IDS,
  COLLECTION_LIMITS,
  FREE_SPECIMEN_LIMIT,
  PAGINATION,
  isUserCreatedCollectionName,
} from "../../constants/appConstants";
import { useStrings } from "../../hooks/useStrings";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

import { APP_COLORS, MUSHROOM_COLORS } from "../../config/colors";
import { dismissKeyboardSmooth } from "../../utils/dismissKeyboardSmooth";
import {
  requestNotificationPermission,
  openDeviceSettings,
  requestLocationPermission,
} from "../../services/permissions";
import { getLocationPermissionEntryAction } from "../../services/permissions/locationPermissionFlow.service";
import {
  markNotificationDismissed,
  markNotificationDenied,
  getNotificationDenialCount,
  getNotificationSettingsThreshold,
} from "../../services/session";
import {
  analyticsService,
  EVENTS,
} from "../../services/analytics/analytics.service";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import {
  logCollectionCreateApiResult,
  shouldShowCollectionLimitPaywall,
} from "../../services/session/collectionLimit.service";
import {
  getApiErrorReason,
  getApiErrorStatus,
  isPaywallOrLimitError,
} from "../../services/api/errors";
import { useDiscountOfferCountdown } from "../../features/subscription/utils/discountOffer";
import { formatCountdownSegment } from "../../utils";
import { PostAuthSubscriptionDisclosure } from "../../features/post-auth-onboarding/components/PostAuthSubscriptionDisclosure";
import { getPostAuthOnboardingColors } from "../../features/post-auth-onboarding/constants";
import { usePostAuthOnboardingIsDark } from "../../features/post-auth-onboarding/utils/theme";
import { COMPARISON_TABLE_COLORS } from "../../constants/subscriptionColors";
import { FREE_VS_PREMIUM_COMPARISON } from "../../data/subscription";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  require("react-native").Dimensions.get("window");

const SPRING_CONFIG = { damping: 80, stiffness: 200 };

const TOP_ROW_HEIGHT = 44;
const HEADER_ROW_HEIGHT = 44;
const CONTENT_PADDING_V = 16;
const MAX_SHEET_RATIO = 0.9;

const isReactComponent = (v: unknown): v is React.ComponentType<any> =>
  typeof v === "function" ||
  (typeof v === "object" && v !== null && "$$typeof" in v);

// ---- Type registry: one place for all sheet types ----
export type AppSheetType =
  | "communityRules"
  | "report"
  | "limitReached"
  | "createCollection"
  | "rateUs"
  | "feedback"
  | "notificationPermission"
  | "locationPermission"
  | "identificationMilestone"
  | "subscriptionDiscount"
  | "addToCollection"
  | "addToAnotherCollection"
  | "moveToCollection"
  | "renameCollection"
  | "custom";

type SheetPayload<K extends keyof AppSheetPayload> = NonNullable<
  AppSheetPayload[K]
>;

export type AppSheetPayload = {
  communityRules?: { config: FeedConfig; onAgree: () => void };
  report?: {
    title?: string;
    description?: string;
    onSubmit: (message: string) => void;
  };
  limitReached?: {
    limitType: LimitType;
    use70Discount?: boolean;
    onUpgrade: () => void;
    height?: number | string;
  };
  createCollection?: {
    onCreated: (collection: Collection) => void;
    onLimitReached?: () => void;
  };
  rateUs?: {
    onLowRating: (rating: number) => void;
    onHighRating: (rating: number) => void;
  };
  feedback?: {
    rating?: number;
    onSubmit: (data: {
      name: string;
      email: string;
      feedback: string;
      rating?: number;
    }) => void;
  };
  notificationPermission?: {
    onGranted?: () => void;
  };
  locationPermission?: {
    onRequestEnable?: () => void;
    onSuccess?: () => void;
  };
  identificationMilestone?: {
    count: number;
    onBackToHome: () => void;
  };
  subscriptionDiscount?: {
    percentage?: number;
    onSubscribe: () => void;
  };
  addToCollection?: {
    mushroomId: string;
    onConfirm: (collectionId: string) => void | Promise<void>;
    onRequestCreateNew?: () => void;
    refreshTrigger?: unknown;
    initialSelectedCollectionId?: string;
    onShowUpgrade?: () => void;
  };
  addToAnotherCollection?: {
    excludeCollectionIds?: string[];
    onConfirm: (collectionId: string) => void | Promise<void>;
    onRequestCreateNew?: () => void;
    refreshTrigger?: unknown;
    initialSelectedCollectionId?: string;
  };
  moveToCollection?: {
    excludeCollectionIds?: string[];
    onConfirm: (collectionId: string) => void | Promise<void>;
    onRequestCreateNew?: () => void;
    refreshTrigger?: unknown;
    initialSelectedCollectionId?: string;
  };
  renameCollection?: {
    collectionId: string;
    initialName: string;
    onRenamed: (name: string) => void;
  };
  custom?: {
    children: React.ReactNode;
    height?: number | string;
    use50PercentBackground?: boolean;
    title?: string;
    showDefaultHeader?: boolean;
    /** When set, sheet panel uses this background (e.g. subscription: #111111 / #FFFFFF). */
    backgroundColor?: string;
    /** When true, content is not scrollable (sticky layout). */
    disableScroll?: boolean;
    /** Override default backdrop tap-to-dismiss (default true for custom). */
    enableBackdropDismiss?: boolean;
    /** When false, disables drag-to-dismiss (needed for TextInput sheets). Default true. */
    enablePanDismiss?: boolean;
    /** Lift sheet bottom edge above the keyboard (px). Used by location search sheet. */
    keyboardBottomInset?: number;
  };
};

type SheetConfig = {
  height: number | string;
  use50PercentBackground: boolean;
  backgroundVariant?: "50" | "70";
  enableBackdropDismiss: boolean;
  showDefaultHeader: boolean;
  title?: string;
};

/** Sheet heights increased by 15% (e.g. 40% -> 46%), capped at 100%. */
const SHEET_CONFIG: Record<AppSheetType, SheetConfig> = {
  communityRules: {
    height: "100%",
    use50PercentBackground: false,
    enableBackdropDismiss: false,
    showDefaultHeader: false,
  },
  report: {
    height: "69%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: true,
    title: MODAL_STRINGS.modals.reportPost.title,
  },
  limitReached: {
    height: "69%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
  createCollection: {
    height: "42%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: true,
    title: "Create New Collection",
  },
  rateUs: {
    height: "52%",
    use50PercentBackground: true,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
  notificationPermission: {
    height: "62%",
    use50PercentBackground: true,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
  locationPermission: {
    height: "62%",
    use50PercentBackground: true,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
  identificationMilestone: {
    height: "55%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
  subscriptionDiscount: {
    height: "90%",
    use50PercentBackground: true,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
  feedback: {
    height: "68%",
    use50PercentBackground: true,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
  addToCollection: {
    height: "58%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: true,
    title: COLLECTION_STRINGS.addToCollection.title,
  },
  addToAnotherCollection: {
    height: "58%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: true,
    title: COLLECTION_STRINGS.addToAnotherCollection.title,
  },
  moveToCollection: {
    height: "58%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: true,
    title: COLLECTION_STRINGS.moveToCollection.title,
  },
  renameCollection: {
    height: "40%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: true,
    title: "Rename collection",
  },
  custom: {
    height: "58%",
    use50PercentBackground: false,
    enableBackdropDismiss: true,
    showDefaultHeader: false,
  },
};

/** Feedback sheet height — dark mode slightly shorter than light (68% → 62%). */
function getFeedbackSheetHeight(isDark: boolean): string {
  return isDark ? "62%" : "68%";
}

function isRateOrFeedbackSheet(sheetType: AppSheetType): boolean {
  return sheetType === "rateUs" || sheetType === "feedback";
}

/** Per–limit-type heights for the limit-reached (upgrade) bottom sheet. */
const LIMIT_REACHED_HEIGHT_BY_TYPE: Record<LimitType, string> = {
  aiChat: "88%",
  details: "83%",
  collection: "69%",
  collectionAlt: "74%",
  identification: "60%",
  soundIdentification: "60%",
  feed: "64%",
  birdOfDay: "70%",
  soundGallery: "64%",
};

/** Upgrade/limit-reached bottom sheet — full-bleed popUp/mushroom art only (never inline banners). */
function getLimitReachedSheetBackground(
  limitType: LimitType,
  isDark: boolean
): ImageSourcePropType | null {
  const item = getCarouselItemForLimitType(limitType);
  const imageKey = isDark ? item.imageDark : item.imageLight;
  const images = Images as Record<string, ImageSourcePropType | undefined>;
  return (
    images[imageKey] ??
    images.subscriptionPopupIconIdentification ??
    images.collectionBgLight ??
    null
  );
}

function getSubscriptionDiscountSheetBackground(
  isDark: boolean
): ImageSourcePropType {
  return isDark ? Images.popUp70Dark : Images.popUp70Light;
}

/** Sheet uses one combined art asset (bg + illustration) as the full surface. */
function usesFullBleedPopupBackground(sheetType: AppSheetType): boolean {
  return (
    sheetType === "subscriptionDiscount" ||
    sheetType === "limitReached" ||
    sheetType === "identificationMilestone" ||
    sheetType === "notificationPermission" ||
    sheetType === "locationPermission"
  );
}

function usesSubscriptionSheetCloseChrome(sheetType: AppSheetType): boolean {
  return sheetType === "limitReached" || sheetType === "subscriptionDiscount";
}

/** Upgrade + milestone + permission sheets use one full-bleed art asset as the sheet surface. */
function usesDedicatedSheetArtBackground(sheetType: AppSheetType): boolean {
  return (
    sheetType === "limitReached" ||
    sheetType === "identificationMilestone" ||
    sheetType === "notificationPermission" ||
    sheetType === "locationPermission"
  );
}

function usesPermissionSheetBackground(sheetType: AppSheetType): boolean {
  return (
    sheetType === "notificationPermission" || sheetType === "locationPermission"
  );
}

/** Pop-up sheets with full-bleed bg: safe-area bottom inset lives in content, not sheet chrome. */
function usesPopupSheetSafeAreaInContent(sheetType: AppSheetType): boolean {
  return (
    sheetType === "limitReached" ||
    sheetType === "identificationMilestone" ||
    sheetType === "rateUs" ||
    sheetType === "feedback" ||
    sheetType === "notificationPermission" ||
    sheetType === "locationPermission" ||
    sheetType === "subscriptionDiscount"
  );
}

/** Pin sheet art to the top so cover-cropping does not clip the header illustration. */
function getBitmapSheetBackgroundStyle(
  sheetType: AppSheetType,
  source: ImageSourcePropType,
  sheetHeight: number
): import("react-native").ImageStyle {
  const base = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
  };
  if (sheetType === "feedback") {
    const resolved = Image.resolveAssetSource(source as number);
    const ratio =
      resolved?.width && resolved?.height
        ? resolved.height / resolved.width
        : 0;
    const naturalHeight = ratio > 0 ? SCREEN_WIDTH * ratio : sheetHeight;
    return { ...base, height: Math.max(sheetHeight, naturalHeight) };
  }
  return { ...base, height: sheetHeight };
}

function getSheetSurfaceBackgroundColor(
  sheetType: AppSheetType,
  theme: ReturnType<typeof useTheme>,
  customSheetBg: string | undefined,
  useBg: boolean,
  isDark: boolean
): string {
  if (customSheetBg) return customSheetBg;
  // Permission / upgrade sheets: solid popup base under the art (never transparent).
  if (
    usesFullBleedPopupBackground(sheetType) ||
    usesPermissionSheetBackground(sheetType) ||
    useBg
  ) {
    return isDark
      ? SUBSCRIPTION_COLORS.POPUP_BG_DARK
      : SUBSCRIPTION_COLORS.POPUP_BG_LIGHT;
  }
  return theme.colors.cardBackground;
}

function getSubscriptionSheetCloseButtonStyle(
  sheetType: AppSheetType,
  isDark: boolean
): ViewStyle | undefined {
  if (!usesSubscriptionSheetCloseChrome(sheetType)) {
    return undefined;
  }
  return {
    backgroundColor: isDark
      ? APP_COLORS.surfaceDarkAlt
      : APP_COLORS.surfaceAuthLight,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  };
}

function getPermissionSheetBackground(
  kind: "notification" | "location",
  isDark: boolean
): ImageSourcePropType {
  if (kind === "notification") {
    return isDark
      ? Images.popupNotificationPermissionBgDark
      : Images.popupNotificationPermissionBg;
  }
  return isDark
    ? Images.popupLocationPermissionBgDark
    : Images.popupLocationPermissionBg;
}

function getIdentificationMilestoneSheetBackground(
  isDark: boolean
): ImageSourcePropType {
  return isDark
    ? Images.popupCongratulationsBgDark
    : Images.popupCongratulationsBg;
}

function getSheetCloseIconSize(sheetType: AppSheetType): number {
  if (
    sheetType === "identificationMilestone" ||
    sheetType === "rateUs" ||
    sheetType === "feedback"
  ) {
    return 32;
  }
  if (
    sheetType === "limitReached" ||
    sheetType === "notificationPermission" ||
    sheetType === "locationPermission"
  ) {
    return 28;
  }
  return 24;
}

function getSheetCloseIconVariant(sheetType: AppSheetType): CloseIconVariant {
  if (
    sheetType === "limitReached" ||
    sheetType === "subscriptionDiscount"
  ) {
    return "plain";
  }
  return "sheet";
}

function isCollectionLimitType(limitType: LimitType): boolean {
  return limitType === "collection" || limitType === "collectionAlt";
}

function usesCompactLimitTitleStyle(limitType: LimitType): boolean {
  return (
    isCollectionLimitType(limitType) ||
    limitType === "identification" ||
    limitType === "soundIdentification" ||
    limitType === "birdOfDay"
  );
}

export interface AppSheetProps {
  visible: boolean;
  onClose: () => void;
  type: AppSheetType;
  payload: AppSheetPayload[AppSheetType];
}

export const AppSheet: React.FC<AppSheetProps> = ({
  visible,
  onClose,
  type,
  payload,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();
  const config = SHEET_CONFIG[type];
  const { showToast } = useToast();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible || type !== "feedback") {
      setKeyboardHeight(0);
      return;
    }
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible, type]);

  const effectiveConfig = useMemo(() => {
    if (type === "limitReached" && payload && "limitType" in payload) {
      const p = payload as SheetPayload<"limitReached">;
      const height =
        p.height != null ? p.height : LIMIT_REACHED_HEIGHT_BY_TYPE[p.limitType];
      return { ...config, height };
    }
    if (type === "feedback" && isDark) {
      return { ...config, height: getFeedbackSheetHeight(true) };
    }
    if (type !== "custom" || !payload || !("children" in payload))
      return config;
    const p = payload as SheetPayload<"custom">;
    return {
      ...config,
      ...(p.height != null && { height: p.height }),
      ...(p.use50PercentBackground != null && {
        use50PercentBackground: p.use50PercentBackground,
      }),
      ...(p.showDefaultHeader != null && {
        showDefaultHeader: p.showDefaultHeader,
      }),
      ...(p.title != null && { title: p.title }),
      ...(p.enableBackdropDismiss != null && {
        enableBackdropDismiss: p.enableBackdropDismiss,
      }),
    };
  }, [type, payload, config, isDark]);

  /** Sheet types that must not scroll (fixed content). Forms use KeyboardAvoidingView instead. */
  const nonScrollableTypes: AppSheetType[] = [
    "rateUs",
    "feedback",
    "notificationPermission",
    "locationPermission",
    "identificationMilestone",
    "subscriptionDiscount",
    "limitReached",
    "report",
    "createCollection",
    "renameCollection",
    "addToCollection",
    "addToAnotherCollection",
    "moveToCollection",
    "communityRules",
  ];
  const shouldDisableScroll =
    nonScrollableTypes.includes(type) ||
    (type === "custom" &&
      payload != null &&
      "disableScroll" in payload &&
      (payload as AppSheetPayload["custom"])?.disableScroll === true);

  const isCollectionFormSheet =
    type === "createCollection" || type === "renameCollection";
  const isCollectionPickerSheet =
    type === "addToCollection" ||
    type === "addToAnotherCollection" ||
    type === "moveToCollection";
  const isFormLikeCustomSheet =
    type === "custom" &&
    payload != null &&
    "children" in payload &&
    Boolean((payload as SheetPayload<"custom">).showDefaultHeader) &&
    Boolean((payload as SheetPayload<"custom">).disableScroll);
  const usesTitleCloseHeaderRow =
    isCollectionFormSheet ||
    isCollectionPickerSheet ||
    isFormLikeCustomSheet;
  const hideStandaloneCloseRow =
    effectiveConfig.showDefaultHeader && usesTitleCloseHeaderRow;

  const customSheetBg =
    type === "custom" && payload && "backgroundColor" in payload
      ? (payload as SheetPayload<"custom">).backgroundColor
      : undefined;
  const customKeyboardBottomInset =
    type === "custom" && payload && "keyboardBottomInset" in payload
      ? Math.max(0, (payload as SheetPayload<"custom">).keyboardBottomInset ?? 0)
      : 0;
  const useBg = effectiveConfig.use50PercentBackground;
  const variant =
    type === "limitReached" &&
    payload &&
    "use70Discount" in payload &&
    (payload as { use70Discount?: boolean }).use70Discount
      ? "70"
      : config.backgroundVariant ?? "50";
  const limitReachedType =
    type === "limitReached" && payload && "limitType" in payload
      ? (payload as { limitType: LimitType }).limitType
      : null;
  const limitReachedBg =
    limitReachedType != null
      ? getLimitReachedSheetBackground(limitReachedType, isDark)
      : null;
  const milestoneSheetBg =
    type === "identificationMilestone"
      ? getIdentificationMilestoneSheetBackground(isDark)
      : null;
  const permissionSheetBg =
    type === "notificationPermission"
      ? getPermissionSheetBackground("notification", isDark)
      : type === "locationPermission"
      ? getPermissionSheetBackground("location", isDark)
      : null;
  /** Rate Us light: dedicated PNG. Dark Rate Us + Feedback share pop_up.webp. */
  const rateUsLightBg =
    type === "rateUs" && !isDark ? Images.rateUsSheetBgLight : null;
  const rateUsFeedbackDarkBg =
    (type === "rateUs" || type === "feedback") && isDark
      ? Images.rateUsSheetBgDark
      : null;
  const subscriptionDiscountBg =
    type === "subscriptionDiscount"
      ? getSubscriptionDiscountSheetBackground(isDark)
      : null;
  const bgSource = limitReachedBg
    ? limitReachedBg
    : milestoneSheetBg
    ? milestoneSheetBg
    : subscriptionDiscountBg
    ? subscriptionDiscountBg
    : permissionSheetBg
    ? permissionSheetBg
    : rateUsFeedbackDarkBg
    ? rateUsFeedbackDarkBg
    : rateUsLightBg
    ? rateUsLightBg
    : useBg
    ? variant === "70"
      ? isDark
        ? Images.popUp70Dark
        : Images.popUp70Light
      : isDark
      ? Images.popUp50Dark
      : Images.popUp50Light
    : null;
  /**
   * Limit-reached / milestone art is one full-bleed asset (like upgrade modals).
   * Generic popUp50/70 backgrounds use use50PercentBackground instead.
   */
  const showSheetBackground = usesDedicatedSheetArtBackground(type)
    ? !!(limitReachedBg ?? milestoneSheetBg ?? permissionSheetBg)
    : !!(useBg && bgSource) || type === "subscriptionDiscount";
  const isSvg = bgSource ? isReactComponent(bgSource) : false;
  const SvgBg = isSvg
    ? (bgSource as React.ComponentType<{
        width: string;
        height: string;
        preserveAspectRatio: string;
      }>)
    : null;

  const usesBitmapSheetArt =
    showSheetBackground && !!bgSource && !isSvg;

  const configBasedHeight = useMemo(() => {
    const h = effectiveConfig.height;
    if (typeof h === "number")
      return Math.min(h, SCREEN_HEIGHT * MAX_SHEET_RATIO);
    const pct = parseFloat(String(h)) / 100;
    return SCREEN_HEIGHT * pct;
  }, [effectiveConfig.height]);

  const [measuredContentHeight, setMeasuredContentHeight] = useState(0);
  useEffect(() => {
    if (!visible) setMeasuredContentHeight(0);
  }, [visible]);

  const chromeHeight =
    TOP_ROW_HEIGHT +
    (effectiveConfig.showDefaultHeader ? HEADER_ROW_HEIGHT : 0) +
    CONTENT_PADDING_V * 2 +
    insets.bottom;
  const maxContentHeight = SCREEN_HEIGHT * MAX_SHEET_RATIO - chromeHeight;
  const MIN_SHEET_HEIGHT = 280;
  const sheetHeight = useMemo(() => {
    if (
      type === "custom" ||
      type === "createCollection" ||
      type === "renameCollection" ||
      type === "rateUs" ||
      type === "feedback" ||
      type === "notificationPermission" ||
      type === "locationPermission" ||
      type === "identificationMilestone" ||
      type === "subscriptionDiscount" ||
      type === "limitReached" ||
      type === "report" ||
      type === "addToCollection" ||
      type === "addToAnotherCollection" ||
      type === "moveToCollection"
    )
      return configBasedHeight;
    if (measuredContentHeight <= 0) return configBasedHeight;
    const contentH = Math.min(
      measuredContentHeight,
      Math.max(maxContentHeight, 0)
    );
    const total = chromeHeight + contentH;
    return Math.max(
      MIN_SHEET_HEIGHT,
      Math.min(total, SCREEN_HEIGHT * MAX_SHEET_RATIO)
    );
  }, [
    type,
    payload,
    measuredContentHeight,
    configBasedHeight,
    chromeHeight,
    maxContentHeight,
  ]);

  const resolvedSheetHeight = useMemo(() => {
    if (type !== "feedback" || keyboardHeight <= 0) return sheetHeight;
    const available = Math.max(
      MIN_SHEET_HEIGHT,
      SCREEN_HEIGHT - keyboardHeight
    );
    return Math.min(sheetHeight, available);
  }, [type, sheetHeight, keyboardHeight]);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () =>
      runOnJS(onClose)()
    );
  }, [onClose]);

  /** Forms with TextInputs: pan steals the first tap and can dismiss while typing. */
  const enablePanDismiss = useMemo(() => {
    if (type === "createCollection" || type === "renameCollection" || type === "feedback") {
      return false;
    }
    if (type === "custom" && payload != null && "children" in payload) {
      const customPayload = payload as SheetPayload<"custom">;
      if (customPayload.enablePanDismiss === false) return false;
      if (customPayload.disableScroll === true) return false;
    }
    return true;
  }, [type, payload]);

  const panGesture = Gesture.Pan()
    .enabled(enablePanDismiss)
    .activeOffsetY([-12, 12])
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((e) => {
      const newY = context.value.y + e.translationY;
      if (newY >= 0) translateY.value = newY;
    })
    .onEnd((e) => {
      const shouldClose =
        e.translationY > resolvedSheetHeight * 0.3 || e.velocityY > 500;
      if (shouldClose && effectiveConfig.enableBackdropDismiss)
        runOnJS(closeSheet)();
      else translateY.value = withSpring(0, SPRING_CONFIG);
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  React.useLayoutEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withTiming(0, { duration: 280 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 });
    }
  }, [visible, translateY]);

  const handleBackdropPress = () => {
    if (effectiveConfig.enableBackdropDismiss) closeSheet();
  };

  const content = useMemo(
    () =>
      renderContentForType(type, payload, {
        theme,
        isDark,
        onClose: closeSheet,
        showToast,
        insets,
      }),
    [type, payload, theme, isDark, showToast, insets]
  );

  if (!visible) return null;

  const communityRulesConfig =
    type === "communityRules" &&
    payload &&
    "config" in payload
      ? (payload as SheetPayload<"communityRules">).config
      : null;

  /** Close sits top-right for chrome-only headers; upgrade, congratulations, Rate Us, Feedback use top-left. */
  const alignCloseButtonRight =
    !effectiveConfig.showDefaultHeader &&
    type !== "communityRules" &&
    type !== "limitReached" &&
    type !== "identificationMilestone" &&
    type !== "rateUs" &&
    type !== "feedback";
  const isLimitReachedUpgradeClose = type === "limitReached";

  const sheetCloseButtonStyles = [
    styles.sheetCloseButton,
    alignCloseButtonRight && styles.sheetCloseButtonRight,
    getSubscriptionSheetCloseButtonStyle(type, isDark),
    type === "identificationMilestone" && styles.milestoneCloseButton,
    type === "rateUs" && styles.rateUsCloseButton,
    type === "feedback" && styles.feedbackCloseButton,
    isLimitReachedUpgradeClose && styles.limitReachedCloseButton,
  ];
  const sheetCloseIconSize = getSheetCloseIconSize(type);
  const sheetCloseIconStyle = [
    styles.closeIcon,
    sheetCloseIconSize >= 32 && styles.closeIconLargest,
    sheetCloseIconSize === 28 && styles.closeIconLarger,
    isLimitReachedUpgradeClose && styles.limitReachedCloseIcon,
  ];

  const isRateFeedbackSheet = isRateOrFeedbackSheet(type);

  /** When scroll is disabled, wrap header + content in one fixed container so nothing scrolls. */
  const fixedBody = (
    <View style={styles.sheetBodyFixed}>
      {type === "communityRules" && communityRulesConfig ? (
        <View
          style={[
            styles.communityRulesNavBar,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              paddingTop: Math.max(insets.top, 8),
            },
          ]}
        >
          <View style={styles.communityRulesNavRow}>
            <TouchableOpacity
              onPress={closeSheet}
              style={[
                styles.communityRulesCloseBtn,
                { backgroundColor: theme.colors.surfaceSecondary },
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseIcon
                isDark={isDark}
                variant={getSheetCloseIconVariant(type)}
                style={styles.communityRulesCloseIcon}
              />
            </TouchableOpacity>
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={[
                styles.communityRulesNavTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              {communityRulesConfig.communityRules.title}
            </Text>
            <View style={styles.communityRulesCloseSpacer} />
          </View>
        </View>
      ) : !hideStandaloneCloseRow && !effectiveConfig.showDefaultHeader ? (
        <View
          style={[
            styles.topRow,
            alignCloseButtonRight && styles.topRowCloseRight,
            isLimitReachedUpgradeClose && styles.limitReachedTopRow,
            type === "rateUs" && styles.rateUsTopRow,
            {
              // Bottom sheets sit above the home indicator — do not add status-bar
              // top inset (that pushed the X too low). Full-screen communityRules
              // still needs a small safe-area offset. Form sheets (disableScroll)
              // also skip status-bar inset so the keyboard has room for inputs.
              paddingTop:
                type === "limitReached"
                  ? 0
                  : type === "rateUs"
                  ? 16
                  : type === "custom"
                  ? shouldDisableScroll
                    ? 8
                    : insets.top + 2
                  : type === "identificationMilestone"
                  ? 6
                  : 10,
              paddingBottom: type === "identificationMilestone" ? 0 : 2,
              paddingHorizontal:
                type === "communityRules" ? spacing[4] : undefined,
            },
          ]}
        >
          <TouchableOpacity
            onPress={closeSheet}
            style={sheetCloseButtonStyles}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon
              isDark={isDark}
              size={sheetCloseIconSize}
              variant={getSheetCloseIconVariant(type)}
              style={sheetCloseIconStyle}
            />
          </TouchableOpacity>
        </View>
      ) : null}
      {effectiveConfig.showDefaultHeader && (
        <View
          style={[
            styles.header,
            usesTitleCloseHeaderRow && styles.headerCreateCollection,
          ]}
        >
          <Text
            variant="title"
            size={usesTitleCloseHeaderRow ? "medium" : "large"}
            weight="semibold"
            style={[
              styles.title,
              { color: theme.colors.textPrimary },
              usesTitleCloseHeaderRow && styles.titleCreateCollection,
            ]}
          >
            {effectiveConfig.title}
          </Text>
          <TouchableOpacity
            onPress={closeSheet}
            style={[
              styles.closeButton,
              usesTitleCloseHeaderRow && styles.closeButtonCreateCollection,
            ]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon
              isDark={isDark}
              variant={getSheetCloseIconVariant(type)}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        </View>
      )}
      {isRateFeedbackSheet ? (
        <ScrollView
          style={[styles.contentScroll, { flex: 1 }]}
          contentContainerStyle={[
            styles.contentScrollContent,
            styles.permissionContentHost,
            {
              flexGrow: 1,
              paddingBottom: Math.max(insets.bottom, 12),
            },
            type === "rateUs" && styles.rateUsScrollContent,
            type === "feedback" && styles.feedbackScrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={Platform.OS === "android"}
        >
          {content}
        </ScrollView>
      ) : (
      <View
        style={[
          styles.contentScroll,
          styles.contentScrollContent,
          styles.contentNoScroll,
          {
            paddingBottom:
              usesPopupSheetSafeAreaInContent(type) || type === "communityRules"
                ? 0
                : isCollectionFormSheet || shouldDisableScroll
                ? Math.max(insets.bottom, 8)
                : CONTENT_PADDING_V + insets.bottom,
            flex: 1,
          },
          type === "custom" && styles.contentScrollContentCustom,
          (isCollectionFormSheet || isCollectionPickerSheet || isFormLikeCustomSheet) &&
            styles.contentScrollContentCreateCollection,
          isCollectionPickerSheet && styles.collectionPickerContentHost,
          isFormLikeCustomSheet && styles.formLikeCustomContentHost,
          type === "limitReached" && styles.limitReachedContentHost,
          (type === "notificationPermission" ||
            type === "locationPermission" ||
            type === "identificationMilestone" ||
            type === "subscriptionDiscount" ||
            type === "rateUs" ||
            type === "feedback") &&
            styles.permissionContentHost,
          type === "communityRules" && styles.communityRulesContentHost,
        ]}
        removeClippedSubviews={false}
      >
        {content}
      </View>
      )}
    </View>
  );

  const sheetContent = shouldDisableScroll ? (
    fixedBody
  ) : (
    <>
      <View
        style={[
          styles.topRow,
          alignCloseButtonRight && styles.topRowCloseRight,
          isLimitReachedUpgradeClose && styles.limitReachedTopRow,
          {
            paddingTop:
              type === "limitReached" ||
              type === "notificationPermission" ||
              type === "locationPermission"
                ? 8
                : insets.top + 4,
          },
        ]}
      >
        {!effectiveConfig.showDefaultHeader ? (
          <TouchableOpacity
            onPress={closeSheet}
            style={sheetCloseButtonStyles}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon
              isDark={isDark}
              size={sheetCloseIconSize}
              variant={getSheetCloseIconVariant(type)}
              style={sheetCloseIconStyle}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      {effectiveConfig.showDefaultHeader && (
        <View
          style={[
            styles.header,
            // {
            //   borderBottomColor: theme.colors.borderLight,
            //   borderBottomWidth: type === 'createCollection' ? 0 : 1,
            // },
          ]}
        >
          <Text
            variant="title"
            size="large"
            weight="semibold"
            style={[styles.title, { color: theme.colors.textPrimary }]}
          >
            {effectiveConfig.title}
          </Text>
          <TouchableOpacity
            onPress={closeSheet}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <CloseIcon
              isDark={isDark}
              variant={getSheetCloseIconVariant(type)}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentScrollContent,
          { paddingBottom: CONTENT_PADDING_V + insets.bottom },
        ]}
        onContentSizeChange={(_w, h) => setMeasuredContentHeight(h)}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={Platform.OS === "android"}
        overScrollMode="always"
      >
        {content}
      </ScrollView>
    </>
  );

  const modalContent = (
    <View
      style={[
        styles.modalWrapper,
        { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP },
      ]}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.backdrop,
              animatedBackdropStyle,
              {
                backgroundColor: usesDedicatedSheetArtBackground(type)
                  ? OVERLAY_COLORS.MODAL_BACKDROP_DARK
                  : OVERLAY_COLORS.MODAL_BACKDROP,
              },
            ]}
          />
          <View pointerEvents="box-none">
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    height: resolvedSheetHeight,
                    maxHeight: SCREEN_HEIGHT,
                    bottom: customKeyboardBottomInset,
                    backgroundColor: getSheetSurfaceBackgroundColor(
                      type,
                      theme,
                      customSheetBg,
                      useBg || usesBitmapSheetArt,
                      isDark
                    ),
                    ...(usesBitmapSheetArt
                      ? {
                          borderTopLeftRadius: isDark
                            ? 16
                            : theme.radius["2xl"],
                          borderTopRightRadius: isDark
                            ? 16
                            : theme.radius["2xl"],
                          ...(isDark
                            ? {
                                borderWidth: 1,
                                borderBottomWidth: 0,
                                borderColor: APP_COLORS.borderDark,
                              }
                            : {}),
                        }
                      : getBottomSheetChromeStyle(theme)),
                    paddingBottom:
                      usesPopupSheetSafeAreaInContent(type) ||
                      isFormLikeCustomSheet
                        ? 0
                        : insets.bottom,
                    overflow: "hidden",
                    ...(Platform.OS === "android" && { elevation: 24 }),
                  },
                  animatedSheetStyle,
                ]}
              >
                {/* Background: one combined art asset fills the entire sheet */}
                {usesBitmapSheetArt ? (
                  <>
                    <View
                      style={StyleSheet.absoluteFillObject}
                      pointerEvents="none"
                    >
                      <AppImage
                        source={bgSource}
                        style={getBitmapSheetBackgroundStyle(
                          type,
                          bgSource,
                          resolvedSheetHeight
                        )}
                        resizeMode="cover"
                        preferRNImage={type === "feedback"}
                      />
                    </View>
                    {sheetContent}
                  </>
                ) : showSheetBackground && bgSource && isSvg && SvgBg ? (
                  <>
                    <View
                      style={StyleSheet.absoluteFillObject}
                      pointerEvents="none"
                    >
                      <SvgBg
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </View>
                    {sheetContent}
                  </>
                ) : (
                  sheetContent
                )}
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );

  return (
    <RNModal
      visible
      transparent
      animationType="none"
      onRequestClose={
        effectiveConfig.enableBackdropDismiss ? closeSheet : undefined
      }
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      {type === "createCollection" ||
      type === "renameCollection" ||
      type === "feedback" ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {modalContent}
        </KeyboardAvoidingView>
      ) : (
        modalContent
      )}
    </RNModal>
  );
};

// ---- Content renderers: one place for all sheet bodies ----
type ContentContext = {
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
};

function renderContentForType(
  type: AppSheetType,
  payload: AppSheetPayload[AppSheetType],
  ctx: ContentContext
): ReactNode {
  switch (type) {
    case "communityRules":
      return payload && "config" in payload ? (
        <CommunityRulesContent
          config={payload.config}
          onAgree={payload.onAgree}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
          insets={ctx.insets}
        />
      ) : null;
    case "report": {
      const p = payload as SheetPayload<"report"> | undefined;
      return p && "onSubmit" in p ? (
        <ReportContent
          title={p.title}
          description={p.description}
          onSubmit={p.onSubmit}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      ) : null;
    }
    case "limitReached":
      return payload && "onUpgrade" in payload ? (
        <LimitReachedContent
          limitType={payload.limitType}
          use70Discount={payload.use70Discount}
          onUpgrade={payload.onUpgrade}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
          insets={ctx.insets}
        />
      ) : null;
    case "createCollection":
      return payload && "onCreated" in payload ? (
        <CreateCollectionContent
          onCreated={payload.onCreated}
          onLimitReached={payload.onLimitReached}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
          showToast={ctx.showToast}
        />
      ) : null;
    case "rateUs":
      return payload && "onHighRating" in payload ? (
        <RateUsContent
          onLowRating={payload.onLowRating}
          onHighRating={payload.onHighRating}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
          insets={ctx.insets}
        />
      ) : null;
    case "feedback": {
      const p = payload as SheetPayload<"feedback"> | undefined;
      return p && "onSubmit" in p ? (
        <FeedbackContent
          rating={p.rating}
          onSubmit={p.onSubmit}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      ) : null;
    }
    case "notificationPermission": {
      const p = payload as SheetPayload<"notificationPermission"> | undefined;
      return (
        <NotificationPermissionContent
          onGranted={p?.onGranted}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
        />
      );
    }
    case "locationPermission": {
      const p = payload as SheetPayload<"locationPermission"> | undefined;
      return (
        <LocationPermissionContent
          onRequestEnable={p?.onRequestEnable}
          onSuccess={p?.onSuccess}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
        />
      );
    }
    case "identificationMilestone":
      return payload && "count" in payload ? (
        <IdentificationMilestoneContent
          count={payload.count}
          onBackToHome={payload.onBackToHome}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
          insets={ctx.insets}
        />
      ) : null;
    case "subscriptionDiscount":
      return payload && "onSubscribe" in payload ? (
        <SubscriptionDiscountContent
          percentage={payload.percentage}
          onSubscribe={payload.onSubscribe}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
        />
      ) : null;
    case "addToCollection":
      return payload && "mushroomId" in payload ? (
        <AddToCollectionContent
          mushroomId={payload.mushroomId}
          onConfirm={payload.onConfirm}
          onRequestCreateNew={payload.onRequestCreateNew}
          refreshTrigger={payload.refreshTrigger}
          initialSelectedCollectionId={payload.initialSelectedCollectionId}
          onShowUpgrade={payload.onShowUpgrade}
          theme={ctx.theme}
          isDark={ctx.isDark}
        />
      ) : null;
    case "addToAnotherCollection": {
      const p = payload as SheetPayload<"addToAnotherCollection"> | undefined;
      return p && "onConfirm" in p ? (
        <UserCollectionPickerContent
          variant="addAnother"
          excludeCollectionIds={p.excludeCollectionIds}
          onConfirm={p.onConfirm}
          onRequestCreateNew={p.onRequestCreateNew}
          refreshTrigger={p.refreshTrigger}
          initialSelectedCollectionId={p.initialSelectedCollectionId}
          theme={ctx.theme}
          isDark={ctx.isDark}
        />
      ) : null;
    }
    case "moveToCollection": {
      const p = payload as SheetPayload<"moveToCollection"> | undefined;
      return p && "onConfirm" in p ? (
        <UserCollectionPickerContent
          variant="move"
          excludeCollectionIds={p.excludeCollectionIds}
          onConfirm={p.onConfirm}
          onRequestCreateNew={p.onRequestCreateNew}
          refreshTrigger={p.refreshTrigger}
          initialSelectedCollectionId={p.initialSelectedCollectionId}
          theme={ctx.theme}
          isDark={ctx.isDark}
        />
      ) : null;
    }
    case "renameCollection":
      return payload && "collectionId" in payload ? (
        <RenameCollectionContent
          collectionId={payload.collectionId}
          initialName={payload.initialName}
          onRenamed={payload.onRenamed}
          onClose={ctx.onClose}
          theme={ctx.theme}
          isDark={ctx.isDark}
          showToast={ctx.showToast}
        />
      ) : null;
    case "custom":
      return payload && "children" in payload
        ? (payload as SheetPayload<"custom">).children
        : null;
    default:
      return null;
  }
}

type CollectionItem = {
  collectionId: string;
  name: string;
  specimenCount: number;
};

function AddToCollectionContent({
  mushroomId,
  onConfirm,
  onRequestCreateNew,
  refreshTrigger,
  initialSelectedCollectionId,
  onShowUpgrade,
  theme,
  isDark,
}: {
  mushroomId: string;
  onConfirm: (collectionId: string) => void | Promise<void>;
  onRequestCreateNew?: () => void;
  refreshTrigger?: unknown;
  initialSelectedCollectionId?: string;
  onShowUpgrade?: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
}) {
  const strings = useStrings();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const maxItemsPerCollection = COLLECTION_LIMITS.MAX_ITEMS_PER_COLLECTION;
  /** Free users: 50 mushrooms total across all collections. Premium: per-collection cap only. */
  const isCollectionFull = (count: number) =>
    isPremium && count >= maxItemsPerCollection;
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [totalSpecimenCount, setTotalSpecimenCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const atFreeSpecimenCap =
    !isPremium && totalSpecimenCount >= FREE_SPECIMEN_LIMIT;
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedCollectionId ?? null
  );
  const [confirming, setConfirming] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const [res, identifiedPage, wishlistPage, allSpecimensPage] =
        await Promise.all([
          collectionService.fetchAllCollections({
            pageNo: 0,
            pageSize: PAGINATION.COLLECTION_PAGE_SIZE,
          }),
          mushroomSpecimenService
            .fetchAllSpecimens(
              { isIdentified: [true] },
              { pageNo: 0, pageSize: 1 }
            )
            .catch(() => ({
              data: [],
              pagination: {
                totalCount: 0,
                pageNo: 0,
                pageSize: 1,
                totalPages: 0,
              },
            })),
          mushroomSpecimenService
            .fetchAllSpecimens(
              { isWishlisted: [true] },
              { pageNo: 0, pageSize: 1 }
            )
            .catch(() => ({
              data: [],
              pagination: {
                totalCount: 0,
                pageNo: 0,
                pageSize: 1,
                totalPages: 0,
              },
            })),
          mushroomSpecimenService
            .fetchAllSpecimens({}, { pageNo: 0, pageSize: 1 })
            .catch(() => ({
              data: [],
              pagination: {
                totalCount: 0,
                pageNo: 0,
                pageSize: 1,
                totalPages: 0,
              },
            })),
        ]);

      const identifiedCount = identifiedPage.pagination?.totalCount ?? 0;
      const wishlistCount = wishlistPage.pagination?.totalCount ?? 0;
      setTotalSpecimenCount(allSpecimensPage.pagination?.totalCount ?? 0);

      const items = res.data
        .map((c) => ({
          collectionId: c.collectionId,
          name: c.name,
          specimenCount: c.specimenCount ?? 0,
        }))
        .filter((c) => c.name !== "Identified" && c.name !== "Wishlist");
      setCollections([
        {
          collectionId: ADD_TO_COLLECTION_IDS.IDENTIFIED,
          name: "Identified",
          specimenCount: identifiedCount,
        },
        {
          collectionId: ADD_TO_COLLECTION_IDS.WISHLIST,
          name: "Wishlist",
          specimenCount: wishlistCount,
        },
        ...items,
      ]);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mushroomId) {
      setSelectedId(initialSelectedCollectionId ?? null);
      fetchCollections();
    }
  }, [mushroomId, fetchCollections, initialSelectedCollectionId]);

  useEffect(() => {
    if (refreshTrigger !== undefined) fetchCollections();
  }, [refreshTrigger, fetchCollections]);

  const handleDone = async () => {
    if (!selectedId) return;
    if (atFreeSpecimenCap) {
      onShowUpgrade?.();
      return;
    }
    const selected = collections.find((c) => c.collectionId === selectedId);
    if (selected && isCollectionFull(selected.specimenCount)) {
      onShowUpgrade?.();
      return;
    }
    setConfirming(true);
    try {
      await onConfirm(selectedId);
      setSelectedId(null);
    } finally {
      setConfirming(false);
    }
  };

  const selected = collections.find((c) => c.collectionId === selectedId);
  const canConfirm =
    !!selectedId &&
    !confirming &&
    !atFreeSpecimenCap &&
    !(selected && isCollectionFull(selected.specimenCount));
  const _sheetBg = isDark ? APP_COLORS.surfaceDark : APP_COLORS.surfaceWhite;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const borderColor = isDark
    ? OVERLAY_COLORS.SURFACE_OVERLAY_WHITE_20
    : theme.colors.border;

  return (
    <View style={sheetStyles.collectionPickerBody}>
      <Text
        style={[
          sheetStyles.addToSubtitle,
          { color: textSecondary, marginTop: 0 },
        ]}
      >
        {strings.collection.addToCollection.subtitle}
      </Text>
      {loading ? (
        <View style={sheetStyles.addToLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={sheetStyles.collectionPickerList}
          contentContainerStyle={sheetStyles.addToScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {collections.map((item) => {
            const selected = selectedId === item.collectionId;
            const full =
              atFreeSpecimenCap || isCollectionFull(item.specimenCount);
            return (
              <TouchableOpacity
                key={item.collectionId}
                activeOpacity={0.7}
                style={[
                  sheetStyles.addToRow,
                  {
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    opacity: full ? 0.6 : 1,
                  },
                ]}
                onPress={() => {
                  if (atFreeSpecimenCap) {
                    onShowUpgrade?.();
                    return;
                  }
                  if (isCollectionFull(item.specimenCount)) {
                    onShowUpgrade?.();
                    return;
                  }
                  setSelectedId(item.collectionId);
                }}
              >
                <MaterialIcons
                  name={selected ? "check-box" : "check-box-outline-blank"}
                  size={21}
                  color={selected ? theme.colors.primary : borderColor}
                  style={{ marginRight: 12 }}
                />
                <Text
                  variant="body"
                  size="medium"
                  weight={selected ? "semibold" : "regular"}
                  style={{ flex: 1, color: textPrimary }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {full ? (
                  <Text
                    variant="body"
                    size="small"
                    style={{ color: textSecondary }}
                    numberOfLines={1}
                  >
                    ({strings.collection.addToCollection.full})
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <View style={sheetStyles.collectionPickerFooter}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRequestCreateNew}
          style={[sheetStyles.addToAddNew, { borderColor }]}
        >
          <MaterialIcons
            name="add"
            size={24}
            color={textPrimary}
            style={{ marginRight: 8 }}
          />
          <Text
            variant="body"
            size="large"
            weight="semibold"
            style={{ color: textPrimary }}
          >
            {strings.collection.addToCollection.createNew}
          </Text>
        </TouchableOpacity>
        <View style={sheetStyles.addToDoneWrap}>
          <Button
            title={strings.common.buttons.done}
            variant="primary"
            size="large"
            fullWidth
            onPress={handleDone}
            disabled={!canConfirm}
            loading={confirming}
          />
        </View>
      </View>
    </View>
  );
}

function RenameCollectionContent({
  collectionId,
  initialName,
  onRenamed,
  onClose,
  theme,
  isDark,
  showToast,
}: {
  collectionId: string;
  initialName: string;
  onRenamed: (name: string) => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
  showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const strings = useStrings();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast(strings.collection.forms.collectionName.required, "error");
      return;
    }
    if (trimmed === initialName.trim()) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await collectionService.updateCollection(collectionId, { name: trimmed });
      showToast(strings.common.success.saved, "success");
      onRenamed(trimmed);
      onClose();
    } catch (e: any) {
      const reason = String(
        e?.data?.reason ?? e?.response?.data?.reason ?? e?.message ?? ""
      );
      if (/already exists|duplicate/i.test(reason)) {
        showToast(strings.collection.forms.collectionName.duplicate, "error");
      } else {
        showToast(strings.collection.renameCollection.saveFailed, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        sheetStyles.createContent,
        { paddingHorizontal: theme.spacing[2] },
      ]}
    >
      <Text
        variant="body"
        size="small"
        color="textSecondary"
        style={sheetStyles.createSubtext}
      >
        {strings.collection.renameCollection.subtitle}
      </Text>
      <Text
        variant="label"
        size="small"
        weight="medium"
        color="text"
        style={sheetStyles.createLabel}
      >
        {strings.collection.forms.collectionName.label}
      </Text>
      <TextInput
        placeholder={strings.collection.forms.collectionName.placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        value={name}
        onChangeText={setName}
        editable={!loading}
        style={[
          sheetStyles.createInput,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
      />
      <View style={sheetStyles.createBtnWrap}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <View style={sheetStyles.createBtnRow}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
              style={[
                sheetStyles.createBtnCancel,
                {
                  backgroundColor: isDark
                    ? CREATE_CANCEL_DARK_BG
                    : CREATE_CANCEL_LIGHT_BG,
                  borderColor: isDark
                    ? CREATE_CANCEL_BORDER_DARK
                    : CREATE_CANCEL_BORDER_LIGHT,
                },
              ]}
            >
              <Text
                variant="label"
                size="medium"
                weight="semibold"
                style={{
                  color: isDark
                    ? CREATE_CANCEL_DARK_TEXT
                    : CREATE_CANCEL_LIGHT_TEXT,
                }}
              >
                {strings.common.buttons.cancel}
              </Text>
            </TouchableOpacity>
            <Button
              title={strings.common.buttons.save}
              variant="primary"
              size="large"
              onPress={handleSave}
              disabled={loading || !name.trim()}
              style={sheetStyles.createBtnPrimary}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function UserCollectionPickerContent({
  variant,
  excludeCollectionIds,
  onConfirm,
  onRequestCreateNew,
  refreshTrigger,
  initialSelectedCollectionId,
  theme,
  isDark,
}: {
  variant: "addAnother" | "move";
  excludeCollectionIds?: string[];
  onConfirm: (collectionId: string) => void | Promise<void>;
  onRequestCreateNew?: () => void;
  refreshTrigger?: unknown;
  initialSelectedCollectionId?: string;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
}) {
  const strings = useStrings();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const copy =
    variant === "move"
      ? strings.collection.moveToCollection
      : strings.collection.addToAnotherCollection;
  const maxItemsPerCollection = COLLECTION_LIMITS.MAX_ITEMS_PER_COLLECTION;
  const isCollectionFull = (count: number) =>
    isPremium && count >= maxItemsPerCollection;
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedCollectionId ?? null
  );
  const [confirming, setConfirming] = useState(false);
  const excludeSet = useMemo(
    () => new Set((excludeCollectionIds ?? []).filter(Boolean)),
    [excludeCollectionIds]
  );

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await collectionService.fetchAllCollections({
        pageNo: 0,
        pageSize: PAGINATION.COLLECTION_PAGE_SIZE,
      });
      const items = res.data
        .map((c) => ({
          collectionId: c.collectionId,
          name: c.name,
          specimenCount: c.specimenCount ?? 0,
        }))
        .filter(
          (c) =>
            isUserCreatedCollectionName(c.name) &&
            c.collectionId &&
            !excludeSet.has(c.collectionId)
        );
      setCollections(items);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [excludeSet]);

  useEffect(() => {
    setSelectedId(initialSelectedCollectionId ?? null);
    fetchCollections();
  }, [fetchCollections, initialSelectedCollectionId]);

  useEffect(() => {
    if (refreshTrigger !== undefined) fetchCollections();
  }, [refreshTrigger, fetchCollections]);

  const handleDone = async () => {
    if (!selectedId) return;
    const selected = collections.find((c) => c.collectionId === selectedId);
    if (selected && isCollectionFull(selected.specimenCount)) return;
    setConfirming(true);
    try {
      await onConfirm(selectedId);
      setSelectedId(null);
    } finally {
      setConfirming(false);
    }
  };

  const selected = collections.find((c) => c.collectionId === selectedId);
  const canConfirm =
    !!selectedId &&
    !confirming &&
    !(selected && isCollectionFull(selected.specimenCount));
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const borderColor = isDark
    ? OVERLAY_COLORS.SURFACE_OVERLAY_WHITE_20
    : theme.colors.border;

  return (
    <View style={sheetStyles.collectionPickerBody}>
      <Text
        style={[
          sheetStyles.addToSubtitle,
          { color: textSecondary, marginTop: 0 },
        ]}
      >
        {copy.subtitle}
      </Text>
      {loading ? (
        <View style={sheetStyles.addToLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={sheetStyles.collectionPickerList}
          contentContainerStyle={sheetStyles.addToScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {collections.map((item) => {
            const isSelected = selectedId === item.collectionId;
            const full = isCollectionFull(item.specimenCount);
            return (
              <TouchableOpacity
                key={item.collectionId}
                activeOpacity={0.7}
                style={[
                  sheetStyles.addToRow,
                  {
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    opacity: full ? 0.6 : 1,
                  },
                ]}
                onPress={() => {
                  if (isCollectionFull(item.specimenCount)) return;
                  setSelectedId(item.collectionId);
                }}
              >
                <MaterialIcons
                  name={isSelected ? "check-box" : "check-box-outline-blank"}
                  size={20}
                  color={isSelected ? theme.colors.primary : borderColor}
                  style={{ marginRight: 8 }}
                />
                <Text
                  variant="body"
                  size="medium"
                  weight={isSelected ? "semibold" : "regular"}
                  style={{ flex: 1, color: textPrimary }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <View style={sheetStyles.collectionPickerFooter}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRequestCreateNew}
          style={[sheetStyles.addToAddNew, { borderColor }]}
        >
          <MaterialIcons
            name="add"
            size={24}
            color={textPrimary}
            style={{ marginRight: 8 }}
          />
          <Text
            variant="body"
            size="large"
            weight="semibold"
            style={{ color: textPrimary }}
          >
            {copy.createNew}
          </Text>
        </TouchableOpacity>
        <View style={sheetStyles.addToDoneWrap}>
          <Button
            title={strings.common.buttons.done}
            variant="primary"
            size="large"
            fullWidth
            onPress={handleDone}
            disabled={!canConfirm}
            loading={confirming}
          />
        </View>
      </View>
    </View>
  );
}

function CommunityRulesContent({
  config,
  onAgree,
  onClose,
  theme,
  isDark: _isDark,
  insets,
}: {
  config: FeedConfig;
  onAgree: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const { communityRules } = config;

  return (
    <View style={styles.communityRulesContainer}>
      <View style={styles.communityRulesScrollWrap}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          style={[
            commonFeedStyles.rulesScrollView,
            styles.communityRulesScrollView,
          ]}
          contentContainerStyle={[
            commonFeedStyles.rulesScrollContent,
            styles.communityRulesScrollContent,
          ]}
          nestedScrollEnabled={true}
          bounces={true}
        >
          <View style={styles.updatedRow}>
            <Icon name="clock" size={20} color={theme.colors.textSecondary} />
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={styles.updatedText}
            >
              Updated {communityRules.lastUpdated}
            </Text>
          </View>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.welcomeIntro}
          >
            {communityRules.intro}
          </Text>
          {communityRules.rules.map((rule, i) => (
            <View key={i} style={styles.communityRuleBlock}>
              <Text
                variant="body"
                size="medium"
                weight="medium"
                style={[
                  commonFeedStyles.ruleTitle,
                  styles.communityRuleTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {i + 1}. {rule.title}
              </Text>
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                style={[commonFeedStyles.ruleText, styles.communityRuleText]}
              >
                {rule.text}
              </Text>
            </View>
          ))}
          {communityRules.footerNote ? (
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={[styles.welcomeIntro, styles.communityRulesFooterNote]}
            >
              {communityRules.footerNote}
            </Text>
          ) : null}
        </ScrollView>
      </View>
      <View
        style={[
          styles.communityRulesFooter,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <Button
          title={communityRules.agreeButtonText}
          variant="primary"
          size="large"
          onPress={() => {
            onAgree();
            onClose();
          }}
          fullWidth
          style={[
            styles.communityRulesOkayButton,
            { backgroundColor: theme.colors.primaryCTA },
          ]}
          textStyle={styles.communityRulesOkayButtonText}
        />
      </View>
    </View>
  );
}

function ReportContent({
  title = MODAL_STRINGS.modals.reportPost.title,
  description = MODAL_STRINGS.modals.reportPost.description,
  onSubmit,
  onClose,
  theme,
}: {
  title?: string;
  description?: string;
  onSubmit: (message: string) => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    const t = message.trim();
    if (!t || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await dismissKeyboardSmooth();
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 80);
      });
      await Promise.resolve(onSubmit(t));
      setMessage("");
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 80);
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <View style={sheetStyles.reportContainer}>
      <Text
        variant="title"
        size="large"
        weight="bold"
        color="text"
        style={sheetStyles.reportTitle}
      >
        {title}
      </Text>
      <Text
        variant="body"
        size="medium"
        color="textSecondary"
        style={sheetStyles.reportDesc}
      >
        {description}
      </Text>
      <TextInput
        style={[
          sheetStyles.reportInput,
          {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          },
        ]}
        placeholder={MODAL_STRINGS.modals.reportPost.placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
      <Button
        title={MODAL_STRINGS.modals.reportPost.submitButton}
        variant="primary"
        size="large"
        fullWidth
        onPress={handleSubmit}
        disabled={isSubmitting || !message.trim()}
        loading={isSubmitting}
        style={sheetStyles.reportBtn}
      />
    </View>
  );
}

/** Accent for “Go pro” on collection / upgrade copy */
const COLLECTION_LIMIT_GO_PRO_ACCENT = MUSHROOM_COLORS.ACCENT_ORANGE;

/** Accent suffixes on limit-reached titles (collection / upgrade sheets). */
const LIMIT_REACHED_GO_PRO_SUFFIXES = [
  "Go pro+ now",
  "Go Pro+ now",
  "Go pro now",
  "Go Pro now",
  "Go pro+",
  "Go Pro",
] as const;

function splitLimitReachedGoProTitle(
  title: string
): { before: string; goPro: string; now: string } | null {
  for (const suffix of LIMIT_REACHED_GO_PRO_SUFFIXES) {
    const idx = title.indexOf(suffix);
    if (idx >= 0) {
      const accent = title.slice(idx);
      const nowIdx = accent.toLowerCase().lastIndexOf(" now");
      if (nowIdx > 0 && nowIdx + 4 === accent.length) {
        return {
          before: title.slice(0, idx),
          goPro: accent.slice(0, nowIdx),
          now: accent.slice(nowIdx),
        };
      }
      return { before: title.slice(0, idx), goPro: accent, now: "" };
    }
  }
  return null;
}

function LimitReachedTitle({
  limitType,
  title,
  theme,
}: {
  limitType: LimitType;
  title: string;
  theme: ReturnType<typeof useTheme>;
}) {
  const baseStyle = [
    sheetStyles.limitTitle,
    usesCompactLimitTitleStyle(limitType) && sheetStyles.collectionLimitTitle,
    { marginTop: 0, color: theme.colors.textPrimary },
  ];
  const split = splitLimitReachedGoProTitle(title);
  if (split) {
    const nowColor =
      limitType === "aiChat"
        ? theme.colors.textPrimary
        : COLLECTION_LIMIT_GO_PRO_ACCENT;
    return (
      <Text
        variant="title"
        size="medium"
        weight="bold"
        numberOfLines={3}
        style={baseStyle}
      >
        {split.before}
        <Text
          variant="title"
          size="medium"
          weight="bold"
          style={{ color: COLLECTION_LIMIT_GO_PRO_ACCENT }}
        >
          {split.goPro}
        </Text>
        {split.now ? (
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={{ color: nowColor }}
          >
            {split.now}
          </Text>
        ) : null}
      </Text>
    );
  }
  return (
    <Text
      variant="title"
      size="medium"
      weight="bold"
      numberOfLines={3}
      style={baseStyle}
    >
      {title}
    </Text>
  );
}

function LimitReachedContent({
  limitType,
  use70Discount: _use70Discount,
  onUpgrade,
  onClose: _onClose,
  theme,
  isDark: _isDark,
  insets,
}: {
  limitType: LimitType;
  use70Discount?: boolean;
  onUpgrade: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
  insets?: { bottom: number };
}) {
  const item = getCarouselItemForLimitType(limitType);
  const { plans, defaultSelectedPlanId } = useSubscriptionPlansWithPrices();
  const selectedPlan =
    plans.find((p) => p.id === defaultSelectedPlanId) ?? plans[0] ?? null;
  const upgradeCtaLabel = useMemo(
    () =>
      getSubscriptionCtaLabel({ selectedPlan }) ||
      UPGRADE_MODAL.CTA_SUBSCRIBE,
    [selectedPlan]
  );
  const bottomPadding = CONTENT_PADDING_V + (insets?.bottom ?? 0);
  const isCollectionLimit = isCollectionLimitType(limitType);
  const isIdentificationLimit = limitType === "identification";
  const isBirdOfDayLimit = limitType === "birdOfDay";

  return (
    <View style={sheetStyles.limitRoot}>
      <View
        style={[
          sheetStyles.limitTextCtaSection,
          isCollectionLimit && sheetStyles.collectionLimitTextCtaSection,
          isIdentificationLimit && sheetStyles.identificationLimitTextCtaSection,
          isBirdOfDayLimit &&
            sheetStyles.birdOfDayLimitTextCtaSection,
          {
            marginTop: "auto",
            paddingHorizontal: theme.spacing[6],
            paddingBottom: bottomPadding,
          },
        ]}
      >
        <LimitReachedTitle
          limitType={limitType}
          title={item.title}
          theme={theme}
        />
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={[
            sheetStyles.limitDesc,
            isCollectionLimit && sheetStyles.collectionLimitDesc,
            isIdentificationLimit && sheetStyles.identificationLimitDesc,
            isBirdOfDayLimit && sheetStyles.birdOfDayLimitDesc,
            { marginTop: theme.spacing[2] },
          ]}
        >
          {item.description}
        </Text>
        <View style={sheetStyles.limitCtaWrap}>
          <View style={sheetStyles.limitCtaBtnWrap}>
            <Button
              title={upgradeCtaLabel}
              variant="primary"
              size="large"
              fullWidth
              onPress={onUpgrade}
              style={[
                sheetStyles.limitBtn,
                {
                  backgroundColor: theme.colors.primaryCTA,
                  borderRadius: theme.radius.button,
                  paddingVertical: theme.spacing[4],
                },
              ]}
              textStyle={{
                color: theme.colors.onPrimary,
                fontFamily: FONTS.bold,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const CREATE_CANCEL_BORDER_LIGHT = APP_COLORS.cancelSecondaryBorderLight;
const CREATE_CANCEL_BORDER_DARK = APP_COLORS.cancelSecondaryBorderDark;
const CREATE_CANCEL_DARK_BG = APP_COLORS.surfaceAuthDark;
/** Light mode: solid white cancel chip (design: #FFF, not tinted sheet surface) */
const CREATE_CANCEL_LIGHT_BG = "#FFFFFF";
const CREATE_CANCEL_DARK_TEXT = APP_COLORS.modalTextOnPrimary;
const CREATE_CANCEL_LIGHT_TEXT = APP_COLORS.surfaceDark;

function CreateCollectionContent({
  onCreated,
  onLimitReached,
  onClose,
  theme,
  isDark,
  showToast,
}: {
  onCreated: (c: Collection) => void;
  onLimitReached?: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
  showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const strings = useStrings();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const handleCreate = async () => {
    const t = name.trim();
    if (!t || loading) return;
    setLoading(true);
    try {
      // Keep collection flow aligned with other premium-gated features:
      // sync subscription mirror before create so we don't use stale in-memory state.
      useSubscriptionStore.getState().syncFromAuthStore();
      const newCollection = await collectionService.addCollection({
        name: t,
        description: description.trim() || undefined,
      });
      showToast("Collection created", "success");
      analyticsService.logEvent(EVENTS.create_collection, {
        collection_name: t,
      });
      setName("");
      setDescription("");
      // Keyboard + sheet close racing is the flicker: settle keyboard first,
      // then animate the sheet away. Keep the button row mounted while saving.
      await dismissKeyboardSmooth();
      onCreated(newCollection);
      onClose();
    } catch (e: unknown) {
      const status = getApiErrorStatus(e);
      const reason = getApiErrorReason(e);
      logCollectionCreateApiResult({
        httpStatus: status,
        reason,
        message: e instanceof Error ? e.message : String(e),
        treatedAsLimitOrUpgrade: isPaywallOrLimitError(e),
      });
      if (isPaywallOrLimitError(e)) {
        await dismissKeyboardSmooth();
        onClose();
        setTimeout(() => {
          if (shouldShowCollectionLimitPaywall()) {
            onLimitReached?.();
            return;
          }
          void useSubscriptionStore.getState().fetchSubscription();
          showToast(
            "Couldn't create collection. Please try again in a moment.",
            "error"
          );
        }, 280);
        return;
      }
      showToast(
        e instanceof Error ? e.message : "Failed to create collection",
        "error"
      );
      setLoading(false);
    }
  };
  return (
    <View
      style={[
        sheetStyles.createContent,
        { paddingHorizontal: theme.spacing[2] },
      ]}
    >
      <Text
        variant="body"
        size="small"
        color="textSecondary"
        style={sheetStyles.createSubtext}
      >
        {strings.collection.forms.createCollection.subtitle}
      </Text>
      <Text
        variant="label"
        size="small"
        weight="medium"
        color="text"
        style={sheetStyles.createLabel}
      >
        Collection name
      </Text>
      <TextInput
        placeholder="Enter collection name"
        placeholderTextColor={theme.colors.textTertiary}
        value={name}
        onChangeText={setName}
        editable={!loading}
        style={[
          sheetStyles.createInput,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
      />
      {/* Description field commented out
      <TextInput
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        editable={!loading}
        style={[
          sheetStyles.createInput,
          sheetStyles.createDesc,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
      />
      */}
      <View style={sheetStyles.createBtnWrap}>
        <View style={sheetStyles.createBtnRow}>
          <TouchableOpacity
            onPress={onClose}
            disabled={loading}
            activeOpacity={0.7}
            style={[
              sheetStyles.createBtnCancel,
              {
                backgroundColor: isDark
                  ? CREATE_CANCEL_DARK_BG
                  : CREATE_CANCEL_LIGHT_BG,
                borderColor: isDark
                  ? CREATE_CANCEL_BORDER_DARK
                  : CREATE_CANCEL_BORDER_LIGHT,
              },
            ]}
          >
            <Text
              variant="label"
              size="medium"
              weight="semibold"
              style={{
                color: isDark
                  ? CREATE_CANCEL_DARK_TEXT
                  : CREATE_CANCEL_LIGHT_TEXT,
              }}
            >
              {strings.common.buttons.cancel}
            </Text>
          </TouchableOpacity>
          <Button
            title={strings.common.buttons.save}
            variant="primary"
            size="large"
            onPress={handleCreate}
            loading={loading}
            disabled={loading || !name.trim()}
            style={sheetStyles.createBtnPrimary}
          />
        </View>
      </View>
    </View>
  );
}

function RateUsContent({
  onLowRating,
  onHighRating,
  onClose: _onClose,
  theme,
  insets,
}: {
  onLowRating: (r: number) => void;
  onHighRating: (r: number) => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const [rating, setRating] = useState(0);
  const s = MODAL_STRINGS.rateUsModal;
  const handleContinue = () => {
    if (rating === 0) return;
    if (rating < 4) {
      onLowRating(rating);
      return;
    }
    onHighRating(rating);
  };
  return (
    <View
      style={[
        sheetStyles.rateContent,
        {
          paddingHorizontal: theme.spacing[6],
          paddingBottom: Math.max(16, insets.bottom),
        },
      ]}
    >
      <Text
        weight="semibold"
        style={[sheetStyles.rateTitle, { color: theme.colors.textPrimary }]}
      >
        {s.title}
      </Text>
      <Text
        color="textSecondary"
        style={sheetStyles.rateSubtitle}
      >
        {s.subtitle}
      </Text>
      <View style={sheetStyles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rating >= i;
          return (
            <TouchableOpacity
              key={i}
              onPress={() =>
                setRating((prev) => (prev === i ? i - 1 : i))
              }
              activeOpacity={0.7}
              style={sheetStyles.rateStarHit}
              accessibilityRole="button"
              accessibilityState={{ selected: filled }}
            >
              <AppImage
                source={Images.starRateUnfilled}
                style={[
                  sheetStyles.rateStar,
                  filled ? sheetStyles.rateStarHidden : null,
                ]}
                resizeMode="contain"
                preferRNImage
              />
              <AppImage
                source={Images.starRateFilled}
                style={[
                  sheetStyles.rateStarFilled,
                  filled ? null : sheetStyles.rateStarHidden,
                ]}
                resizeMode="contain"
                preferRNImage
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={sheetStyles.rateContinueSpacer} />
      <Button
        title={rating >= 4 ? s.rateNow : s.continue}
        variant="primary"
        size="large"
        onPress={handleContinue}
        disabled={rating === 0}
        style={sheetStyles.rateContinueBtn}
      />
    </View>
  );
}

const ALLOW_TEXT_COLOR = APP_COLORS.modalTextOnPrimary;
const NOT_NOW_BG_DARK = APP_COLORS.surfaceDark;
const NOT_NOW_BG_LIGHT = APP_COLORS.modalTextOnPrimary;
const NOT_NOW_TEXT_DARK = APP_COLORS.modalTextOnPrimary;
const NOT_NOW_TEXT_LIGHT = APP_COLORS.surfaceDark;

function PermissionPromptLayout({
  title,
  subtitle,
  theme,
  children,
  contentStyle,
}: {
  title: string;
  subtitle: string;
  theme: ReturnType<typeof useTheme>;
  children: ReactNode;
  contentStyle?: object | object[];
}) {
  const colors = theme.colors;

  return (
    <View style={sheetStyles.permissionRoot}>
      <View
        style={[
          sheetStyles.permissionBottomSection,
          { paddingHorizontal: theme.spacing[6], paddingBottom: 24 },
          ...(Array.isArray(contentStyle)
            ? contentStyle
            : contentStyle
            ? [contentStyle]
            : []),
        ]}
      >
        <Text
          weight="semibold"
          style={[sheetStyles.permissionTitle, { color: colors.textPrimary }]}
        >
          {title}
        </Text>
        <Text color="textSecondary" style={sheetStyles.permissionSubtitle}>
          {subtitle}
        </Text>
        {children}
      </View>
    </View>
  );
}

function PermissionPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  theme,
  labelColor = ALLOW_TEXT_COLOR,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  theme: ReturnType<typeof useTheme>;
  labelColor?: string;
}) {
  const colors = theme.colors;

  return (
    <TouchableOpacity
      style={[
        sheetStyles.permissionPrimaryBtn,
        { backgroundColor: colors.primaryCTA },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text weight="semibold" style={{ color: labelColor }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function PermissionSecondaryButton({
  label,
  onPress,
  disabled,
  isDark,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isDark: boolean;
}) {
  const notNowBg = isDark ? NOT_NOW_BG_DARK : NOT_NOW_BG_LIGHT;
  const notNowTextColor = isDark ? NOT_NOW_TEXT_DARK : NOT_NOW_TEXT_LIGHT;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        sheetStyles.permissionSecondaryBtn,
        {
          backgroundColor: notNowBg,
          borderColor: isDark
            ? SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_DARK
            : SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_LIGHT,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text weight="semibold" style={{ color: notNowTextColor }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function NotificationPermissionContent({
  onGranted,
  onClose,
  theme,
  isDark: _isDark,
}: {
  onGranted?: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
}) {
  const [shouldOpenSettings, setShouldOpenSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    analyticsService.logEvent(EVENTS.notif_popup);
    analyticsService.logEvent(EVENTS.notification_modal_shown);
    analyticsService.logEvent(EVENTS.native_permission);
    const load = async () => {
      try {
        const count = await getNotificationDenialCount();
        const threshold = getNotificationSettingsThreshold();
        setShouldOpenSettings(count >= threshold);
      } catch {
        setShouldOpenSettings(false);
      }
    };
    load();
  }, []);

  const handleEnable = async () => {
    setIsProcessing(true);
    try {
      if (shouldOpenSettings) {
        await markNotificationDismissed();
        await openDeviceSettings();
        onClose();
        return;
      }

      const result = await requestNotificationPermission();

      if (result.granted) {
        analyticsService.logEvent(EVENTS.notification_permission_granted, {
          source: "popup",
        });
        analyticsService.logEvent(EVENTS.permission_given);
        analyticsService.logEvent(EVENTS.native_permission_given);
        await markNotificationDismissed();
        onGranted?.();
        onClose();
      } else {
        analyticsService.logEvent(EVENTS.notification_permission_denied, {
          source: "popup",
        });
        analyticsService.logEvent(EVENTS.permission_denied);
        analyticsService.logEvent(EVENTS.native_permission_denied);
        await markNotificationDenied();
        onClose();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      await markNotificationDismissed();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const notifCopy = MODAL_STRINGS.bottomSheets.pushNotifications;
  const ctaLabel = shouldOpenSettings
    ? notifCopy.openSettings
    : notifCopy.enableButton;

  return (
    <PermissionPromptLayout
      title={notifCopy.title}
      subtitle={notifCopy.subtitle}
      theme={theme}
    >
      <PermissionPrimaryButton
        label={ctaLabel}
        onPress={handleEnable}
        disabled={isProcessing}
        loading={isProcessing}
        theme={theme}
      />
    </PermissionPromptLayout>
  );
}

function LocationPermissionContent({
  onRequestEnable,
  onSuccess,
  onClose,
  theme,
  isDark: _isDark,
}: {
  onRequestEnable?: () => void;
  onSuccess?: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
}) {
  const strings = MODAL_STRINGS.bottomSheets.enableLocation;
  const settingsCopy = MODAL_STRINGS.bottomSheets.locationManageAccess;
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsSettings, setNeedsSettings] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getLocationPermissionEntryAction().then((entry) => {
      if (!mounted) return;
      setNeedsSettings(entry === "manage_settings");
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleEnable = () => {
    if (needsSettings) {
      setIsProcessing(true);
      void openDeviceSettings().finally(() => {
        setIsProcessing(false);
        onClose();
      });
      return;
    }

    if (onRequestEnable) {
      onRequestEnable();
      return;
    }

    // Legacy callers (e.g. settings preview): dismiss sheet before native prompt.
    setIsProcessing(true);
    onClose();
    setTimeout(() => {
      void (async () => {
        try {
          const result = await requestLocationPermission();
          if (result.granted) {
            onSuccess?.();
          } else if (result.blocked) {
            openDeviceSettings();
          }
        } catch {
          // ignore
        } finally {
          setIsProcessing(false);
        }
      })();
    }, 450);
  };

  return (
    <PermissionPromptLayout
      title={needsSettings ? settingsCopy.title : strings.title}
      subtitle={needsSettings ? settingsCopy.subtitle : strings.subtitle}
      theme={theme}
    >
      <PermissionPrimaryButton
        label={needsSettings ? settingsCopy.goToSettings : strings.enableButton}
        onPress={handleEnable}
        disabled={isProcessing}
        loading={isProcessing}
        theme={theme}
      />
    </PermissionPromptLayout>
  );
}

const SUBSCRIPTION_LIST_ICONS_LIGHT: Record<string, ImageSourcePropType> = {
  Identification: Images.subscriptionListIdentification,
  Collections: Images.subscriptionListCollection,
  Details: Images.subscriptionListDetails,
  Feed: Images.subscriptionListFeed,
  "Bird of the Day": Images.subscriptionListBirdOfDay,
  "AI Chat": Images.subscriptionListAiChat,
};

const SUBSCRIPTION_LIST_ICONS_DARK: Record<string, ImageSourcePropType> = {
  Identification: Images.subscriptionListIdentificationDark,
  Collections: Images.subscriptionListCollectionDark,
  Details: Images.subscriptionListDetailsDark,
  Feed: Images.subscriptionListFeedDark,
  "Bird of the Day": Images.subscriptionListBirdOfDayDark,
  "AI Chat": Images.subscriptionListAiChatDark,
};

function SubscriptionDiscountComparisonTable({
  percentage,
  theme,
}: {
  percentage: number;
  theme: ReturnType<typeof useTheme>;
}) {
  const colors = theme.colors;
  const comparison = SUBSCRIPTION_TEXTS.intro.comparison;

  return (
    <View
      style={[
        sheetStyles.discountComparisonCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        variant="body"
        size="small"
        weight="semibold"
        color="textSecondary"
        style={sheetStyles.discountComparisonSectionTitle}
      >
        {comparison.title}
      </Text>

      <View style={sheetStyles.discountComparisonRow}>
        <View style={[sheetStyles.discountComparisonCell, { flex: 1.35 }]}>
          <Text
            variant="body"
            size="small"
            weight="semibold"
            color="textSecondary"
          >
            {comparison.headers.feature}
          </Text>
        </View>
        <View
          style={[
            sheetStyles.discountComparisonCell,
            sheetStyles.discountComparisonCenterCell,
            { flex: 1 },
          ]}
        >
          <Text
            variant="body"
            size="small"
            weight="semibold"
            color="textSecondary"
          >
            {comparison.headers.free}
          </Text>
        </View>
        <View
          style={[
            sheetStyles.discountComparisonCell,
            sheetStyles.discountComparisonCenterCell,
            sheetStyles.discountComparisonPremiumHeader,
          ]}
        >
          <Text
            variant="body"
            size="small"
            weight="semibold"
            color="textSecondary"
          >
            {comparison.headers.premium}
          </Text>
          <View
            style={[
              sheetStyles.discountComparisonPremiumBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text
              variant="body"
              size="small"
              weight="semibold"
              style={{ color: colors.textInverse }}
            >
              {percentage}% OFF
            </Text>
          </View>
        </View>
      </View>

      {FREE_VS_PREMIUM_COMPARISON.map((item) => {
        const listIcons =
          theme.mode === "dark"
            ? SUBSCRIPTION_LIST_ICONS_DARK
            : SUBSCRIPTION_LIST_ICONS_LIGHT;
        const iconSource = listIcons[item.feature];
        return (
          <View
            key={item.feature}
            style={[
              sheetStyles.discountComparisonRow,
              sheetStyles.discountComparisonRowBorder,
              { borderTopColor: colors.border },
            ]}
          >
            <View
              style={[
                sheetStyles.discountComparisonCell,
                sheetStyles.discountComparisonCellWithIcon,
                { flex: 1.35 },
              ]}
            >
              {iconSource ? (
                <AppImage
                  source={iconSource}
                  style={sheetStyles.discountComparisonFeatureIcon}
                  resizeMode="contain"
                />
              ) : null}
              <Text
                variant="body"
                size="small"
                style={{ flex: 1 }}
                numberOfLines={2}
              >
                {item.feature}
              </Text>
            </View>
            <View
              style={[
                sheetStyles.discountComparisonCell,
                sheetStyles.discountComparisonCenterCell,
                { flex: 1 },
              ]}
            >
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                numberOfLines={2}
              >
                {item.free}
              </Text>
            </View>
            <View
              style={[
                sheetStyles.discountComparisonCell,
                sheetStyles.discountComparisonCenterCell,
                sheetStyles.discountComparisonPremiumCell,
              ]}
            >
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                numberOfLines={2}
              >
                {item.premium}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SubscriptionDiscountContent({
  percentage = 50,
  onSubscribe,
  onClose,
  theme,
  isDark,
}: {
  percentage?: number;
  onSubscribe: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
}) {
  const discountOffer = useDiscountOfferCountdown();
  const { plans } = useSubscriptionPlansWithPrices();
  const paywallIsDark = usePostAuthOnboardingIsDark();
  const paywallColors = useMemo(
    () => getPostAuthOnboardingColors(paywallIsDark),
    [paywallIsDark]
  );
  const disclosurePlan = useMemo(
    () =>
      plans.find((plan) => (plan.duration ?? "").toLowerCase() === "year") ??
      plans[0] ??
      null,
    [plans]
  );
  const strings = MODAL_STRINGS.discount;
  const title = SUBSCRIPTION_TEXTS.intro.title.replace(
    "50",
    String(percentage)
  );
  const colors = theme.colors;
  const timerText = `${formatCountdownSegment(
    discountOffer.hours
  )}:${formatCountdownSegment(discountOffer.minutes)}:${formatCountdownSegment(
    discountOffer.seconds
  )}`;

  return (
    <View style={sheetStyles.discountRoot}>
      <ScrollView
        style={sheetStyles.discountComparisonScroll}
        contentContainerStyle={sheetStyles.discountComparisonScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <SubscriptionDiscountComparisonTable
          percentage={percentage}
          theme={theme}
        />
      </ScrollView>

      <View
        style={[
          sheetStyles.permissionBottomSection,
          { paddingHorizontal: theme.spacing[6], paddingBottom: 32 },
        ]}
      >
        <Text
          weight="semibold"
          style={[sheetStyles.permissionTitle, { color: colors.textPrimary }]}
        >
          {title}
        </Text>
        <Text color="textSecondary" style={sheetStyles.permissionSubtitle}>
          {strings.subtitle50}
        </Text>

        <View
          style={[
            sheetStyles.discountTimerPill,
            sheetStyles.discountTimerPillRow,
            { backgroundColor: SUBSCRIPTION_COLORS.TIMER_BADGE_BG },
          ]}
        >
          <AppImage
            source={Images.discountTimer}
            style={sheetStyles.discountTimerIcon}
            resizeMode="contain"
          />
          <Text
            variant="body"
            size="small"
            weight="medium"
            style={{ color: SUBSCRIPTION_COLORS.TIMER_BADGE_TEXT }}
          >
            {SUBSCRIPTION_TEXTS.intro.discountTimer.prefix} {timerText}
          </Text>
        </View>

        <PostAuthSubscriptionDisclosure
          plan={disclosurePlan}
          colors={paywallColors}
        />

        <PermissionPrimaryButton
          label={strings.ctaText}
          onPress={() => {
            onSubscribe();
            onClose();
          }}
          theme={theme}
        />
        <PermissionSecondaryButton
          label="Later"
          onPress={onClose}
          isDark={isDark}
        />
      </View>
    </View>
  );
}

function IdentificationMilestoneContent({
  count,
  onBackToHome,
  onClose,
  theme,
  insets,
}: {
  count: number;
  onBackToHome: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
  isDark: boolean;
  insets: { bottom: number };
}) {
  const strings = MODAL_STRINGS.modals.congratulations;
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <View style={sheetStyles.milestoneRoot}>
      <View
        style={[
          sheetStyles.milestoneTextCtaSection,
          {
            marginTop: "auto",
            paddingHorizontal: theme.spacing[6],
            paddingBottom: bottomPad,
          },
        ]}
      >
        <Text
          weight="semibold"
          style={[sheetStyles.milestoneTitle, { color: theme.colors.textPrimary }]}
        >
          {strings.title}
        </Text>
        <Text color="textSecondary" style={sheetStyles.milestoneSubtitle}>
          {formatString(strings.subtitle, {
            ordinal: getOrdinal(count),
          })}
        </Text>
        <View style={sheetStyles.milestoneCtaWrap}>
          <PermissionPrimaryButton
            label={strings.backToHomeButton}
            onPress={() => {
              onBackToHome();
              onClose();
            }}
            theme={theme}
            labelColor={theme.colors.onPrimary}
          />
        </View>
      </View>
    </View>
  );
}

/** Matches Ask AI composer input corner radius (Figma). */
const FEEDBACK_INPUT_BORDER_RADIUS = Radius["2xl"];

function FeedbackContent({
  rating,
  onSubmit,
  onClose,
  theme,
}: {
  rating?: number;
  onSubmit: (data: {
    name: string;
    email: string;
    feedback: string;
    rating?: number;
  }) => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const s = MODAL_STRINGS.feedbackModal;
  const isValid = feedback.length >= 10;
  const isEmailValid = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = isValid && isEmailValid;
  const handleSubmit = () => {
    onSubmit({ name, email, feedback, rating });
    setName("");
    setEmail("");
    setFeedback("");
    onClose();
  };
  const feedbackInputBg = theme.colors.textFieldBackground;
  const feedbackInputBorder = theme.colors.textFieldBorder;
  return (
    <View style={sheetStyles.feedbackRoot}>
      <View style={sheetStyles.feedbackContent}>
        <Text
          weight="semibold"
          color="textPrimary"
          style={sheetStyles.feedbackTitle}
        >
          {s.title}
        </Text>
        <Text color="textSecondary" style={sheetStyles.feedbackSubtitle}>
          {s.subtitle}
        </Text>
        <TextInput
          placeholder={s.namePlaceholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={name}
          onChangeText={setName}
          style={[
            sheetStyles.feedbackInput,
            {
              borderColor: feedbackInputBorder,
              backgroundColor: feedbackInputBg,
              color: theme.colors.text,
              borderRadius: FEEDBACK_INPUT_BORDER_RADIUS,
            },
          ]}
        />
        <TextInput
          placeholder={s.emailPlaceholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[
            sheetStyles.feedbackInput,
            {
              borderColor: feedbackInputBorder,
              backgroundColor: feedbackInputBg,
              color: theme.colors.text,
              borderRadius: FEEDBACK_INPUT_BORDER_RADIUS,
            },
          ]}
        />
        <TextInput
          placeholder={s.feedbackPlaceholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={4}
          maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
          style={[
            sheetStyles.feedbackInput,
            sheetStyles.feedbackMultiline,
            {
              borderColor: feedbackInputBorder,
              backgroundColor: feedbackInputBg,
              color: theme.colors.text,
              borderRadius: FEEDBACK_INPUT_BORDER_RADIUS,
            },
          ]}
        />
        <Text
          color="textSecondary"
          style={sheetStyles.feedbackCharCount}
        >
          {feedback.length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
        </Text>
        <Button
          title={s.submit}
          variant="primary"
          size="large"
          fullWidth
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={sheetStyles.feedbackBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: spacing[2],
    paddingBottom: 2,
    zIndex: 2,
  },
  topRowCloseRight: {
    justifyContent: "flex-end",
    paddingHorizontal: spacing[3],
  },
  handleContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetCloseButton: {
    width: 40,
    height: 40,
    marginLeft: -4,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  sheetCloseButtonRight: {
    marginLeft: 0,
    marginRight: -4,
  },
  /** Congratulations: X top-left, nudged slightly inward like Feedback. */
  milestoneCloseButton: {
    marginLeft: 8,
    marginTop: -2,
  },
  /** Rate Us: nudge X slightly right + down from the top-left corner */
  rateUsTopRow: {
    paddingHorizontal: spacing[4],
    minHeight: 48,
  },
  rateUsCloseButton: {
    marginLeft: 8,
    marginTop: 6,
  },
  /** Feedback: keep X on the left, nudged slightly inward from the edge */
  feedbackCloseButton: {
    marginLeft: 8,
  },
  /** Upgrade/limit-reached: circular X control, perfectly centered in the top-left corner */
  limitReachedTopRow: {
    position: "relative",
    minHeight: 48,
    paddingHorizontal: spacing[4],
    justifyContent: "center",
    alignItems: "flex-start",
  },
  limitReachedCloseButton: {
    position: "absolute",
    left: spacing[4],
    top: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 0,
    marginTop: 0,
    marginRight: 0,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  limitReachedCloseIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 44, height: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingTop: 0,
    paddingBottom: 10,
  },
  /** Create / rename collection: title + close on one row (Figma). */
  headerCreateCollection: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: spacing[4],
    minHeight: 44,
  },
  title: { flex: 1 },
  titleCreateCollection: {
    fontSize: 22,
    lineHeight: 28,
  },
  closeButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    marginRight: -4,
  },
  /** Rename/Create collection: close aligned with title row */
  closeButtonCreateCollection: {
    marginRight: 0,
    marginTop: 0,
    marginLeft: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: { width: 24, height: 24 },
  closeIconLarger: { width: 28, height: 28 },
  closeIconLargest: { width: 32, height: 32 },
  contentScroll: { flex: 1, minHeight: 0 },
  contentScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: spacing[4],
    paddingTop: 16,
  },
  /** Less top padding for custom payload (e.g. subscription sheet) – smaller gap below header row */
  contentScrollContentCustom: {
    paddingTop: 6,
  },
  /** Create / rename collection: minimal gap below header → subtitle */
  contentScrollContentCreateCollection: {
    paddingTop: 4,
  },
  /** Select / move collection sheets: flex body with pinned footer */
  collectionPickerContentHost: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  /** Change location and similar form sheets: no extra bottom inset (sheet handles safe area). */
  formLikeCustomContentHost: {
    paddingTop: 4,
    paddingBottom: 0,
  },
  /** Prevents scroll when sheet uses fixed content (feedback, report, etc.) */
  contentNoScroll: { overflow: "hidden" as const },
  limitReachedContentHost: {
    paddingHorizontal: 0,
    paddingTop: 0,
    flexGrow: 1,
  },
  permissionContentHost: {
    paddingHorizontal: 0,
    paddingTop: 0,
    flexGrow: 1,
  },
  rateUsScrollContent: {
    justifyContent: "flex-end",
  },
  feedbackScrollContent: {
    justifyContent: "flex-end",
  },
  /** Single fixed block: header + content, no scroll. */
  sheetBodyFixed: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden" as const,
    zIndex: 1,
  },
  communityRulesContainer: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  communityRulesNavBar: {
    paddingBottom: 12,
    paddingHorizontal: spacing[5],
  },
  communityRulesNavRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  communityRulesCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
  communityRulesCloseIcon: {
    width: 24,
    height: 24,
  },
  communityRulesCloseSpacer: {
    width: 40,
    height: 40,
  },
  communityRulesNavTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  communityRulesScrollWrap: {
    flex: 1,
    minHeight: 0,
  },
  communityRulesScrollView: {
    flex: 1,
    minHeight: 0,
  },
  communityRulesScrollContent: {
    paddingTop: 0,
    paddingBottom: 100,
    gap: 8,
  },
  communityRulesFooter: {
    paddingTop: 12,
    paddingHorizontal: spacing[5],
    borderTopWidth: 0,
  },
  communityRulesOkayButton: {
    borderRadius: 24,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
  },
  communityRulesOkayButtonText: {
    fontSize: 16,
    lineHeight: 24,
  },
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  updatedText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  welcomeIntro: {
    marginBottom: 0,
    lineHeight: 20,
    fontSize: 14,
  },
  communityRuleBlock: {
    gap: 8,
  },
  communityRuleTitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 0,
  },
  communityRuleText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 0,
    marginBottom: 0,
  },
  communityRulesFooterNote: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 0,
    marginBottom: 0,
  },
  /** Community rules: no extra top padding under the nav bar (Figma). */
  communityRulesContentHost: {
    paddingTop: 0,
    paddingHorizontal: spacing[5],
  },
});

const sheetStyles = StyleSheet.create({
  reportContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  reportTitle: { marginBottom: 12 },
  reportDesc: { marginBottom: 20, lineHeight: 22 },
  reportInput: {
    minHeight: 120,
    padding: spacing[4],
    fontSize: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 20,
  },
  reportBtn: { marginTop: "auto", marginBottom: 20 },
  limitRoot: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    justifyContent: "flex-end",
  },
  /** Text + CTA pinned to sheet bottom via marginTop: 'auto' on parent flex column. */
  limitTextCtaSection: {
    flexShrink: 0,
    width: "100%",
  },
  limitTitle: { textAlign: "center" },
  collectionLimitTitle: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  limitDesc: { textAlign: "center", lineHeight: 22, marginBottom: 16 },
  collectionLimitDesc: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  collectionLimitTextCtaSection: {
    paddingTop: 8,
  },
  identificationLimitTextCtaSection: {
    paddingTop: 0,
    marginTop: "auto",
  },
  identificationLimitDesc: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  birdOfDayLimitTextCtaSection: {
    paddingTop: 0,
    marginTop: "auto",
  },
  birdOfDayLimitDesc: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  limitBtn: { minHeight: 50, width: "100%" },
  limitCtaWrap: {
    marginTop: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  limitCtaBtnWrap: {
    width: "100%",
    alignSelf: "stretch",
  },
  createContent: {
    alignItems: "stretch",
  },
  createSubtext: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 0,
    marginBottom: 14,
    textAlign: "left",
  },
  createLabel: {
    marginBottom: 4,
    textAlign: "left",
    fontSize: 13,
  },
  createInput: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  createDesc: { minHeight: 80, textAlignVertical: "top" },
  createBtnWrap: { marginTop: 10, flexShrink: 0 },
  createBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  createBtnCancel: {
    flex: 1,
    minWidth: 0,
    borderRadius: 24,
    borderWidth: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnPrimary: { flex: 1, minWidth: 0 },
  rateContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 8,
    width: "100%",
  },
  permissionRoot: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  permissionBottomSection: {
    marginTop: "auto",
    flexShrink: 0,
    width: "100%",
  },
  milestoneRoot: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  milestoneTextCtaSection: {
    flexShrink: 0,
    width: "100%",
  },
  milestoneTitle: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 8,
  },
  milestoneSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  milestoneCtaWrap: {
    width: "100%",
  },
  permissionTitle: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionPrimaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
  },
  permissionSecondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
  },
  rateTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    lineHeight: 36,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
    width: "100%",
  },
  rateSubtitle: {
    marginTop: 6,
    marginBottom: 20,
    textAlign: "center",
    width: "100%",
  },
  starsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 320,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  rateStarHit: {
    width: 44,
    height: 44,
    flexShrink: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  rateStar: {
    width: 44,
    height: 44,
  },
  rateStarFilled: {
    position: "absolute",
    width: 44,
    height: 44,
  },
  rateStarHidden: {
    opacity: 0,
  },
  rateContinueSpacer: {
    height: 32,
  },
  rateStarsSpacer: {
    height: 0,
  },
  rateContinueBtn: {
    width: "100%",
    alignSelf: "center",
  },
  feedbackRoot: {
    width: "100%",
    flex: 1,
    minHeight: 0,
  },
  feedbackKeyboardRoot: { width: "100%", flexGrow: 1 },
  feedbackScroll: { flex: 1 },
  feedbackContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingTop: 40,
    paddingBottom: 8,
    width: "100%",
  },
  feedbackContentGrow: { flexGrow: 1 },
  feedbackTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    lineHeight: 36,
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
    width: "100%",
  },
  feedbackSubtitle: { marginBottom: 16, textAlign: "center", width: "100%" },
  feedbackInput: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  feedbackMultiline: { minHeight: 100, textAlignVertical: "top" },
  feedbackCharCount: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 8,
    fontSize: 12,
  },
  feedbackBtn: { marginTop: 16 },
  discountTimerRow: {
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  discountTimerLabel: {
    textAlign: "center",
  },
  discountRoot: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  discountComparisonScroll: {
    flex: 1,
    minHeight: 0,
  },
  discountComparisonScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  discountComparisonCard: {
    width: "100%",
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  discountComparisonSectionTitle: {
    marginBottom: spacing[3],
  },
  discountComparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  discountComparisonRowBorder: {
    borderTopWidth: 1,
  },
  discountComparisonCell: {
    flex: 1,
    justifyContent: "center",
  },
  discountComparisonCellWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountComparisonFeatureIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  discountComparisonCenterCell: {
    alignItems: "center",
  },
  discountComparisonPremiumHeader: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: COMPARISON_TABLE_COLORS.border,
  },
  discountComparisonPremiumCell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: COMPARISON_TABLE_COLORS.border,
  },
  discountComparisonPremiumBadge: {
    position: "absolute",
    top: -8,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  discountTimerPill: {
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    alignSelf: "center",
  },
  discountTimerPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discountTimerIcon: {
    width: 20,
    height: 20,
  },
  addToHeader: { marginBottom: 8 },
  addToHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  collectionPickerBody: {
    flex: 1,
    minHeight: 0,
  },
  collectionPickerList: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
  },
  collectionPickerFooter: {
    paddingTop: 16,
    gap: 16,
  },
  addToCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addToTitle: { fontSize: 21, fontFamily: FONTS.bold },
  addToSubtitle: { fontSize: 15, marginTop: 6 },
  addToLoading: { paddingVertical: 32, alignItems: "center" },
  addToScroll: { flexGrow: 0, flexShrink: 1 },
  addToScrollContent: { paddingBottom: 8 },
  addToRow: { flexDirection: "row", alignItems: "center" },
  addToAddNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 30,
    height: 50,
  },
  addToDone: { width: "100%", alignItems: "center", justifyContent: "center" },
  addToDoneWrap: { width: "100%" },
});
