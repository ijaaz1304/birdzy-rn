/**
 * Identify entry hub — Photo / Sound / Step-by-step (product spec A).
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import { CameraStackParamList, RootStackParamList } from "../../../navigation/types";
import { NAVIGATION_STRINGS } from "../../../config/navigation.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { spacing } from "../../../design-system/spacing";
import { Radius } from "../../../design";

type Nav = NativeStackNavigationProp<CameraStackParamList, "IdentifyHub">;

export const IdentifyHubScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const strings = NAVIGATION_STRINGS.identifyHub;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.getParent()?.goBack();
  };

  const goWizard = () => {
    const root = navigation.getParent()?.getParent();
    root?.navigate("MainTabs" as keyof RootStackParamList, {
      screen: "Home",
      params: { screen: "StepByStep" },
    });
  };

  const options = [
    {
      id: "photo",
      icon: "photo-camera" as const,
      title: strings.photo,
      hint: strings.photoHint,
      onPress: () => navigation.navigate("CameraMain"),
    },
    {
      id: "sound",
      icon: "mic" as const,
      title: strings.sound,
      hint: strings.soundHint,
      onPress: () => navigation.navigate("SoundIdentify"),
    },
    {
      id: "wizard",
      icon: "help-outline" as const,
      title: strings.wizard,
      hint: strings.wizardHint,
      onPress: goWizard,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : spacing[2] }]}>
          <TouchableOpacity onPress={handleBack} hitSlop={HIT_SLOP.CLOSE}>
            <NavBackIcon color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text variant="headline" size="medium" weight="bold" style={styles.headerTitle}>
            {strings.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.subtitle}
        >
          {strings.subtitle}
        </Text>

        <View style={styles.cards}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={opt.onPress}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
                <MaterialIcons name={opt.icon} size={32} color={colors.primary} />
              </View>
              <View style={styles.cardCopy}>
                <Text variant="title" size="medium" weight="semibold">
                  {opt.title}
                </Text>
                <Text variant="body" size="small" color="textSecondary">
                  {opt.hint}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  headerTitle: { flex: 1, textAlign: "center" },
  headerSpacer: { width: 24 },
  subtitle: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  cards: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: { flex: 1, gap: 4 },
});
