jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
  NativeModules: {
    SettingsManager: {
      settings: {
        AppleLocale: "en_IN",
        AppleLanguages: ["en-IN"],
      },
    },
    I18nManager: {
      localeIdentifier: "en_IN",
    },
  },
}));

const resolvedOptionsSpy = jest
  .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
  .mockReturnValue({
    locale: "en-IN",
    timeZone: "Asia/Kolkata",
    calendar: "gregory",
    numberingSystem: "latn",
  } as Intl.ResolvedDateTimeFormatOptions);

import {
  formatNumericProductPrice,
  getAndroidOneTimeFormattedPrice,
  getAndroidSubscriptionFormattedPrice,
  getAndroidSubscriptionOfferToken,
  getDeviceCurrency,
  getDeviceRegionCode,
  inferCurrencyFromFormattedPrice,
  pickProductFormattedPrice,
  resolveProductCurrency,
  resolveProductDisplayPrice,
} from "../../src/features/subscription/utils/iapPriceDisplay";

describe("iapPriceDisplay", () => {
  beforeEach(() => {
    const rn = require("react-native") as {
      NativeModules: {
        SettingsManager: { settings: Record<string, unknown> };
        I18nManager: { localeIdentifier: string };
      };
    };
    rn.NativeModules.SettingsManager.settings = {
      AppleLocale: "en_IN",
      AppleLanguages: ["en-IN"],
    };
    rn.NativeModules.I18nManager.localeIdentifier = "en_IN";

    resolvedOptionsSpy.mockReturnValue({
      locale: "en-IN",
      timeZone: "Asia/Kolkata",
      calendar: "gregory",
      numberingSystem: "latn",
    } as Intl.ResolvedDateTimeFormatOptions);
  });

  afterAll(() => {
    resolvedOptionsSpy.mockRestore();
  });

  it("resolves India region from locale/timezone (DeviceInfo.getDeviceCountry removed)", () => {
    expect(getDeviceRegionCode()).toBe("IN");
    expect(getDeviceCurrency()).toBe("INR");
  });

  it("prefers displayPrice from StoreKit products", () => {
    expect(
      pickProductFormattedPrice({
        displayPrice: "₹499.00",
        localizedPrice: "$4.99",
      })
    ).toBe("₹499.00");
  });

  it("skips USD formatted prices on India devices and uses INR numeric fallback", () => {
    expect(
      pickProductFormattedPrice({
        localizedPrice: "$4.99",
        price: 499,
      })
    ).toBeNull();
    expect(
      resolveProductDisplayPrice({
        localizedPrice: "$4.99",
        price: 499,
      })
    ).toBe("₹499.00");
  });

  it("prefers device region currency over mismatched store currency metadata", () => {
    expect(
      resolveProductCurrency({
        currency: "USD",
        price: 499,
      })
    ).toBe("INR");
    expect(
      resolveProductDisplayPrice({
        currency: "USD",
        localizedPrice: "$499.00",
        price: 499,
      })
    ).toBe("₹499.00");
  });

  it("infers INR and USD from formatted strings", () => {
    expect(inferCurrencyFromFormattedPrice("₹499.00")).toBe("INR");
    expect(inferCurrencyFromFormattedPrice("$4.99")).toBe("USD");
    expect(inferCurrencyFromFormattedPrice("US$4.99")).toBe("USD");
  });

  it("uses device country for currency when StoreKit omits currency", () => {
    expect(resolveProductCurrency({ currency: "" })).toBe("INR");
  });

  it("formats numeric fallback in INR for India devices", () => {
    expect(formatNumericProductPrice({ price: 499, currency: "" })).toBe(
      "₹499.00"
    );
  });

  it("reads Android yearly price from subscriptionOffers pricing phases when top-level is Free", () => {
    const product = {
      type: "subs",
      displayPrice: "Free",
      price: 0,
      subscriptionOffers: [
        {
          displayPrice: "Free",
          price: 0,
          offerTokenAndroid: "offer-token-yearly",
          pricingPhasesAndroid: {
            pricingPhaseList: [
              {
                formattedPrice: "Free",
                priceAmountMicros: "0",
                recurrenceMode: 1,
              },
              {
                formattedPrice: "₹1,499.00",
                priceAmountMicros: "1499000000",
                recurrenceMode: 2,
              },
            ],
          },
        },
      ],
    };

    expect(getAndroidSubscriptionFormattedPrice(product)).toBe("₹1,499.00");
    expect(pickProductFormattedPrice(product)).toBe("₹1,499.00");
    expect(getAndroidSubscriptionOfferToken(product)).toBe("offer-token-yearly");
  });

  it("reads Android lifetime price from oneTimePurchaseOfferDetailsAndroid", () => {
    const product = {
      type: "in-app",
      displayPrice: "",
      oneTimePurchaseOfferDetailsAndroid: [
        {
          formattedPrice: "₹4,999.00",
          priceAmountMicros: "4999000000",
          offerToken: "lifetime-offer",
        },
      ],
    };

    expect(getAndroidOneTimeFormattedPrice(product)).toBe("₹4,999.00");
    expect(pickProductFormattedPrice(product)).toBe("₹4,999.00");
  });

  it("falls back to legacy subscriptionOfferDetailsAndroid pricing phases", () => {
    const product = {
      type: "subs",
      displayPrice: "Free",
      subscriptionOfferDetailsAndroid: [
        {
          offerToken: "legacy-offer",
          pricingPhases: {
            pricingPhaseList: [
              {
                formattedPrice: "$29.99",
                priceAmountMicros: "29990000",
                recurrenceMode: 2,
              },
            ],
          },
        },
      ],
    };

    expect(getAndroidSubscriptionFormattedPrice(product)).toBe("$29.99");
    expect(getAndroidSubscriptionOfferToken(product)).toBe("legacy-offer");
  });

  it("rejects USD Android phase prices on India devices and uses INR micros fallback", () => {
    const product = {
      type: "subs",
      displayPrice: "Free",
      price: 0,
      subscriptionOfferDetailsAndroid: [
        {
          offerToken: "legacy-offer",
          pricingPhases: {
            pricingPhaseList: [
              {
                formattedPrice: "$29.99",
                priceAmountMicros: "1499000000",
                recurrenceMode: 2,
              },
            ],
          },
        },
      ],
    };

    expect(pickProductFormattedPrice(product)).toBeNull();
    expect(resolveProductDisplayPrice(product)).toBe("₹1,499.00");
  });

  it("uses USD for US locale/timezone", () => {
    const rn = require("react-native") as {
      NativeModules: {
        SettingsManager: { settings: Record<string, unknown> };
        I18nManager: { localeIdentifier: string };
      };
    };
    rn.NativeModules.SettingsManager.settings = {
      AppleLocale: "en_US",
      AppleLanguages: ["en-US"],
    };
    rn.NativeModules.I18nManager.localeIdentifier = "en_US";

    resolvedOptionsSpy.mockReturnValue({
      locale: "en-US",
      timeZone: "America/New_York",
      calendar: "gregory",
      numberingSystem: "latn",
    } as Intl.ResolvedDateTimeFormatOptions);

    expect(getDeviceRegionCode()).toBe("US");
    expect(getDeviceCurrency()).toBe("USD");
    expect(
      resolveProductDisplayPrice({
        localizedPrice: "$4.99",
        price: 4.99,
      })
    ).toBe("$4.99");
  });

  it("prefers India timezone over en-US language locale", () => {
    const rn = require("react-native") as {
      NativeModules: {
        SettingsManager: { settings: Record<string, unknown> };
        I18nManager: { localeIdentifier: string };
      };
    };
    rn.NativeModules.SettingsManager.settings = {
      AppleLocale: "en_US",
      AppleLanguages: ["en-US"],
    };
    rn.NativeModules.I18nManager.localeIdentifier = "en_US";

    resolvedOptionsSpy.mockReturnValue({
      locale: "en-US",
      timeZone: "Asia/Kolkata",
      calendar: "gregory",
      numberingSystem: "latn",
    } as Intl.ResolvedDateTimeFormatOptions);

    expect(getDeviceRegionCode()).toBe("IN");
    expect(getDeviceCurrency()).toBe("INR");
    expect(
      resolveProductDisplayPrice({
        localizedPrice: "$499.00",
        price: 499,
      })
    ).toBe("₹499.00");
  });
});
