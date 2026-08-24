/**
 * Notifee Test Utility
 *
 * Helper functions to test Notifee notification setup and functionality
 * Use this to verify notifications are working correctly (run on device, not in Jest).
 */

import notifee, {
  AndroidImportance,
  TriggerType,
} from "@notifee/react-native";
import { Platform, Alert } from "react-native";
import {
  requestNotificationPermission,
  createNotificationChannel,
} from "./notification.service";
// Plant reminder notifications removed - not needed for rocks/minerals app
// import { scheduleReminderNotifications } from './plantReminderNotifications';
// import type { PlantReminder } from './plantReminderNotifications.types';

/**
 * Test notification permissions
 */
export const testNotificationPermissions = async (): Promise<boolean> => {
  try {
    const settings = await notifee.getNotificationSettings();

    console.log("📱 Notification Settings:");
    console.log(
      "  - Authorized:",
      settings.authorizationStatus === 1 || settings.authorizationStatus === 2
    );
    console.log("  - Authorization Status:", settings.authorizationStatus);
    if (Platform.OS === "ios" && settings.ios) {
      console.log("  - iOS Settings:", JSON.stringify(settings.ios, null, 2));
    }

    if (settings.authorizationStatus === 0) {
      // Not determined - request permission
      const granted = await requestNotificationPermission();
      if (granted) {
        console.log("✅ Notification permission granted");
        return true;
      } else {
        console.error("❌ Notification permission denied");
        Alert.alert(
          "Permission Required",
          "Please enable notifications in Settings to receive notifications."
        );
        return false;
      }
    } else if (
      settings.authorizationStatus === 1 ||
      settings.authorizationStatus === 2
    ) {
      console.log("✅ Notifications are authorized");
      return true;
    } else {
      console.error("❌ Notifications are blocked");
      Alert.alert(
        "Notifications Blocked",
        "Please enable notifications in Settings to receive notifications."
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Error checking notification permissions:", error);
    return false;
  }
};

/**
 * Test notification channel creation (Android)
 */
export const testNotificationChannel = async (): Promise<string | null> => {
  if (Platform.OS !== "android") {
    console.log("ℹ️  Notification channels are Android-only");
    return "default";
  }

  try {
    const channelId = await createNotificationChannel();
    console.log("✅ Notification channel created:", channelId);

    // Get channel details
    const channels = await notifee.getChannels();
    const channel = channels.find((c) => c.id === channelId);

    if (channel) {
      console.log("📱 Channel Details:");
      console.log("  - ID:", channel.id);
      console.log("  - Name:", channel.name);
      console.log("  - Importance:", channel.importance);
      console.log("  - Sound:", channel.sound);
      console.log("  - Vibration:", channel.vibration);
    }

    return channelId;
  } catch (error) {
    console.error("❌ Error creating notification channel:", error);
    return null;
  }
};

/**
 * Test immediate notification (no trigger)
 */
export const testImmediateNotification = async (): Promise<boolean> => {
  try {
    const channelId = await testNotificationChannel();

    const notificationId = await notifee.displayNotification({
      title: "🪨 Test Notification",
      body: "This is a test notification from Trackzio Minerals",
      android: {
        channelId: channelId || "default",
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: "default",
        },
      },
      ios: {
        sound: "default",
      },
      data: {
        test: "true",
        type: "test",
      },
    });

    console.log("✅ Test notification displayed:", notificationId);
    return true;
  } catch (error) {
    console.error("❌ Error displaying test notification:", error);
    return false;
  }
};

/**
 * Test scheduled notification (triggered)
 */
export const testScheduledNotification = async (
  secondsFromNow: number = 5
): Promise<boolean> => {
  try {
    const channelId = await testNotificationChannel();
    const triggerDate = new Date(Date.now() + secondsFromNow * 1000);

    const notificationId = await notifee.createTriggerNotification(
      {
        title: "🌱 Test Scheduled Notification",
        body: `This notification was scheduled for ${triggerDate.toLocaleTimeString()}`,
        android: {
          channelId: channelId || "default",
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
        },
        ios: {
          sound: "default",
        },
        data: {
          test: "true",
          type: "scheduled_test",
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
      }
    );

    console.log(
      `✅ Test notification scheduled for ${secondsFromNow} seconds from now`
    );
    console.log("  - Notification ID:", notificationId);
    console.log("  - Trigger Time:", triggerDate.toLocaleString());

    return true;
  } catch (error) {
    console.error("❌ Error scheduling test notification:", error);
    return false;
  }
};

/**
 * Test plant reminder notification
 * Removed - reminders not needed for rocks/minerals app
 */
export const testPlantReminderNotification = async (): Promise<boolean> => {
  console.log(
    "ℹ️  Plant reminder notifications removed - not needed for rocks/minerals app"
  );
  return false;
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<void> => {
  try {
    const notifications = await notifee.getTriggerNotifications();

    console.log(`📋 Found ${notifications.length} scheduled notifications:`);
    notifications.forEach((notification, index) => {
      console.log(`\n${index + 1}. Notification:`);
      console.log("   - ID:", notification.notification.id);
      console.log(
        "   - Title:",
        notification.notification.data?.title || notification.notification.title
      );
      console.log(
        "   - Body:",
        notification.notification.data?.body || notification.notification.body
      );
      console.log("   - Trigger:", notification.trigger);
    });

    if (notifications.length === 0) {
      console.log("ℹ️  No scheduled notifications found");
    }
  } catch (error) {
    console.error("❌ Error getting scheduled notifications:", error);
  }
};

/**
 * Cancel all test notifications
 */
export const cancelAllTestNotifications = async (): Promise<void> => {
  try {
    await notifee.cancelAllNotifications();
    console.log("✅ All notifications cancelled");
  } catch (error) {
    console.error("❌ Error cancelling notifications:", error);
  }
};

/**
 * Run full test suite
 */
export const runNotifeeTestSuite = async (): Promise<void> => {
  console.log("\n🧪 Starting Notifee Test Suite...\n");

  // 1. Test permissions
  console.log("1️⃣ Testing notification permissions...");
  const hasPermission = await testNotificationPermissions();
  if (!hasPermission) {
    console.error("❌ Test suite stopped: No notification permission");
    return;
  }

  // 2. Test channel (Android)
  console.log("\n2️⃣ Testing notification channel...");
  await testNotificationChannel();

  // 3. Test immediate notification
  console.log("\n3️⃣ Testing immediate notification...");
  await testImmediateNotification();

  // 4. Test scheduled notification (5 seconds)
  console.log("\n4️⃣ Testing scheduled notification (5 seconds)...");
  await testScheduledNotification(5);

  // 5. Test plant reminder
  console.log("\n5️⃣ Testing plant reminder notification...");
  await testPlantReminderNotification();

  // 6. List all scheduled notifications
  console.log("\n6️⃣ Listing all scheduled notifications...");
  await getScheduledNotifications();

  console.log("\n✅ Test suite completed!");
  console.log("\n💡 Tips:");
  console.log("  - Wait 5 seconds to see the scheduled test notification");
  console.log("  - Check your device notification tray");
  console.log(
    "  - Use getScheduledNotifications() to see all scheduled notifications"
  );
  console.log(
    "  - Use cancelAllTestNotifications() to clean up test notifications"
  );
};
