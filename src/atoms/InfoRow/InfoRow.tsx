import React from "react";
import { View, StyleSheet } from "react-native";
import { InfoRowProps } from "../../types/ui";
import { Text } from "../Text";
import { useTheme } from "../../hooks/useTheme";

export const InfoRow = ({
  label,
  value,
  labelColor,
  valueColor,
  rowDividerColor,
  rowPaddingVertical,
  labelStyle,
  valueStyle,
}: InfoRowProps) => {
  const theme = useTheme();
  const spacing = theme.spacing;
  const paddingVertical = rowPaddingVertical ?? spacing[2];

  return (
    <View
      style={[
        styles.row,
        { paddingVertical },
        rowDividerColor
          ? {
              borderBottomWidth: 1,
              borderBottomColor: rowDividerColor,
            }
          : undefined,
      ]}
    >
      <Text allowFontScaling={false}
        color="textSecondary"
        style={[labelColor ? { color: labelColor } : undefined, labelStyle]}
      >
        {label}
      </Text>
      <View style={styles.valueWrap}>
        <Text allowFontScaling={false}
          style={[
            valueColor ? { color: valueColor } : undefined,
            valueStyle,
            styles.valueText,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  valueWrap: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  valueText: {},
});
