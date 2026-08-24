/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) push notifications
 * Following banknote app pattern
 */

import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import { Platform } from "react-native";
import { analyticsService, EVENTS } from "../analytics/analytics.service";

// Lazy import Firebase Messaging
let messaging: any = null;
const getMessaging = async () => {
  if (!messaging) {
    try {
      messaging = require("@react-native-firebase/messaging").default;
    } catch (error) {
      console.error("Failed to import Firebase Messaging:", error);
      return null;
    }
  }
  return messaging;
};

/**
 * Map FCM data type to in-app notification type for the Notification Center list.
 */
const mapNotificationType = (
  dataType?: string
): "info" | "warning" | "success" | "error" => {
  if (!dataType) return "info";
  const t = dataType.toLowerCase();
  if (t === "error") return "error";
  if (t === "warning") return "warning";
  if (t === "success" || t === "like" || t === "comment" || t === "subscribe")
    return "success";
  return "info";
};

/**
 * Build actionUrl for in-app notification so tapping can navigate (e.g. to post).
 * Format: "post:<postId>" or "comment:<postId>:<commentId>" or "profile:<userId>"
 */
const buildActionUrl = (data?: Record<string, any>): string | undefined => {
  if (!data) return undefined;
  const postId = data.postId ?? data.post_id;
  const commentId = data.commentId ?? data.comment_id;
  const userId = data.userId ?? data.user_id;
  if (postId && commentId) return `comment:${postId}:${commentId}`;
  if (postId) return `post:${postId}`;
  if (userId) return `profile:${userId}`;
  return undefined;
};

/**
 * Setup foreground notification listener
 * 1. Displays local notification (banner) when app is in foreground
 * 2. Adds the same notification to the in-app Notification Center list (like, comment, subscribe) so User A sees it in the app
 *
 * Backend FCM payload for like/comment/subscribe should include:
 * - notification: { title, body }
 * - data: { type: "like" | "comment" | "subscribe", postId?, commentId?, userId? }
 * So when User B likes/comments/subscribes, the server sends FCM to User A and this handler both shows a banner and adds to the in-app list.
 */
export const setupForegroundNotificationListener = () => {
  let unsubscribe: (() => void) | null = null;

  getMessaging().then((messagingModule) => {
    if (!messagingModule) {
      return;
    }

    unsubscribe = messagingModule().onMessage(async (remoteMessage: any) => {
      console.log("Foreground notification received:", remoteMessage);
      const title = remoteMessage.notification?.title || "New Notification";
      const body = remoteMessage.notification?.body || "";
      const data = remoteMessage.data || {};

      try {
        analyticsService.logEvent(EVENTS.notification_received, {
          source: "foreground",
          has_data: !!remoteMessage?.data,
          type: data.type,
        });
      } catch (_) {}

      // Add to in-app Notification Center list (like, comment, subscribe, etc.) so User A sees it in the app
      try {
        const {
          useNotificationsStore,
        } = require("../../features/notifications/notifications.store");
        const notifType = mapNotificationType(data.type);
        const actionUrl = buildActionUrl(data);
        useNotificationsStore.getState().addNotification({
          title,
          body,
          type: notifType,
          ...(actionUrl && { actionUrl }),
        });
      } catch (e) {
        console.warn("Failed to add notification to in-app list:", e);
      }

      // Display local notification (system banner) via notifee
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: NOTIFICATION_CHANNEL_IDS.DEFAULT,
          smallIcon: "ic_launcher",
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
        },
        ios: {
          sound: "default",
          critical: true,
        },
        data: data as Record<string, string>,
      });
    });
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

/**
 * Setup notification tap listener (foreground)
 */
