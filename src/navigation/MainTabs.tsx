/**
 * Main Bottom Tab Navigator — Figma 8015:141357
 * Tabs: Home | Catalogue | Identify (center) | Feed | Collection
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  getFocusedRouteNameFromRoute,
  useNavigationState,
} from "@react-navigation/native";
import { MainTabParamList } from "./types";
import { HomeStack } from "./HomeStack";
import { CatalogueStack } from "./CatalogueStack";
import { CameraStack } from "./CameraStack";
import { CollectionStack } from "./CollectionStack";
import { FeedStack } from "./FeedStack";
import { FeedNotificationsSync } from "../features/feed/components/FeedNotificationsSync";
import { AppLogsTooltip } from "../components/AppLogsTooltip/AppLogsTooltip";
import { TabBarLayoutProvider } from "../contexts/TabBarLayoutContext";
import { TooltipVisibilityContext } from "../contexts/TooltipVisibilityContext";
import { IdentificationEntryProvider } from "../features/camera/IdentificationEntryProvider";
import { CustomBottomTabBar } from "./CustomBottomTabBar";

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<
    "Home" | "Catalogue" | "Camera" | "Collection" | "Feed"
  >("Home");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const runAfterTooltipCompleteRef = useRef<
    (() => void | Promise<void>) | null
  >(null);
  const registerRunAfterTooltipComplete = useCallback(
    (fn: () => void | Promise<void>) => {
      runAfterTooltipCompleteRef.current = fn;
    },
    []
  );
  const runAfterTooltipComplete = useCallback(() => {
    const fn = runAfterTooltipCompleteRef.current;
    runAfterTooltipCompleteRef.current = null;
    fn?.();
  }, []);

  const routeName = useNavigationState((state) => {
    if (!state) return "Home";
    const route = state.routes[state.index];
    return route.name;
  });

  useEffect(() => {
    if (
      routeName &&
      ["Home", "Catalogue", "Camera", "Collection", "Feed"].includes(routeName)
    ) {
      setCurrentTab(routeName as typeof currentTab);
    }
  }, [routeName]);

  const nestedRouteByTab = useNavigationState((state) => {
    if (!state) return {} as Record<string, string | undefined>;
    const result: Record<string, string | undefined> = {};
    const tabNames = ["Home", "Catalogue", "Collection", "Feed"] as const;
    for (const tabName of tabNames) {
      const tabRoute = state.routes.find((r) => r.name === tabName);
      const stackState = tabRoute?.state as
        | { index?: number; routes?: Array<{ name: string }> }
        | undefined;
      if (!stackState?.routes?.length) {
        result[tabName] = undefined;
        continue;
      }
      const idx =
        typeof stackState.index === "number"
          ? stackState.index
          : stackState.routes.length - 1;
      result[tabName] = stackState.routes[idx]?.name;
    }
    return result;
  });

  const isTabAtRoot = useCallback(
    (tab: typeof currentTab) => {
      const nested = nestedRouteByTab[tab];
      switch (tab) {
        case "Home":
          return !nested || nested === "HomeMain";
        case "Catalogue":
          return !nested || nested === "CatalogueMain";
        case "Collection":
          return !nested || nested === "CollectionMain";
        case "Feed":
          return !nested || nested === "FeedMain";
        default:
          return false;
      }
    },
    [nestedRouteByTab]
  );

  const ftueActive = currentTab !== "Camera" && isTabAtRoot(currentTab);

  const shouldHideTabBar = (tabName: string, nestedRouteName?: string) => {
    if (tabName === "Camera") return true;
    const hiddenByTab: Record<string, string[]> = {
      Home: ["BirdOfTheDay", "OtherApps", "BirdDetails"],
      Catalogue: ["BirdDetails", "SearchFilter"],
      Collection: [
        "CreateCollection",
        "BirdDetails",
        "EditBirdDetails",
      ],
      Camera: [
        "CameraPermissionGate",
        "CameraCaptureScreen",
        "DiagnosisLoading",
        "OtherPossibleMatches",
        "GalleryPicker",
        "IdentifyHub",
        "CameraMain",
        "SoundIdentify",
      ],
      Feed: ["CreatePost", "CropImage", "PostDetails", "NotificationCenter"],
    };
    const list = hiddenByTab[tabName] ?? [];
    return nestedRouteName ? list.includes(nestedRouteName) : false;
  };

  return (
    <>
      <TooltipVisibilityContext.Provider
        value={{
          tooltipVisible,
          setTooltipVisible,
          registerRunAfterTooltipComplete,
          runAfterTooltipComplete,
        }}
      >
        <IdentificationEntryProvider>
          <TabBarLayoutProvider>
            <FeedNotificationsSync />
            <Tab.Navigator
              initialRouteName="Home"
              tabBar={(props) => <CustomBottomTabBar {...props} />}
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: shouldHideTabBar(
                  route.name,
                  getFocusedRouteNameFromRoute(route) ?? undefined
                )
                  ? { display: "none" }
                  : undefined,
              })}
            >
              <Tab.Screen name="Home" component={HomeStack} />
              <Tab.Screen
                name="Catalogue"
                component={CatalogueStack}
                listeners={({ navigation }) => ({
                  tabPress: (e) => {
                    const state = navigation.getState();
                    const catalogueRoute = state.routes.find(
                      (r) => r.name === "Catalogue"
                    );
                    const stackState = catalogueRoute?.state as
                      | { index?: number; routes?: Array<{ name: string }> }
                      | undefined;

                    const routes = stackState?.routes ?? [];
                    const idx =
                      typeof stackState?.index === "number"
                        ? stackState.index
                        : routes.length - 1;
                    const activeNestedName = routes[idx]?.name;

                    const shouldGoToCatalogueMain =
                      state.routes[state.index]?.name === "Catalogue" &&
                      activeNestedName !== "CatalogueMain";

                    const catalogueHasOnlyDeepScreen =
                      state.routes[state.index]?.name !== "Catalogue" &&
                      routes.length === 1 &&
                      routes[0]?.name !== "CatalogueMain";

                    if (shouldGoToCatalogueMain || catalogueHasOnlyDeepScreen) {
                      e.preventDefault();
                      navigation.navigate("Catalogue", {
                        screen: "CatalogueMain",
                      });
                    }
                  },
                })}
              />
              <Tab.Screen
                name="Camera"
                component={CameraStack}
                options={{ tabBarButton: () => null }}
              />
              <Tab.Screen name="Feed" component={FeedStack} />
              <Tab.Screen
                name="Collection"
                component={CollectionStack}
                listeners={({ navigation }) => ({
                  tabPress: (e) => {
                    const state = navigation.getState();
                    const collectionRoute = state.routes.find(
                      (r) => r.name === "Collection"
                    );
                    const stackState = collectionRoute?.state as
                      | {
                          index?: number;
                          routes?: Array<{ name: string }>;
                        }
                      | undefined;
                    const routes = stackState?.routes ?? [];
                    const idx =
                      typeof stackState?.index === "number"
                        ? stackState.index
                        : routes.length - 1;
                    const activeName = routes[idx]?.name;
                    if (activeName && activeName !== "CollectionMain") {
                      e.preventDefault();
                      navigation.navigate("Collection", {
                        screen: "CollectionMain",
                        params: {},
                      });
                    }
                  },
                })}
              />
            </Tab.Navigator>
            <AppLogsTooltip
              currentTab={currentTab}
              ftueActive={ftueActive}
              onVisibleChange={setTooltipVisible}
              onComplete={runAfterTooltipComplete}
            />
          </TabBarLayoutProvider>
        </IdentificationEntryProvider>
      </TooltipVisibilityContext.Provider>
    </>
  );
};
