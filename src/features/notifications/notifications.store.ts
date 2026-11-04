/**
 * Notifications store using Zustand
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  /** Feed (Firestore): drives avatar badges and message line */
  feedActivityType?: "like" | "comment" | "follow";
  actorUserName?: string;
}

/** Firestore notification doc shape (from feed.service subscribeToFeedNotifications) */
export interface FeedNotificationDoc {
  id: string;
  type: string;
  actorUserId: string;
  actorUserName: string;
  postId?: string;
  commentId?: string;
  content?: string;
  createdAt: { toDate: () => Date } | null;
}

interface NotificationsState {
  ownerUserId: string | null;
  setOwner: (userId: string | null) => void;
  notifications: Notification[];
  unreadCount: number;
  isEnabled: boolean;
  isLoading: boolean;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "read" | "timestamp">
  ) => void;
  /** Sync from Firestore feed notifications (like, comment); preserves read state by id */
  setNotificationsFromFirestore: (docs: FeedNotificationDoc[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setEnabled: (enabled: boolean) => void;
  fetchNotifications: () => Promise<void>;
}

let notificationOwnerGeneration = 0;
let notificationOwnerAssigned = false;

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, _get) => ({
      ownerUserId: null,
      setOwner: (userId) => {
        notificationOwnerAssigned = true;
        if (_get().ownerUserId !== userId) {
          notificationOwnerGeneration++;
          set({
            ownerUserId: userId,
            notifications: [],
            unreadCount: 0,
            isLoading: false,
          });
        }
      },
      notifications: [],
      unreadCount: 0,
      isEnabled: true,
      isLoading: false,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          read: false,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(
            0,
            100
          ), // Keep last 100
          unreadCount: state.unreadCount + 1,
        }));
      },

      setNotificationsFromFirestore: (docs) => {
        set((state) => {
          const readIds = new Set(
            state.notifications.filter((n) => n.read).map((n) => n.id)
          );
          const notifications: Notification[] = docs.map((doc) => {
            const ts =
              doc.createdAt && typeof doc.createdAt.toDate === "function"
                ? doc.createdAt.toDate().toISOString()
                : new Date().toISOString();
            const isLike = doc.type === "like";
            const isFollow = doc.type === "follow" || doc.type === "subscribe";
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
              ? `${doc.content.slice(0, 80)}${
                  doc.content.length > 80 ? "…" : ""
                }`
              : "Tap to view";
            const actionUrl = isFollow
              ? `profile:${doc.actorUserId}`
              : doc.commentId
              ? `comment:${doc.postId}:${doc.commentId}`
              : `post:${doc.postId}`;
            const feedActivityType: "like" | "comment" | "follow" = isFollow
              ? "follow"
              : isLike
              ? "like"
              : "comment";
            return {
              id: doc.id,
              title,
              body,
              type: "success" as const,
              read: readIds.has(doc.id),
              timestamp: ts,
              actionUrl,
              feedActivityType,
              actorUserName: doc.actorUserName ?? "Someone",
            };
          });
          const unreadCount = notifications.filter((n) => !n.read).length;
          return { notifications, unreadCount };
        });
      },

      markAsRead: (id: string) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id: string) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const updated = state.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount:
              notification && !notification.read
                ? state.unreadCount - 1
                : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
      },

      fetchNotifications: async () => {
        const { useAuthStore } = require("../auth/auth.store");
        const userId: string | null = useAuthStore.getState().user?.id ?? null;
        _get().setOwner(userId);
        if (!userId || _get().isLoading) return;
        set({ isLoading: true });
        const generation = notificationOwnerGeneration;
        const current = () =>
          generation === notificationOwnerGeneration &&
          _get().ownerUserId === userId &&
          useAuthStore.getState().user?.id === userId;
        try {
          const {
            feedService,
          } = require("../../services/firebase/feed.service");
          const docs = await feedService.fetchFeedNotificationDocuments(userId);
          if (current()) _get().setNotificationsFromFirestore(docs);
        } catch (error) {
          if (__DEV__) console.warn("Notification refresh failed", error);
        } finally {
          if (current()) set({ isLoading: false });
        }
      },
    }),
    {
      name: "birdzy-notifications-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        ownerUserId: state.ownerUserId,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        isEnabled: state.isEnabled,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<NotificationsState> | undefined;
        // Async hydration must not restore another account after setOwner ran.
        if (
          !saved?.ownerUserId ||
          (notificationOwnerAssigned &&
            saved.ownerUserId !== current.ownerUserId)
        )
          return current;
        return {
          ...current,
          ownerUserId: saved.ownerUserId,
          notifications: saved.notifications ?? [],
          unreadCount: saved.unreadCount ?? 0,
          isEnabled: saved.isEnabled ?? current.isEnabled,
          isLoading: false,
        };
      },
    }
  )
);
