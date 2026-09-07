import { getPlanCardPriceView, getPlanCardTrialDays, getSubscriptionCtaLabel, getSubscriptionTrialDisclosureText } from "../../src/features/post-auth-onboarding/utils/planDisplay";
import {
  getUserSubscriptionTrialState,
  resolveTrialUiState,
} from "../../src/features/subscription/utils/trialEligibility";

jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ user: null, setUser: jest.fn() }),
  },
}));

jest.mock("../../src/features/subscription/subscription.store", () => ({
  useSubscriptionStore: { getState: () => ({ subscription: null }) },
  selectIsPremium: () => false,
}));

describe("getPlanCardPriceView", () => {
  it("shows Loading… while IAP prices are pending", () => {
    expect(getPlanCardPriceView("Loading…", "year")).toEqual({
      amount: "Loading…",
      suffix: "",
      hasStorePrice: false,
    });
  });

  it("splits localized yearly store price into amount and suffix", () => {
    const view = getPlanCardPriceView("₹1,499.00", "year");
    expect(view.hasStorePrice).toBe(true);
    expect(view.amount).toBe("₹1,499");
    expect(view.suffix).toBe("/year");
    expect(view.billingNote).toBe("₹124.92/month");
  });

  it("returns em dash when store price is unavailable", () => {
    expect(getPlanCardPriceView("—", "week")).toEqual({
      amount: "—",
      suffix: "",
      hasStorePrice: false,
    });
  });
});

describe("getPlanCardTrialDays", () => {
  it("never shows trial for lifetime plans", () => {
    expect(getPlanCardTrialDays("lifetime", 7)).toBeUndefined();
  });

  it("uses store trial days when eligible", () => {
    expect(getPlanCardTrialDays("year", 7)).toBe(7);
    expect(getPlanCardTrialDays("week", 3)).toBe(3);
  });

  it("returns undefined when store reports no trial", () => {
    expect(getPlanCardTrialDays("year", 0)).toBeUndefined();
    expect(getPlanCardTrialDays("week", 0)).toBeUndefined();
    expect(getPlanCardTrialDays("year")).toBeUndefined();
  });
});

describe("getSubscriptionCtaLabel", () => {
  it("shows Continue for weekly, lifetime, and non-trial yearly", () => {
    expect(
      getSubscriptionCtaLabel({
        selectedPlan: { duration: "week", priceDisplay: "$4.99" },
      })
    ).toBe("Continue");
    expect(
      getSubscriptionCtaLabel({
        selectedPlan: { duration: "lifetime", priceDisplay: "$79.99" },
      })
    ).toBe("Continue");
    expect(
      getSubscriptionCtaLabel({
        selectedPlan: { duration: "year", priceDisplay: "$29.99", trialDays: 0 },
      })
    ).toBe("Subscribe for $29.99/year");
  });

  it("shows trial CTA only when store offer includes trial days", () => {
    expect(
      getSubscriptionCtaLabel({
        selectedPlan: { duration: "year", priceDisplay: "$29.99", trialDays: 7 },
      })
    ).toBe("Get 7 Days Free Trial");
  });
});

describe("getSubscriptionTrialDisclosureText", () => {
  it("shows trial + price when store offer includes trial", () => {
    expect(
      getSubscriptionTrialDisclosureText({
        duration: "year",
        priceDisplay: "$29.99",
        trialDays: 7,
      })
    ).toBe("1 week free, then $29.99/year");
  });

  it("shows auto-renewing copy when no trial", () => {
    expect(
      getSubscriptionTrialDisclosureText({
        duration: "year",
        priceDisplay: "$29.99",
        trialDays: 0,
      })
    ).toBe("$29.99/year, auto-renewing unless cancelled");
  });

  it("does not invent trial copy for weekly plans without store trial", () => {
    expect(
      getSubscriptionTrialDisclosureText({
        duration: "week",
        priceDisplay: "$4.99",
        trialDays: 0,
      })
    ).toBe("$4.99/month, auto-renewing unless cancelled");
  });
});

describe("resolveTrialUiState", () => {
  it("shows trial for eligible users with a store trial offer", () => {
    const decision = resolveTrialUiState({
      playOfferIsTrial: true,
      playTrialDays: 7,
      userHasActiveSubscription: false,
      userHasConsumedTrial: false,
    });
    expect(decision.shouldShowTrial).toBe(true);
    expect(decision.trialDays).toBe(7);
  });

  it("hides trial for users who already consumed trial", () => {
    const decision = resolveTrialUiState({
      playOfferIsTrial: true,
      playTrialDays: 7,
      userHasActiveSubscription: false,
      userHasConsumedTrial: true,
    });
    expect(decision.shouldShowTrial).toBe(false);
    expect(decision.trialDays).toBe(0);
  });

  it("hides trial for subscribed users", () => {
    const decision = resolveTrialUiState({
      playOfferIsTrial: true,
      playTrialDays: 7,
      userHasActiveSubscription: true,
      userHasConsumedTrial: false,
    });
    expect(decision.shouldShowTrial).toBe(false);
  });
});

describe("getUserSubscriptionTrialState", () => {
  it("returns default non-subscriber state when user is null", () => {
    expect(getUserSubscriptionTrialState()).toEqual({
      userHasActiveSubscription: false,
      userHasConsumedTrial: false,
      userHasPreviouslyPurchased: false,
    });
  });
});
