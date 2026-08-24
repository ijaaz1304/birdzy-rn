/**
 * Figma 8015:141357 — Home | Catalogue | [Identify] | Feed | Collection
 */

import React, { useCallback, useMemo, useRef } from "react";
import {
  ImageStyle,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { Images } from "../assets";
import { NAVIGATION_STRINGS } from "../config/navigation.strings";
import { TAB_BAR_COLORS as TAB_BAR_COLORS_CONST } from "../constants/colorConstants";
import { APP_COLORS } from "../config/colors";
import { spacing } from "../design-system/spacing";
import { useTheme } from "../hooks/useTheme";
import { useTabBarLayout } from "../contexts/TabBarLayoutContext";
import type { MeasurableTabName } from "../contexts/TabBarLayoutContext";
import { analyticsService } from "../services/analytics/analytics.service";
import { EVENTS } from "../services/analytics/analytics.events";

const TAB_BAR_BASE_HEIGHT = 56;
const TAB_ICON_SIZE = 16;
const CENTER_TAB_ICON_SIZE = 24;
const CENTER_TAB_CIRCLE_SIZE = 48;

const LEFT_TABS = ["Home", "Catalogue"] as const;
const RIGHT_TABS = ["Feed", "Collection"] as const;
type SideTabName = (typeof LEFT_TABS)[number] | (typeof RIGHT_TABS)[number];

const TAB_LABELS: Record<SideTabName, string> = {
  Home: NAVIGATION_STRINGS.tabs.home,
  Catalogue: NAVIGATION_STRINGS.tabs.explore,
  Feed: NAVIGATION_STRINGS.tabs.community,
  Collection: NAVIGATION_STRINGS.tabs.myBirds,
};

const TAB_ICONS: Record<SideTabName, number> = {
  Home: Images.bottomTabHome,
  Catalogue: Images.bottomTabCatalogue,
  Feed: Images.bottomTabFeed,
  Collection: Images.bottomTabCollection,
};

const TAB_ANALYTICS: Partial<Record<SideTabName, string>> = {
  Home: EVENTS.home_bottom_nav,
  Catalogue: EVENTS.global_catalogue_bottom_nav,
  Feed: EVENTS.feed_bottom_nav,
  Collection: EVENTS.private_collection_bottom_nav,
};

function emitTabAnalytics(name: SideTabName) {
  const event = TAB_ANALYTICS[name];
  if (event) analyticsService.logEvent(event);
}

function MeasuredTabTarget({
  tabName,
  children,
  onPress,
  style,
  accessibilityLabel,
  accessibilityState,
}: {
  tabName: MeasurableTabName;
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  accessibilityLabel: string;
  accessibilityState?: { selected?: boolean };
}) {
  const ref = useRef<View>(null);
  const { reportTabCenter } = useTabBarLayout();

  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, _y, width, height) => {
      if (width > 0 && height > 0) {
        reportTabCenter(tabName, x + width / 2);
      }
    });
  }, [reportTabCenter, tabName]);

  return (
    <View ref={ref} collapsable={false} onLayout={measure} style={style}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.tabPressable}
      >
        {children}
      </TouchableOpacity>
    </View>
  );
}

