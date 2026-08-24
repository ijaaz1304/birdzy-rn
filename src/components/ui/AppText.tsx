import React from "react";
import { Text, TextProps, StyleSheet, TextStyle } from "react-native";
import { useTheme, Typography } from "../../design";

interface AppTextProps extends TextProps {
  variant?: keyof typeof Typography.presets;
  color?: string;
}

const AppText: React.FC<AppTextProps> = ({
  variant = "body16",
  color,
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();
  const preset = Typography.presets[variant];

  return (
    <Text
      style={[
        styles.base,
        preset as TextStyle, // 👈 ensures type compatibility
        { color: color || colors.textPrimary },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default AppText;

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false, // visually aligns text better
  },
});
