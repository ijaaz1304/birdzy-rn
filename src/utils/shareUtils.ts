/**
 * Sharing Utilities
 * Centralized sharing functionality for mushrooms, posts, etc.
 */

import { Share, Platform, InteractionManager } from "react-native";
import { showAlert } from "../store/alert.store";
import { analyticsService } from "../services/analytics/analytics.service";
import { EVENTS } from "../services/analytics/analytics.events";
import { getAppStoreUrl } from "../constants/appStoreConstants";
import { DEFAULT_APP_DISPLAY_NAME } from "../constants/branding";
import { useAppLogsStore } from "../features/app-logs/app-logs.store";

const SHARE_LOG = "[Share]";

export interface ShareContent {
  title?: string;
  message: string;
  url?: string;
}

/** Get current platform app store URL (from Remote Config when set, else default). Call at use time for latest value. */
export { getAppStoreUrl };

/**
 * iOS uses `ActionSheetManager.showShareActionSheetWithOptions`. If we call `Share.share` while another
 * RN `Modal` / overlay is still dismissing, the sheet often never appears and the Promise never resolves.
 * Wait until interactions + a short delay so the root VC can present the activity controller.
 */
function waitForIosShareSlot(
  log: ReturnType<typeof useAppLogsStore.getState>
): Promise<void> {
  if (Platform.OS !== "ios") return Promise.resolve();
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        log.info(`${SHARE_LOG} ios share presentation slot ready`);
        resolve();
      }, 550);
    });
  });
}

/**
 * iOS: do not pass remote image URLs as `url` (hangs). Prefer `message` only; include links in text.
 * RN Share.js iOS path ignores `title` on `content` — only `message` / `url` go to the native sheet.
 */

/**
 * Share mushroom details (includes app link so recipients can open or download the app)
 */
