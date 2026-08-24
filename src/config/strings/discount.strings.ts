/**
 * Discount Popup & Banner Strings
 */

export const DISCOUNT_STRINGS = {
  firstVisit: {
    percentage: 70,
    title: "Get 70% Off – One Time Only",
    subtitle:
      "Upgrade now to enjoy a smarter, faster Plant App — for 30% of the normal price!",
    ctaText: "Get perks & go Pro+",
  },
  subsequentVisit: {
    percentage: 50,
    title: "Get 50% Off – Limited Time",
    subtitle:
      "Upgrade now to enjoy a smarter, faster Plant App — for 50% of the normal price!",
    ctaText: "Get perks & go Pro+",
  },
  timer: {
    minutes: "m",
    seconds: "s",
  },
  buttons: {
    close: "×",
  },
  // Discount banner (home screen)
  banner: {
    onSubscription: "ON SUBSCRIPTION",
    on: "ON",
    subscription: "SUBSCRIPTION",
    off: "OFF",
    discountEndsIn: "Discount ends in",
    subscribeNow: "Subscribe now",
    closeIcon: "✕",
  },
  // Discount countdown banner
  countdownBanner: {
    label: "Discount ends in ",
    nextDiscountLabel: "Discount in ",
    hours: "h",
    minutes: "m",
    seconds: "s",
    badgePercent: "50%",
  },
} as const;
