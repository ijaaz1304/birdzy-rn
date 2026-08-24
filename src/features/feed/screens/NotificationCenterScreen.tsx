/**
 * Notification Center Screen
 * Full-screen entry for Feed notifications (replaces bottom sheet)
 */

import React, { useCallback } from "react";
import { BackHandler } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { ScreenContainer } from "../../../molecules";
import { NotificationsList } from "../components/NotificationsList";
import { FeedStackParamList } from "../../../navigation/types";
import type { Notification } from "../../notifications/notifications.store";

type NotificationCenterScreenNavigationProp = NativeStackNavigationProp<
  FeedStackParamList,
  "NotificationCenter"
>;

/**
 * Parse actionUrl and navigate (e.g. post:postId -> PostDetails).
 */
const navigateFromActionUrl = (
  navigation: NotificationCenterScreenNavigationProp,
  actionUrl?: string
) => {
  if (!actionUrl) return;
  const [scheme, ...parts] = actionUrl.split(":");
  if (scheme === "post" && parts[0]) {
    navigation.navigate("PostDetails", { postId: parts[0] });
  } else if (scheme === "comment" && parts[0]) {
    navigation.navigate("PostDetails", { postId: parts[0] });
  } else if (scheme === "profile") {
    navigation.navigate("FeedMain");
  }
};

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<NotificationCenterScreenNavigationProp>();
  const theme = useTheme();

  const handleClose = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("FeedMain");
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        handleClose();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [handleClose])
  );

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      navigateFromActionUrl(navigation, notification.actionUrl);
    },
    [navigation]
  );

  return (
    <ScreenContainer
      showBackground={false}
      backgroundColor={theme.colors.surface}
    >
      <NotificationsList
        visible={true}
        onClose={handleClose}
        onNotificationPress={handleNotificationPress}
      />
    </ScreenContainer>
  );
};
