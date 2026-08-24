import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../design/theme";
import { Typography } from "../../design/typography";
import { Space } from "../../design/spacing";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

const AppTab: React.FC<Props> = ({ label, active = false, onPress, style }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.tab,
        {
          borderBottomWidth: 2,
          borderBottomColor: active ? colors.textBrand : "transparent",
        },
        style,
      ]}
    >
      <Text
        style={[
          Typography.presets.caption12,
          {
            color: active ? colors.textBrand : colors.textSecondary,
            fontWeight: active ? "700" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default AppTab;

const styles = StyleSheet.create({
  tab: {
    paddingVertical: Space.sm, // 8px
    paddingHorizontal: Space.md, // 12px
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
