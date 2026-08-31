import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BirdSizeScaleGraphic } from "../../../assets";
import { Text } from "../../../atoms";
import { UI_COLORS } from "../../../constants/colorConstants";
import { Radius } from "../../../design";
import { FONTS } from "../../../common/typography";
import { spacing } from "../../../design-system/spacing";
import { useTheme } from "../../../hooks/useTheme";
import { WIZARD_SIZE_LABELS } from "../stepByStep.constants";

type Props = {
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

export function WizardSizePicker({ selectedIndex, onSelect }: Props) {
  const theme = useTheme();
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
                    {
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
                        { backgroundColor: theme.colors.primaryCTA },
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
  pill: {
    borderWidth: 1,
    borderRadius: Radius.full,
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
