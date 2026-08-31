/**
 * Diagnose Entry Screen
 * Unused leftover from Home; retargeted to the got-bitten Ask AI assistant.
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
import { ASK_AI_STRINGS } from "../../../config/strings/ask-ai.strings";
import { screenStyles } from "../../../styles/common";
import { SCREEN_COLORS } from "../../../constants/colorConstants";
import { NavigationService } from "../../../utils/navigation";

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
  const navigation = useNavigation<DiagnoseEntryScreenNavigationProp>();

  const handleAskAboutBite = () => {
    NavigationService.navigateNested("AskAIStack", "AskAIMain", {
      assistant: "gotBitten",
      initialMessage: ASK_AI_STRINGS.gotBittenPrompt,
    });
  };

  return (
    <SafeAreaView
      style={[screenStyles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[screenStyles.header, { paddingHorizontal: spacing[6] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="title" size="large" weight="bold">
          Bird bite help
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.content, { paddingHorizontal: spacing[6] }]}>
        <Card variant="elevated" padding="large" style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Icon name="medkit" size={48} color={colors.primary} />
            </View>
          </View>

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={styles.title}
          >
            Think a bird bit you?
          </Text>
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.description}
          >
            Describe what happened or share a photo. The bite assistant can help
            you figure out next steps.
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
                Photo analysis
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
                Likely species
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
                What to do next
              </Text>
            </View>
          </View>
        </Card>

        <Button
          title="Ask about a bite"
          variant="primary"
          size="large"
          onPress={handleAskAboutBite}
          fullWidth
          style={styles.ctaButton}
        />

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
            • Share a clear photo of the bite if you can
          </Text>
          <Text
            variant="body"
            size="small"
            color="textTertiary"
            style={styles.tip}
          >
            • Mention when and where it happened
          </Text>
          <Text
            variant="body"
            size="small"
            color="textTertiary"
            style={styles.tip}
          >
            • Note the bird’s size, color, or behavior
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
