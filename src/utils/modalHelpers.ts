/**
 * Modal Helper Functions
 *
 * Use with INDIVIDUAL modal components only. DynamicModal/DynamicBottomSheet
 * are not used in production; each flow has its own component.
 *
 * Component mapping:
 * - getCongratulationsModalConfig  → <CongratulationsModal visible {...config} />
 * - getCouldNotIdentifyModalConfig  → <CouldNotIdentifyModal visible {...config} />
 * - getUnlimitedChatsModalConfig   → <UpgradeModal visible {...config} />
 * - getUnlimitedMushroomsModalConfig   → <UpgradeModal visible {...config} />
 * - getFreeCollectionModalConfig   → <UpgradeModal visible {...config} />
 * - getAdvancedMushroomDetailsModalConfig → <UpgradeModal visible {...config} />
 * - getEnableGalleryPopupConfig    → <PermissionModal visible permissionType="storage" {...config} />
 * - getEnableCameraPopupConfig     → <PermissionModal visible permissionType="camera" {...config} />
 * - getRateUsBottomSheetConfig     → Use <RateUsModal /> (stars + onLowRating/onHighRating)
 * - getFeedbackBottomSheetConfig   → Use <FeedbackModal /> (form)
 * - getSubscriptionBottomSheetConfig → Use subscription screen or UpgradeModal
 * - getDiscountModalConfig         → Use <SmallDiscountModal /> or DiscountModalScreen
 */

import type { CongratulationsModalProps } from "../molecules/Modal/CongratulationsModal";
import type {
  CouldNotIdentifyModalProps,
  CouldNotIdentifyModalButton,
} from "../molecules/Modal/CouldNotIdentifyModal";
import type { UpgradeModalProps } from "../molecules/Modal/UpgradeModal";
import type { PermissionModalProps } from "../molecules/Modal/PermissionModal";
import { MODAL_STRINGS } from "../config/strings/modals.strings";
import {
  requestStoragePermission,
  requestCameraPermission,
} from "../services/permissions/permission.service";
import { markUserRated } from "../services/session/sessionModalOrchestrator.service";
import { Linking, Platform } from "react-native";
import { getAppStoreUrl } from "../constants/appStoreConstants";
import InAppReview from "react-native-in-app-review";
import { useAppLogsStore } from "../features/app-logs/app-logs.store";
import { navigateToSubscriptionMain } from "./navigation";
import { analyticsService } from "../services/analytics/analytics.service";
import { EVENTS } from "../services/analytics/analytics.events";

/** Config for CongratulationsModal (omit visible; add when rendering). */
export const getCongratulationsModalConfig = (
  count: number,
  onClose: () => void,
  onBackToHome: () => void
): Omit<CongratulationsModalProps, "visible"> => ({
  onClose,
  count,
  onBackToHome,
});

/** Config for UpgradeModal (unlimited chats). */
export const getUnlimitedChatsModalConfig = (
  onClose: () => void,
  navigation: { navigate: (name: string) => void }
): Omit<UpgradeModalProps, "visible"> => {
  const strings = MODAL_STRINGS.modals.unlimitedChats;
  return {
    onClose,
    title: strings.title,
    subtitle: strings.subtitle,
    onUpgrade: () => {
      navigateToSubscriptionMain();
      onClose();
    },
  };
};

/** Config for UpgradeModal (unlimited mushrooms). */
export const getUnlimitedMushroomsModalConfig = (
  onClose: () => void,
  navigation: { navigate: (name: string) => void }
): Omit<UpgradeModalProps, "visible"> => {
  const strings = MODAL_STRINGS.modals.unlimitedMushrooms;
  return {
    onClose,
    title: strings.title,
    subtitle: strings.subtitle,
    onUpgrade: () => {
      navigateToSubscriptionMain();
      onClose();
    },
  };
};

/** Config for UpgradeModal (free collection). */
export const getFreeCollectionModalConfig = (
  onClose: () => void,
  navigation: { navigate: (name: string) => void }
): Omit<UpgradeModalProps, "visible"> => {
  const strings = MODAL_STRINGS.modals.freeCollection;
  return {
    onClose,
    title: strings.title,
    subtitle: strings.subtitle,
    onUpgrade: () => {
      navigateToSubscriptionMain();
      onClose();
    },
  };
};

