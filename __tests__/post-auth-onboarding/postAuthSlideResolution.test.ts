jest.mock("../../src/services/permissions/permissionPromptSkip", () => ({
  shouldSkipLocationPermissionPrompt: jest.fn(),
  shouldSkipNotificationPermissionPrompt: jest.fn(),
}));

import { POST_AUTH_ONBOARDING_STEPS } from "../../src/features/post-auth-onboarding/constants";
import { resolvePostAuthOnboardingSlide } from "../../src/features/post-auth-onboarding/utils/postAuthSlideResolution";
import {
  shouldSkipLocationPermissionPrompt,
  shouldSkipNotificationPermissionPrompt,
} from "../../src/services/permissions/permissionPromptSkip";

const skipLocation = shouldSkipLocationPermissionPrompt as jest.Mock;
const skipNotification = shouldSkipNotificationPermissionPrompt as jest.Mock;

describe("resolvePostAuthOnboardingSlide", () => {
  beforeEach(() => {
    skipLocation.mockReset();
    skipNotification.mockReset();
  });

  it("starts at location when location prompt is still needed", async () => {
    skipLocation.mockResolvedValue(false);
    skipNotification.mockResolvedValue(true);

    await expect(
      resolvePostAuthOnboardingSlide(POST_AUTH_ONBOARDING_STEPS.LOCATION, false)
    ).resolves.toEqual({
      kind: "slide",
      slide: POST_AUTH_ONBOARDING_STEPS.LOCATION,
    });
  });

  it("starts at notifications when location is already handled", async () => {
    skipLocation.mockResolvedValue(true);
    skipNotification.mockResolvedValue(false);

    await expect(
      resolvePostAuthOnboardingSlide(POST_AUTH_ONBOARDING_STEPS.LOCATION, false)
    ).resolves.toEqual({
      kind: "slide",
      slide: POST_AUTH_ONBOARDING_STEPS.NOTIFICATIONS,
    });
  });

  it("completes for premium users once permissions are handled", async () => {
    skipLocation.mockResolvedValue(true);
    skipNotification.mockResolvedValue(true);

    await expect(
      resolvePostAuthOnboardingSlide(POST_AUTH_ONBOARDING_STEPS.LOCATION, true)
    ).resolves.toEqual({ kind: "complete" });
  });

  it("resumes promo slides for free users with handled permissions", async () => {
    skipLocation.mockResolvedValue(true);
    skipNotification.mockResolvedValue(true);

    await expect(
      resolvePostAuthOnboardingSlide(POST_AUTH_ONBOARDING_STEPS.DISCOUNT, false)
    ).resolves.toEqual({
      kind: "slide",
      slide: POST_AUTH_ONBOARDING_STEPS.DISCOUNT,
    });
  });

  it("does not return to notifications after advancing past them", async () => {
    skipLocation.mockResolvedValue(true);
    skipNotification.mockResolvedValue(false);

    await expect(
      resolvePostAuthOnboardingSlide(
        POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION,
        false
      )
    ).resolves.toEqual({
      kind: "slide",
      slide: POST_AUTH_ONBOARDING_STEPS.SUBSCRIPTION,
    });
  });
});
