/**
 * Screen Container Component
 * Wraps screen content with SafeAreaView and optional background SVG
 */

import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  SafeAreaView,
  SafeAreaViewProps,
} from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { SvgBackground } from "../../utils/svgUtils";
import { Images } from "../../assets";

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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const bgColor = backgroundColor ?? theme.colors.background;
  const usePngBackground = !backgroundComponent;
  const splashBgSource =
    theme.mode === "dark" ? Images.splashBgDark : Images.splashBgLight;

  return (
    <View
      style={[styles.wrapper, { backgroundColor: bgColor }]}
      onLayout={({ nativeEvent: { layout } }) =>
        setSize((previous) =>
          previous.width === layout.width && previous.height === layout.height
            ? previous
            : { width: layout.width, height: layout.height }
        )
      }
    >
      {showBackground &&
        (usePngBackground ? (
          <AppImage
            source={splashBgSource}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : size.width > 0 && size.height > 0 ? (
          <SvgBackground
            SvgComponent={backgroundComponent!}
            width={size.width}
            height={size.height}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null)}
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
    ...StyleSheet.absoluteFillObject,
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
