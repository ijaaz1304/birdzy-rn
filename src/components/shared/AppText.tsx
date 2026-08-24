import { AppImage } from "@/components/AppImage";
import React from "react";
import { Text, TextProps, StyleSheet, TextStyle, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Typography } from "../../design";
import { Images } from "../../assets";

import { spacing } from "../../design-system/spacing";

interface AppTextProps extends TextProps {
  variant?: keyof typeof Typography.presets;
  color?: string;
  showDiagnosisBanner?: boolean;
}

const AppText: React.FC<AppTextProps> = ({
  variant = "body16",
  color,
  style,
  children,
  showDiagnosisBanner = false,
  ...rest
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const preset = Typography.presets[variant];

  if (showDiagnosisBanner) {
    const bannerSource =
      theme.mode === "dark" ? Images.popUp70Dark : Images.popUp70Light;
    return (
      <View style={styles.bannerContainer}>
        <View style={styles.bannerBackground} pointerEvents="none">
          <AppImage
            source={bannerSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </View>
        <Text
          style={[
            styles.base,
            preset as TextStyle,
            { color: color || colors.textPrimary },
            styles.bannerText,
            style,
          ]}
          {...rest}
        >
          {children}
        </Text>
      </View>
    );
  }

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
  bannerContainer: {
    position: "relative",
    width: "100%",
    minHeight: 60,
  },
  bannerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  bannerText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
  },
});
