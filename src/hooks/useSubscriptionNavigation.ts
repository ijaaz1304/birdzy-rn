/**
 * Hook for navigating to subscription screens
 * Provides a consistent way to navigate to subscription-related screens
 */

import {
  navigateToSubscriptionMain,
  navigateToSubscriptionScreen,
  type SubscriptionScreenName,
} from "../utils/navigation";

export const useSubscriptionNavigation = () => {
  const navigateToSubscription = (
    screen: SubscriptionScreenName = "SubscriptionMain",
    params?: Record<string, unknown>
  ) => {
    navigateToSubscriptionScreen(screen, params);
  };

  return {
    navigateToSubscription,
    navigateToSubscriptionMain,
    navigateToSubscriptionIntro: () =>
      navigateToSubscriptionScreen("SubscriptionIntro"),
    navigateToSubscriptionPlans: () => navigateToSubscriptionMain(),
  };
};
