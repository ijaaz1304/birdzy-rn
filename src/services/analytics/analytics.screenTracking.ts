/**
 * Central screen tracking: maps navigation route names to spec analytics events.
 * Used by RootNavigator onStateChange to fire one event per screen focus.
 */

import type { NavigationState } from "@react-navigation/native";
import { EVENTS } from "./analytics.events";

/** Map focused screen name (leaf route) to spec event name. */
export const SCREEN_TO_EVENT: Record<string, string> = {
  HomeMain: EVENTS.homescreen,
  CollectionMain: EVENTS.collection_screen,
  CameraMain: EVENTS.identification_screen,
  IdentifyImageCrop: EVENTS.photo_cropping_screen,
  OtherPossibleMatches: EVENTS.identification_all_options_screen,
  QuizMain: EVENTS.which_bird_screen_1,
  FeedMain: EVENTS.feed_screen,
  AskAIMain: EVENTS.ask_ai_screen,
  SubscriptionMain: EVENTS.subscription_screen,
  SettingsMain: EVENTS.settings_screen,
  CatalogueMain: EVENTS.global_catalogue_screen,
  BirdOfTheDay: EVENTS.bird_of_the_day_screen,
  Login: EVENTS.login_screen,
  // BirdPersonality questionnaire: which_bird_screen_* events are logged in quizAnalytics
};

/**
 * Get analytics event and params for a given leaf screen name (for logging with time_spent on leave).
 */
export function getScreenEventForScreenName(screenName: string): {
  event: string;
  params?: Record<string, string>;
} | null {
  const event = SCREEN_TO_EVENT[screenName];
  if (!event) return null;
  const params: Record<string, string> = {};
  if (event === EVENTS.global_catalogue_screen) {
    // discount not known from name alone; omit or leave for screen to pass
  }
  return { event, params: Object.keys(params).length ? params : undefined };
}

/**
 * Resolve full navigation state to the leaf focused screen name.
 * Handles MainTabs -> Tab -> Stack -> Screen.
 */
export function getLeafFocusedRouteName(
  state: NavigationState | undefined
): string | undefined {
  if (!state?.routes?.length) return undefined;
  let current: NavigationState | undefined = state;
  let name: string | undefined = state.routes[state.index]?.name;
  while (current) {
    const route = current.routes[current.index];
    if (!route) break;
    name = route.name;
    const nested = (route as any).state;
    if (nested?.routes?.length) {
      current = nested as NavigationState;
    } else {
      break;
    }
  }
  return name;
}

/**
 * Get analytics event name and optional params for the current navigation state.
 * Returns undefined if no spec event for this screen.
 */
export function getScreenEventForState(state: NavigationState | undefined): {
  event: string;
  params?: Record<string, string>;
} | null {
  const screenName = getLeafFocusedRouteName(state);
  if (!screenName) return null;
  const event = SCREEN_TO_EVENT[screenName];
  if (!event) return null;
  const params: Record<string, string> = {};
  if (event === EVENTS.global_catalogue_screen) {
    const route = getCurrentRouteWithParams(state);
    if (route?.params?.discount !== undefined) {
      params.discount = route.params.discount ? "discount" : "non-discount";
    }
  }
  return { event, params: Object.keys(params).length ? params : undefined };
}

function getCurrentRouteWithParams(
  state: NavigationState | undefined
): { name: string; params?: any } | null {
  if (!state?.routes?.length) return null;
  const route = state.routes[state.index];
  const nested = (route as any).state;
  if (nested?.routes?.length) {
    const inner = getCurrentRouteWithParams(nested as NavigationState);
    if (inner) return inner;
  }
  return route ? { name: route.name, params: (route as any).params } : null;
}
