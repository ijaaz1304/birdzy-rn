/**
 * Sync local notification preference toggles to FCM topics (client draft).
 * Backend must create matching topics on Firebase Console.
 */

import type { BirdNotificationPreferences } from "../../features/settings/notificationsPreference.storage";

const TOPICS = {
  birdOfDay: "birdzy_bird_of_day",
  migrationAlerts: "birdzy_migration_alerts",
  communityReplies: "birdzy_community_replies",
  identificationTips: "birdzy_id_tips",
  weeklyDigest: "birdzy_weekly_digest",
} as const;

let messagingModule: (() => {
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
}) | null = null;

async function getMessaging() {
  if (messagingModule) return messagingModule;
  try {
    const mod = require("@react-native-firebase/messaging").default;
    messagingModule = mod;
    return mod;
  } catch {
    return null;
  }
}

async function setTopic(topic: string, enabled: boolean): Promise<void> {
  const messaging = await getMessaging();
  if (!messaging) return;
  const msg = messaging();
  try {
    if (enabled) {
      await msg.subscribeToTopic(topic);
    } else {
      await msg.unsubscribeFromTopic(topic);
    }
  } catch (error) {
    console.warn(`[notificationTopics] Failed to sync topic ${topic}:`, error);
  }
}

/** Apply preference toggles to FCM topics. Requires push permission + valid token. */
export async function syncNotificationTopics(
  prefs: BirdNotificationPreferences
): Promise<void> {
  const master = prefs.push;
  await Promise.all([
    setTopic(TOPICS.birdOfDay, master && prefs.birdOfDay),
    setTopic(TOPICS.migrationAlerts, master && prefs.migrationAlerts),
    setTopic(TOPICS.communityReplies, master && prefs.communityReplies),
    setTopic(TOPICS.identificationTips, master && prefs.identificationTips),
    setTopic(TOPICS.weeklyDigest, master && prefs.weeklyDigest),
  ]);
}

export { TOPICS as NOTIFICATION_FCM_TOPICS };
