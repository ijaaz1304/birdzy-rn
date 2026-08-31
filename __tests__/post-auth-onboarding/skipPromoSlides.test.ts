import { POST_AUTH_ONBOARDING_STEPS } from "../../src/features/post-auth-onboarding/constants";
import {
  isPostAuthPromoSlide,
  shouldSkipPostAuthPromoSlides,
} from "../../src/features/post-auth-onboarding/utils/skipPromoSlides";

describe("isPostAuthPromoSlide", () => {
  it("keeps location and notifications", () => {
    expect(isPostAuthPromoSlide(POST_AUTH_ONBOARDING_STEPS.LOCATION)).toBe(
      false
    );
    expect(
      isPostAuthPromoSlide(POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS)
    ).toBe(false);
  });

  it("treats subscription, gift, and discount as promo", () => {
    expect(isPostAuthPromoSlide(POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION)).toBe(
      true
    );
    expect(isPostAuthPromoSlide(POST_AUTH_ONBOARDING_STEPS.SURPRISE)).toBe(
      true
    );
    expect(isPostAuthPromoSlide(POST_AUTH_ONBOARDING_STEPS.DISCOUNT)).toBe(
      true
    );
  });
});

describe("shouldSkipPostAuthPromoSlides", () => {
  it("skips for premium or backend-subscribed users", () => {
    expect(shouldSkipPostAuthPromoSlides(true, false)).toBe(true);
    expect(shouldSkipPostAuthPromoSlides(false, true)).toBe(true);
  });

  it("keeps promo slides for free users", () => {
    expect(shouldSkipPostAuthPromoSlides(false, false)).toBe(false);
  });
});
