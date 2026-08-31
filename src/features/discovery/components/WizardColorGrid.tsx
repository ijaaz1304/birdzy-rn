import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";
import { useTheme } from "../../../hooks/useTheme";
import { WIZARD_COLOR_OPTIONS } from "../stepByStep.constants";

type Props = {
  selected: string[];
  onToggle: (color: string) => void;
};

export function WizardColorGrid({ selected, onToggle }: Props) {
  const theme = useTheme();
  const selectedBg = `${theme.colors.primaryCTA}18`;

  return (
    <View style={styles.grid}>
      {WIZARD_COLOR_OPTIONS.map((option) => {
        const active = selected.includes(option.id);
        const isWhite = option.id === "White";
        return (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.85}
            onPress={() => onToggle(option.id)}
            style={[
              styles.card,
              {
                backgroundColor: active
                  ? selectedBg
                  : theme.colors.surfacePrimary,
                borderColor: active
                  ? theme.colors.primaryCTA
                  : theme.colors.border0,
              },
            ]}
          >
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: option.hex,
                  borderWidth: isWhite ? 1 : 0,
                  borderColor: theme.colors.border0,
                },
              ]}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active
                    ? theme.colors.primaryCTA
                    : theme.colors.textSecondary,
                  fontFamily: active ? FONTS.bold : FONTS.regular,
                },
              ]}
            >
              {option.id}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "31%",
    flexGrow: 1,
    maxWidth: "32.5%",
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 8,
    gap: 4,
  },
  swatch: {
    width: "100%",
    aspectRatio: 300 / 200,
    borderRadius: Radius.sm,
  },
  label: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    paddingVertical: 4,
  },
});