export const shareMushroom = async (
  mushroomName: string,
  scientificName?: string,
  imageUrl?: string
): Promise<void> => {
  const log = useAppLogsStore.getState();
  const storeUrl = getAppStoreUrl();
  log.info(`${SHARE_LOG} shareMushroom start`, {
    platform: Platform.OS,
    nameLen: mushroomName?.length ?? 0,
    hasScientific: !!scientificName,
    hasImageUrl: !!imageUrl?.trim(),
    iosMessageOnly: Platform.OS === "ios",
  });
  try {
    await waitForIosShareSlot(log);
    const text = scientificName
      ? `Check out ${mushroomName} (${scientificName}) in the ${DEFAULT_APP_DISPLAY_NAME} app!`
      : `Check out ${mushroomName} in the ${DEFAULT_APP_DISPLAY_NAME} app!`;
    let message = `${text}\n\n${storeUrl}`;
    const trimmedImg = imageUrl?.trim();
    if (trimmedImg) {
      message += `\n\n${trimmedImg}`;
    }

    const result =
      Platform.OS === "ios"
        ? await Share.share({ message })
        : await Share.share({
            message,
            title: mushroomName,
          });

    log.info(`${SHARE_LOG} shareMushroom result`, {
      action: result.action,
      activityType: (result as { activityType?: string }).activityType,
    });

    if (result.action === Share.sharedAction) {
      analyticsService.logEvent(EVENTS.content_share_success, {
        content_type: "mushroom",
        platform: Platform.OS,
      });
      return;
    }
    if (result.action === Share.dismissedAction) {
      analyticsService.logEvent(EVENTS.content_share_cancelled, {
        content_type: "mushroom",
        platform: Platform.OS,
      });
      return;
    }
  } catch (error) {
    analyticsService.logEvent(EVENTS.content_share_cancelled, {
      content_type: "mushroom",
      platform: Platform.OS,
    });
    log.error(`${SHARE_LOG} shareMushroom error`, {
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("Error sharing mushroom:", error);
    showAlert("Error", "Failed to share. Please try again.");
  }
};

/**
 * Share post from feed
 */
export const sharePost = async (
  postId: string,
  content: string,
  imageUrl?: string
): Promise<void> => {
  const log = useAppLogsStore.getState();
  log.info(`${SHARE_LOG} sharePost start`, {
    postIdSuffix: postId?.slice(-8),
    contentLen: content?.length ?? 0,
    hasImageUrl: !!imageUrl?.trim(),
  });
  try {
    await waitForIosShareSlot(log);
    let message = `${content}\n\nShared from ${DEFAULT_APP_DISPLAY_NAME} app!`;
    const trimmedPostImg = imageUrl?.trim();
    if (trimmedPostImg) {
      message += `\n\n${trimmedPostImg}`;
    }
    if (Platform.OS === "ios") {
      message += `\n\n${getAppStoreUrl()}`;
    }

    const result =
      Platform.OS === "ios"
        ? await Share.share({ message })
        : await Share.share({
            message,
            title: "Share Post",
          });

    log.info(`${SHARE_LOG} sharePost result`, { action: result.action });

    if (result.action === Share.sharedAction) {
      analyticsService.logEvent(EVENTS.content_share_success, {
        content_type: "post",
        platform: Platform.OS,
      });
      return;
    }
    if (result.action === Share.dismissedAction) {
      analyticsService.logEvent(EVENTS.content_share_cancelled, {
        content_type: "post",
        platform: Platform.OS,
      });
    }
  } catch (error) {
    log.error(`${SHARE_LOG} sharePost error`, {
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("Error sharing post:", error);
    showAlert("Error", "Failed to share. Please try again.");
  }
};

/**
 * Share app
 */
export const shareApp = async (): Promise<void> => {
  const log = useAppLogsStore.getState();
  log.info(`${SHARE_LOG} shareApp start`, { platform: Platform.OS });
  try {
    await waitForIosShareSlot(log);
    const store = getAppStoreUrl();
    const msg = `Check out the ${DEFAULT_APP_DISPLAY_NAME} app! Discover and identify birds.\n\n${store}`;
    const result =
      Platform.OS === "ios"
        ? await Share.share({ message: msg })
        : await Share.share({
            message: msg,
            title: `${DEFAULT_APP_DISPLAY_NAME} App`,
            url: store,
          });
    log.info(`${SHARE_LOG} shareApp completed`, {
      action: (result as { action?: string }).action,
    });
  } catch (error) {
    log.error(`${SHARE_LOG} shareApp error`, {
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("Error sharing app:", error);
    showAlert("Error", "Failed to share. Please try again.");
  }
};

/**
 * Generic share function
 */
export const shareContent = async (content: ShareContent): Promise<void> => {
  const log = useAppLogsStore.getState();
  log.info(`${SHARE_LOG} shareContent start`, {
    titleLen: content.title?.length ?? 0,
    messageLen: content.message?.length ?? 0,
    hasUrl: !!content.url,
  });
  try {
    await waitForIosShareSlot(log);
    let message = content.message;
    if (content.url?.trim()) {
      message = `${message}\n\n${content.url.trim()}`;
    }
    if (Platform.OS === "ios") {
      message = `${message}\n\n${getAppStoreUrl()}`;
    }
    const result =
      Platform.OS === "ios"
        ? await Share.share({ message })
        : await Share.share({
            message,
            title: content.title,
          });
    log.info(`${SHARE_LOG} shareContent result`, { action: result.action });
    if (result.action === Share.sharedAction) {
      analyticsService.logEvent(EVENTS.content_share_success, {
        content_type: "content",
        platform: Platform.OS,
      });
    } else if (result.action === Share.dismissedAction) {
      analyticsService.logEvent(EVENTS.content_share_cancelled, {
        content_type: "content",
        platform: Platform.OS,
      });
    }
  } catch (error) {
    log.error(`${SHARE_LOG} shareContent error`, {
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("Error sharing content:", error);
    showAlert("Error", "Failed to share. Please try again.");
  }
};
