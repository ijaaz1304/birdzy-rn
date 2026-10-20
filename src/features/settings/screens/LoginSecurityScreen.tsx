/**
 * Login & Security Screen (Figma 7894:18302)
 * Email/password accounts can change their password; social accounts can create one.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { SettingsStackParamList } from "../../../navigation/types";
import { useAuthStore } from "../../auth/auth.store";
import { SettingsHeader, SettingsIcon } from "../components";
import { useSettingsColors } from "../settingsColors";

const S = SETTINGS_STRINGS.loginSecurity;

type Nav = NativeStackNavigationProp<SettingsStackParamList, "LoginSecurity">;

export const LoginSecurityScreen: React.FC = () => {
  const c = useSettingsColors();
  const navigation = useNavigation<Nav>();
  const isSocial = useAuthStore((s) => !!s.user?.isSocial);

  const rows = isSocial
    ? [{ title: S.createPassword, route: "CreatePassword" as const }]
    : [{ title: S.changePassword, route: "ChangePassword" as const }];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.screen }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title={S.title} />
      <View style={styles.list}>
        {rows.map((row) => (
          <TouchableOpacity
            key={row.route}
            style={styles.row}
            onPress={() => navigation.navigate(row.route)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={[styles.rowTitle, { color: c.text }]}>
              {row.title}
            </Text>
            <SettingsIcon name="chevronRightList" color={c.placeholder} />
          </TouchableOpacity>
        ))}
      </View>
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
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    lineHeight: 24,
  },
});
