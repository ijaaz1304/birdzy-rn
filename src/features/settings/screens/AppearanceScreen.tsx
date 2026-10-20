import { SettingsHeader } from "../components/SettingsHeader";
/**
 * Appearance — light / dark / system theme picker (Figma 10214:29163)
 */

import React, { useCallback, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text } from "../../../atoms";
import { RadioButton } from "../../../atoms/RadioButton";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeContext } from "../../../app/ThemeProvider";
import { SettingsStackParamList } from "../../../navigation/types";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { ThemeMode } from "../../../design-system/themes";
import { spacing } from "../../../design-system/spacing";
import { FONTS } from "../../../common/typography";
import { trackThemeChanged } from "../../theme/themeExperiment.service";
import { useThemeExperiment } from "../../theme/useThemeExperiment";

type AppearanceScreenNavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  "Appearance"
>;

const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string }[] = [
  {
    mode: "light",
    label: SETTINGS_STRINGS.appearance.options.light,
  },
  {
    mode: "dark",
    label: SETTINGS_STRINGS.appearance.options.dark,
  },
  {
    mode: "system",
    label: SETTINGS_STRINGS.appearance.options.system,
  },
];

export const AppearanceScreen: React.FC = () => {
  const navigation = useNavigation<AppearanceScreenNavigationProp>();
  const theme = useTheme();
  const colors = theme.colors;
  const { themeMode, setThemeMode } = useThemeContext();
  const { canChangeAppearance } = useThemeExperiment();

  useEffect(() => {
    if (!canChangeAppearance) {
      navigation.goBack();
    }
  }, [canChangeAppearance, navigation]);

  const handleSelect = useCallback(
    (mode: ThemeMode) => {
      if (!canChangeAppearance || mode === themeMode) {
        return;
      }
      const previous = themeMode;
      setThemeMode(mode);
      trackThemeChanged(previous, mode);
    },
    [canChangeAppearance, setThemeMode, themeMode]
  );

  if (!canChangeAppearance) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title={SETTINGS_STRINGS.appearance.title}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {APPEARANCE_OPTIONS.map((option) => {
          const selected = themeMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              activeOpacity={0.7}
              onPress={() => handleSelect(option.mode)}
              style={styles.row}
            >
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                {option.label}
              </Text>
              <RadioButton selected={selected} size="medium" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
});
