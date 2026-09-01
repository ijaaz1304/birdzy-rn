/**
 * Local Push Notification Service
 * Handles scheduling and managing local notifications for mineral/rock reminders
 * Includes subscription-aware notification handling
 */

import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
} from "@notifee/react-native";
import { Platform } from "react-native";
import { checkNotificationPermission } from "../permissions";
import { useAuthStore } from "../../features/auth/auth.store";
import { NOTIFICATION_CHANNEL_IDS } from "./pushNotification.service";

export interface ReminderNotificationData {
  id: string;
  mushroomId: string; // Changed from plantId
  mushroomName: string; // Changed from plantName
  reminderType:
    | "watering"
    | "misting"
    | "fertilizing"
    | "rotating"
    | "cleaning"
    | "charging";
  scheduledTime: Date;
  repeat?: "everyday" | "every2days" | "every2weeks" | "everymonth";
  waterAmount?: string;
  waterUnit?: string;
  notes?: string;
}

/**
 * Check if user has active subscription for notification features
 */
const checkSubscriptionForNotifications = (): boolean => {
  try {
    const user = useAuthStore.getState().user;
    // Check if user is subscribed (premium features may include advanced notifications)
    return user?.isSubscribed ?? false;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
};

/**
 * Check notification permission only (never shows native dialog).
 * Use this for scheduling/initialization. The native permission request
 * must only be triggered from our custom NotificationPermissionPopup when user taps Allow.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const result = await checkNotificationPermission();
    return result.granted;
  } catch (error) {
    console.error("Error checking notification permission:", error);
    return false;
  }
};

/**
 * Create the default notification channel (Android only).
 * Uses the same common channel as push and scheduled notifications.
 */
export const createNotificationChannel = async (): Promise<string> => {
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_IDS.DEFAULT,
      name: "Notifications",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    });
    return NOTIFICATION_CHANNEL_IDS.DEFAULT;
  }
  return NOTIFICATION_CHANNEL_IDS.DEFAULT;
};

/**
 * Get reminder type emoji/icon
 */
const getReminderTypeIcon = (
  type: ReminderNotificationData["reminderType"]
): string => {
  switch (type) {
    case "watering":
      return "💧";
    case "misting":
      return "🌫️";
    case "fertilizing":
      return "🌿";
    case "rotating":
      return "🔄";
    case "cleaning":
      return "✨";
    case "charging":
      return "⚡";
    default:
      return "💎";
  }
};

/**
 * Get reminder type title
 */
const getReminderTypeTitle = (
  type: ReminderNotificationData["reminderType"]
): string => {
  switch (type) {
    case "watering":
      return "Watering Reminder";
    case "misting":
      return "Misting Reminder";
    case "fertilizing":
      return "Fertilizing Reminder";
    case "rotating":
      return "Rotating Reminder";
    case "cleaning":
      return "Cleaning Reminder";
    case "charging":
      return "Charging Reminder";
    default:
      return "Birding Reminder";
  }
};

/**
 * Calculate next trigger date based on repeat option
 */
const calculateNextTriggerDate = (
  baseDate: Date,
  repeat?: ReminderNotificationData["repeat"]
): Date => {
  const nextDate = new Date(baseDate);

  switch (repeat) {
    case "everyday":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "every2days":
      nextDate.setDate(nextDate.getDate() + 2);
      break;
    case "every2weeks":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "everymonth":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      // No repeat, just use the base date
      break;
  }

  return nextDate;
};

/**
 * Schedule a local notification for a reminder
 * Handles subscription status - free users may have limited notification features
 */
