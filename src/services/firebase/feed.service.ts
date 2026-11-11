import { coalesceInFlight } from "../../utils/coalesceInFlight";
/**
 * Firestore Feed Service
 * Handles feed posts CRUD operations with real-time updates
 */

import {
  firebasePerf,
  isFirebaseInitialized,
  waitForFirebaseReady,
} from "../../lib/firebase";
import { analyticsService, EVENTS } from "../analytics/analytics.service";
// Lazy import firestore to avoid initialization issues
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  addHiddenPostId,
  addReportedPostId,
  loadExcludedPostIds,
  mergeHiddenPostIdSets,
  subscribeToLocalHiddenPostIds,
  subscribeToLocalReportedPostIds,
} from "./feedHiddenPosts.storage";
// Post type - should come from API types
type Post = any;

export interface CreatePostData {
  userId: string;
  userName: string;
  userAvatar?: string;
  itemName?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  caption?: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  itemName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  caption?: string;
}

export interface PostDocument extends Omit<Post, "isMyPost" | "timestamp"> {
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  likes: string[]; // Array of user IDs who liked
  comments: number;
  shares: number;
  imageUrls?: string[]; // Multiple images support
}

const FEED_PREFS_COLLECTION = "users";
const FEED_PREFS_DOC = "feedPreferences";
const NOTIFICATIONS_SUBCOLLECTION = "notifications";
const HIDDEN_POST_IDS_FIELD = "hiddenPostIds";
const REPORTED_POST_IDS_FIELD = "reportedPostIds";
const REPORTS_COLLECTION = "reports";
const COMMUNITY_RULES_DOC = "communityRules";
const COMMUNITY_RULES_AGREED_FIELD = "is_agreed";
const COMMUNITY_RULES_AGREED_AT_FIELD = "agreedAt";

export interface FeedNotificationPayload {
  type: "like" | "comment" | "follow";
  actorUserId: string;
  actorUserName: string;
  /** Required for like/comment; omitted for follow */
  postId?: string;
  commentId?: string;
  content?: string;
}

class FeedService {
  private readonly COLLECTION = "posts";

  /**
   * Get Firestore instance (lazy import)
   */
  private getFirestore(): FirebaseFirestoreTypes.Module {
    const firestore = require("@react-native-firebase/firestore").default;
    return firestore();
  }

  /**
   * Get Firestore FieldValue (lazy import)
   */
  private getFieldValue() {
    const firestore = require("@react-native-firebase/firestore").default;
    return firestore.FieldValue;
  }

