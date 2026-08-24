/**
 * Keeps Firestore feed notifications (likes, comments, follows) synced into the global
 * notifications store and shows immediate local banners when new activity arrives.
 */

import React, { useEffect, useRef } from "react";
import { useAuthStore } from "../../auth/auth.store";
import { useNotificationsStore } from "../../notifications/notifications.store";
import { feedService } from "../../../services/firebase/feed.service";
import {
  seedFeedNotificationWatermark,
  showNewFeedNotificationBanners,
  type FeedNotificationBannerDoc,
} from "../../../services/notifications/feedNotificationBanners.service";

export const FeedNotificationsSync: React.FC = () => {
  const userId = useAuthStore((s) => s.user?.id);
  const setNotificationsFromFirestore = useNotificationsStore(
    (s) => s.setNotificationsFromFirestore
  );
  const isFirstSnapshotRef = useRef(true);

  useEffect(() => {
    isFirstSnapshotRef.current = true;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const unsub = feedService.subscribeToFeedNotifications(userId, (docs) => {
      const mapped: FeedNotificationBannerDoc[] = docs.map((d) => ({
        id: d.id,
        type: d.type,
        actorUserId: d.actorUserId,
        actorUserName: d.actorUserName,
        postId: d.postId,
        commentId: d.commentId,
        content: d.content,
        createdAt: d.createdAt,
      }));

      setNotificationsFromFirestore(mapped);

      void (async () => {
        if (isFirstSnapshotRef.current) {
          isFirstSnapshotRef.current = false;
          await seedFeedNotificationWatermark(userId, mapped);
          return;
        }
        await showNewFeedNotificationBanners(userId, mapped);
      })();
    });

    return unsub;
  }, [userId, setNotificationsFromFirestore]);

  return null;
};
