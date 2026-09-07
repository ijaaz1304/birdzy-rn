import { Images } from "../../../assets";

export type PostAuthSubscriptionFeature = {
  iconLight: number;
  iconDark: number;
  title: string;
  subtitle: string;
};

/** Promo carousel — carousel_png/subs_0…subs_5 (384×384 PNG icons). */
export const POST_AUTH_SUBSCRIPTION_FEATURES: PostAuthSubscriptionFeature[] = [
  {
    iconLight: Images.subscriptionCarousel0,
    iconDark: Images.subscriptionCarousel0Dark,
    title: "Identify Without Limits",
    subtitle:
      "Experience the thrill of identifying birds anytime, right at your fingertips!",
  },
  {
    iconLight: Images.subscriptionCarousel1,
    iconDark: Images.subscriptionCarousel1Dark,
    title: "Build Unlimited Collections",
    subtitle:
      "Save and organize every sighting by creating unlimited personal collections.",
  },
  {
    iconLight: Images.subscriptionCarousel2,
    iconDark: Images.subscriptionCarousel2Dark,
    title: "Unlock Full Species Insights",
    subtitle:
      "Access detailed species insights that go beyond the basic overview.",
  },
  {
    iconLight: Images.subscriptionCarousel3,
    iconDark: Images.subscriptionCarousel3Dark,
    title: "Unlimited Feed Posts",
    subtitle: "Share your bird discoveries with no limits on feed posts.",
  },
  {
    iconLight: Images.subscriptionCarousel4,
    iconDark: Images.subscriptionCarousel4Dark,
    title: "Multiple Birds of the Day",
    subtitle:
      "Discover featured birds every day and expand your knowledge.",
  },
  {
    iconLight: Images.subscriptionCarousel5,
    iconDark: Images.subscriptionCarousel5Dark,
    title: "Chat With AI Without Limits",
    subtitle:
      "Ask unlimited questions about birds and get instant AI guidance.",
  },
];

export function getPostAuthSubscriptionFeatures(
  _isDark: boolean
): PostAuthSubscriptionFeature[] {
  return POST_AUTH_SUBSCRIPTION_FEATURES;
}
