/**
 * Avatar atom component
 * Displays user profile picture or initials
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, Text, StyleSheet, ImageSourcePropType, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

import { FONTS } from "../../common/typography";

export interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 36,
  style,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const Radius = theme.radius;

  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const imageSource = typeof source === "string" ? { uri: source } : source;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Radius.full,
          backgroundColor: colors.surfaceBrand,
        },
        style,
      ]}
    >
      {source ? (
        <AppImage
          source={imageSource}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: Radius.full,
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.4,
              color: colors.textInverse,
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    fontFamily: FONTS.bold,
  },
});