/** Config for UpgradeModal (advanced mushroom details). */
export const getAdvancedMushroomDetailsModalConfig = (
  onClose: () => void,
  navigation: { navigate: (name: string) => void }
): Omit<UpgradeModalProps, "visible"> => {
  const strings = MODAL_STRINGS.modals.advanceBirdDetails;
  return {
    onClose,
    title: strings.title,
    subtitle: strings.subtitle,
    onUpgrade: () => {
      navigateToSubscriptionMain();
      onClose();
    },
  };
};

/** Config for CouldNotIdentifyModal. */
export const getCouldNotIdentifyModalConfig = (
  onClose: () => void,
  onRetake?: () => void,
  onTryAgain?: () => void
): Omit<CouldNotIdentifyModalProps, "visible"> => {
  const strings = MODAL_STRINGS.modals.couldNotIdentify;
  const buttons: CouldNotIdentifyModalButton[] = [];

  if (onRetake) {
    buttons.push({
      label: strings.retakeButton,
      variant: "primary",
      onPress: onRetake,
    });
  }

  if (onTryAgain) {
    buttons.push({
      label: strings.tryAgainButton,
      variant: "outline",
      onPress: onTryAgain,
    });
  }

  return {
    onClose,
    title: strings.title,
    subtitle: strings.subtitle,
    buttons,
  };
};

/** Config for NotificationPermissionPopup-style flow. Use <NotificationPermissionPopup /> for UI. */
export const getEnablePushNotificationsBottomSheetConfig = (
  onClose: () => void,
  onSuccess?: () => void
): { onClose: () => void; onSuccess?: () => void } => ({
  onClose,
  onSuccess,
});

/** NotificationPermissionPopup handles request internally; use that component. */

/** Config for PermissionModal (gallery). */
export const getEnableGalleryPopupConfig = (
  onClose: () => void,
  onSuccess?: () => void
): Omit<PermissionModalProps, "visible"> => ({
  onClose,
  permissionType: "storage",
  onGrant: async () => {
    const result = await requestStoragePermission();
    if (result.granted) {
      onSuccess?.();
    }
    onClose();
  },
});

/** Config for PermissionModal (camera). */
export const getEnableCameraPopupConfig = (
  onClose: () => void,
  onSuccess?: () => void
): Omit<PermissionModalProps, "visible"> => ({
  onClose,
  permissionType: "camera",
  onGrant: async () => {
    const result = await requestCameraPermission();
    if (result.granted) {
      onSuccess?.();
    }
    onClose();
  },
});

/**
 * Rate Us: use <RateUsModal /> with onLowRating / onHighRating.
 * To open store and mark rated, use this helper or call markUserRated + Linking.openURL.
 */
export const getRateUsBottomSheetConfig = (
  onClose: () => void,
  onRated?: () => void
): { onClose: () => void; onRated?: () => void } => ({
  onClose,
  onRated,
});

/** Delay (ms) after closing the rate sheet before Play/StoreKit in-app review UI. */
const IN_APP_REVIEW_DELAY_MS = 650;

const delayBeforeReviewPrompt = (): Promise<void> =>
  new Promise<void>((resolve) =>
    setTimeout(() => resolve(), IN_APP_REVIEW_DELAY_MS)
  );

const openPlayStoreListing = async (
  reason: string
): Promise<boolean> => {
  const log = useAppLogsStore.getState();
  try {
    const storeUrl = getAppStoreUrl();
    log.info("[RateUs] Opening store URL", {
      platform: Platform.OS,
      reason,
      storeUrl,
    });
    await Linking.openURL(storeUrl);
    await markUserRated();
    log.info("[RateUs] Store URL opened successfully");
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error("[RateUs] Error opening app store for rating", {
      platform: Platform.OS,
      reason,
      message: errMsg,
    });
    return false;
  }
};

/**
 * Open native in-app rating (Android: Play In-App Review, iOS: StoreKit).
 * Used by RateUsModal onHighRating for both entry points (Settings + session modal).
 *
 * Android: tries In-App Review first, then always opens the Play Store listing.
 * Google often completes the API without showing UI (quota / suppression), especially
 * after the custom star sheet — Play Store is the reliable destination for "Rate Now".
 *
 * iOS: StoreKit in-app review; opens App Store URL only if the native API throws.
 *
 * A short delay lets the rate sheet finish dismissing before the review UI / store opens.
 */
