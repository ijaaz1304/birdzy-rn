import type { ImageSourcePropType } from "react-native";
import { Images, QUIZ_BIRD_LOCAL_IMAGES } from "../assets";
import { prefetchBundledSources } from "./prefetchBundledSources";

let didWarmBundledCache = false;

/** Sheet backgrounds, subscription popups, and tab icons — warmed once at app boot. */
export function warmBundledImageCache(): void {
  if (didWarmBundledCache) return;
  didWarmBundledCache = true;

  const sources: ImageSourcePropType[] = [
    // Splash — decode before first paint.
    Images.onboardingSplash,
    // First-paint screens — decode before onboarding / Find Your Mushroom / Home cards.
    Images.onboardingBg1,
    Images.onboardingBg1Dark,
    Images.commonBg,
    Images.birdPersonalityImage,
    ...Object.values(QUIZ_BIRD_LOCAL_IMAGES),
    Images.homeFindSpecies,
    Images.homeFindSpeciesDark,
    Images.homeAskAiCard,
    Images.homeAskAiCardDark,
    Images.homeBirdOfDay,
    Images.homeBirdOfDayDark,
    Images.commonBg,
    Images.subscriptionCarousel0,
    Images.subscriptionCarousel1,
    Images.subscriptionCarousel2,
    Images.subscriptionCarousel3,
    Images.subscriptionCarousel4,
    Images.subscriptionCarousel5,
    Images.rateUsSheetBgLight,
    Images.rateUsSheetBgDark,
    Images.popUp50Light,
    Images.popUp50Dark,
    Images.birdSubsToPremium,
    Images.subscriptionBackgroundDark,
    Images.popUp70Light,
    Images.popUp70Dark,
    Images.popupNotificationPermissionBg,
    Images.popupNotificationPermissionBgDark,
    Images.popupLocationPermissionBg,
    Images.popupLocationPermissionBgDark,
    Images.popupCongratulationsBg,
    Images.popupCongratulationsBgDark,
    Images.subscriptionPopupIconIdentification,
    Images.subscriptionPopupIconIdentificationDark,
    Images.subscriptionPopupIconCollection,
    Images.subscriptionPopupIconCollectionDark,
    Images.subscriptionPopupIconDetails,
    Images.subscriptionPopupIconDetailsDark,
    Images.subscriptionPopupIconFeed,
    Images.subscriptionPopupIconFeedDark,
    Images.subscriptionPopupIconSoundGallery,
    Images.subscriptionPopupIconSoundGalleryDark,
    Images.subscriptionPopupIconSoundIdentification,
    Images.subscriptionPopupIconSoundIdentificationDark,
    Images.subscriptionPopupIconBirdOfDay,
    Images.subscriptionPopupIconBirdOfDayDark,
    Images.subscriptionPopupIconAiChat,
    Images.subscriptionPopupIconAiChatDark,
    Images.collectionAltBgLight,
    Images.collectionAltBgDark,
    Images.collectionBgDark,
    Images.splashBgLight,
    Images.splashBgDark,
    Images.splashDark,
    Images.discountCountdownStickyBgDark,
    Images.bottomTabHome,
    Images.bottomTabCatalogue,
    Images.bottomTabIdentify,
    Images.bottomTabIdentifyDark,
    Images.bottomTabCollection,
    Images.bottomTabFeed,
  ];

  prefetchBundledSources(sources);
}
