import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../../design/theme";
import { Space } from "../../design";
import AppText from "../ui/AppText";

type Props = {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
};

const AppCheckbox: React.FC<Props> = ({
  label,
  checked = false,
  disabled = false,
  onToggle,
}) => {
  const { colors } = useTheme();

  const borderColor = disabled
    ? colors.borderSecondary
    : checked
    ? colors.borderBrand
    : colors.borderPrimary;

  const backgroundColor = disabled
    ? colors.surfaceSecondary
    : checked
    ? colors.surfaceBrand
    : colors.surfacePrimary;

  const iconColor = checked
    ? colors.surfacePrimary
    : disabled
    ? colors.textSecondary
    : "transparent";

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={onToggle}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          {
            borderColor,
            backgroundColor,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {checked && <Feather name="check" size={9} color={iconColor} />}
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

export default AppCheckbox;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
