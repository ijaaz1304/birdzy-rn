/**
 * Subscription Configuration
 * Static text and configuration for subscription screens
 */

import { DEFAULT_SELECTED_PLAN_ID } from "../data/subscription/subscriptionPlansLoader";

export const SUBSCRIPTION_TEXTS = {
  intro: {
    discountTimer: {
      prefix: "Discount ends in",
    },
    title: "Get 50% Off — Unlock Advanced Capabilities",
    comparison: {
      title: "What you'll receive",
      headers: {
        feature: "Feature",
        free: "Free",
        premium: "Premium",
      },
    },
    cta: {
      primary: "Start my free trial",
      later: "Later",
    },
    pricing: {
      monthly: {
        title: "Monthly",
        description: "Cancel anytime",
      },
      yearly: {
        title: "Annually",
        description: "7 days free trial",
      },
      lifetime: {
        title: "Lifetime",
        description: "One time purchase",
      },
      badge: {
        discount: "50% OFF",
        active: "Active",
      },
    },
    legal: {
      text: "By tapping one of the packs above, you'll be charged,\nyour subscription will auto-renew for the same price\nand package length until you cancel via App store.",
    },
  },
  plans: {
    discountTimer: {
      prefix: "Discount ends in",
    },
    header: {
      appName: "Birdzy",
      premium: "Premium",
    },
    legal: {
      text: 'By clicking "Subscribe" you agree to the Terms of Service and Paid Services Terms. Subscription auto-renews unless cancelled 24 hours before the end of the period.',
    },
  },
} as const;

export const SUBSCRIPTION_CONFIG = {
  defaultSelectedPlan: DEFAULT_SELECTED_PLAN_ID,
  defaultCountdown: {
    hours: 0,
    minutes: 20,
    seconds: 20,
  },
  discountPercent: 50,
} as const;

/**
 * Image keys for subscription carousel (popup/subscription_upgrade – match Images in assets/index.ts).
 */
export const SUBSCRIPTION_CAROUSEL_IMAGE_KEYS = {
  identification: {
    light: "subscriptionPopupIconIdentification",
    dark: "subscriptionPopupIconIdentificationDark",
  },
  collection: {
    light: "subscriptionPopupIconCollection",
    dark: "subscriptionPopupIconCollectionDark",
  },
  collectionAlt: {
    light: "collectionAltBgLight",
    dark: "collectionAltBgDark",
  },
  details: {
    light: "subscriptionPopupIconDetails",
    dark: "subscriptionPopupIconDetailsDark",
  },
  feed: {
    light: "subscriptionPopupIconFeed",
    dark: "subscriptionPopupIconFeedDark",
  },
  soundGallery: {
    light: "subscriptionPopupIconSoundGallery",
    dark: "subscriptionPopupIconSoundGalleryDark",
  },
  soundIdentification: {
    light: "subscriptionPopupIconSoundIdentification",
    dark: "subscriptionPopupIconSoundIdentificationDark",
  },
  mushroomOfDay: {
    light: "subscriptionPopupIconMushroomOfDay",
    dark: "subscriptionPopupIconMushroomOfDayDark",
  },
  aiChat: {
    light: "subscriptionPopupIconAiChat",
    dark: "subscriptionPopupIconAiChatDark",
  },
} as const;

// Carousel items (images from popup/subscription_upgrade)
export const SUBSCRIPTION_CAROUSEL_ITEMS = [
  {
    id: "1",
    iconKey: "collection",
    title: "Create unlimited collections - Go pro+ now",
    description:
      "Free users can create up to 2 collections. Upgrade to Pro to organize and save unlimited bird lists.",
    imageLight: "collectionBgLight",
    imageDark: "collectionBgDark",
  },
  {
    id: "1b",
    iconKey: "collectionAlt",
    title: "Get unlimited collection space - Go pro+ now",
    description:
      "Your life list is growing! Free accounts are limited to 100 sightings. Upgrade to Pro+ to save and manage unlimited entries.",
    imageLight: "collectionAltBgLight",
    imageDark: "collectionAltBgDark",
  },
  {
    id: "2",
    iconKey: "identification",
    title: "Get unlimited identifications - Go pro+",
    description:
      "Free users get 2 photo IDs and 2 sound IDs per day. Go Pro+ to identify with no daily cap.",
    imageLight: "subscriptionPopupIconIdentification",
    imageDark: "subscriptionPopupIconIdentificationDark",
  },
  {
    id: "3",
    iconKey: "details",
    title: "Get advanced bird details - Go pro+ now",
    description:
      "Want deeper insights? Unlock full species profiles, range maps, calls, and ecology with Pro+ access.",
    imageLight: "subscriptionPopupIconDetails",
    imageDark: "subscriptionPopupIconDetailsDark",
  },
  {
    id: "5",
    iconKey: "aiChat",
    title: "Get unlimited chat access with AI - Go pro now",
    description:
      "Free users get 5 AI messages per day. Pro+ gives you unlimited access to your smart bird expert.",
    imageLight: "subscriptionPopupIconAiChat",
    imageDark: "subscriptionPopupIconAiChatDark",
  },
  {
    id: "6",
    iconKey: "mushroomOfDay",
    title: "Get multiple birds of the day - Go pro+ now",
    description:
      "Free users can only view one Bird of the Day per day. Pro+ gives you unlimited refreshes.",
    imageLight: "subscriptionPopupIconMushroomOfDay",
    imageDark: "subscriptionPopupIconMushroomOfDayDark",
  },
  {
    id: "7",
    iconKey: "feed",
    title: "Get unlimited feed posts daily - Go pro+ now",
    description:
      "Free users can share one community post per day. Upgrade for unlimited sightings and photos in the feed!",
    imageLight: "subscriptionPopupIconFeed",
    imageDark: "subscriptionPopupIconFeedDark",
  },
  {
    id: "8",
    iconKey: "soundGallery",
    title: "Save unlimited sound recordings - Go pro+",
    description:
      "Free users can store up to 20 recordings in their sound library. Upgrade for unlimited clips.",
    imageLight: "subscriptionPopupIconSoundGallery",
    imageDark: "subscriptionPopupIconSoundGalleryDark",
  },
  {
    id: "9",
    iconKey: "soundIdentification",
    title: "Get unlimited sound identifications - Go pro+",
    description:
      "Free users get 2 sound identifications per day. Go Pro+ to identify bird calls with no daily cap.",
    imageLight: "subscriptionPopupIconSoundIdentification",
    imageDark: "subscriptionPopupIconSoundIdentificationDark",
  },
] as const;

export type LimitType =
  | "identification"
  | "soundIdentification"
  | "collection"
  | "collectionAlt"
  | "details"
  | "feed"
  | "mushroomOfDay"
  | "aiChat"
  | "soundGallery";

/** First carousel item that matches the limit type (by iconKey). Used for limit-reached bottom sheet. */
export function getCarouselItemForLimitType(
  limitType: LimitType
): (typeof SUBSCRIPTION_CAROUSEL_ITEMS)[number] {
  const item = SUBSCRIPTION_CAROUSEL_ITEMS.find(
    (item) => item.iconKey === limitType
  );
  if (item) return item;
  return SUBSCRIPTION_CAROUSEL_ITEMS[0];
}
