/**
 * Wraps the default tab bar pressable and reports this tab's horizontal center
 * (window coordinates) via TabBarLayoutContext for overlay alignment.
 */

import React, { useCallback, useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import {
  useTabBarLayout,
  type MeasurableTabName,
} from "../contexts/TabBarLayoutContext";

type PlatformPressableProps = React.ComponentProps<typeof PlatformPressable>;

export type MeasuredTabBarButtonProps = PlatformPressableProps & {
  tabName: MeasurableTabName;
};

export const MeasuredTabBarButton = React.memo(function MeasuredTabBarButton({
  tabName,
  ...pressableProps
}: MeasuredTabBarButtonProps) {
  const ref = useRef<View>(null);
  const { reportTabCenter } = useTabBarLayout();

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.measureInWindow((x, _y, width, height) => {
      if (width > 0 && height > 0) {
        reportTabCenter(tabName, x + width / 2);
      }
    });
  }, [reportTabCenter, tabName]);

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", () => {
      requestAnimationFrame(measure);
    });
    return () => sub.remove();
  }, [measure]);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={styles.measureRoot}
      onLayout={measure}
    >
      <PlatformPressable {...pressableProps} />
    </View>
  );
});

const styles = StyleSheet.create({
  measureRoot: {
    flex: 1,
    minWidth: 0,
  },
});
