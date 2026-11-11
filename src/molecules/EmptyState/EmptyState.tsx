/**
 * Reusable Empty State Component
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ImageSourcePropType, ImageStyle, StyleProp } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";

import { spacing } from "../../design-system/spacing";

export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  image?: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
  emoji?: string;
  title?: string;
  subtitle?: string;
  /**
   * "default" is the large heading used across the app. "body" is a lighter
   * heading (16 px medium) over a 14 px message in a 263 dp column, as in the
   * Explore Near You design.
   */
  appearance?: "default" | "body";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  image,
  imageStyle,
  emoji,
  title,
  subtitle,
  appearance = "default",
}) => {
  const theme = useTheme();
  const body = appearance === "body";
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      {image ? (
        <AppImage
          source={image}
          style={[styles.image, imageStyle]}
          resizeMode="contain"
        />
      ) : emoji ? (
        <Text variant="display" size="large" style={styles.icon}>
          {emoji}
        </Text>
      ) : icon ? (
        typeof icon === "string" ? (
          <Icon
            name={icon}
            size={64}
            color={colors.textTertiary}
            style={styles.iconContainer}
          />
        ) : (
          <View style={styles.iconContainer}>{icon}</View>
        )
      ) : null}
      {title ? (
        <Text
          variant={body ? "body" : "title"}
          size={body ? "large" : "medium"}
          weight={body ? "medium" : "semibold"}
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          variant="body"
          size={body || !title ? "medium" : "small"}
          color="textSecondary"
          style={[
            styles.subtitle,
            !title && styles.subtitleOnly,
            body && styles.subtitleBody,
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  icon: {
    fontSize: 56,
    marginBottom: 12,
  },
  iconContainer: {
    marginBottom: 12,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  title: {
    marginTop: 12,
    textAlign: "center",
    alignSelf: "stretch",
    width: "100%",
  },
  subtitle: {
    marginTop: 4,
    textAlign: "center",
  },
  subtitleBody: {
    marginTop: 4,
    maxWidth: 263,
  },
  subtitleOnly: {
    marginTop: spacing[2],
    lineHeight: 24,
    maxWidth: 320,
  },
});
