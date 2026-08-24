import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle, LayoutChangeEvent, Animated } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AppText from "./AppText";
import { useTheme } from "../../design/theme";
import { Space } from "../../design";

export type TabItem = {
  key: string;
  label: string;
  icon: string;
};

type CenterAction = {
  icon: string;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
};

type Props = {
  tabs: [TabItem, TabItem, TabItem, TabItem];
  activeKey: string;
  onTabPress: (key: string) => void;
  centerAction?: CenterAction;
  showTopIndicator?: boolean;
  containerStyle?: ViewStyle;
};

const AppBottomNavBar: React.FC<Props> = ({
  tabs,
  activeKey,
  onTabPress,
  centerAction,
  showTopIndicator = true,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const slotCount = centerAction ? 5 : 4;
  const slotWidth = width / slotCount;

  const activeSlotIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.key === activeKey);
    if (idx === -1) return 0;
    if (!centerAction) return idx;
    return idx < 2 ? idx : idx + 1;
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

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);
  const actionSize = centerAction?.size ?? 40;

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfacePrimary,
          borderTopColor: colors.border0,
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
              backgroundColor: colors.borderBrand,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
      )}

      {/* Icon row container (adds space below indicator) */}
      <View style={styles.iconRow}>
        {/* Left tabs */}
        {leftTabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onTabPress(tab.key)}
              style={[styles.tabSlot, { width: slotWidth }]}
            >
              <Feather
                name={tab.icon}
                size={20}
                color={active ? colors.textPrimary : colors.textTertiary}
              />
              <AppText
                variant="body14"
                style={{
                  marginTop: 4,
                  color: active ? colors.textPrimary : colors.textTertiary,
                  fontWeight: active ? "500" : "400",
                }}
              >
                {tab.label}
              </AppText>
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
                    centerAction.backgroundColor ?? colors.borderBrand,
                },
              ]}
            >
              <Feather
                name={centerAction.icon}
                size={20}
                color={centerAction.iconColor ?? colors.surfacePrimary}
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
              style={[styles.tabSlot, { width: slotWidth }]}
            >
              <Feather
                name={tab.icon}
                size={20}
                color={active ? colors.textPrimary : colors.textTertiary}
              />
              <AppText
                variant="body14"
                style={{
                  marginTop: 4,
                  color: active ? colors.textPrimary : colors.textTertiary,
                  fontWeight: active ? "500" : "400",
                }}
              >
                {tab.label}
              </AppText>
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
    height: 60, // slightly taller for the spacer
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
    marginTop: Space.xs, // <-- adds the gap between indicator & icons
    flex: 1,
  },
  tabSlot: {
    alignItems: "center",
    justifyContent: "center",
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

export default AppBottomNavBar;
