import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../design/theme";
import { Space } from "../../design";
import AppText from "../ui/AppText";

import { Radius } from "../../design";

type Props = {
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

const AppRadioButton: React.FC<Props> = ({
  label,
  selected = false,
  disabled = false,
  onSelect,
}) => {
  const { colors } = useTheme();

  const borderColor = disabled
    ? colors.borderSecondary
    : selected
    ? colors.borderBrand
    : colors.borderPrimary;

  const fillColor = selected
    ? colors.surfaceBrand
    : disabled
    ? colors.surfaceBrand
    : "transparent";

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={onSelect}
      style={styles.row}
    >
      <View
        style={[
          styles.circle,
          {
            borderColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>

      {label && (
        <AppText
          variant="body14"
          color={disabled ? colors.textSecondary : colors.textPrimary}
          style={{ marginLeft: Space.sm }}
        >
          {label}
        </AppText>
      )}
    </TouchableOpacity>
  );
};

export default AppRadioButton;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});
