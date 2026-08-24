/**
 * FeedCard Component
 * Reusable post card with proper theming and consistent styling
 */

import { AppImage, CachedRemoteImage } from "@/components/AppImage";
import React, { useRef } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Images } from "../../../assets";
import { FEED_COLORS, UI_COLORS } from "../../../constants/colorConstants";
import { Text } from "../../../atoms";
import { Avatar } from "../../../atoms";
import { IconButton } from "../../../atoms";

import { Radius } from "../../../design";


export interface FeedCardProps {
  userName: string;
  userAvatar?: string;
  timestamp: string;
  title?: string;
  content?: string;
  image?: string;
  itemName?: string;
  likes: number;
  comments: number;
  shares?: number;
  isLiked?: boolean;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  /** Called when options (3-dot) is pressed; receives anchor Y for positioning popup below the button. */
  onOptions?: (anchorTop?: number) => void;
  showItemName?: boolean;
  style?: ViewStyle;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  userName,
  userAvatar,
  timestamp,
  title,
  content,
  image,
  itemName,
  likes,
  comments,
  shares,
  isLiked = false,
  onPress,
  onLike,
  onComment,
  onShare,
  onOptions,
  showItemName = false,
  style,
}) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const optionsButtonRef = useRef<View>(null);

  const handleOptionsPress = () => {
    optionsButtonRef.current?.measureInWindow((_x, y, _w, height) => {
      onOptions?.(y + height + 4);
    });
  };

  const actionColorInactive = theme.colors.textSecondary;
  const likeActiveColor = FEED_COLORS.LIKE_ACTIVE;

  const likeIcon = isLiked
    ? isDark
      ? Images.feedLikeSelectedDark
      : Images.feedLikeSelected
    : isDark
    ? Images.feedLikeDark
    : Images.feedLike;
  const commentIcon = isDark ? Images.feedCommentDark : Images.feedComment;
  const shareIcon = isDark ? Images.feedShareDark : Images.feedShare;

  const cardStyle = {
    backgroundColor:
      theme.mode === "dark"
        ? FEED_COLORS.CARD.DARK.BACKGROUND
        : FEED_COLORS.CARD.LIGHT.BACKGROUND,
    borderColor:
      theme.mode === "dark"
        ? FEED_COLORS.CARD.DARK.BORDER
        : FEED_COLORS.CARD.LIGHT.BORDER,
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, cardStyle, style]}
    >
      {/* Post Header */}
      <View style={styles.header}>
        <Avatar name={userName} size={40} source={userAvatar} />
        <View style={styles.headerInfo}>
          <Text variant="body" size="medium" weight="semibold" color="text">
            {userName}
          </Text>
          <Text
            variant="body"
            size="small"
            style={{
              color: theme.colors.textTertiary ?? UI_COLORS.TEXT_TERTIARY,
            }}
          >
            {timestamp}
          </Text>
        </View>
        {onOptions && (
          <View ref={optionsButtonRef} collapsable={false}>
            <IconButton
              icon="more-horizontal"
              variant="ghost"
              size="small"
              onPress={handleOptionsPress}
            />
          </View>
        )}
      </View>

      {/* Post Title - above image (Facebook style) */}
      {title && (
        <Text
          variant="title"
          size="medium"
          weight="semibold"
          color="text"
          style={styles.title}
        >
          {title}
        </Text>
      )}

      {/* Post Content / Description - above image */}
      {content && (
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.content}
        >
          {content}
        </Text>
      )}

      {/* Item Name (e.g., Mineral Name) */}
      {showItemName && itemName && (
        <View style={styles.itemNameContainer}>
          <Text variant="body" size="small" color="primary" weight="medium">
            {itemName}
          </Text>
        </View>
      )}

      {/* Post Image - below title/description; placeholder until FastImage onLoad */}
      {image && (
        <View style={styles.imageContainer}>
          <CachedRemoteImage
            uri={image}
            style={styles.image}
            borderRadius={Radius.md}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Stats row: "X likes • Y comments" | "Z shares" (above the action buttons) */}
      <View
        style={[styles.statsRow, { borderBottomColor: theme.colors.border }]}
      >
        <Text variant="body" size="small" style={styles.statsLeft}>
          <Text
            style={{
              color: likes > 0 ? likeActiveColor : theme.colors.textSecondary,
            }}
          >
            {likes} {likes === 1 ? "like" : "likes"}
          </Text>
          <Text style={{ color: theme.colors.textSecondary }}>
            {" • "}
            {comments} {comments === 1 ? "comment" : "comments"}
          </Text>
        </Text>
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.statsRight}
        >
          {shares !== undefined && shares > 0 ? `${shares} shares` : ""}
        </Text>
      </View>

      {/* Post Actions - Like/Liked, Comment, Share (no counts in labels) */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={onLike}
        >
          <AppImage
            source={likeIcon}
            style={styles.actionIcon}
            resizeMode="contain"
          />
          <Text
            variant="body"
            size="small"
            weight="medium"
            style={[
              styles.actionText,
              { color: isLiked ? likeActiveColor : actionColorInactive },
            ]}
          >
            {isLiked ? "Liked" : "Like"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={onComment}
        >
          <AppImage
            source={commentIcon}
            style={styles.actionIcon}
            resizeMode="contain"
          />
          <Text
            variant="body"
            size="small"
            weight="medium"
            style={[styles.actionText, { color: actionColorInactive }]}
          >
            Comment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={onShare}
        >
          <AppImage
            source={shareIcon}
            style={styles.actionIcon}
            resizeMode="contain"
          />
          <Text
            variant="body"
            size="small"
            weight="medium"
            style={[styles.actionText, { color: actionColorInactive }]}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignSelf: "center",
    padding: 12,
    gap: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    lineHeight: 32,
    paddingVertical: 2,
  },
  content: {
    lineHeight: 20,
  },
  itemNameContainer: {
    marginTop: -4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statsLeft: {
    flex: 1,
  },
  statsRight: {},
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionIcon: {
    width: 18,
    height: 18,
  },
  actionText: {
    marginLeft: 4,
  },
});
