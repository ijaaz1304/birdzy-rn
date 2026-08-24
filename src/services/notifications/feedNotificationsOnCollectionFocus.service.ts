/**
 * On Collection tab focus: fetch feed notifications from Firestore (same data as the real-time listener),
 * sync the in-app notification list, and show new items as local Notifee notifications (with dedupe watermark).
 */

import { useNotificationsStore } from "../../features/notifications/notifications.store";
import { feedService } from "../firebase/feed.service";
import {
  showNewFeedNotificationBanners,
  type FeedNotificationBannerDoc,
} from "./feedNotificationBanners.service";

function mapDocs(
  docs: Awaited<ReturnType<typeof feedService.fetchFeedNotificationDocuments>>
): FeedNotificationBannerDoc[] {
  return docs.map((d) => ({
    id: d.id,
    type: d.type,
    actorUserId: d.actorUserId,
    actorUserName: d.actorUserName,
    postId: d.postId,
    commentId: d.commentId,
    content: d.content,
    createdAt: d.createdAt,
  }));
}

/**
 * Call when the Collection main screen gains focus (logged-in user).
 */
export async function runFeedNotificationsOnCollectionFocus(
  userId: string
): Promise<void> {
  if (!userId) return;

  const docs = mapDocs(
    await feedService.fetchFeedNotificationDocuments(userId, 100)
  );

  useNotificationsStore.getState().setNotificationsFromFirestore(docs);
  await showNewFeedNotificationBanners(userId, docs);
}
