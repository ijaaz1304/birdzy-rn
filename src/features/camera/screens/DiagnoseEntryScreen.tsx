/**
 * Diagnose Entry Screen
 * Entry point for identification flow
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../hooks/useTheme";
import { Text, Button, NavBackIcon } from "../../../atoms";
import { Card } from "../../../molecules";
import { CameraStackParamList } from "../../../navigation/types";
import { useFeatureConfig } from "../../../config/context";
import { screenStyles } from "../../../styles/common";
import { SCREEN_COLORS } from "../../../constants/colorConstants";

import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

type DiagnoseEntryScreenNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "DiagnoseEntry"
>;

export const DiagnoseEntryScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const _radius = theme.radius;
  const navigation = useNavigation<DiagnoseEntryScreenNavigationProp>();
  const _cameraConfig = useFeatureConfig("camera");

  const handleStartDiagnosis = () => {
    // Navigate to camera permission gate, which will then go to camera capture
    navigation.navigate("CameraPermissionGate", { mode: "diagnose" });
  };

  return (
    <SafeAreaView
      style={[screenStyles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[screenStyles.header, { paddingHorizontal: spacing[6] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="title" size="large" weight="bold">
          Identify with a photo
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.content, { paddingHorizontal: spacing[6] }]}>
        {/* Info Card */}
        <Card variant="elevated" padding="large" style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Icon name="medical" size={48} color={colors.primary} />
            </View>
          </View>

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={styles.title}
          >
            Identify mushrooms
          </Text>
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.description}
          >
            Take a clear photo to get instant AI-powered identification and
            learn more about what you found.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="checkmark-circle" size={20} color={colors.success} />
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                style={styles.featureText}
              >
                Fast identification
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="checkmark-circle" size={20} color={colors.success} />
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                style={styles.featureText}
              >
                Detailed information
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="checkmark-circle" size={20} color={colors.success} />
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                style={styles.featureText}
              >
                Similar matches
              </Text>
            </View>
          </View>
        </Card>

        {/* CTA Button */}
        <Button
          title="Start identification"
          variant="primary"
          size="large"
          onPress={handleStartDiagnosis}
          fullWidth
          style={styles.ctaButton}
        />

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.tipsTitle}
          >
            Tips for best results:
          </Text>
          <Text
            variant="body"
            size="small"
            color="textTertiary"
            style={styles.tip}
          >
            • Take photos in good lighting
          </Text>
          <Text
            variant="body"
            size="small"
            color="textTertiary"
            style={styles.tip}
          >
            • Keep the mushroom centered and in focus
          </Text>
          <Text
            variant="body"
            size="small"
            color="textTertiary"
            style={styles.tip}
          >
            • Include multiple angles if possible
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 24,
  },
  infoCard: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresList: {
    width: "100%",
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  ctaButton: {
    marginBottom: 24,
  },
  tipsContainer: {
    padding: spacing[4],
    backgroundColor: SCREEN_COLORS.LIGHT.surfaceVariant,
    borderRadius: Radius.md,
  },
  tipsTitle: {
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  tip: {
    marginBottom: 4,
  },
});
