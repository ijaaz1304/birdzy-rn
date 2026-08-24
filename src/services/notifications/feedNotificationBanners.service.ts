/**
 * Feed notification banners (Notifee) for like / comment / subscribe.
 * Shared by the real-time Firestore listener and Collection-tab focus refresh.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, { AndroidImportance } from "@notifee/react-native";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { UI_STATE_KEYS } from "../../constants/storageConstants";
import { checkNotificationPermission } from "../permissions";
import { NOTIFICATION_CHANNEL_IDS } from "./pushNotification.service";

const MAX_BANNERS_PER_BATCH = 5;

type WatermarkV1 = { userId: string; ms: number };

export type FeedNotificationBannerDoc = {
  id: string;
  type: string;
  actorUserId: string;
  actorUserName: string;
  postId?: string;
  commentId?: string;
  content?: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
};

function getCreatedAtMs(
  createdAt: FirebaseFirestoreTypes.Timestamp | null
): number {
  if (!createdAt || typeof createdAt.toMillis !== "function") return 0;
  return createdAt.toMillis();
}

export function buildFeedNotificationTitleBody(doc: {
  type: string;
  actorUserName: string;
  content?: string;
}): { title: string; body: string } {
  const isFollow = doc.type === "follow" || doc.type === "subscribe";
  const isLike = doc.type === "like";
  const title = isFollow
    ? `${doc.actorUserName} subscribed to you`
    : isLike
    ? `${doc.actorUserName} liked your post`
    : `${doc.actorUserName} commented on your post`;
  const body = isFollow
    ? "Tap to open your feed"
    : isLike
    ? "Tap to view"
    : doc.content
    ? `${doc.content.slice(0, 80)}${doc.content.length > 80 ? "…" : ""}`
    : "Tap to view";
  return { title, body };
}

function toNotifeeData(doc: {
  type: string;
  postId?: string;
  commentId?: string;
  actorUserId: string;
}): Record<string, string> {
  const postId = doc.postId ?? "";
  const isFollow = doc.type === "follow" || doc.type === "subscribe";
  return {
    type: String(doc.type ?? ""),
    postId: String(postId),
    commentId: doc.commentId ? String(doc.commentId) : "",
    actorUserId: String(doc.actorUserId ?? ""),
    userId: isFollow ? String(doc.actorUserId ?? "") : "",
    source: "feed_notification",
  };
}

async function loadWatermark(userId: string): Promise<WatermarkV1 | null> {
  try {
    const raw = await AsyncStorage.getItem(
      UI_STATE_KEYS.FEED_NOTIF_NOTIFEE_WATERMARK
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WatermarkV1;
    return parsed.userId === userId ? parsed : null;
  } catch {
    return null;
  }
}

async function saveWatermark(userId: string, ms: number): Promise<void> {
  await AsyncStorage.setItem(
    UI_STATE_KEYS.FEED_NOTIF_NOTIFEE_WATERMARK,
    JSON.stringify({ userId, ms } satisfies WatermarkV1)
  );
}

function maxCreatedAtMs(docs: FeedNotificationBannerDoc[]): number {
  let maxMs = 0;
  for (const d of docs) {
    const ms = getCreatedAtMs(d.createdAt);
    if (ms > maxMs) maxMs = ms;
  }
  return maxMs;
}

/**
 * First listener snapshot / new user: mark existing notifications as seen (no banner spam).
 */
export async function seedFeedNotificationWatermark(
  userId: string,
  docs: FeedNotificationBannerDoc[]
): Promise<void> {
  if (!userId) return;
  const maxMs = maxCreatedAtMs(docs);
  const seedMs = maxMs > 0 ? maxMs : Date.now();
  await saveWatermark(userId, seedMs);
}

/**
 * Show Notifee banners for notifications newer than the stored watermark.
 */
export async function showNewFeedNotificationBanners(
  userId: string,
  docs: FeedNotificationBannerDoc[]
): Promise<void> {
  if (!userId || docs.length === 0) return;

  const stored = await loadWatermark(userId);
  if (!stored) {
    await seedFeedNotificationWatermark(userId, docs);
    return;
  }

  let watermarkMs = stored.ms;
  const eligible = docs
    .map((d) => ({ d, ms: getCreatedAtMs(d.createdAt) }))
    .filter(({ ms }) => ms > watermarkMs)
    .sort((a, b) => a.ms - b.ms)
    .slice(0, MAX_BANNERS_PER_BATCH);

  if (eligible.length === 0) return;

  const perm = await checkNotificationPermission();
  if (!perm.granted) {
    // Still advance watermark so we don't replay a backlog after permission is granted.
    const latestMs = Math.max(...eligible.map((e) => e.ms));
    if (latestMs > watermarkMs) {
      await saveWatermark(userId, latestMs);
    }
    return;
  }

  for (const { d, ms } of eligible) {
    const { title, body } = buildFeedNotificationTitleBody(d);
    try {
      await notifee.displayNotification({
        id: `feed_${d.id}`,
        title,
        body,
        android: {
          channelId: NOTIFICATION_CHANNEL_IDS.DEFAULT,
          smallIcon: "ic_launcher",
          importance: AndroidImportance.HIGH,
          pressAction: { id: "default" },
        },
        ios: {
          sound: "default",
          critical: true,
        },
        data: toNotifeeData(d),
      });
    } catch (e) {
      if (__DEV__) console.warn("showNewFeedNotificationBanners notifee:", e);
    }
    watermarkMs = Math.max(watermarkMs, ms);
  }

  await saveWatermark(userId, watermarkMs);
}
