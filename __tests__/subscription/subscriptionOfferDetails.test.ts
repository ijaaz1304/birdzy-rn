import {
  getStoreTrialDaysFromProduct,
  isFirstPhaseFreeTrial,
  parseBillingPeriodToDays,
  selectAndroidSubscriptionOffer,
} from "../../src/features/subscription/utils/subscriptionOfferDetails";

function trialThenPaidProduct(overrides?: Record<string, unknown>) {
  return {
    id: "yearly_pack_birdzy",
    subscriptionOffers: [
      {
        offerTokenAndroid: "paid-offer",
        basePlanIdAndroid: "yearly-pack-birdzy",
        pricingPhasesAndroid: {
          pricingPhaseList: [
            {
              priceAmountMicros: "2999000000",
              billingCycleCount: 1,
              billingPeriod: "P1Y",
              recurrenceMode: 2,
            },
          ],
        },
      },
      {
        offerTokenAndroid: "trial-offer",
        basePlanIdAndroid: "yearly-pack-trial-full",
        id: "free-trial",
        pricingPhasesAndroid: {
          pricingPhaseList: [
            {
              priceAmountMicros: "0",
              billingCycleCount: 1,
              billingPeriod: "P7D",
            },
            {
              priceAmountMicros: "2999000000",
              billingCycleCount: 1,
              billingPeriod: "P1Y",
              recurrenceMode: 2,
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe("subscriptionOfferDetails", () => {
  it("parses ISO billing periods into days", () => {
    expect(parseBillingPeriodToDays("P7D")).toBe(7);
    expect(parseBillingPeriodToDays("P1W")).toBe(7);
    expect(parseBillingPeriodToDays("P3D")).toBe(3);
  });

  it("selects Play trial offer for eligible store product", () => {
    const product = trialThenPaidProduct();
    const selected = selectAndroidSubscriptionOffer(product);
    expect(selected?.offerToken).toBe("trial-offer");
    expect(selected?.isTrial).toBe(true);
    expect(selected?.trialDays).toBe(7);
    expect(getStoreTrialDaysFromProduct(product)).toBe(7);
  });

  it("returns no trial when Play returns only paid offer", () => {
    const product = {
      id: "yearly_birdzy_pack_half_price",
      subscriptionOfferDetailsAndroid: [
        {
          offerToken: "paid-only",
          basePlanId: "yearly-pack-half-price-trial",
          pricingPhases: {
            pricingPhaseList: [
              {
                priceAmountMicros: "1450000000",
                billingCycleCount: 1,
                billingPeriod: "P1Y",
                recurrenceMode: 2,
              },
            ],
          },
        },
      ],
    };

    const selected = selectAndroidSubscriptionOffer(product);
    expect(selected?.isTrial).toBe(false);
    expect(selected?.trialDays).toBe(0);
    expect(getStoreTrialDaysFromProduct(product)).toBe(0);
  });

  it("prefers paid offer when preferPaidOffer is true", () => {
    const product = trialThenPaidProduct();
    const selected = selectAndroidSubscriptionOffer(product, {
      preferPaidOffer: true,
    });
    expect(selected?.offerToken).toBe("paid-offer");
    expect(selected?.isTrial).toBe(false);
  });

  it("detects free-trial first phase", () => {
    expect(
      isFirstPhaseFreeTrial([
        { priceAmountMicros: "0", billingCycleCount: 1, billingPeriod: "P7D" },
      ])
    ).toBe(true);
    expect(
      isFirstPhaseFreeTrial([
        {
          priceAmountMicros: "1450000000",
          billingCycleCount: 1,
          billingPeriod: "P1Y",
        },
      ])
    ).toBe(false);
  });
});
