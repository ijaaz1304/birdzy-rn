/**
 * Post Details Screen — Figma feed post / comments (9162:109674)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { useToast } from "../../../hooks/useToast";
import { useAuthStore } from "../../../features/auth/auth.store";
import { feedService } from "../../../services/firebase";
import { FEED_COLORS } from "../../../constants/colorConstants";
import { Text, NavBackIcon } from "../../../atoms";
import { Avatar, IconButton, Button } from "../../../atoms";
import { AppImage, CachedRemoteImage } from "@/components/AppImage";
import { ReportModal, REPORT_MODAL_KEYBOARD_COOLDOWN_MS } from "../../../molecules/ReportModal";
import { MODAL_STRINGS } from "../../../config/strings/modals.strings";
import { FeedStackParamList } from "../../../navigation/types";
import { CommentItem, Comment } from "../components/CommentItem";
import { PostActionSheet } from "../components/PostActionSheet";
import { DeletePostPopup } from "../components/DeletePostPopup";
import { Images } from "../../../assets";
import type { Post } from "../../../data/feed/postTypes";
import { spacing } from "../../../design-system/spacing";

type PostDetailsScreenRouteProp = RouteProp<FeedStackParamList, "PostDetails">;
type PostDetailsScreenNavigationProp = NativeStackNavigationProp<
  FeedStackParamList,
  "PostDetails"
>;

export const PostDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.mode === "dark";
  const navigation = useNavigation<PostDetailsScreenNavigationProp>();
  const route = useRoute<PostDetailsScreenRouteProp>();
  const { postId } = route.params;
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [_selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );
  const [_selectedReplyId, setSelectedReplyId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null
  );
  const [actionSheetAnchorTop, setActionSheetAnchorTop] = useState<
    number | undefined
  >(undefined);
  const moreButtonRef = useRef<View>(null);
  const commentInputRef = useRef<TextInput>(null);

  const likeIcon = isDark ? Images.feedLikeDark : Images.feedLike;
  const likeIconSelected = isDark
    ? Images.feedLikeSelectedDark
    : Images.feedLikeSelected;
  const shareIcon = isDark ? Images.feedShareDark : Images.feedShare;
  const likeActiveColor = FEED_COLORS.LIKE_ACTIVE;

  useEffect(() => {
    let cancelled = false;
    feedService
      .getPost(postId, user?.id ?? undefined)
      .then((p) => {
        if (!cancelled) setPost(p ?? null);
      })
      .catch(() => {
        if (!cancelled) setPost(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, user?.id]);

  useEffect(() => {
    if (!postId) return;
    const unsubscribe = feedService.subscribeToComments(
      postId,
      user?.id,
      setComments
    );
    return unsubscribe;
  }, [postId, user?.id]);

  const handlePostLike = async () => {
    if (!user?.id || !post) return;
    try {
      await feedService.toggleLike(
        postId,
        user.id,
        user.name || user.email || "Someone"
      );
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likes: (post.likes || 0) + (post.isLiked ? -1 : 1),
      });
    } catch (e) {
      console.error("Error toggling like:", e);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const { sharePost } = require("../../../utils/shareUtils");
    await sharePost(postId, post.content || "", post.image);
  };

  const handleAddComment = async () => {
    if (!user?.id || !commentText.trim()) return;
    const text = commentText.trim();
    const replyToCommentId = replyingToCommentId;
    setCommentText("");
    setReplyingToCommentId(null);
    const isReply = !!replyToCommentId;
    try {
      if (isReply && replyToCommentId) {
        await feedService.addReply(
          postId,
          replyToCommentId,
          user.id,
          user.name ?? "User",
          user.avatar,
          text
        );
        showToast("Reply added", "success");
      } else {
        await feedService.addComment(
          postId,
          user.id,
          user.name ?? "User",
          user.avatar,
          text
        );
        showToast("Comment added", "success");
        if (post) {
          setPost({
            ...post,
            comments: (post.comments || 0) + 1,
          });
        }
      }
    } catch (e) {
      console.error(
        isReply ? "Error adding reply:" : "Error adding comment:",
        e
      );
      setCommentText(text);
      if (isReply) setReplyingToCommentId(replyToCommentId);
      showToast(
        isReply ? "Could not add reply" : "Could not add comment",
        "error"
      );
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user?.id) return;
    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;
      await feedService.toggleCommentLike(postId, commentId, user.id);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likes: c.likes + (c.isLiked ? -1 : 1),
              }
            : c
        )
      );
    } catch (e) {
      console.error("Error toggling comment like:", e);
    }
  };

  const handleReply = (commentId: string) => {
    if (replyingToCommentId === commentId) {
      setReplyingToCommentId(null);
      setCommentText("");
      return;
    }
    setReplyingToCommentId(commentId);
    setCommentText("");
  };

  const handleReplyLike = async (commentId: string, replyId: string) => {
    if (!user?.id) return;
    try {
      await feedService.toggleReplyLike(postId, commentId, replyId, user.id);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId || !c.replies) return c;
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === replyId
                ? {
                    ...r,
                    isLiked: !r.isLiked,
                    likes: r.likes + (r.isLiked ? -1 : 1),
                  }
                : r
            ),
          };
        })
      );
    } catch (e) {
      console.error("Error toggling reply like:", e);
    }
  };

  const handleDeletePost = async () => {
    if (!user?.id) return;
    setShowDeletePopup(false);
    try {
      await feedService.deletePost(postId, user.id);
      showToast("Post deleted", "success");
      navigation.goBack();
    } catch (e) {
      console.error("Delete failed", e);
      showToast("Could not delete post", "error");
    }
  };

  const handleHidePost = async () => {
    if (!user?.id) return;
    try {
      await feedService.hidePost(user.id, postId);
      showToast("Post hidden from your feed", "success");
      navigation.goBack();
    } catch (e) {
      console.error("Hide post failed", e);
      showToast("Could not hide post", "error");
    }
  };

  const handleReportSubmit = async (message: string) => {
    if (!user?.id) return;
    try {
      await feedService.reportPost(user.id, postId, message);
      showToast(MODAL_STRINGS.modals.reportPost.successMessage, "success");
      setTimeout(() => {
        navigation.goBack();
      }, REPORT_MODAL_KEYBOARD_COOLDOWN_MS);
    } catch (e) {
      console.error("Report failed", e);
      showToast("Could not submit report", "error");
    }
  };

  const closeReportSheet = useCallback(() => {
    setShowReportSheet(false);
  }, []);

  const surfaceColor = theme.colors.surfacePrimary;
  const canSend = commentText.trim().length > 0;
  const currentUserName = user?.name ?? user?.email ?? "You";

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <NavBackIcon color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerSpacer} />
      <View ref={moreButtonRef} collapsable={false}>
        <IconButton
          icon="more-horizontal"
          variant="ghost"
          size="medium"
          onPress={() => {
            moreButtonRef.current?.measureInWindow((_x, y, _w, height) => {
              setActionSheetAnchorTop(y + height + 4);
              setShowActionSheet(true);
            });
          }}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: surfaceColor }]}
        edges={["top", "bottom"]}
      >
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: surfaceColor }]}
        edges={["top", "bottom"]}
      >
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text variant="body" color="textSecondary">
            Post not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {renderHeader()}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: 24 + insets.bottom + 56 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Post block */}
            <View style={styles.postBlock}>
              <View style={styles.postAuthorRow}>
                <Avatar
                  name={post.userName}
                  size={40}
                  source={post.userAvatar}
                />
                <View style={styles.postAuthorMeta}>
                  <Text variant="body" size="small" weight="medium" color="text">
                    {post.userName}
                  </Text>
                  <Text variant="body" size="small" color="textTertiary">
                    {post.timestamp ?? "Just now"}
                  </Text>
                </View>
              </View>

              {post.title ? (
                <Text
                  variant="title"
                  size="large"
                  weight="bold"
                  color="text"
                  style={styles.postTitle}
                >
                  {post.title}
                </Text>
              ) : null}

              {(post.content || post.caption) ? (
                <Text
                  variant="body"
                  size="medium"
                  color="textSecondary"
                  style={styles.postBody}
                >
                  {post.content || post.caption}
                </Text>
              ) : null}

              {post.image ? (
                <CachedRemoteImage
                  uri={post.image}
                  style={styles.postImage}
                  borderRadius={12}
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <View
              style={[styles.sectionDivider, { backgroundColor: theme.colors.border0 }]}
            />

            {/* Comments header + composer */}
            <View style={styles.commentsSection}>
              <Text
                variant="title"
                size="medium"
                weight="medium"
                color="text"
                style={styles.commentsTitle}
              >
                Comments ({comments.length})
              </Text>

              {!replyingToCommentId && (
                <View style={styles.composerBlock}>
                  <View style={styles.composerUserRow}>
                    <Avatar
                      name={currentUserName}
                      size={24}
                      source={user?.avatar}
                    />
                    <Text variant="body" size="small" weight="medium" color="text">
                      {currentUserName}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.composerField,
                      {
                        backgroundColor: theme.colors.textFieldBackground,
                        borderColor: theme.colors.textFieldBorder,
                      },
                    ]}
                  >
                    <TextInput
                      ref={commentInputRef}
                      style={[styles.composerInput, { color: theme.colors.text }]}
                      placeholder="What are your thought?"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.composerActions}>
                    <Button
                      title="Send"
                      size="medium"
                      variant="primary"
                      disabled={!canSend}
                      onPress={handleAddComment}
                      style={styles.sendPill}
                      textStyle={styles.sendPillText}
                    />
                  </View>
                </View>
              )}

              {comments.length === 0 ? (
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={styles.emptyText}
                >
                  No comments yet. Be the first to comment!
                </Text>
              ) : (
                comments.map((comment, index) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onLike={handleCommentLike}
                    onOptions={(commentId, _isMyComment) => {
                      setSelectedCommentId(commentId);
                    }}
                    onReplyLike={handleReplyLike}
                    onReplyOptions={(commentId, replyId, _isMyReply) => {
                      setSelectedCommentId(commentId);
                      setSelectedReplyId(replyId);
                    }}
                    isReplying={replyingToCommentId === comment.id}
                    replyText={
                      replyingToCommentId === comment.id ? commentText : ""
                    }
                    onReplyTextChange={setCommentText}
                    onSendReply={handleAddComment}
                    replyUserAvatar={user?.avatar}
                    replyUserName={currentUserName}
                    showDivider={index < comments.length - 1}
                  />
                ))
              )}
            </View>
          </ScrollView>

          {/* Bottom like / share bar */}
          <View
            style={[
              styles.bottomBar,
              {
                borderTopColor: theme.colors.border0,
                backgroundColor: surfaceColor,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.bottomActionHalf}
              onPress={handlePostLike}
              activeOpacity={0.7}
            >
              <AppImage
                source={post.isLiked ? likeIconSelected : likeIcon}
                style={styles.bottomIcon}
                resizeMode="contain"
              />
              <Text
                variant="body"
                size="small"
                weight="medium"
                style={{ color: likeActiveColor }}
              >
                {post.likes || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomActionHalf}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <AppImage
                source={shareIcon}
                style={styles.bottomIcon}
                resizeMode="contain"
              />
              <Text variant="body" size="small" weight="medium" color="text">
                {post.shares || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <PostActionSheet
          visible={showActionSheet}
          isMyPost={!!post.isMyPost}
          showOptionIcons={false}
          onEdit={() =>
            navigation.navigate("CreatePost", {
              postId,
              initialPost: {
                title: post.title,
                content: post.content || post.caption,
                itemName: post.itemName,
                image: post.image,
              },
            })
          }
          onDelete={() => {
            setShowActionSheet(false);
            setShowDeletePopup(true);
          }}
          onHide={handleHidePost}
          onReport={() => setShowReportSheet(true)}
          onClose={() => setShowActionSheet(false)}
          anchorTop={actionSheetAnchorTop}
        />

        <DeletePostPopup
          visible={showDeletePopup}
          onConfirm={handleDeletePost}
          onCancel={() => setShowDeletePopup(false)}
        />

        <ReportModal
          visible={showReportSheet}
          variant="post"
          onSubmit={handleReportSubmit}
          onClose={closeReportSheet}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: 12,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: 8,
  },
  postBlock: {
    gap: 12,
    paddingBottom: 16,
  },
  postAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  postAuthorMeta: {
    gap: 2,
  },
  postTitle: {
    fontSize: 20,
    lineHeight: 28,
  },
  postBody: {
    fontSize: 16,
    lineHeight: 24,
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 4,
  },
  sectionDivider: {
    height: 1,
    width: "100%",
    marginBottom: 16,
  },
  commentsSection: {
    gap: 16,
  },
  commentsTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  composerBlock: {
    gap: 12,
  },
  composerUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composerField: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 96,
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
  },
  composerInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 72,
    padding: 0,
  },
  composerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sendPill: {
    minWidth: 88,
    minHeight: 40,
    height: 40,
    borderRadius: 24,
    paddingHorizontal: spacing[4],
    paddingVertical: 0,
  },
  sendPillText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 24,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingTop: 12,
    borderTopWidth: 1,
  },
  bottomActionHalf: {
    flex: 1,
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
  },
  bottomIcon: {
    width: 20,
    height: 20,
  },
});
