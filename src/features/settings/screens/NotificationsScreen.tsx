/**
 * Notifications Screen — bird-specific category toggles (product spec J).
 */

import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import { Card } from "../../../molecules";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  type BirdNotificationPreferences,
} from "../notificationsPreference.storage";
import { syncNotificationTopics } from "../../../services/notifications/notificationTopics.service";
import { spacing } from "../../../design-system/spacing";

type PrefKey = keyof BirdNotificationPreferences;

export const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const strings = SETTINGS_STRINGS.notifications;
  const [notifications, setNotifications] = useState<BirdNotificationPreferences>({
    push: true,
    birdOfDay: true,
    migrationAlerts: true,
    communityReplies: true,
    identificationTips: false,
    weeklyDigest: false,
  });

  useFocusEffect(
    useCallback(() => {
      void loadNotificationPreferences().then((prefs) => {
        setNotifications(prefs);
        void syncNotificationTopics(prefs);
      });
    }, [])
  );

  const notificationItems: {
    key: PrefKey;
    label: string;
    icon: string;
    hint?: string;
  }[] = [
    { key: "push", label: strings.push, icon: "notifications-outline" },
    { key: "birdOfDay", label: strings.birdOfDay, icon: "sunny-outline", hint: strings.birdOfDayHint },
    {
      key: "migrationAlerts",
      label: strings.migrationAlerts,
      icon: "airplane-outline",
      hint: strings.migrationHint,
    },
    {
      key: "communityReplies",
      label: strings.communityReplies,
      icon: "chatbubbles-outline",
    },
    {
      key: "identificationTips",
      label: strings.identificationTips,
      icon: "bulb-outline",
    },
    {
      key: "weeklyDigest",
      label: strings.weeklyDigest,
      icon: "calendar-outline",
    },
  ];

  const updatePref = async (key: PrefKey, value: boolean) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    await saveNotificationPreferences(next);
    void syncNotificationTopics(next);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          {strings.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <Text
        variant="body"
        size="small"
        color="textSecondary"
        style={styles.subtitle}
      >
        {strings.subtitle}
      </Text>

      <ScrollView style={styles.content}>
        {notificationItems.map((item) => (
          <Card
            key={item.key}
            variant="outlined"
            padding="medium"
            style={styles.notificationCard}
          >
            <View style={styles.notificationContent}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.labelBlock}>
                <Text variant="body" size="medium" weight="medium">
                  {item.label}
                </Text>
                {item.hint ? (
                  <Text variant="caption" size="small" color="textSecondary">
                    {item.hint}
                  </Text>
                ) : null}
              </View>
            </View>
            <Switch
              value={notifications[item.key]}
              onValueChange={(value) => void updatePref(item.key, value)}
              trackColor={{
                false: theme.colors.surfaceVariant,
                true: theme.colors.primary,
              }}
            />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  placeholder: { width: 24 },
  subtitle: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  notificationCard: {
    marginBottom: spacing[2],
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: spacing[3],
  },
  labelBlock: {
    flex: 1,
    gap: 2,
  },
});
