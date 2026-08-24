/**
 * Light Guide Screen
 */

import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Text, NavBackIcon } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { Card } from "../../../molecules";

import { spacing } from "../../../design-system/spacing";

export const LightGuideScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          Light Guide
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Card variant="elevated" padding="large" style={styles.section}>
          <Text
            variant="headline"
            size="medium"
            weight="bold"
            style={styles.sectionTitle}
          >
            Understanding Light Requirements
          </Text>
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.sectionText}
          >
            Learn about lighting setups for photos and displays, including
            direct, indirect, and low-light conditions.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionText: {
    lineHeight: 24,
  },
});
