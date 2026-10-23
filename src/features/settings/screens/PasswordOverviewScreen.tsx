import { isGuestSettingsSession } from "../../../utils/settingsAccountAccess";
import { LoginSecurityScreen } from "./LoginSecurityScreen";
/**
 * Shared layout for Change password (Figma 7884:4492) and
 * Create password (Figma 7894:21034): email row + password row with a
 * trailing action that opens the PasswordSheet.
 */

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Text } from "../../../atoms";
import { useToast } from "../../../hooks";
import { FONTS } from "../../../common/typography";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { useAuthStore } from "../../auth/auth.store";
import { SettingsHeader, SettingsIcon, PasswordSheet } from "../components";
import { useSettingsColors } from "../settingsColors";
import { changePassword, createPassword } from "../passwordActions";

const S = SETTINGS_STRINGS.loginSecurity;
const SHEET = SETTINGS_STRINGS.passwordSheet;

export interface PasswordOverviewScreenProps {
  mode: "change" | "create";
}

export const PasswordOverviewScreen: React.FC<PasswordOverviewScreenProps> = ({
  mode,
}) => {
  const guest = useAuthStore(isGuestSettingsSession);
  const c = useSettingsColors();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const email = useAuthStore((s) => s.user?.email ?? "");
  const provider = useAuthStore((s) => s.user?.socialProvider);
  const [sheetVisible, setSheetVisible] = useState(false);
  const isChange = mode === "change";

  const handleSubmit = async ({ newPassword }: { newPassword: string }) => {
    if (guest) return;
    if (isChange) {
      await changePassword(newPassword);
    } else {
      await createPassword(newPassword);
    }
    setSheetVisible(false);
    showToast(isChange ? SHEET.changed : SHEET.created, "success");
    if (!isChange) navigation.goBack();
  };

  const showGoogleIcon = !isChange && provider?.toLowerCase() === "google";

  if (guest) return <LoginSecurityScreen />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.screen }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title={isChange ? S.changePassword : S.createPassword} />
      <View style={styles.list}>
        <View style={styles.row}>
          {showGoogleIcon && <SettingsIcon name="google" color={c.text} />}
          <View style={styles.textBlock}>
            <Text style={[styles.rowTitle, { color: c.text }]}>{S.email}</Text>
            <Text style={[styles.caption, { color: c.label }]}>{email}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.textBlock}>
            <Text style={[styles.rowTitle, { color: c.text }]}>
              {S.password}
            </Text>
            {isChange && (
              <Text style={[styles.caption, { color: c.label }]}>
                {S.passwordMask}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setSheetVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
          >
            <Text style={[styles.action, { color: c.brand }]}>
              {isChange ? S.change : S.create}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <PasswordSheet
        visible={sheetVisible}
        mode={mode}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 4,
  },
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  textBlock: {
    flex: 1,
    paddingVertical: 12,
    gap: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  action: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    lineHeight: 20,
    textAlign: "right",
  },
});
