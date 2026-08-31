import {
  shouldSkipLocationPermissionPrompt,
  shouldSkipNotificationPermissionPrompt,
} from "../../../services/permissions/permissionPromptSkip";
import { POST_AUTH_ONBOARDING_STEPS } from "../constants";
import { isPostAuthPromoSlide } from "./skipPromoSlides";

export type PostAuthSlideResolution =
  | { kind: "slide"; slide: number }
  | { kind: "complete" };

/**
 * Returns the first post-auth slide the user still needs, or complete when
 * permissions and promo slides can all be skipped.
 */
export async function resolvePostAuthOnboardingSlide(
  startSlide: number,
  skipPromoSlides: boolean
): Promise<PostAuthSlideResolution> {
  if (
    startSlide <= POST_AUTH_ONBOARDING_STEPS.LOCATION &&
    !(await shouldSkipLocationPermissionPrompt())
  ) {
    return { kind: "slide", slide: POST_AUTH_ONBOARDING_STEPS.LOCATION };
  }

  if (
    startSlide <= POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS &&
    !(await shouldSkipNotificationPermissionPrompt())
  ) {
    return {
      kind: "slide",
      slide: POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS,
    };
  }

  if (skipPromoSlides) {
    return { kind: "complete" };
  }

  if (startSlide >= POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION) {
    return { kind: "slide", slide: startSlide };
  }

  return { kind: "slide", slide: POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION };
}
