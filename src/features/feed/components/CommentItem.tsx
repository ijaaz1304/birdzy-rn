/**
 * Comment row — Figma feed post details (9162:109674)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInput,
} from "react-native";
import { AppImage } from "@/components/AppImage";
import { useTheme } from "../../../hooks/useTheme";
import { FEED_COLORS } from "../../../constants/colorConstants";
import { Text } from "../../../atoms";
import { Avatar } from "../../../atoms";
import { IconButton } from "../../../atoms";
import { Images } from "../../../assets";
import { spacing } from "../../../design-system/spacing";

export interface Comment {
  id: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  isMyComment?: boolean;
  replies?: Reply[];
}

export interface Reply {
  id: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  isMyReply?: boolean;
}

export interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  onOptions?: (commentId: string, isMyComment: boolean) => void;
  onReplyLike?: (commentId: string, replyId: string) => void;
  onReplyOptions?: (
    commentId: string,
    replyId: string,
    isMyReply: boolean
  ) => void;
  isReplying?: boolean;
  replyText?: string;
  onReplyTextChange?: (text: string) => void;
  onSendReply?: () => void;
  replyUserAvatar?: string;
  replyUserName?: string;
  style?: ViewStyle;
  showDivider?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onOptions,
  onReplyLike,
  isReplying = false,
  replyText = "",
  onReplyTextChange,
  onSendReply,
  replyUserAvatar,
  replyUserName,
  style,
  showDivider = true,
}) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const [showReplies, setShowReplies] = useState(false);
  const inlineReplyRef = useRef<TextInput>(null);
  const likeActiveColor = FEED_COLORS.LIKE_ACTIVE;
  const likeIcon = isDark ? Images.feedLikeDark : Images.feedLike;
  const commentIcon = isDark ? Images.feedCommentDark : Images.feedComment;

  const hasReplies = !!comment.replies?.length;
  const replyCount = comment.replies?.length ?? 0;
  const repliesVisible = showReplies || isReplying;

  useEffect(() => {
    if (isReplying) {
      setShowReplies(true);
      setTimeout(() => inlineReplyRef.current?.focus(), 100);
    }
  }, [isReplying]);

  const toggleReplies = () => {
    if (repliesVisible) {
      setShowReplies(false);
      if (isReplying) onReply?.(comment.id);
      return;
    }
    if (!hasReplies) {
      onReply?.(comment.id);
      setShowReplies(true);
      return;
    }
    setShowReplies(true);
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.commentBlock}>
        <View style={styles.commentHeader}>
          <View style={styles.commentHeaderLeft}>
            <Avatar name={comment.userName} size={24} source={comment.userAvatar} />
            <Text
              variant="body"
              size="small"
              weight="medium"
              color="text"
              style={styles.userName}
            >
              {comment.userName}
            </Text>
          </View>
          <IconButton
            icon="more-horizontal"
            variant="ghost"
            size="small"
            onPress={() => onOptions?.(comment.id, !!comment.isMyComment)}
            style={[
              styles.moreButton,
              { backgroundColor: theme.colors.surfacePrimary },
            ] as unknown as ViewStyle}
          />
        </View>

        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.commentBody}
        >
          {comment.content}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => onLike?.(comment.id)}
            style={styles.actionChip}
            activeOpacity={0.7}
          >
            <AppImage source={likeIcon} style={styles.actionIcon} resizeMode="contain" />
            <Text
              variant="body"
              size="small"
              weight="medium"
              style={{
                color: comment.isLiked ? likeActiveColor : likeActiveColor,
              }}
            >
              {comment.likes > 0 ? comment.likes : comment.isLiked ? 1 : 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleReplies}
            style={styles.actionChip}
            activeOpacity={0.7}
          >
            <AppImage
              source={commentIcon}
              style={styles.actionIcon}
              resizeMode="contain"
            />
            <Text variant="body" size="small" weight="medium" color="text">
              {repliesVisible
                ? "Hide comment"
                : replyCount > 0
                ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                : "Reply"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {repliesVisible && (hasReplies || isReplying) && (
        <View style={styles.repliesBlock}>
          {comment.replies?.map((reply) => (
            <View key={reply.id} style={styles.replyItem}>
              <Avatar name={reply.userName} size={24} source={reply.userAvatar} />
              <View style={styles.replyBodyWrap}>
                <Text
                  variant="body"
                  size="small"
                  weight="medium"
                  color="text"
                  style={styles.replyUserName}
                >
                  {reply.userName}
                </Text>
                <Text variant="body" size="small" color="textSecondary">
                  {reply.content}
                </Text>
              </View>
            </View>
          ))}

          {isReplying && (
            <View style={styles.inlineReplyRow}>
              <Avatar
                name={replyUserName ?? "You"}
                size={32}
                source={replyUserAvatar}
              />
              <View
                style={[
                  styles.inlineReplyField,
                  {
                    backgroundColor: theme.colors.textFieldBackground,
                    borderColor: theme.colors.textFieldBorder,
                  },
                ]}
              >
                <TextInput
                  ref={inlineReplyRef}
                  style={[styles.inlineReplyInput, { color: theme.colors.text }]}
                  placeholder="Write a reply..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={replyText}
                  onChangeText={onReplyTextChange}
                  returnKeyType="send"
                  onSubmitEditing={onSendReply}
                />
                <TouchableOpacity
                  onPress={onSendReply}
                  disabled={!replyText.trim()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppImage
                    source={Images.aiChatSend}
                    style={[
                      styles.inlineSendIcon,
                      { opacity: replyText.trim() ? 1 : 0.4 },
                    ]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {showDivider && (
        <View
          style={[styles.divider, { backgroundColor: theme.colors.border0 }]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  commentBlock: {
    gap: 8,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  userName: {
    flex: 1,
  },
  moreButton: {
    borderRadius: 24,
    width: 32,
    height: 32,
  },
  commentBody: {
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 28,
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  repliesBlock: {
    paddingLeft: 32,
    marginTop: 8,
    gap: 8,
  },
  replyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  replyBodyWrap: {
    flex: 1,
    gap: 4,
  },
  replyUserName: {
    lineHeight: 16,
  },
  inlineReplyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  inlineReplyField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 360,
    minHeight: 48,
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    gap: 12,
  },
  inlineReplyInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 0,
  },
  inlineSendIcon: {
    width: 20,
    height: 20,
  },
  divider: {
    height: 1,
    width: "100%",
    marginTop: 16,
  },
});
