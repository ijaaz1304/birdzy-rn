import { CommonActions } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { NavigationService } from "../../../utils/navigation";
import { usePostAuthOnboardingStore } from "../post-auth-onboarding.store";

export const POST_AUTH_ONBOARDING_ROUTE = "PostAuthOnboarding";

export function resetToPostAuthOnboarding(
  navigation?: NavigationProp<ParamListBase>
): void {
  usePostAuthOnboardingStore.getState().beginPostAuthOnboarding();

  const action = CommonActions.reset({
    index: 0,
    routes: [{ name: POST_AUTH_ONBOARDING_ROUTE }],
  });

  if (navigation) {
    const root = navigation.getParent?.() ?? navigation;
    root.dispatch(action);
    return;
  }

  NavigationService.reset(POST_AUTH_ONBOARDING_ROUTE);
}
