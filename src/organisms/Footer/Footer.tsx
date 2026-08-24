/**
 * Footer organism component
 * Reusable footer component for screens
 */

import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Divider } from "../../atoms";

export interface FooterLink {
  label: string;
  onPress: () => void;
}

export interface FooterProps {
  /**
   * Footer content/text
   */
  children?: React.ReactNode;
  /**
   * Links to display in footer
   */
  links?: FooterLink[];
  /**
   * Show divider above footer
   * @default true
   */
  showDivider?: boolean;
  /**
   * Footer variant
   * @default 'default'
   */
  variant?: "default" | "transparent" | "elevated";
  /**
   * Custom style
   */
  style?: ViewStyle;
  /**
   * Text alignment
   * @default 'center'
   */
  textAlign?: "left" | "center" | "right";
}

export const Footer: React.FC<FooterProps> = ({
  children,
  links,
  showDivider = true,
  variant = "default",
  style,
  textAlign = "center",
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const getFooterStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor:
        variant === "transparent" ? "transparent" : theme.colors.surface,
      paddingBottom: Math.max(insets.bottom, theme.spacing[4]),
      ...(variant === "elevated" && theme.shadows.sm),
    };

    return baseStyle;
  };

  return (
    <View style={[styles.container, getFooterStyle(), style]}>
      {showDivider && <Divider style={styles.divider} />}
      <View
        style={[
          styles.content,
          {
            alignItems:
              textAlign === "center"
                ? "center"
                : textAlign === "right"
                ? "flex-end"
                : "flex-start",
          },
        ]}
      >
        {children && (
          <View style={styles.childrenContainer}>
            {typeof children === "string" ? (
              <Text
                variant="body"
                size="small"
                color="textSecondary"
                style={styles.text}
              >
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        )}
        {links && links.length > 0 && (
          <View style={styles.linksContainer}>
            {links.map((link, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity onPress={link.onPress} activeOpacity={0.7}>
                  <Text
                    variant="body"
                    size="small"
                    color="primary"
                    weight="medium"
                  >
                    {link.label}
                  </Text>
                </TouchableOpacity>
                {index < links.length - 1 && (
                  <Text
                    variant="body"
                    size="small"
                    color="textTertiary"
                    style={styles.separator}
                  >
                    {" "}
                    •{" "}
                  </Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  divider: {
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  childrenContainer: {
    marginBottom: 8,
  },
  linksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    textAlign: "center",
  },
  separator: {
    marginHorizontal: 4,
  },
});
