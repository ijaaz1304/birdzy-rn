/**
 * Screen Container Component
 * Wraps screen content with SafeAreaView and optional background SVG
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet } from "react-native";
import {
  SafeAreaView,
  SafeAreaViewProps,
} from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { SvgBackground } from "../../utils/svgUtils";
import { Images } from "../../assets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ScreenContainerProps extends SafeAreaViewProps {
  /**
   * Whether to show the background SVG
   * @default true
   */
  showBackground?: boolean;
  /**
   * Custom background component (optional; default uses PNG splash background)
   */
  backgroundComponent?: React.ComponentType<any>;
  /**
   * Override background color (e.g. #171717 dark, #F6F6F6 light for auth)
   */
  backgroundColor?: string;
  /**
   * Children to render
   */
  children: React.ReactNode;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  showBackground = true,
  backgroundComponent,
  backgroundColor,
  children,
  style,
  ...safeAreaProps
}) => {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.background;
  const usePngBackground = !backgroundComponent;
  const splashBgSource =
    theme.mode === "dark" ? Images.splashBgDark : Images.splashBgLight;

  return (
    <View style={[styles.wrapper, { backgroundColor: bgColor }]}>
      {showBackground &&
        (usePngBackground ? (
          <AppImage
            source={splashBgSource}
            style={[
              styles.backgroundImage,
              { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
            ]}
            resizeMode="cover"
          />
        ) : (
          <SvgBackground
            SvgComponent={backgroundComponent!}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
        ))}
      <SafeAreaView
        style={[styles.container, style]}
        edges={["top", "bottom"]}
        {...safeAreaProps}
      >
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
    zIndex: 1,
    position: "relative",
  },
});
