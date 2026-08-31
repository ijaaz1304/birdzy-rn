import { POST_AUTH_ONBOARDING_STEPS } from "../constants";

/** Subscription, gift, and 50% discount slides. */
export function isPostAuthPromoSlide(slide: number): boolean {
  return slide >= POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION;
}

/** Existing subscribers skip promo paywalls but still see location + notifications. */
export function shouldSkipPostAuthPromoSlides(
  isPremium: boolean,
  userIsSubscribed: boolean
): boolean {
  return isPremium || userIsSubscribed;
}