export const setupNotificationTapListener = () => {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log("Notification pressed:", detail);
      try {
        analyticsService.logEvent(EVENTS.notification_opened, {
          source: "foreground_tap",
          type: detail.notification?.data?.type,
        });
      } catch (_) {}
      // Navigation will be handled by RootNavigator
      // You can add custom navigation logic here based on notification data
      const notificationData = detail.notification?.data;
      if (notificationData) {
        handleNotificationNavigation(notificationData);
      }
    }
  });
};

/**
 * Setup background notification handler
 * Handles notifications when app is in background
 */
export const setupBackgroundNotificationHandler = () => {
  getMessaging().then((messagingModule) => {
    if (!messagingModule) {
      return;
    }

    messagingModule().onNotificationOpenedApp((remoteMessage: any) => {
      console.log("Background notification opened:", remoteMessage);
      try {
        analyticsService.logEvent(EVENTS.notification_opened, {
          source: "background",
          type: remoteMessage?.data?.type,
        });
      } catch (_) {}
      handleNotificationNavigation(remoteMessage.data);
    });
  });
};

/**
 * Setup initial notification handler
 * Handles notification that opened app from closed state
 */
export const setupInitialNotificationHandler = async () => {
  try {
    const messagingModule = await getMessaging();
    if (!messagingModule) {
      return;
    }

    const remoteMessage = await messagingModule().getInitialNotification();

    if (remoteMessage) {
      console.log("Initial notification:", remoteMessage);
      try {
        analyticsService.logEvent(EVENTS.notification_opened, {
          source: "killed_state",
          type: remoteMessage?.data?.type,
        });
      } catch (_) {}
      const data = remoteMessage.data;
      if (notificationPressHandler && data) {
        notificationPressHandler(data);
      } else if (data) {
        pendingInitialNotificationData = data;
      }
    }
  } catch (error) {
    console.error("Failed to get initial notification:", error);
  }
};

/**
 * Optional handler set by RootNavigator so FCM background/killed tap can navigate.
 * Called with notification data; RootNavigator passes a fn that performs navigation.
 */
let notificationPressHandler: ((data: Record<string, any>) => void) | null =
  null;
/** If app was opened from killed state by notification before handler was set, replay once handler is set. */
let pendingInitialNotificationData: Record<string, any> | null = null;

export const setNotificationPressHandler = (
  handler: ((data: Record<string, any>) => void) | null
) => {
  notificationPressHandler = handler;
  if (handler && pendingInitialNotificationData) {
    const data = pendingInitialNotificationData;
    pendingInitialNotificationData = null;
    handler(data);
  }
};

const handleNotificationNavigation = (data?: Record<string, any>) => {
  if (!data) return;
  console.log("Notification navigation:", {
    type: data.type,
    id: data.id || data.postId || data.commentId,
  });
  if (notificationPressHandler) {
    notificationPressHandler(data);
  }
};

/**
 * Single common channel ID for all notifications (Android).
 * Keeps one channel so users manage one notification category in system settings.
 */
export const NOTIFICATION_CHANNEL_IDS = {
  DEFAULT: "default",
} as const;

/**
 * Create the single default notification channel (Android).
 * All notifications (push, scheduled, reminders) use this channel.
 */
export const createNotificationChannels = async () => {
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_IDS.DEFAULT,
      name: "Notifications",
      description: "All app notifications",
      sound: "default",
      importance: AndroidImportance.HIGH,
    });
  }
};

/**
 * Initialize push notification service
 * Should be called on app startup
 */
export const initializePushNotificationService = async () => {
  try {
    // Create notification channels (Android)
    await createNotificationChannels();

    // Setup foreground listener (shows in-app notification when FCM message received in foreground)
    setupForegroundNotificationListener();

    // Foreground tap is handled by RootNavigator (notifee.onForegroundEvent) to avoid double navigation
    // setupNotificationTapListener();

    // Setup background handler
    setupBackgroundNotificationHandler();

    // Setup initial notification handler
    await setupInitialNotificationHandler();

    console.log("Push notification service initialized");
  } catch (error) {
    console.error("Error initializing push notification service:", error);
  }
};
