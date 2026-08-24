/**
 * BottomNavBar organism component
 * Optimized and dynamic version of AppBottomNavBar
 */

import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle, LayoutChangeEvent, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";

export type TabItem = {
  key: string;
  label: string;
  icon: string;
};

export type CenterAction = {
  icon: string;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
};

export interface BottomNavBarProps {
  tabs: TabItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  centerAction?: CenterAction;
  showTopIndicator?: boolean;
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  tabs,
  activeKey,
  onTabPress,
  centerAction,
  showTopIndicator = true,
  containerStyle,
  tabStyle,
}) => {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const slotCount = centerAction ? tabs.length + 1 : tabs.length;
  const slotWidth = width / slotCount;

  const activeSlotIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.key === activeKey);
    if (idx === -1) return 0;
    if (!centerAction) return idx;
    return idx < Math.floor(tabs.length / 2) ? idx : idx + 1;
  }, [activeKey, tabs, centerAction]);

  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!width || !showTopIndicator) return;
    const target = activeSlotIndex * slotWidth;
    Animated.timing(indicatorX, {
      toValue: target,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [width, activeSlotIndex, slotWidth, showTopIndicator, indicatorX]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const leftTabs = centerAction
    ? tabs.slice(0, Math.floor(tabs.length / 2))
    : tabs.slice(0, Math.floor(tabs.length / 2));
  const rightTabs = centerAction
    ? tabs.slice(Math.floor(tabs.length / 2))
    : tabs.slice(Math.floor(tabs.length / 2));
  const actionSize = centerAction?.size ?? 40;

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderTopColor: theme.colors.border0,
        },
        containerStyle,
      ]}
    >
      {/* Top indicator */}
      {showTopIndicator && (
        <Animated.View
          style={[
            styles.topIndicator,
            {
              width: slotWidth,
              backgroundColor: theme.colors.borderBrand,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
      )}

      {/* Icon row container */}
      <View style={styles.iconRow}>
        {/* Left tabs */}
        {leftTabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onTabPress(tab.key)}
              style={[styles.tabSlot, { width: slotWidth }, tabStyle]}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={
                  active ? theme.colors.textPrimary : theme.colors.textTertiary
                }
              />
              <Text
                variant="body"
                size="small"
                color={active ? "text" : "textTertiary"}
                weight={active ? "semibold" : "normal"}
                style={styles.tabLabel}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Center action button */}
        {centerAction && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={centerAction.onPress}
            style={[styles.centerSlot, { width: slotWidth }]}
          >
            <View
              style={[
                styles.actionCircle,
                {
                  width: actionSize,
                  height: actionSize,
                  borderRadius: actionSize / 2,
                  backgroundColor:
                    centerAction.backgroundColor ?? theme.colors.borderBrand,
                },
              ]}
            >
              <Icon
                name={centerAction.icon}
                size={20}
                color={centerAction.iconColor ?? theme.colors.surfacePrimary}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Right tabs */}
        {rightTabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onTabPress(tab.key)}
              style={[styles.tabSlot, { width: slotWidth }, tabStyle]}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={
                  active ? theme.colors.textPrimary : theme.colors.textTertiary
                }
              />
              <Text
                variant="body"
                size="small"
                color={active ? "text" : "textTertiary"}
                weight={active ? "semibold" : "normal"}
                style={styles.tabLabel}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    height: 60,
  },
  topIndicator: {
    position: "absolute",
    top: 0,
    height: 3,
    borderRadius: 2,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    flex: 1,
  },
  tabSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    marginTop: 4,
  },
  centerSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