export const openAppStoreForRating = async (): Promise<void> => {
  const log = useAppLogsStore.getState();
  log.info("[RateUs] openAppStoreForRating started", { platform: Platform.OS });

  log.debug("[RateUs] Waiting before review prompt", {
    platform: Platform.OS,
    delayMs: IN_APP_REVIEW_DELAY_MS,
  });
  await delayBeforeReviewPrompt();

  const isAvailable =
    typeof InAppReview.isAvailable === "function" &&
    InAppReview.isAvailable();
  log.info("[RateUs] InAppReview.isAvailable", {
    platform: Platform.OS,
    isAvailable,
  });

  if (Platform.OS === "android") {
    try {
      log.info("[RateUs] Calling InAppReview.RequestInAppReview");
      analyticsService.logEvent(EVENTS.native_rate_open);
      const result = await InAppReview.RequestInAppReview();
      log.info("[RateUs] In-app review flow finished", {
        result,
        note: "dialog visibility unknown; opening Play Store next",
      });
      analyticsService.logEvent(EVENTS.native_rate_give, {
        result: String(result),
      });
    } catch (e) {
      const err = e as { code?: string | number; message?: string };
      const msg = err?.message ?? (e instanceof Error ? e.message : String(e));
      const code = err?.code != null ? String(err.code) : "";
      log.warn("[RateUs] In-app review failed, opening Play Store", {
        code: code || undefined,
        message: msg,
      });
    }
    await openPlayStoreListing("android_post_in_app_attempt");
    return;
  }

  if (isAvailable) {
    try {
      log.info("[RateUs] Calling InAppReview.RequestInAppReview");
      analyticsService.logEvent(EVENTS.native_rate_open);
      const result = await InAppReview.RequestInAppReview();
      log.info("[RateUs] In-app review flow finished", { result });
      analyticsService.logEvent(EVENTS.native_rate_give, {
        result: String(result),
      });
      await markUserRated();
      return;
    } catch (e) {
      const err = e as { code?: string | number; message?: string };
      const msg = err?.message ?? (e instanceof Error ? e.message : String(e));
      const code = err?.code != null ? String(err.code) : "";
      log.warn("[RateUs] In-app review failed, falling back to store", {
        code: code || undefined,
        message: msg,
      });
    }
  }

  await openPlayStoreListing("ios_fallback");
};

/**
 * Feedback: use <FeedbackModal /> with visible, onClose, onSubmit.
 * This config is for reference only; FeedbackModal has its own form.
 */
export const getFeedbackBottomSheetConfig = (
  onClose: () => void,
  _onSubmit: (data: {
    name: string;
    email: string;
    feedback: string;
    rating?: number;
  }) => void,
  _rating?: number
): { onClose: () => void } => ({
  onClose,
});

/**
 * Subscription prompt: use UpgradeModal or navigate to Subscription screen.
 */
export const getSubscriptionBottomSheetConfig = (
  onClose: () => void,
  _navigation: { navigate: (name: string) => void }
): { onClose: () => void; onUpgrade: () => void } => ({
  onClose,
  onUpgrade: () => {
    navigateToSubscriptionMain();
    onClose();
  },
});

/** @deprecated Use getUnlimitedMushroomsModalConfig */
export const getUnlimitedRocksModalConfig = getUnlimitedMushroomsModalConfig;

/** @deprecated Use getAdvancedMushroomDetailsModalConfig */
export const getAdvancedRockDetailsModalConfig =
  getAdvancedMushroomDetailsModalConfig;

/**
 * Discount: use <SmallDiscountModal /> or DiscountModalScreen. Returns title/subtitle/CTA for reference.
 */
export const getDiscountModalConfig = (
  percentage: 50 | 70,
  onClose: () => void,
  onSubscribe: () => void
): {
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubscribe: () => void;
} => {
  const strings = MODAL_STRINGS.discount;
  return {
    title: percentage === 70 ? strings.title70 : strings.title50,
    subtitle: percentage === 70 ? strings.subtitle70 : strings.subtitle50,
    onClose,
    onSubscribe: () => {
      onSubscribe();
      onClose();
    },
  };
};
