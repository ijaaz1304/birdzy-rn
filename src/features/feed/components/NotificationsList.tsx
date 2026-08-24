/**
 * Notifications List — feed activity UI (avatar + type badge, bold name, time, unread tint)
 */

import React, { useEffect, useCallback, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Text as RNText } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { FEED_COLORS, UI_COLORS } from "../../../constants/colorConstants";
import { Text, NavBackIcon } from "../../../atoms";
import { Avatar } from "../../../atoms";
import { spacing } from "../../../design-system/spacing";

import {
  useNotificationsStore,
  Notification,
} from "../../notifications/notifications.store";

import { FONTS } from "../../../common/typography";

const UNREAD_ROW_BG_LIGHT = "#E8F4FC";
const UNREAD_ROW_BG_DARK = "rgba(59, 130, 246, 0.16)";
const LIKE_BADGE = FEED_COLORS.LIKE_ACTIVE;
const COMMENT_BADGE = "#16A34A";
const FOLLOW_BADGE = "#7C3AED";

export interface NotificationsListProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

function inferFeedActivityType(
  n: Notification
): "like" | "comment" | "follow" | null {
  if (n.feedActivityType) return n.feedActivityType;
  const t = n.title.toLowerCase();
  if (t.includes("liked your post")) return "like";
  if (t.includes("commented")) return "comment";
  if (t.includes("subscribed")) return "follow";
  return null;
}

function displayActorName(n: Notification): string {
  if (n.actorUserName?.trim()) return n.actorUserName.trim();
  const first = n.title.split(/\s+/)[0];
  return first || "Someone";
}

const NotificationItem: React.FC<{
  notification: Notification;
  onPress: () => void;
}> = React.memo(
  ({ notification, onPress }) => {
    const theme = useTheme();
    const isDark = useIsDark();
    const { markAsRead } = useNotificationsStore();

    const handlePress = () => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      onPress();
    };

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };

    const feedType = inferFeedActivityType(notification);
    const name = displayActorName(notification);
    const unreadBg = isDark ? UNREAD_ROW_BG_DARK : UNREAD_ROW_BG_LIGHT;

    const badgeMeta = useMemo(() => {
      switch (feedType) {
        case "like":
          return { icon: "thumb-up" as const, color: LIKE_BADGE };
        case "comment":
          return { icon: "chat-bubble" as const, color: COMMENT_BADGE };
        case "follow":
          return { icon: "person-add" as const, color: FOLLOW_BADGE };
        default:
          return {
            icon: "notifications" as const,
            color: theme.colors.primary,
          };
      }
    }, [feedType, theme.colors.primary]);

    const messageText = useMemo(() => {
      if (feedType === "like") {
        return (
          <RNText style={styles.messageLine} numberOfLines={3}>
            <RNText style={[styles.messageBold, { color: theme.colors.text }]}>
              {name}
            </RNText>
            <RNText
              style={[styles.messageRest, { color: FEED_COLORS.LIKE_ACTIVE }]}
            >
              {" "}
              liked your post.
            </RNText>
          </RNText>
        );
      }
      if (feedType === "comment") {
        return (
          <RNText style={styles.messageLine} numberOfLines={3}>
            <RNText style={[styles.messageBold, { color: theme.colors.text }]}>
              {name}
            </RNText>
            <RNText style={[styles.messageRest, { color: theme.colors.text }]}>
              {" "}
              commented on your post.
            </RNText>
          </RNText>
        );
      }
      if (feedType === "follow") {
        return (
          <RNText style={styles.messageLine} numberOfLines={3}>
            <RNText style={[styles.messageBold, { color: theme.colors.text }]}>
              {name}
            </RNText>
            <RNText style={[styles.messageRest, { color: theme.colors.text }]}>
              {" "}
              subscribed to you.
            </RNText>
          </RNText>
        );
      }
      return (
        <Text
          variant="body"
          size="medium"
          weight="normal"
          style={{ color: theme.colors.text }}
        >
          {notification.title}
        </Text>
      );
    }, [feedType, name, notification.title, theme.colors.text]);

    const AVATAR_SIZE = 52;

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.row,
          !notification.read && { backgroundColor: unreadBg },
        ]}
      >
        <View style={styles.avatarCol}>
          <View style={styles.avatarWrap}>
            <Avatar name={name} size={AVATAR_SIZE} />
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: badgeMeta.color,
                  borderColor: isDark ? theme.colors.surface : UI_COLORS.WHITE,
                },
              ]}
            >
              <MaterialIcons
                name={badgeMeta.icon}
                size={14}
                color={UI_COLORS.WHITE}
              />
            </View>
          </View>
        </View>
        <View style={styles.textCol}>
          {messageText}
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.time}
          >
            {formatTime(notification.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.notification.id === nextProps.notification.id &&
      prevProps.notification.read === nextProps.notification.read &&
      prevProps.onPress === nextProps.onPress
    );
  }
);

NotificationItem.displayName = "NotificationItem";

export const NotificationsList: React.FC<NotificationsListProps> = ({
  visible,
  onClose,
  onNotificationPress,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const { notifications, fetchNotifications } = useNotificationsStore();

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible, fetchNotifications]);

  const handleItemPress = useCallback(
    (notification: Notification) => {
      onNotificationPress?.(notification);
    },
    [onNotificationPress]
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={() => handleItemPress(item)}
      />
    ),
    [handleItemPress]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="large"
          weight="bold"
          style={styles.headerTitle}
        >
          Notifications
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="notifications-none"
            size={56}
            color={theme.colors.textTertiary}
          />
          <Text
            variant="title"
            size="medium"
            weight="semibold"
            style={styles.emptyTitle}
          >
            No notifications
          </Text>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.emptySubtitle}
          >
            You're all caught up!
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingBottom: spacing[6],
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing[4],
    paddingVertical: 16,
  },
  avatarCol: {
    marginRight: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    position: "relative",
  },
  typeBadge: {
    position: "absolute",
    right: -4,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  textCol: {
    flex: 1,
    paddingTop: 2,
  },
  messageLine: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageBold: {
    fontFamily: FONTS.bold,
  },
  messageRest: {
    fontFamily: FONTS.regular,
  },
  time: {
    marginTop: 6,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
  },
});
