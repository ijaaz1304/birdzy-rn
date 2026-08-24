/**
 * Builds React Navigation reset state for deep-link destinations.
 * Overlay stacks keep MainTabs in the back stack so back returns to Home.
 * Tab destinations use nested `state` (not `params.screen`) so reset can
 * focus Collection / Feed / etc. — reset ignores nested screen params.
 */

import type { ResolvedRootNavigation } from "../../services/notifications/notificationRouting";

const OVERLAY_ROOT_STACKS = new Set<string>([
  "SettingsStack",
  "SubscriptionStack",
  "AskAIStack",
  "GuidesStack",
  "QuizStack",
  "BirdPersonalityStack",
]);

/** Must match `<Tab.Screen>` order in `MainTabs.tsx`. */
export const MAIN_TAB_ORDER = [
  "Home",
  "Catalogue",
  "Camera",
  "Feed",
  "Collection",
] as const;

type MainTabName = (typeof MAIN_TAB_ORDER)[number];

const MAIN_TAB_ROOT_SCREENS: Record<MainTabName, string> = {
  Home: "HomeMain",
  Catalogue: "CatalogueMain",
  Camera: "IdentifyHub",
  Feed: "FeedMain",
  Collection: "CollectionMain",
};

export type DeepLinkResetRoute = {
  name: string;
  params?: object;
  state?: {
    index: number;
    routes: DeepLinkResetRoute[];
  };
};

export type DeepLinkResetState = {
  index: number;
  routes: DeepLinkResetRoute[];
};

function isMainTabName(value: string | undefined): value is MainTabName {
  return (
    value != null && (MAIN_TAB_ORDER as readonly string[]).includes(value)
  );
}

function readNestedScreenParams(params: unknown): {
  screen?: string;
  params?: object;
} {
  if (!params || typeof params !== "object") return {};
  const record = params as { screen?: unknown; params?: unknown };
  return {
    screen: typeof record.screen === "string" ? record.screen : undefined,
    params:
      record.params && typeof record.params === "object"
        ? (record.params as object)
        : undefined,
  };
}

export function buildMainTabsResetRoute(
  destinationParams: unknown
): DeepLinkResetRoute {
  const tabTarget = readNestedScreenParams(destinationParams);
  const tabName: MainTabName = isMainTabName(tabTarget.screen)
    ? tabTarget.screen
    : "Home";
  const nested = readNestedScreenParams(tabTarget.params);
  const nestedScreen = nested.screen ?? MAIN_TAB_ROOT_SCREENS[tabName];
  const tabIndex = MAIN_TAB_ORDER.indexOf(tabName);

  return {
    name: "MainTabs",
    state: {
      index: tabIndex,
      routes: MAIN_TAB_ORDER.map((name) =>
        name === tabName
          ? {
              name,
              state: {
                index: 0,
                routes: [
                  nested.params
                    ? { name: nestedScreen, params: nested.params }
                    : { name: nestedScreen },
                ],
              },
            }
          : { name }
      ),
    },
  };
}

const MAIN_TABS_HOME_ROUTE = buildMainTabsResetRoute({
  screen: "Home",
  params: { screen: "HomeMain" },
});

export function buildDeepLinkResetState(destination: ResolvedRootNavigation): DeepLinkResetState {
  if (OVERLAY_ROOT_STACKS.has(destination.screen)) {
    return {
      index: 1,
      routes: [
        MAIN_TABS_HOME_ROUTE,
        {
          name: destination.screen,
          params: destination.params as object,
        },
      ],
    };
  }

  if (destination.screen === "MainTabs") {
    return {
      index: 0,
      routes: [buildMainTabsResetRoute(destination.params)],
    };
  }

  return {
    index: 0,
    routes: [
      {
        name: destination.screen,
        params: destination.params as object,
      },
    ],
  };
}
