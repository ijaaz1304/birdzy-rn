import IdentifyBirdDark from "../assets/dark/figma/tab_identify_bird.svg";
import IdentifyFrameDark from "../assets/dark/figma/tab_identify_frame.svg";
/**
 * Bottom tab bar — layout and selection treatment match Shroom-Ai MainTabs.
 * Identify stays a chooser (does not switch to the Camera tab).
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
import { spacing } from "../design-system/spacing";
import { useTheme } from "../hooks/useTheme";
import { useTabBarLayout } from "../contexts/TabBarLayoutContext";
import type { MeasurableTabName } from "../contexts/TabBarLayoutContext";
import { analyticsService } from "../services/analytics/analytics.service";
import { EVENTS } from "../services/analytics/analytics.events";
import { useIdentificationEntry } from "../features/camera/IdentificationEntryProvider";

/** Inner tab row height (icons + labels); safe-area padding is added separately. */
const TAB_BAR_BASE_HEIGHT = 66;
const TAB_ICON_SIZE = 24;
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
  const isDark = theme.mode === "dark";
  const { openIdentifyMethodChooser } = useIdentificationEntry();
  const tabColors =
    theme.mode === "dark"
      ? TAB_BAR_COLORS_CONST.DARK
      : TAB_BAR_COLORS_CONST.LIGHT;

  const tabActiveColor = tabColors.selected;
  const tabLineColor = tabColors.line;
  const tabInactiveColor = tabColors.unselected;
  const tabBarBottomInset = Math.max(insets.bottom, 10);
  const tabBarHeight = (isDark ? 56 : TAB_BAR_BASE_HEIGHT) + tabBarBottomInset;

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
    openIdentifyMethodChooser();
  };

  const renderSideTab = (name: SideTabName) => {
    const focused = focusedRoute.name === name;
    const iconStyle: ImageStyle = {
      width: isDark ? 16 : TAB_ICON_SIZE,
      height: isDark ? 16 : TAB_ICON_SIZE,
      tintColor: focused ? tabActiveColor : tabInactiveColor,
    };

    return (
      <MeasuredTabTarget
        key={name}
        tabName={name}
        accessibilityLabel={TAB_LABELS[name]}
        accessibilityState={focused ? { selected: true } : {}}
        onPress={() => handleSideTabPress(name)}
        style={[styles.sideTab, isDark && styles.darkSideTab]}
      >
        <View style={[styles.tabIconWrap, isDark && styles.darkTabIconWrap]}>
          <AppImage
            source={TAB_ICONS[name]}
            style={iconStyle}
            resizeMode="contain"
          />
          <View
            style={[
              styles.activeLine,
              isDark && styles.darkActiveLine,
              {
                opacity: focused ? 1 : 0,
                backgroundColor: tabLineColor,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            isDark && styles.darkTabLabel,
            { color: focused ? tabActiveColor : tabInactiveColor },
            isDark && {
              fontFamily: focused ? "Satoshi-Medium" : "Satoshi-Regular",
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
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
        isDark && styles.darkBar,
        {
          backgroundColor: isDark ? tabColors.background : theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: tabBarBottomInset,
          height: tabBarHeight,
          minHeight: tabBarHeight,
        },
      ]}
    >
      {LEFT_TABS.map(renderSideTab)}

      <MeasuredTabTarget
        tabName="Camera"
        accessibilityLabel={NAVIGATION_STRINGS.tabs.identify}
        onPress={handleIdentifyPress}
        style={[styles.centerTab, isDark && styles.darkCenterTab]}
      >
        <View style={styles.tabIconWrap}>
          {isDark ? (
            <View
              style={[
                styles.darkIdentifyCircle,
                { backgroundColor: theme.colors.primaryCTA },
              ]}
            >
              <View style={styles.darkScanSlot}>
                <IdentifyBirdDark style={styles.darkScanBird} />
                <IdentifyFrameDark style={styles.darkScanFrame} />
              </View>
            </View>
          ) : (
            <AppImage
              source={Images.bottomTabIdentify}
              style={styles.identifyTabIcon}
              resizeMode="contain"
            />
          )}
        </View>
      </MeasuredTabTarget>

      {RIGHT_TABS.map(renderSideTab)}
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
  darkBar: { paddingHorizontal: 16, paddingTop: 0, gap: 8 },
  darkCenterTab: { flex: 0, width: 48, height: 56 },
  darkSideTab: { height: 56 },
  darkTabIconWrap: { width: "100%", height: 16, marginTop: 8 },
  darkActiveLine: { top: -12, height: 2, width: "100%", borderRadius: 0 },
  darkTabLabel: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Satoshi-Medium",
  },
  darkIdentifyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  darkScanSlot: { width: 24, height: 24 },
  darkScanBird: { position: "absolute", left: 5, top: 4.83 },
  darkScanFrame: { position: "absolute", left: 1.9, top: 0.53 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[2],
    paddingTop: 6,
  },
  sideTab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerTab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 38,
  },
  activeLine: {
    position: "absolute",
    top: -10,
    height: 3,
    width: 32,
    borderRadius: 2,
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 1,
    fontFamily: "Satoshi-Regular",
  },
  identifyTabIcon: {
    width: CENTER_TAB_CIRCLE_SIZE,
    height: CENTER_TAB_CIRCLE_SIZE,
    marginTop: 4,
  },
  tabPressable: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
