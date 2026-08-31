/**
 * Navigation Utilities
 * Optimized navigation helpers for faster navigation across the app
 */

import {
  CommonActions,
  NavigationContainerRef,
} from "@react-navigation/native";
import { buildDeepLinkResetState } from "../navigation/deepLinking/deepLinkNavigation";
import type { ResolvedRootNavigation } from "../services/notifications/notificationRouting";
import { useIdentificationEntryStore } from "../features/camera/identificationEntry.store";

/**
 * Fast navigation helper that uses CommonActions for better performance
 */
export class NavigationService {
  private static navigationRef: NavigationContainerRef<any> | null = null;

  static setNavigationRef(ref: NavigationContainerRef<any> | null) {
    this.navigationRef = ref;
  }

  static getNavigationRef(): NavigationContainerRef<any> | null {
    return this.navigationRef;
  }

  /**
   * Fast navigate to a screen
   */
  static navigate(routeName: string, params?: any) {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.dispatch(
        CommonActions.navigate({
          name: routeName,
          params,
        })
      );
    }
  }

  /**
   * Fast navigate to nested screen (e.g., AuthStack -> Login)
   */
  static navigateNested(stackName: string, screenName: string, params?: any) {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.dispatch(
        CommonActions.navigate({
          name: stackName,
          params: {
            screen: screenName,
            params,
          },
        })
      );
    }
  }

  /**
   * Fast reset navigation (replaces entire navigation state)
   */
  static reset(routeName: string, params?: any) {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        })
      );
    }
  }

  /**
   * Fast reset to nested screen
   */
  static resetToNested(stackName: string, screenName: string, params?: any) {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: stackName,
              state: {
                routes: [{ name: screenName, params }],
                index: 0,
              },
            },
          ],
        })
      );
    }
  }

  /**
   * Reset root stack to a resolved deep-link / notification destination.
   * Tab routes also dispatch navigate with `initial: false` so an already-mounted
   * MainTabs does not stay on its default Home tab.
   */
  static resetToResolvedDestination(
    destination: { screen: string; params?: object },
    navigationRef?: NavigationContainerRef<any> | null
  ) {
    const ref = navigationRef ?? this.navigationRef;
    if (!ref?.isReady()) return false;

    ref.dispatch(
      CommonActions.reset(
        buildDeepLinkResetState({
          screen: destination.screen,
          params: destination.params,
        } as ResolvedRootNavigation)
      )
    );

    if (destination.screen === "MainTabs" && destination.params) {
      const nested = destination.params as {
        screen?: string;
        params?: object;
      };
      if (nested.screen) {
        ref.dispatch(
          CommonActions.navigate({
            name: "MainTabs",
            params: {
              screen: nested.screen,
              params: nested.params,
              initial: false,
            },
          })
        );
      }
    }
    return true;
  }

  /**
   * Fast go back
   */
  static goBack() {
    if (this.navigationRef?.isReady() && this.navigationRef.canGoBack()) {
      this.navigationRef.dispatch(CommonActions.goBack());
    }
  }

  /**
   * Fast replace current screen
   */
  static replace(routeName: string, params?: any) {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        })
      );
    }
  }
}

export type SubscriptionScreenName =
  | "SubscriptionMain"
  | "SubscriptionIntro"
  | "SubscriptionStatus";

/** Navigate to a screen in SubscriptionStack from anywhere in the app. */
export function navigateToSubscriptionScreen(
  screen: SubscriptionScreenName = "SubscriptionMain",
  params?: Record<string, unknown>
) {
  NavigationService.navigateNested("SubscriptionStack", screen, params);
}

/** Shorthand for the main subscription paywall screen. */
export function navigateToSubscriptionMain(params?: Record<string, unknown>) {
  navigateToSubscriptionScreen("SubscriptionMain", params);
}

/** Open Camera tab → Sound Identify flow (location then microphone popups). */
export function navigateToSoundIdentify(
  navigation: { navigate: (name: string, params?: object) => void }
) {
  const startSound =
    useIdentificationEntryStore.getState().startSoundEntryHandler;
  if (startSound) {
    startSound();
    return;
  }
  navigation.navigate("MainTabs", {
    screen: "Camera",
    params: { screen: "SoundIdentify" },
  });
}

/**
 * Hook for fast navigation
 * Use this instead of useNavigation for better performance
 */
export const useFastNavigation = () => {
  return {
    navigate: NavigationService.navigate,
    navigateNested: NavigationService.navigateNested,
    reset: NavigationService.reset,
    resetToNested: NavigationService.resetToNested,
    goBack: NavigationService.goBack,
    replace: NavigationService.replace,
  };
};
