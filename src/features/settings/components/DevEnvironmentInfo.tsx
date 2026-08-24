/**
 * Dev Environment Info Component
 *
 * Shows developer information in Settings screen.
 * Displays environment, Firebase project, and build configuration.
 * Visible in both dev and prod for this app.
 */

import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { isFirebaseInitialized } from "../../../lib/firebase/config";
import { firebase } from "@react-native-firebase/app";
import { useSubscriptionStore } from "../../subscription/subscription.store";

import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

export function DevEnvironmentInfo() {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const devForcePremium = useSubscriptionStore((s) => s.devForcePremium);
  const setDevForcePremium = useSubscriptionStore((s) => s.setDevForcePremium);

  // Get Firebase project ID if available
  let firebaseProjectId = "Not initialized";
  try {
    if (isFirebaseInitialized()) {
      const app = firebase.app();
      firebaseProjectId = app.options.projectId || "Unknown";
    }
  } catch (error) {
    firebaseProjectId = "Error reading";
  }

  // Determine build configuration
  const buildConfig = __DEV__ ? "Debug-Dev" : "Release-Dev";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSecondary,
          marginTop: spacing[6] || 24,
          padding: spacing[3] || 12,
          borderRadius: Radius.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colors.primary },
        ]}
      >
        Developer Info
      </Text>

      <Text
        style={[
          styles.row,
          {
            color: colors.textSecondary,
            marginTop: spacing[2] || 8,
          },
        ]}
      >
        Environment:{" "}
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          Development
        </Text>
      </Text>

      <Text
        style={[
          styles.row,
          {
            color: colors.textSecondary,
            marginTop: spacing[1] || 4,
          },
        ]}
      >
        Firebase Project:{" "}
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {firebaseProjectId}
        </Text>
      </Text>

      <Text
        style={[
          styles.row,
          {
            color: colors.textSecondary,
            marginTop: spacing[1] || 4,
          },
        ]}
      >
        Build:{" "}
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {buildConfig}
        </Text>
      </Text>

      <View
        style={[
          styles.toggleRow,
          {
            marginTop: spacing[3] || 12,
            paddingTop: spacing[2] || 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.row,
            {
              color: colors.textSecondary,
              flex: 1,
            },
          ]}
        >
          Force premium
        </Text>
        <Switch
          value={devForcePremium}
          onValueChange={setDevForcePremium}
          trackColor={{
            false: colors.surfaceVariant,
            true: colors.primary,
          }}
          thumbColor={colors.surface}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 12,
    borderRadius: Radius.sm,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  row: {
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    fontFamily: FONTS.medium,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
