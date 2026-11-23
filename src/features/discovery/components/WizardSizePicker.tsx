import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BirdSizeScaleGraphic } from "../../../assets";
import { Text } from "../../../atoms";
import { UI_COLORS } from "../../../constants/colorConstants";
import { FONTS } from "../../../common/typography";
import { spacing } from "../../../design-system/spacing";
import { useTheme } from "../../../hooks/useTheme";
import { WIZARD_SIZE_LABELS } from "../stepByStep.constants";

type Props = {
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

/**
 * Dark radios (Figma 9380:170248 layout): selected = teal rgba(22, 182, 180, 1) / #16B6B4
 * 2px ring + 10px dot (design request; Figma render shows #785284);
 * unselected = #D1D1D1 fill with #B0B0B0 ring.
 */
const RADIO_DARK = {
  selected: "#16B6B4",
  fill: "#D1D1D1",
  border: "#B0B0B0",
} as const;

export function WizardSizePicker({ selectedIndex, onSelect }: Props) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const label =
    selectedIndex != null ? WIZARD_SIZE_LABELS[selectedIndex] : undefined;

  return (
    <View style={styles.wrap}>
      {label ? (
        <View
          style={[
            styles.pill,
            { borderColor: UI_COLORS.WIZARD_SIZE_PILL_BORDER },
          ]}
        >
          <Text style={[styles.pillLabel, { color: theme.colors.textPrimary }]}>
            {label}
          </Text>
        </View>
      ) : null}
      <View style={styles.scale}>
        <BirdSizeScaleGraphic
          width="100%"
          height={78}
          preserveAspectRatio="xMidYMid meet"
          // SVG uses currentColor: Figma #F6F6F6 silhouettes in dark, #111111 in light.
          color={isDark ? "#F6F6F6" : "#111111"}
        />
        <View style={styles.radios}>
          {WIZARD_SIZE_LABELS.map((sizeLabel, index) => {
            const selected = selectedIndex === index;
            return (
              <TouchableOpacity
                key={sizeLabel}
                onPress={() => onSelect(index)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={sizeLabel}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.radio,
                    isDark
                      ? {
                          borderColor: selected
                            ? RADIO_DARK.selected
                            : RADIO_DARK.border,
                          backgroundColor: selected
                            ? "transparent"
                            : RADIO_DARK.fill,
                        }
                      : {
                          borderColor: selected
                            ? theme.colors.primaryCTA
                            : theme.colors.border0,
                        },
                  ]}
                >
                  {selected ? (
                    <View
                      style={[
                        styles.radioInner,
                        {
                          backgroundColor: isDark
                            ? RADIO_DARK.selected
                            : theme.colors.primaryCTA,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 20,
  },
  // Figma Tag/Filter: 1px #41EDE9, radius 24, px8/py4.
  pill: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  scale: {
    width: "100%",
    gap: spacing[3],
  },
  radios: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
