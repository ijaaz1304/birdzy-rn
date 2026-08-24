/**
 * Scheduled Inactivity Notifications Service
 * Handles scheduling 2-day and 5-day inactivity reminder notifications
 *
 * Notifications are scheduled after successful identification and rescheduled
 * when user becomes active again.
 */

import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestNotificationPermission } from "./notification.service";
import { getRemoteConfigValue } from "../remoteConfig";
import { NOTIFICATION_CHANNEL_IDS } from "./pushNotification.service";

// Notification IDs
const INACTIVITY_2_DAY_NOTIFICATION_ID = "inactivity-2-day";
const INACTIVITY_5_DAY_NOTIFICATION_ID = "inactivity-5-day";

// Storage keys
const INACTIVITY_2_DAY_SCHEDULED_KEY = "inactivity-2-day-scheduled";
const INACTIVITY_5_DAY_SCHEDULED_KEY = "inactivity-5-day-scheduled";
const LAST_ACTIVITY_TIMESTAMP_KEY = "last_activity_timestamp";

/**
 * Schedule 2-day inactivity notification
 */
export const schedule2DayInactivityNotification = async (): Promise<void> => {
  try {
    // Check notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      if (__DEV__) {
        console.log(
          "Notification permission not granted, skipping 2-day notification"
        );
      }
      return;
    }

    // Get interval from Remote Config (default: 2 days)
    const intervalDays = getRemoteConfigValue(
      "identificationReminderIntervalDays"
    );

    // Calculate trigger time (2 days from now)
    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + intervalDays);

    // Cancel existing notification if any
    await notifee.cancelNotification(INACTIVITY_2_DAY_NOTIFICATION_ID);

    // Schedule notification (spec: "Identify more notes!" → rocks/minerals)
    await notifee.createTriggerNotification(
      {
        id: INACTIVITY_2_DAY_NOTIFICATION_ID,
        title: "Identify more birds!",
        body: "It's been a few days since you last identified a bird. Try now?",
        android: {
          channelId: NOTIFICATION_CHANNEL_IDS.DEFAULT,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
          autoCancel: true,
          largeIcon: "ic_launcher", // App logo on left (as per spec)
          smallIcon: "ic_launcher",
        },
        ios: {
          sound: "default",
          // iOS displays app icon automatically in notifications
          // For custom images, use attachments with a URL or local file path
        },
        data: {
          type: "identification_inactivity",
          days: intervalDays.toString(),
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
      } as TimestampTrigger
    );

    // Store scheduling timestamp
    await AsyncStorage.setItem(
      INACTIVITY_2_DAY_SCHEDULED_KEY,
      Date.now().toString()
    );

    if (__DEV__) {
      console.log(
        `✅ Scheduled 2-day inactivity notification for ${triggerDate.toISOString()}`
      );
    }
  } catch (error) {
    console.warn("Failed to schedule 2-day inactivity notification:", error);
  }
};

/**
 * Schedule 5-day inactivity notification
 */
export const schedule5DayInactivityNotification = async (): Promise<void> => {
  try {
    // Check notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      if (__DEV__) {
        console.log(
          "Notification permission not granted, skipping 5-day notification"
        );
      }
      return;
    }

    // Calculate trigger time (5 days from now)
    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + 5);

    // Cancel existing notification if any
    await notifee.cancelNotification(INACTIVITY_5_DAY_NOTIFICATION_ID);

    // Schedule notification (spec: "Identify and Evaluate banknotes" → rocks/minerals)
    await notifee.createTriggerNotification(
      {
        id: INACTIVITY_5_DAY_NOTIFICATION_ID,
        title: "Identify birds near you",
        body: "It's been a while since your last identification. Open the app and spot something new today.",
        android: {
          channelId: NOTIFICATION_CHANNEL_IDS.DEFAULT,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
          autoCancel: true,
          largeIcon: "ic_launcher", // App logo on left (as per spec)
          smallIcon: "ic_launcher",
        },
        ios: {
          sound: "default",
          // iOS displays app icon automatically in notifications
          // For custom images, use attachments with a URL or local file path
        },
        data: {
          type: "identification_inactivity",
          days: "5",
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
      } as TimestampTrigger
    );

    // Store scheduling timestamp
    await AsyncStorage.setItem(
      INACTIVITY_5_DAY_SCHEDULED_KEY,
      Date.now().toString()
    );

    if (__DEV__) {
      console.log(
        `✅ Scheduled 5-day inactivity notification for ${triggerDate.toISOString()}`
      );
    }
  } catch (error) {
    console.warn("Failed to schedule 5-day inactivity notification:", error);
  }
};

/**
 * Reschedule inactivity notifications
 * Called after successful identification to reset the timers
 */
export const rescheduleInactivityNotifications = async (): Promise<void> => {
  try {
    // Update last activity timestamp
    await AsyncStorage.setItem(
      LAST_ACTIVITY_TIMESTAMP_KEY,
      Date.now().toString()
    );

    // Cancel existing notifications
    await notifee.cancelNotification(INACTIVITY_2_DAY_NOTIFICATION_ID);
    await notifee.cancelNotification(INACTIVITY_5_DAY_NOTIFICATION_ID);

    // Reschedule both notifications
    await schedule2DayInactivityNotification();
    await schedule5DayInactivityNotification();

    if (__DEV__) {
      console.log("✅ Rescheduled inactivity notifications");
    }
  } catch (error) {
    console.warn("Failed to reschedule inactivity notifications:", error);
  }
};

/**
 * Cancel all inactivity notifications
 */
export const cancelInactivityNotifications = async (): Promise<void> => {
  try {
    await notifee.cancelNotification(INACTIVITY_2_DAY_NOTIFICATION_ID);
    await notifee.cancelNotification(INACTIVITY_5_DAY_NOTIFICATION_ID);

    // Clear storage
    await AsyncStorage.removeItem(INACTIVITY_2_DAY_SCHEDULED_KEY);
    await AsyncStorage.removeItem(INACTIVITY_5_DAY_SCHEDULED_KEY);

    if (__DEV__) {
      console.log("✅ Cancelled all inactivity notifications");
    }
  } catch (error) {
    console.warn("Failed to cancel inactivity notifications:", error);
  }
};

/**
 * Get last activity timestamp
 */
export const getLastActivityTimestamp = async (): Promise<number | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_ACTIVITY_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
};

/**
 * Check if user is inactive
 * Returns true if user hasn't been active for the configured timeout period
 */
export const isUserInactive = async (): Promise<boolean> => {
  try {
    const lastActivity = await getLastActivityTimestamp();
    if (!lastActivity) {
      return false; // No activity recorded yet, not considered inactive
    }

    const inactivityTimeoutDays = getRemoteConfigValue("inactivityTimeoutDays");
    const timeoutMs = inactivityTimeoutDays * 24 * 60 * 60 * 1000;
    const timeSinceLastActivity = Date.now() - lastActivity;

    return timeSinceLastActivity >= timeoutMs;
  } catch {
    return false;
  }
};