export function CustomBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabColors =
    theme.mode === "dark"
      ? TAB_BAR_COLORS_CONST.DARK
      : TAB_BAR_COLORS_CONST.LIGHT;

  const tabActiveColor = tabColors.selected;
  const tabActiveBorderColor = tabColors.line;
  const tabInactiveColor = tabColors.unselected;
  const tabBarBottomInset = Math.max(insets.bottom, spacing[2]);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + tabBarBottomInset;

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  const tabBarStyle = focusedOptions.tabBarStyle;
  const isHidden =
    tabBarStyle &&
    typeof tabBarStyle === "object" &&
    !Array.isArray(tabBarStyle) &&
    "display" in tabBarStyle &&
    tabBarStyle.display === "none";

  const routeByName = useMemo(() => {
    const map = new Map<string, (typeof state.routes)[number]>();
    for (const route of state.routes) {
      map.set(route.name, route);
    }
    return map;
  }, [state.routes]);

  if (isHidden) {
    return null;
  }

  const handleSideTabPress = (name: SideTabName) => {
    emitTabAnalytics(name);
    const route = routeByName.get(name);
    if (!route) return;

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    const isFocused = focusedRoute.name === name;
    if (isFocused && !event.defaultPrevented) {
      resetTabToRoot(navigation, name);
      return;
    }

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const handleIdentifyPress = () => {
    analyticsService.logEvent(EVENTS.identify_bottom_nav);
    const cameraRoute = routeByName.get("Camera");
    if (!cameraRoute) return;

    navigation.emit({
      type: "tabPress",
      target: cameraRoute.key,
      canPreventDefault: true,
    });

    navigation.navigate("Camera", { screen: "IdentifyHub" });
  };

  const renderSideTab = (name: SideTabName) => {
    const focused = focusedRoute.name === name;
    const iconStyle: ImageStyle = {
      width: TAB_ICON_SIZE,
      height: TAB_ICON_SIZE,
      tintColor: focused ? tabActiveColor : tabInactiveColor,
    };

    return (
      <MeasuredTabTarget
        key={name}
        tabName={name}
        accessibilityLabel={TAB_LABELS[name]}
        accessibilityState={focused ? { selected: true } : {}}
        onPress={() => handleSideTabPress(name)}
        style={[
          styles.sideTab,
          focused && {
            borderTopWidth: 2,
            borderTopColor: tabActiveBorderColor,
          },
        ]}
      >
        <AppImage source={TAB_ICONS[name]} style={iconStyle} resizeMode="contain" />
        <Text
          style={[
            styles.tabLabel,
            {
              color: focused ? tabActiveColor : tabInactiveColor,
              fontFamily: focused ? "Satoshi-Medium" : "Satoshi-Regular",
            },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {TAB_LABELS[name]}
        </Text>
      </MeasuredTabTarget>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: tabColors.background,
          borderTopColor: tabColors.border,
          paddingBottom: tabBarBottomInset,
          height: tabBarHeight,
          minHeight: tabBarHeight,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        {LEFT_TABS.map(renderSideTab)}
      </View>

      <MeasuredTabTarget
        tabName="Camera"
        accessibilityLabel={NAVIGATION_STRINGS.tabs.identify}
        onPress={handleIdentifyPress}
        style={styles.centerTabWrap}
      >
        <View style={styles.centerTabCircle}>
          <AppImage
            source={Images.bottomTabIdentifyDark}
            style={styles.centerTabIcon}
            resizeMode="contain"
          />
        </View>
      </MeasuredTabTarget>

      <View style={styles.rightGroup}>
        {RIGHT_TABS.map(renderSideTab)}
      </View>
    </View>
  );
}

function resetTabToRoot(
  navigation: BottomTabBarProps["navigation"],
  name: SideTabName
) {
  switch (name) {
    case "Home":
      navigation.navigate("Home", { screen: "HomeMain" });
      break;
    case "Catalogue":
      navigation.navigate("Catalogue", { screen: "CatalogueMain" });
      break;
    case "Feed":
      navigation.navigate("Feed", { screen: "FeedMain" });
      break;
    case "Collection":
      navigation.navigate("Collection", {
        screen: "CollectionMain",
        params: {},
      });
      break;
  }
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 1,
    paddingHorizontal: spacing[4],
    paddingTop: 0,
    gap: spacing[2],
  },
  leftGroup: {
    flex: 1,
    flexDirection: "row",
    gap: spacing[2],
  },
  rightGroup: {
    flex: 1,
    flexDirection: "row",
    gap: spacing[2],
  },
  sideTab: {
    flex: 1,
    alignItems: "center",
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
    gap: spacing[1],
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    width: "100%",
  },
  centerTabWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  centerTabCircle: {
    width: CENTER_TAB_CIRCLE_SIZE,
    height: CENTER_TAB_CIRCLE_SIZE,
    borderRadius: CENTER_TAB_CIRCLE_SIZE / 2,
    backgroundColor: APP_COLORS.ctaPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  centerTabIcon: {
    width: CENTER_TAB_ICON_SIZE,
    height: CENTER_TAB_ICON_SIZE,
  },
  tabPressable: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
  },
});
