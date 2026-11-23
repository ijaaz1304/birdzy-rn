import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { NavBackIcon, Text } from "../../../atoms";
import { UI_COLORS } from "../../../constants/colorConstants";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { spacing } from "../../../design-system/spacing";
import { WIZARD_QUESTION_COUNT } from "../stepByStep.constants";

/** Figma 9380:170085 (dark): track Surface-Secondary #091421, fill Brand-2 light-2 #009DA7. */
const PROGRESS_DARK = { track: "#091421", fill: "#009DA7" } as const;

type Props = {
  questionIndex: number;
  onBack: () => void;
  onSkip: () => void;
  skipLabel: string;
};

export function WizardProgressHeader({
  questionIndex,
  onBack,
  onSkip,
  skipLabel,
}: Props) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const progress = Math.max(
    (questionIndex + 1) / WIZARD_QUESTION_COUNT,
    1 / WIZARD_QUESTION_COUNT
  );

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onBack} hitSlop={HIT_SLOP.CLOSE}>
        <NavBackIcon color={theme.colors.textPrimary} size={24} />
      </TouchableOpacity>
      <View
        style={[
          styles.track,
          {
            backgroundColor: isDark
              ? PROGRESS_DARK.track
              : theme.colors.surfaceSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: isDark
                ? PROGRESS_DARK.fill
                : UI_COLORS.WIZARD_PROGRESS,
            },
          ]}
        />
      </View>
      <TouchableOpacity onPress={onSkip} hitSlop={HIT_SLOP.CLOSE}>
        <Text style={[styles.skip, { color: theme.colors.textPrimary }]}>
          {skipLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma Top Navigation Bar: px16 / py12, gap 8.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    minHeight: 52,
  },
  track: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 8,
  },
  skip: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
});
