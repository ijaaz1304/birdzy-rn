import { getPlanCardPriceView, getSubscriptionCtaLabel, getSubscriptionTrialDisclosureText } from "../../src/features/post-auth-onboarding/utils/planDisplay";

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

describe("getSubscriptionCtaLabel", () => {
  it("shows Continue for weekly and lifetime plans", () => {
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
  });

  it("keeps trial CTA for yearly plans", () => {
    expect(
      getSubscriptionCtaLabel({
        selectedPlan: { duration: "year", priceDisplay: "$29.99", trialDays: 7 },
        useTrialCta: true,
      })
    ).toBe("Try free for 7 days");
  });
});

describe("getSubscriptionTrialDisclosureText", () => {
  it("shows Apple-style trial + price for yearly plans", () => {
    expect(
      getSubscriptionTrialDisclosureText({
        duration: "year",
        priceDisplay: "$29.99",
        trialDays: 7,
      })
    ).toBe("1 week free, then $29.99/year");
  });

  it("shows day-based trial label for non-week trials", () => {
    expect(
      getSubscriptionTrialDisclosureText({
        duration: "month",
        priceDisplay: "$9.99",
        trialDays: 3,
      })
    ).toBe("3 days free, then $9.99/month");
  });

  it("shows weekly disclosure with 3-day trial and monthly price label", () => {
    expect(
      getSubscriptionTrialDisclosureText({
        duration: "week",
        priceDisplay: "$4.99",
      })
    ).toBe("3 days free, then $4.99/month");
  });
});
