/**
 * Account Actions Screen
 * Contains Delete Account and Logout actions
 */

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text, NavBackIcon } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { SettingsStackParamList } from "../../../navigation/types";
import { SettingsSection, SettingsItem } from "../components";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { DeleteAccountConfirmation } from "../../../components/DeleteAccountConfirmation";
import { LogoutConfirmation } from "../../../components/LogoutConfirmation";

import { spacing } from "../../../design-system/spacing";

type AccountActionsNavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  "AccountActions"
>;

export const AccountActionsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<AccountActionsNavigationProp>();
  const [showLogout, setShowLogout] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleLogoutPress = () => {
    setShowLogout(true);
  };

  const handleLogoutClose = () => {
    setShowLogout(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="large"
          weight="bold"
          style={styles.headerTitle}
        >
          Account Actions
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Account Actions">
          <SettingsItem
            title={SETTINGS_STRINGS.account.logOut}
            onPress={handleLogoutPress}
            showArrow={true}
            showBorder={true}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.account.deleteAccount}
            onPress={() => setShowDeleteAccount(true)}
            showArrow={true}
            textColor={colors.error}
          />
        </SettingsSection>
      </ScrollView>

      <LogoutConfirmation visible={showLogout} onClose={handleLogoutClose} />
      <DeleteAccountConfirmation
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: 32,
  },
});