export const scheduleReminderNotification = async (
  reminder: ReminderNotificationData
): Promise<string | null> => {
  try {
    // Check subscription status for advanced notification features
    const isSubscribed = checkSubscriptionForNotifications();

    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return null;
    }

    // For free users, you might want to limit certain notification types
    // This is a placeholder - adjust based on your subscription model
    if (!isSubscribed && reminder.reminderType === "charging") {
      console.warn("Charging reminders require subscription");
      // You can either return null or allow it based on your business logic
    }

    // Create channel (Android)
    const channelId = await createNotificationChannel();

    // Build notification body
    let body = `Time to ${reminder.reminderType} your ${reminder.mushroomName}`;
    if (
      reminder.reminderType === "watering" &&
      reminder.waterAmount &&
      reminder.waterUnit
    ) {
      body = `Time to water ${reminder.mushroomName} with ${reminder.waterAmount}${reminder.waterUnit}`;
    }
    if (reminder.notes) {
      body += `\n${reminder.notes}`;
    }

    // Calculate trigger time
    const triggerDate = reminder.scheduledTime;
    const now = new Date();

    // If the scheduled time is in the past, schedule for next occurrence based on repeat
    let actualTriggerDate = triggerDate;
    if (triggerDate < now && reminder.repeat) {
      actualTriggerDate = calculateNextTriggerDate(
        triggerDate,
        reminder.repeat
      );
    }

    // Create trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: actualTriggerDate.getTime(),
    };

    // Schedule notification
    const notificationId = await notifee.createTriggerNotification(
      {
        id: reminder.id,
        title: `${getReminderTypeIcon(
          reminder.reminderType
        )} ${getReminderTypeTitle(reminder.reminderType)}`,
        body,
        data: {
          reminderId: reminder.id,
          mushroomId: reminder.mushroomId,
          reminderType: reminder.reminderType,
          screen: "Collection",
          params: JSON.stringify({
            screen: "CollectionMain",
            params: {
              initialTab: "reminders",
            },
          }),
        },
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
        },
        ios: {
          sound: "default",
        },
      },
      trigger
    );

    console.log(
      `Scheduled notification ${notificationId} for ${actualTriggerDate.toISOString()}`
    );
    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelReminderNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await notifee.cancelNotification(notificationId);
    console.log(`Cancelled notification ${notificationId}`);
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await notifee.cancelAllNotifications();
    console.log("Cancelled all notifications");
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    const notifications = await notifee.getTriggerNotifications();
    return notifications;
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
};

/**
 * Initialize notification service
 * Should be called on app startup
 * Handles subscription-aware initialization
 * Also initializes push notification service
 */
export const initializeNotificationService = async (): Promise<void> => {
  try {
    // Check subscription status
    const isSubscribed = checkSubscriptionForNotifications();

    // Request permission
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      console.warn(
        "Notification permission not granted - notifications will not work"
      );
      return;
    }

    // Create channel (Android)
    await createNotificationChannel();

    // Initialize push notification service (FCM)
    try {
      const {
        initializePushNotificationService,
      } = require("./pushNotification.service");
      await initializePushNotificationService();
    } catch (error) {
      console.warn(
        "Push notification service not available (messaging package may not be installed):",
        error
      );
    }

    // Set up notification handlers for subscription changes
    // This ensures notifications work correctly when subscription status changes
    if (isSubscribed) {
      console.log(
        "Notification service initialized with subscription features"
      );
    } else {
      console.log("Notification service initialized (free tier)");
    }
  } catch (error) {
    console.error("Error initializing notification service:", error);
    throw error;
  }
};

/**
 * Refresh notification service when subscription status changes
 * Call this when user subscribes/unsubscribes
 */
export const refreshNotificationService = async (): Promise<void> => {
  try {
    const isSubscribed = checkSubscriptionForNotifications();

    // Cancel all existing notifications if unsubscribed
    // (or adjust based on your business logic)
    if (!isSubscribed) {
      // You might want to cancel premium-only notifications
      // For now, we'll keep all notifications active
      console.log("Subscription status changed - notifications remain active");
    } else {
      console.log("Subscription active - all notification features enabled");
    }
  } catch (error) {
    console.error("Error refreshing notification service:", error);
  }
};
