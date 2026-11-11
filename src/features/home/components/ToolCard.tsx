import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageSourcePropType } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

import { FONTS } from "../../../common/typography";

interface ToolCardProps {
  title: string;
  iconSource: ImageSourcePropType;
  onPress?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, iconSource, onPress }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
    >
      {/* Background icon with lower opacity */}
      <View style={styles.backgroundIconContainer}>
        <AppImage
          source={iconSource}
          style={styles.backgroundIcon}
          resizeMode="contain"
        />
      </View>

      {/* Foreground content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AppImage source={iconSource} style={styles.icon} resizeMode="contain" />
        </View>
        <Text allowFontScaling={false} style={[styles.title, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ToolCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    position: "relative",
    overflow: "hidden",
  },
  backgroundIconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.15,
  },
  backgroundIcon: {
    width: "200%",
    height: "200%",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    textAlign: "center",
  },
});
