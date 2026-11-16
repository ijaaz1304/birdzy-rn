import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../../hooks/useTheme";
import { typography } from "../../../design-system/typography";

/**
 * Figma textfield error row (Sign up 8015:111110): 16pt alert icon + Caption/12px/Regular in error
 * red, 8pt gap. Wraps and grows with the user's font size (helper/error text is never truncated).
 */
export const AuthFieldError = ({ message, testID }: { message: string; testID?: string }) => {
  const theme = useTheme();
  const color = theme.colors.textError ?? theme.colors.error;
  return (
    <View style={styles.row} accessibilityRole="alert" testID={testID}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5.32 9.32C7.73 5.05 8.94 2.92 10.59 2.37a4.5 4.5 0 0 1 2.82 0c1.65.55 2.86 2.68 5.27 6.95 2.41 4.27 3.62 6.41 3.26 8.15a4.6 4.6 0 0 1-1.41 2.49C19.21 21 16.8 21 11.97 21h.06c-4.83 0-7.24 0-8.53-1.04a4.6 4.6 0 0 1-1.41-2.49c-.36-1.74.85-3.88 3.23-8.15Z"
          stroke={color}
          strokeWidth={1.5}
        />
        <Path d="M12 13V9" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M11.99 16.5h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  /** Caption/12px/Regular */
  text: {
    ...typography.caption.regular,
    flex: 1,
  },
});