  /**
   * Convert Firestore document to Post
   */
  private documentToPost(
    doc: FirebaseFirestoreTypes.DocumentSnapshot,
    currentUserId?: string
  ): Post {
    const data = doc.data() as PostDocument | undefined;
    if (!data) {
      return null as any;
    }

    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      itemName: data.itemName,
      title: data.title,
      content: data.content,
      image: data.imageUrl || (data.imageUrls && data.imageUrls[0]),
      caption: data.caption,
      likes: data.likes?.length || 0,
      comments: data.comments || 0,
      shares: data.shares || 0,
      timestamp: this.formatTimestamp(data.createdAt ?? null),
      isMyPost: currentUserId ? data.userId === currentUserId : false,
      isLiked: currentUserId
        ? (data.likes || []).includes(currentUserId)
        : false,
    };
  }

  /**
   * Format Firestore timestamp to relative time.
   * Handles null/undefined (e.g. pending serverTimestamp or missing field).
   */
  private formatTimestamp(
    timestamp: FirebaseFirestoreTypes.Timestamp | null | undefined
  ): string {
    if (timestamp == null || typeof timestamp.toDate !== "function") {
      return "Just now";
    }
    const now = new Date();
    const postDate = timestamp.toDate();
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return postDate.toLocaleDateString();
  }

  /**
   * Remove undefined values from object (Firestore does not accept undefined).
   */
  private stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const key of Object.keys(obj) as (keyof T)[]) {
      if (obj[key] !== undefined) {
        out[key] = obj[key];
      }
    }
    return out;
  }

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<string> {
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase is not available");
    }

    const trace = await firebasePerf.startTrace("firestore_create_post");

    try {
      trace?.putAttribute("user_id", data.userId);

      const raw: Record<string, any> = {
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        itemName: data.itemName,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl || (data.imageUrls && data.imageUrls[0]),
        imageUrls: data.imageUrls,
        caption: data.caption,
        likes: [],
        comments: 0,
        shares: 0,
        createdAt: this.getFieldValue().serverTimestamp(),
        updatedAt: this.getFieldValue().serverTimestamp(),
      };

      const postData = this.stripUndefined(raw);

      const docRef = await this.getFirestore()
        .collection(this.COLLECTION)
        .add(postData);

      await trace?.stop();

      analyticsService.logEvent(EVENTS.post_created, {
        post_id: docRef.id,
        has_image: !!data.imageUrl,
        has_title: !!data.title,
      });
      analyticsService.logEvent(EVENTS.feed_add, { post_id: docRef.id });
      analyticsService.logEvent(EVENTS.feed_post, { post_id: docRef.id });

      return docRef.id;
    } catch (error) {
      await trace?.stop();
      throw error;
    }
  }

  /**
   * Get all posts (real-time listener)
   * Optimized with debouncing to prevent excessive updates on Android
   */
  subscribeToPosts(
    callback: (posts: Post[]) => void,
    currentUserId?: string,
    onError?: (err: Error) => void
  ): () => void {
    if (!isFirebaseInitialized()) {
      onError?.(new Error("Firebase is not available"));
      return () => {};
    }
    let lastUpdate = 0;
    const DEBOUNCE_MS = 300; // Debounce updates to max once per 300ms

    const unsubscribe = this.getFirestore()
      .collection(this.COLLECTION)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const now = Date.now();
          // Debounce rapid updates to prevent UI blocking on Android
          if (now - lastUpdate < DEBOUNCE_MS) {
            return;
          }
          lastUpdate = now;

          const posts = snapshot.docs
            .map((doc) => this.documentToPost(doc, currentUserId))
            .filter((p): p is Post => p != null);
          callback(posts);

          if (now - lastUpdate >= 1000) {
            analyticsService.logEvent(EVENTS.posts_viewed, {
              post_count: posts.length,
            });
          }
        },
        (error) => {
          if (__DEV__) {
            console.error("Error fetching posts:", error);
          }
          analyticsService.logEvent(EVENTS.posts_fetch_error, {
            error_message: error.message,
          });
          onError?.(error);
        }
      );

    return unsubscribe;
  }

  /**
   * Count posts created by the user (lifetime). Used to enforce the free-tier
   * feed cap. Returns `null` on error so callers can fall back to local storage
   * instead of allowing unlimited posts.
   */
  async getUserPostCount(userId: string): Promise<number | null> {
    const LOG = "[Feed getUserPostCount]";
    if (!isFirebaseInitialized()) {
      const ready = await waitForFirebaseReady(2500);
      if (!ready) {
        if (__DEV__) {
          console.warn(LOG, "Firebase not ready; returning null.");
        }
        return null;
      }
    }
    try {
      const snapshot = await this.getFirestore()
        .collection(this.COLLECTION)
        .where("userId", "==", userId)
        .limit(20)
        .get();
      const count = snapshot.size;
      if (__DEV__) console.log(LOG, "count=", count, "userId=", userId);
      return count;
    } catch (error) {
      if (__DEV__) {
        console.error(LOG, "Error getting user post count:", error);
      }
      return null;
    }
  }

  /**
   * Get count of posts created today by the user (for free-tier limit).
   * Non‑premium users: 1 post per 24h (UTC day). Returns 0 on error so we don't
   * block first-time users when the query fails (e.g. missing Firestore index).
   */
  async getUserPostCountToday(userId: string): Promise<number> {
    const LOG = "[Feed getUserPostCountToday]";
    if (!isFirebaseInitialized()) {
      if (__DEV__)
        console.log(LOG, "Firebase not ready, waiting up to 2.5s...");
      const ready = await waitForFirebaseReady(2500);
      if (!ready) {
        if (__DEV__) {
          console.warn(
            LOG,
            "Firebase not ready after wait; returning 0 (allow post)."
          );
        }
        return 0;
      }
      if (__DEV__) console.log(LOG, "Firebase ready after wait.");
    }
    try {
      const firestore = require("@react-native-firebase/firestore").default;
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const startTimestamp = firestore.Timestamp.fromDate(startOfDay);

      const snapshot = await this.getFirestore()
        .collection(this.COLLECTION)
        .where("userId", "==", userId)
        .where("createdAt", ">=", startTimestamp)
        .get();

      const count = snapshot.size;
      if (__DEV__) console.log(LOG, "countToday=", count, "userId=", userId);
      return count;
    } catch (error) {
      if (__DEV__) {
        console.error(
          LOG,
          "Error getting user post count today (returning 0):",
          error
        );
      }
      return 0;
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string, currentUserId?: string): Promise<Post | null> {
    try {
      const doc = await this.getFirestore()
        .collection(this.COLLECTION)
        .doc(postId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return this.documentToPost(doc, currentUserId);
    } catch (error) {
      console.error("Error getting post:", error);
      throw error;
    }
  }

  /**
   * Update a post (only by owner)
   * Undefined fields are sent as FieldValue.delete() so Firestore accepts the update and the field is removed (e.g. removing image).
   */
  async updatePost(
    postId: string,
    data: UpdatePostData,
    _userId: string
  ): Promise<void> {
    const trace = await firebasePerf.startTrace("firestore_update_post");
    const FieldValue = this.getFieldValue();

    try {
      trace.putAttribute("post_id", postId);

      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) {
          updateData[key] = FieldValue.delete();
        } else {
          updateData[key] = value;
        }
      }

      await this.getFirestore()
        .collection(this.COLLECTION)
        .doc(postId)
        .update(updateData);

      await trace.stop();

      analyticsService.logEvent(EVENTS.post_updated, { post_id: postId });
    } catch (error) {
      await trace.stop();
      throw error;
    }
  }

  /**
   * Delete a post (only by owner)
   */
  async deletePost(postId: string, _userId: string): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.COLLECTION)
        .doc(postId)
        .delete();

      analyticsService.logEvent(EVENTS.post_deleted, { post_id: postId });
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  /**
   * Add a comment to a post. Increments the post's comment count.
   */
  async addComment(
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string
  ): Promise<string> {
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase is not available");
    }
    const FieldValue = this.getFieldValue();
    const commentsRef = this.getFirestore()
      .collection(this.COLLECTION)
      .doc(postId)
      .collection("comments");

    const docRef = await commentsRef.add({
      userId,
      userName,
      userAvatar: userAvatar ?? null,
      content: content.trim(),
      likes: [],
      createdAt: FieldValue.serverTimestamp(),
    });

    await this.getFirestore()
      .collection(this.COLLECTION)
      .doc(postId)
      .update({
        comments: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // In-app notification for post owner (Firebase only, no external backend)
    try {
      const postDoc = await this.getFirestore()
        .collection(this.COLLECTION)
        .doc(postId)
        .get();
      const postData = postDoc.data() as { userId?: string } | undefined;
      const postOwnerId = postData?.userId;
      if (postOwnerId && postOwnerId !== userId && isFirebaseInitialized()) {
        await this.writeFeedNotification(postOwnerId, {
          type: "comment",
          actorUserId: userId,
          actorUserName: userName,
          postId,
          commentId: docRef.id,
          content: content.trim().slice(0, 100),
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("writeFeedNotification (comment) failed:", e);
    }

    return docRef.id;
  }

  /**
   * Subscribe to comments for a post. Callback receives Comment[] with replies (id, userName, content, timestamp, likes, isLiked, isMyComment, replies[]).
   */
  subscribeToComments(
    postId: string,
    currentUserId: string | undefined,
    callback: (
      comments: Array<{
        id: string;
        userName: string;
        userAvatar?: string;
        content: string;
        timestamp: string;
        likes: number;
        isLiked?: boolean;
        isMyComment?: boolean;
        replies?: Array<{
          id: string;
          userName: string;
          userAvatar?: string;
          content: string;
          timestamp: string;
          likes: number;
          isLiked?: boolean;
          isMyReply?: boolean;
        }>;
      }>
    ) => void
  ): () => void {
    if (!isFirebaseInitialized()) {
      callback([]);
      return () => {};
    }
    const firestore = this.getFirestore();
    const commentsRef = firestore
      .collection(this.COLLECTION)
      .doc(postId)
      .collection("comments");

    const repliesByCommentId = new Map<
      string,
      Array<{
        id: string;
        userName: string;
        userAvatar?: string;
        content: string;
        timestamp: string;
        likes: number;
        isLiked?: boolean;
        isMyReply?: boolean;
      }>
    >();

    let latestCommentDocs: FirebaseFirestoreTypes.DocumentSnapshot[] = [];

    const pushCommentsWithReplies = () => {
      const comments = latestCommentDocs.map((doc) => {
        const data = doc.data() as {
          userId: string;
          userName: string;
          userAvatar?: string;
          content: string;
          likes: string[];
          createdAt: FirebaseFirestoreTypes.Timestamp;
        };
        const likes = data.likes || [];
        return {
          id: doc.id,
          userName: data.userName ?? "User",
          userAvatar: data.userAvatar,
          content: data.content ?? "",
          timestamp: this.formatTimestamp(data.createdAt),
          likes: likes.length,
          isLiked: currentUserId ? likes.includes(currentUserId) : false,
          isMyComment: currentUserId ? data.userId === currentUserId : false,
          replies: repliesByCommentId.get(doc.id) ?? [],
        };
      });
      callback(comments);
    };

    const unsubReplies = new Map<string, () => void>();

    const unsubscribeComments = commentsRef
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs;
          latestCommentDocs = docs;
          pushCommentsWithReplies();

          const seenIds = new Set(docs.map((d) => d.id));
          unsubReplies.forEach((unsub, commentId) => {
            if (!seenIds.has(commentId)) {
              unsub();
              unsubReplies.delete(commentId);
              repliesByCommentId.delete(commentId);
            }
          });

          docs.forEach((doc) => {
            if (unsubReplies.has(doc.id)) return;
            const commentId = doc.id;
            const repliesRef = commentsRef.doc(commentId).collection("replies");
            const unsub = repliesRef.orderBy("createdAt", "asc").onSnapshot(
              (replySnap) => {
                const replyList = replySnap.docs.map((rd) => {
                  const d = rd.data() as {
                    userId: string;
                    userName: string;
                    userAvatar?: string;
                    content: string;
                    likes: string[];
                    createdAt: FirebaseFirestoreTypes.Timestamp;
                  };
                  const likes = d.likes || [];
                  return {
                    id: rd.id,
                    userName: d.userName ?? "User",
                    userAvatar: d.userAvatar,
                    content: d.content ?? "",
                    timestamp: this.formatTimestamp(d.createdAt),
                    likes: likes.length,
                    isLiked: currentUserId
                      ? likes.includes(currentUserId)
                      : false,
                    isMyReply: currentUserId
                      ? d.userId === currentUserId
                      : false,
                  };
                });
                repliesByCommentId.set(commentId, replyList);
                pushCommentsWithReplies();
              },
              () => {
                repliesByCommentId.set(commentId, []);
                pushCommentsWithReplies();
              }
            );
            unsubReplies.set(commentId, unsub);
          });
        },
        (error) => {
          if (__DEV__) {
            console.error("Error subscribing to comments:", error);
          }
          callback([]);
        }
      );

    return () => {
      unsubscribeComments();
      unsubReplies.forEach((u) => u());
      unsubReplies.clear();
      repliesByCommentId.clear();
    };
  }

  /**
   * Toggle like on a comment.
   */
  async toggleCommentLike(
    postId: string,
    commentId: string,
    userId: string
  ): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase is not available");
    }
    const commentRef = this.getFirestore()
      .collection(this.COLLECTION)
      .doc(postId)
      .collection("comments")
      .doc(commentId);
    const doc = await commentRef.get();
    if (!doc.exists) throw new Error("Comment not found");
    const data = doc.data() as { likes?: string[] };
    const likes = data.likes || [];
    const isLiked = likes.includes(userId);
    const FieldValue = this.getFieldValue();
    if (isLiked) {
      await commentRef.update({ likes: FieldValue.arrayRemove(userId) });
      return false;
    } else {
      await commentRef.update({ likes: FieldValue.arrayUnion(userId) });
      return true;
    }
  }

  /**
   * Add a reply to a comment. Increments reply count on the comment doc.
   */
  async addReply(
    postId: string,
    commentId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string
  ): Promise<string> {
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase is not available");
    }
    const FieldValue = this.getFieldValue();
    const commentRef = this.getFirestore()
      .collection(this.COLLECTION)
      .doc(postId)
      .collection("comments")
      .doc(commentId);
    const repliesRef = commentRef.collection("replies");
    const docRef = await repliesRef.add({
      userId,
      userName,
      userAvatar: userAvatar ?? null,
      content: content.trim(),
      likes: [],
      createdAt: FieldValue.serverTimestamp(),
    });
    await commentRef.update({
      replyCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // In-app notification for post owner (same as top-level comment)
    try {
      const postDoc = await this.getFirestore()
        .collection(this.COLLECTION)
        .doc(postId)
        .get();
      const postData = postDoc.data() as { userId?: string } | undefined;
      const postOwnerId = postData?.userId;
      if (postOwnerId && postOwnerId !== userId && isFirebaseInitialized()) {
        await this.writeFeedNotification(postOwnerId, {
          type: "comment",
          actorUserId: userId,
          actorUserName: userName,
          postId,
          commentId,
          content: content.trim().slice(0, 100),
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("writeFeedNotification (reply) failed:", e);
    }

    return docRef.id;
  }

  /**
   * Toggle like on a reply.
   */
  async toggleReplyLike(
    postId: string,
    commentId: string,
    replyId: string,
    userId: string
  ): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase is not available");
    }
    const replyRef = this.getFirestore()
      .collection(this.COLLECTION)
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .collection("replies")
      .doc(replyId);
    const doc = await replyRef.get();
    if (!doc.exists) throw new Error("Reply not found");
    const data = doc.data() as { likes?: string[] };
    const likes = data.likes || [];
    const isLiked = likes.includes(userId);
    const FieldValue = this.getFieldValue();
    if (isLiked) {
      await replyRef.update({ likes: FieldValue.arrayRemove(userId) });
      return false;
    } else {
      await replyRef.update({ likes: FieldValue.arrayUnion(userId) });
      return true;
    }
  }

  /**
   * Write a feed notification for the recipient (like/comment). Stored in users/{recipientUserId}/notifications.
   * Used so the recipient's app can show in-app notifications via real-time listener (no external backend).
   */
  async writeFeedNotification(
    recipientUserId: string,
    payload: FeedNotificationPayload
  ): Promise<void> {
    if (!isFirebaseInitialized()) return;
    const FieldValue = this.getFieldValue();
    const ref = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(recipientUserId)
      .collection(NOTIFICATIONS_SUBCOLLECTION)
      .doc();
    await ref.set({
      type: payload.type,
      actorUserId: payload.actorUserId,
      actorUserName: payload.actorUserName,
      ...(payload.postId != null &&
        String(payload.postId).length > 0 && { postId: payload.postId }),
      ...(payload.commentId != null && { commentId: payload.commentId }),
      ...(payload.content != null && { content: payload.content }),
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Real-time: whether followerUserId follows authorUserId (doc exists under users/{author}/followers/{follower}).
   */
  subscribeToAuthorFollowState(
    authorUserId: string,
    followerUserId: string,
    callback: (isFollowing: boolean) => void
  ): () => void {
    if (!isFirebaseInitialized()) {
      callback(false);
      return () => {};
    }
    const ref = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(authorUserId)
      .collection("followers")
      .doc(followerUserId);
    const unsub = ref.onSnapshot(
      (snap: FirebaseFirestoreTypes.DocumentSnapshot) => callback(snap.exists()),
      () => callback(false)
    );
    return unsub;
  }

  /**
   * Follow / unfollow a feed author. New follow writes an in-app notification for the author.
   */
  async setFollowAuthor(
    authorUserId: string,
    followerUserId: string,
    followerDisplayName: string,
    follow: boolean
  ): Promise<void> {
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase is not available");
    }
    if (authorUserId === followerUserId) return;
    const FieldValue = this.getFieldValue();
    const ref = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(authorUserId)
      .collection("followers")
      .doc(followerUserId);
    const name = followerDisplayName.trim() || "Someone";
    if (follow) {
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          userName: name,
          createdAt: FieldValue.serverTimestamp(),
        });
        await this.writeFeedNotification(authorUserId, {
          type: "follow",
          actorUserId: followerUserId,
          actorUserName: name,
        });
      }
    } else {
      try {
        await ref.delete();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Subscribe to the current user's feed notifications (like, comment, follow). Callback receives docs for in-app list.
   * Unsubscribe by calling the returned function.
   */
  subscribeToFeedNotifications(
    userId: string,
    callback: (
      docs: Array<{
        id: string;
        type: string;
        actorUserId: string;
        actorUserName: string;
        postId?: string;
        commentId?: string;
        content?: string;
        createdAt: FirebaseFirestoreTypes.Timestamp | null;
      }>
    ) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!isFirebaseInitialized()) {
      onError?.(new Error("Firebase is not available"));
      return () => {};
    }
    const ref = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(userId)
      .collection(NOTIFICATIONS_SUBCOLLECTION);
    const unsubscribe = ref
      .orderBy("createdAt", "desc")
      .limit(100)
      .onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => {
            const d = doc.data() as {
              type?: string;
              actorUserId?: string;
              actorUserName?: string;
              postId?: string;
              commentId?: string;
              content?: string;
              createdAt?: FirebaseFirestoreTypes.Timestamp;
            };
            return {
              id: doc.id,
              type: d.type ?? "info",
              actorUserId: d.actorUserId ?? "",
              actorUserName: d.actorUserName ?? "Someone",
              postId: d.postId != null ? String(d.postId) : "",
              commentId: d.commentId,
              content: d.content,
              createdAt: d.createdAt ?? null,
            };
          });
          callback(docs);
        },
        (error) => {
          if (__DEV__) {
            const code = (error as { code?: string })?.code;
            if (code === "firestore/permission-denied") {
              console.warn(
                "subscribeToFeedNotifications: permission denied (ensure user is signed in to Firebase and Firestore rules allow users/{uid}/notifications)"
              );
            } else {
              console.error("subscribeToFeedNotifications error:", error);
            }
          }
          onError?.(error);
        }
      );
    return unsubscribe;
  }

  /**
   * One-shot fetch of feed notifications (same shape as subscribeToFeedNotifications).
   * Use on Collection tab focus to refresh in-app list + drive local Notifee banners.
   */
  async fetchFeedNotificationDocuments(
    userId: string,
    limit = 100
  ): Promise<
    Array<{
      id: string;
      type: string;
      actorUserId: string;
      actorUserName: string;
      postId?: string;
      commentId?: string;
      content?: string;
      createdAt: FirebaseFirestoreTypes.Timestamp | null;
    }>
  > {
    if (!isFirebaseInitialized()) {
      return [];
    }
    try {
      const snapshot = await this.getFirestore()
        .collection(FEED_PREFS_COLLECTION)
        .doc(userId)
        .collection(NOTIFICATIONS_SUBCOLLECTION)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => {
        const d = doc.data() as {
          type?: string;
          actorUserId?: string;
          actorUserName?: string;
          postId?: string;
          commentId?: string;
          content?: string;
          createdAt?: FirebaseFirestoreTypes.Timestamp;
        };
        return {
          id: doc.id,
          type: d.type ?? "info",
          actorUserId: d.actorUserId ?? "",
          actorUserName: d.actorUserName ?? "Someone",
          postId: d.postId != null ? String(d.postId) : "",
          commentId: d.commentId,
          content: d.content,
          createdAt: d.createdAt ?? null,
        };
      });
    } catch (error) {
      if (__DEV__) {
        const code = (error as { code?: string })?.code;
        if (code === "firestore/permission-denied") {
          console.warn(
            "fetchFeedNotificationDocuments: permission denied (Firestore rules / auth)"
          );
        } else {
          console.warn("fetchFeedNotificationDocuments error:", error);
        }
      }
      return [];
    }
  }

  /**
   * Toggle like on a post
   * @param actorUserName - Used to create in-app notification for post owner (optional)
   */
  async toggleLike(
    postId: string,
    userId: string,
    actorUserName?: string
  ): Promise<boolean> {
    return coalesceInFlight(`feed:like:${userId}:${postId}`, async () => {
      try {
        const postRef = this.getFirestore()
          .collection(this.COLLECTION)
          .doc(postId);
        const postDoc = await postRef.get();

      if (!postDoc.exists) {
        throw new Error("Post not found");
      }

      const data = postDoc.data() as PostDocument;
      const likes = data.likes || [];
      const isLiked = likes.includes(userId);
      const postOwnerId = data.userId;

      if (isLiked) {
        // Unlike
        await postRef.update({
          likes: this.getFieldValue().arrayRemove(userId),
        });

        analyticsService.logEvent(EVENTS.post_unliked, { post_id: postId });
        return false;
      } else {
        // Like
        await postRef.update({
          likes: this.getFieldValue().arrayUnion(userId),
        });

          analyticsService.logEvent(EVENTS.post_liked, { post_id: postId });
          analyticsService.logEvent(EVENTS.feed_like, { post_id: postId });

          // In-app notification for post owner (Firebase only, no external backend)
          if (
            postOwnerId &&
            postOwnerId !== userId &&
            isFirebaseInitialized()
          ) {
            try {
              await this.writeFeedNotification(postOwnerId, {
                type: "like",
                actorUserId: userId,
                actorUserName: (actorUserName ?? "").trim() || "Someone",
                postId,
              });
            } catch (e) {
              if (__DEV__)
                console.warn("writeFeedNotification (like) failed:", e);
            }
          }
          return true;
        }
      } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
      }
    });
  }

  /**
   * Get posts by user ID
   */
  subscribeToUserPosts(
    userId: string,
    callback: (posts: Post[]) => void,
    currentUserId?: string,
    onError?: (err: Error) => void
  ): () => void {
    if (!isFirebaseInitialized()) {
      onError?.(new Error("Firebase is not available"));
      return () => {};
    }
    let lastUpdate = 0;
    const DEBOUNCE_MS = 300; // Debounce updates to max once per 300ms

    const unsubscribe = this.getFirestore()
      .collection(this.COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const now = Date.now();
          // Debounce rapid updates to prevent UI blocking on Android
          if (now - lastUpdate < DEBOUNCE_MS) {
            return;
          }
          lastUpdate = now;

          const posts = snapshot.docs
            .map((doc) => this.documentToPost(doc, currentUserId))
            .filter((p): p is Post => p != null);
          callback(posts);
        },
        (error) => {
          if (__DEV__) {
            console.error("Error fetching user posts:", error);
          }
          onError?.(error);
        }
      );

    return unsubscribe;
  }

  /**
   * Get community rules agreed state for the current user (one per user).
   * Returns true if the user has agreed to community rules.
   */
  async getCommunityRulesAgreed(userId: string): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      return false;
    }
    try {
      const doc = await this.getFirestore()
        .collection(FEED_PREFS_COLLECTION)
        .doc(userId)
        .collection(FEED_PREFS_DOC)
        .doc(COMMUNITY_RULES_DOC)
        .get();
      const data = doc.data();
      return !!(data && data[COMMUNITY_RULES_AGREED_FIELD] === true);
    } catch (e) {
      if (__DEV__) {
        console.error("Error getting community rules agreed:", e);
      }
      return false;
    }
  }

  /**
   * Subscribe to community rules agreed state for the current user.
   * Callback receives true when the user has agreed, false otherwise.
   */
  subscribeToCommunityRulesAgreed(
    userId: string,
    callback: (isAgreed: boolean) => void
  ): () => void {
    if (!isFirebaseInitialized()) {
      callback(false);
      return () => {};
    }
    const ref = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(userId)
      .collection(FEED_PREFS_DOC)
      .doc(COMMUNITY_RULES_DOC);
    const unsubscribe = ref.onSnapshot(
      (snap) => {
        const data = snap.data();
        callback(!!(data && data[COMMUNITY_RULES_AGREED_FIELD] === true));
      },
      (err) => {
        const isPermissionDenied =
          (err as any)?.code === "firestore/permission-denied" ||
          (err as any)?.message?.includes("permission-denied");
        if (!isPermissionDenied && __DEV__) {
          console.error("Error subscribing to community rules agreed:", err);
        }
        callback(false);
      }
    );
    return unsubscribe;
  }

  /**
   * Mark community rules as agreed for the current user (one per user).
   * Call this when the user taps Agree in the community rules sheet.
   */
  async setCommunityRulesAgreed(userId: string): Promise<void> {
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase is not available");
    }
    const ref = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(userId)
      .collection(FEED_PREFS_DOC)
      .doc(COMMUNITY_RULES_DOC);
    await ref.set({
      [COMMUNITY_RULES_AGREED_FIELD]: true,
      [COMMUNITY_RULES_AGREED_AT_FIELD]: this.getFieldValue().serverTimestamp(),
    });
    analyticsService.logEvent(EVENTS.community_rules_agreed, {
      user_id: userId,
    });
  }

  /**
   * Subscribe to post IDs excluded from the user's feed (hidden + reported by them).
   */
  subscribeToFeedExcludedPostIds(
    userId: string,
    callback: (excludedIds: Set<string>) => void
  ): () => void {
    let firestoreHiddenIds = new Set<string>();
    let firestoreReportedIds = new Set<string>();
    let localHiddenIds = new Set<string>();
    let localReportedIds = new Set<string>();

    const emitMerged = () => {
      callback(
        mergeHiddenPostIdSets(
          localHiddenIds,
          localReportedIds,
          firestoreHiddenIds,
          firestoreReportedIds
        )
      );
    };

    const unsubLocalHidden = subscribeToLocalHiddenPostIds(userId, (ids) => {
      localHiddenIds = ids;
      emitMerged();
    });
    const unsubLocalReported = subscribeToLocalReportedPostIds(
      userId,
      (ids) => {
        localReportedIds = ids;
        emitMerged();
      }
    );

    if (!isFirebaseInitialized()) {
      return () => {
        unsubLocalHidden();
        unsubLocalReported();
      };
    }

    const hiddenRef = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(userId)
      .collection(FEED_PREFS_DOC)
      .doc("hidden");
    const reportedRef = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(userId)
      .collection(FEED_PREFS_DOC)
      .doc("reported");

    const unsubHiddenFirestore = hiddenRef.onSnapshot(
      (snap) => {
        const data = snap.data();
        const arr = (data && data[HIDDEN_POST_IDS_FIELD]) || [];
        firestoreHiddenIds = new Set(Array.isArray(arr) ? arr : []);
        emitMerged();
      },
      (err) => {
        const isPermissionDenied =
          (err as any)?.code === "firestore/permission-denied" ||
          (err as any)?.message?.includes("permission-denied");
        if (!isPermissionDenied && __DEV__) {
          console.error("Error subscribing to hidden post IDs:", err);
        }
        void loadExcludedPostIds(userId).then(callback);
      }
    );

    const unsubReportedFirestore = reportedRef.onSnapshot(
      (snap) => {
        const data = snap.data();
        const arr = (data && data[REPORTED_POST_IDS_FIELD]) || [];
        firestoreReportedIds = new Set(Array.isArray(arr) ? arr : []);
        emitMerged();
      },
      (err) => {
        const isPermissionDenied =
          (err as any)?.code === "firestore/permission-denied" ||
          (err as any)?.message?.includes("permission-denied");
        if (!isPermissionDenied && __DEV__) {
          console.error("Error subscribing to reported post IDs:", err);
        }
        void loadExcludedPostIds(userId).then(callback);
      }
    );

    return () => {
      unsubLocalHidden();
      unsubLocalReported();
      unsubHiddenFirestore();
      unsubReportedFirestore();
    };
  }

  /** @deprecated Use subscribeToFeedExcludedPostIds */
  subscribeToHiddenPostIds(
    userId: string,
    callback: (hiddenIds: Set<string>) => void
  ): () => void {
    return this.subscribeToFeedExcludedPostIds(userId, callback);
  }

  /**
   * Hide a post from the current user's feed. The post will no longer appear for them.
   */
  async hidePost(userId: string, postId: string): Promise<void> {
    await addHiddenPostId(userId, postId);

    if (isFirebaseInitialized()) {
      const ref = this.getFirestore()
        .collection(FEED_PREFS_COLLECTION)
        .doc(userId)
        .collection(FEED_PREFS_DOC)
        .doc("hidden");
      const FieldValue = this.getFieldValue();
      try {
        await ref.update({
          [HIDDEN_POST_IDS_FIELD]: FieldValue.arrayUnion(postId),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (e: any) {
        if (e?.code === "not-found" || e?.message?.includes("NOT_FOUND")) {
          try {
            await ref.set({
              [HIDDEN_POST_IDS_FIELD]: [postId],
              updatedAt: FieldValue.serverTimestamp(),
            });
          } catch (firestoreError) {
            if (__DEV__) {
              console.warn(
                "Firestore hidePost sync failed (local hide still saved):",
                firestoreError
              );
            }
          }
        } else if (__DEV__) {
          console.warn(
            "Firestore hidePost sync failed (local hide still saved):",
            e
          );
        }
      }
    }

    analyticsService.logEvent(EVENTS.post_hidden, { post_id: postId });
  }

  private async syncReportedPostToFirestore(
    userId: string,
    postId: string
  ): Promise<void> {
    if (!isFirebaseInitialized()) return;

    const ref = this.getFirestore()
      .collection(FEED_PREFS_COLLECTION)
      .doc(userId)
      .collection(FEED_PREFS_DOC)
      .doc("reported");
    const FieldValue = this.getFieldValue();

    try {
      await ref.update({
        [REPORTED_POST_IDS_FIELD]: FieldValue.arrayUnion(postId),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (e: any) {
      if (e?.code === "not-found" || e?.message?.includes("NOT_FOUND")) {
        try {
          await ref.set({
            [REPORTED_POST_IDS_FIELD]: [postId],
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (firestoreError) {
          if (__DEV__) {
            console.warn(
              "Firestore reportPost sync failed (local report still saved):",
              firestoreError
            );
          }
        }
      } else if (__DEV__) {
        console.warn(
          "Firestore reportPost sync failed (local report still saved):",
          e
        );
      }
    }
  }

  /**
   * Report a post and exclude it from the reporter's feed.
   * Also stores the report in `reports` for moderation when Firestore allows it.
   */
  async reportPost(
    userId: string,
    postId: string,
    reason?: string
  ): Promise<void> {
    await addReportedPostId(userId, postId);
    await this.syncReportedPostToFirestore(userId, postId);

    if (isFirebaseInitialized()) {
      try {
        await this.getFirestore()
          .collection(REPORTS_COLLECTION)
          .add({
            postId,
            reportedBy: userId,
            reason: reason || null,
            createdAt: this.getFieldValue().serverTimestamp(),
          });
      } catch (e) {
        if (__DEV__) {
          console.error("Error saving report:", e);
        }
      }
    }

    analyticsService.logEvent(EVENTS.post_reported, {
      post_id: postId,
      has_reason: !!reason,
    });
  }
}

export const feedService = new FeedService();
