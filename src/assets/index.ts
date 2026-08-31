/**
 * Assets exports
 * Mushroom WebP assets live under src/assets/ (askai, home, popUp/mushroom, etc.).
 * Prefer .webp requires where a WebP file exists (iOS decodes via SDWebImageWebPCoder).
 */

import { IDENTIFICATION_TIP_LIGHT_IMAGES } from "./identificationTipImages";

// Splash/Background — Images.splashBgLight/Dark, Images.splashDark

// Subscription Background - SVG (no PNG equivalents in assets)
export { default as SubscriptionBackground } from "./subscription/background/light/subscription_bg.svg";
export { default as SubscriptionBackgroundDark } from "./subscription/background/dark/subscription_bg.png";

// SVG / banner exports (mushroom WebP where noted)
export { default as PlantCardsSvg } from "./onboarding/light/background_1.webp";
export { default as SpeciesSvg } from "./home/species_of_day.webp";
export { default as PlantScanSvg } from "./home/identify.webp";

export { default as AiBannerSvg } from "./home/ask_ai.webp";
export { default as AiBannerFullSvg } from "./home/ask_ai.webp";
export { default as DiscountBannerSvg } from "./home/images/banner/light/discount_banner.webp";
export { default as DiscountBannerDarkSvg } from "./home/images/banner/dark/discount_banner.png";
export { default as MushroomOfTheDayBannerSvg } from "./home/species_of_day.webp";
export { default as MushroomOfTheDayBannerDarkSvg } from "./home/popup/mushroom/dark/mushroom_of_the_day_header.webp";
export { default as MushroomOfTheDayBgSvg } from "./home/popup/mushroom/light/mushroom_of_the_day.webp";
/** @deprecated Use MushroomOfTheDayBannerSvg */
export { default as BirdOfTheDayBannerSvg } from "./home/species_of_day.webp";
/** @deprecated Use MushroomOfTheDayBannerDarkSvg */
export { default as BirdOfTheDayBannerDarkSvg } from "./home/popup/mushroom/dark/mushroom_of_the_day_header.webp";
/** @deprecated Use MushroomOfTheDayBgSvg */
export { default as BirdOfTheDayBgSvg } from "./home/popup/mushroom/light/mushroom_of_the_day.webp";
export { default as Banner1Svg } from "./home/images/banner/light/identify_banner.webp";
export { default as Banner1DarkSvg } from "./home/images/banner/dark/identify_banner.png";
export { default as Banner2Svg } from "./home/images/banner/light/identify_banner.webp";
export { default as Banner2DarkSvg } from "./home/images/banner/dark/discount_banner.png";

export { IDENTIFICATION_TIP_LIGHT_IMAGES, IDENTIFICATION_TIP_LIGHT_IMAGE_LIST } from "./identificationTipImages";
export { default as CatalogueVolumeIcon } from "./catalogue/icons/volume_high.svg";
export { default as BirdSizeScaleGraphic } from "./collection/details/bird/size_scale.svg";
export { default as IdentifyTabIcon } from "./common/bottomTab/identification.svg";
export { default as HomeTabIcon } from "./common/bottomTab/home.svg";
export { default as CatalogueTabIcon } from "./common/bottomTab/catalogue.svg";
export { default as FeedTabIcon } from "./common/bottomTab/feed.svg";
export { default as CollectionTabIcon } from "./common/bottomTab/collection.svg";
export { default as ExploreHotspotIcon } from "./home/explore_hotspot.svg";
export { default as ExplorePinIcon } from "./home/explore_pin.svg";
export { default as SoundLibraryFilterIcon } from "./discovery/icons/filter.svg";
export { default as SoundLibraryPlayIcon } from "./discovery/icons/play.svg";
export { default as SoundLibraryEditIcon } from "./discovery/icons/edit.svg";
export { default as SoundLibraryDeleteIcon } from "./discovery/icons/delete.svg";
export { default as WizardMapPinIcon } from "./discovery/wizard/map_pin.svg";
export { default as WizardCurrentLocationIcon } from "./discovery/wizard/current_location.svg";
export { default as WizardClockIcon } from "./discovery/wizard/clock.svg";
export { default as CreatePlusIcon } from "./common/icons/create_plus.svg";
export { default as UploadIconSvg } from "./common/icons/upload.svg";
export { default as AskAiCameraIconSvg } from "./askai/icons/camera.svg";
export { default as AskAiSendIconSvg } from "./askai/icons/send.svg";
export { default as CancelIconLight } from "./common/icons/cancel.svg";
export { default as CancelIconDark } from "./common/icons/cancel_dark.svg";

export { default as NotificationFeed } from "./common/icons/notification.svg";
export { default as NotificationFeedDark } from "./common/icons/notification_dark.svg";
export { default as RateMatchSad01Light } from "./collection/details/rateMatch/light/sad_01.svg";
export { default as RateMatchSad01Dark } from "./collection/details/rateMatch/dark/sad_01.svg";
export { default as RateMatchSad02Light } from "./collection/details/rateMatch/light/sad_02.svg";
export { default as RateMatchSad02Dark } from "./collection/details/rateMatch/dark/sad_02.svg";
export { default as RateMatchFlushedLight } from "./collection/details/rateMatch/light/flushed.svg";
export { default as RateMatchFlushedDark } from "./collection/details/rateMatch/dark/flushed.svg";
export { default as RateMatchHappyLight } from "./collection/details/rateMatch/light/happy.svg";
export { default as RateMatchHappyDark } from "./collection/details/rateMatch/dark/happy.svg";
export { default as RateMatchStarFaceLight } from "./collection/details/rateMatch/light/star_face.svg";
export { default as RateMatchStarFaceDark } from "./collection/details/rateMatch/dark/star_face.svg";

/** Local bundled quiz archetype images keyed by quiz mushroom id. */
export const QUIZ_MUSHROOM_LOCAL_IMAGES = {
  porcini: require("./quiz/which_shroom/porcini.webp"),
  reishi: require("./quiz/which_shroom/reishi.webp"),
  oyster_mushroom: require("./quiz/which_shroom/oyster_mushroom.webp"),
  wild_enoki: require("./quiz/which_shroom/wild_enoki.webp"),
  fly_agaric: require("./quiz/which_shroom/fly_agaric.webp"),
  lions_mane: require("./quiz/which_shroom/lions_mane.webp"),
  morel: require("./quiz/which_shroom/morel.webp"),
  winter_chanterelle: require("./quiz/which_shroom/winter_chanterelle.webp"),
} as const;

export const Images = {
  mushroomSample: require("./catalogue/icons/species/no_mushroom.webp"),
  /** @deprecated Use mushroomSample */
  plantSample: require("./catalogue/icons/species/no_mushroom.webp"),
  /** @deprecated Use mushroomSample */
  mineralSample: require("./catalogue/icons/species/no_mushroom.webp"),
  plantCardsDark: require("./onboarding/dark/background_1.webp"),
  /** @deprecated Use mushroomCardsDark */
  mineralCardsDark: require("./onboarding/dark/background_1.webp"),
  /** @deprecated Use mushroomCardsLight */
  mineralCardsLight: require("./onboarding/light/background_2.webp"),
  speciesDark: require("./home/species_of_day.webp"),
  /** @deprecated Use speciesDark */
  mineralsDark: require("./home/species_of_day.webp"),
  /** @deprecated Use speciesLight */
  mineralsLight: require("./home/species_of_day.webp"),
  diagnoseAi: require("./home/identify.webp"),
  authIdentifyIllustration: require("./home/identify.webp"),
  authBgLight: require("./onboarding/post_auth/light/background.webp"),
  authBgDark: require("./branding/splash/background/dark/auth_bg.webp"),
  authScreenBg: require("./onboarding/light/auth.webp"),

  appIcon: require("./branding/app-icon/app_icon.webp"),

  onboardingBg1: require("./onboarding/light/background_1.webp"),
  onboardingBg2: require("./onboarding/light/background_2.webp"),
  onboardingBg3: require("./onboarding/light/background_3.webp"),
  onboardingBg4: require("./onboarding/light/background_4.webp"),
  onboardingBg5: require("./onboarding/light/background_5.webp"),
  onboardingBg1Dark: require("./onboarding/dark/background_1.webp"),
  onboardingBg2Dark: require("./onboarding/dark/background_2.webp"),
  onboardingBg3Dark: require("./onboarding/dark/background_3.webp"),
  onboardingBg4Dark: require("./onboarding/dark/background_4.webp"),
  onboardingBg5Dark: require("./onboarding/dark/background_5.webp"),
  /** Pre-onboarding / app splash — 1500×3248 */
  onboardingSplash: require("./onboarding/light/splash.webp"),

  subscription: require("./subscription/subscription.png"),
  subscriptionBackgroundDark: require("./subscription/background/dark/subscription_bg.png"),
  subscriptionFailed: require("./catalogue/icons/species/subscription_failed.webp"),
  subscriptionFailedDark: require("./catalogue/icons/species/dark/subscription_failed.png"),
  subscriptionDiscountBox: require("./subscription/discount/subscription_gift_icon.png"),
  giftBox: require("./subscription/discount/subscription_gift_icon.png"),
  subscriptionIconIdentification: require("./subscription/carousel/light/identify.webp"),
  subscriptionIconCollection: require("./subscription/carousel/light/collection.webp"),
  subscriptionIconDetails: require("./subscription/carousel/light/detail.webp"),
  subscriptionIconFeed: require("./subscription/carousel/light/feed.webp"),
  subscriptionIconMushroomOfDay: require("./subscription/carousel/light/shroom_of_the_day.webp"),
  subscriptionIconAiChat: require("./subscription/carousel/light/ai.webp"),
  subscriptionIconIdentificationDark: require("./subscription/carousel/dark/identify.webp"),
  subscriptionIconCollectionDark: require("./subscription/carousel/dark/collection.webp"),
  subscriptionIconDetailsDark: require("./subscription/carousel/dark/detail.webp"),
  subscriptionIconFeedDark: require("./subscription/carousel/dark/feed.webp"),
  subscriptionIconMushroomOfDayDark: require("./subscription/carousel/dark/shroom_of_the_day.webp"),
  subscriptionIconAiChatDark: require("./subscription/carousel/dark/ai.webp"),
  /** Subscription paywall / post-auth feature carousel (subs_0…subs_5 PNGs). */
  subscriptionCarousel0: require("./subscription/carousel_png/subs_0.png"),
  subscriptionCarousel1: require("./subscription/carousel_png/subs_1.png"),
  subscriptionCarousel2: require("./subscription/carousel_png/subs_2.png"),
  subscriptionCarousel3: require("./subscription/carousel_png/subs_3.png"),
  subscriptionCarousel4: require("./subscription/carousel_png/subs_4.png"),
  subscriptionCarousel5: require("./subscription/carousel_png/subs_5.png"),
  subscriptionCarousel0Dark: require("./subscription/carousel_png/subs_0.png"),
  subscriptionCarousel1Dark: require("./subscription/carousel_png/subs_1.png"),
  subscriptionCarousel2Dark: require("./subscription/carousel_png/subs_2.png"),
  subscriptionCarousel3Dark: require("./subscription/carousel_png/subs_3.png"),
  subscriptionCarousel4Dark: require("./subscription/carousel_png/subs_4.png"),
  subscriptionCarousel5Dark: require("./subscription/carousel_png/subs_5.png"),

  subscriptionListIdentification: require("./subscription/list/light/1.webp"),
  subscriptionListCollection: require("./subscription/list/light/2.webp"),
  subscriptionListDetails: require("./subscription/list/light/3.webp"),
  subscriptionListFeed: require("./subscription/list/light/4.webp"),
  subscriptionListMushroomOfDay: require("./subscription/list/light/5.webp"),
  subscriptionListAiChat: require("./subscription/list/light/6.webp"),
  subscriptionListIdentificationDark: require("./subscription/list/dark/1.webp"),
  subscriptionListCollectionDark: require("./subscription/list/dark/2.webp"),
  subscriptionListDetailsDark: require("./subscription/list/dark/3.webp"),
  subscriptionListFeedDark: require("./subscription/list/dark/4.webp"),
  subscriptionListMushroomOfDayDark: require("./subscription/list/dark/5.webp"),
  subscriptionListAiChatDark: require("./subscription/list/dark/6.webp"),

  modalNotification: require("./common/modal/notification.png"),
  mushroomTrash: require("./catalogue/icons/species/trash.webp"),
  discountTimer: require("./catalogue/icons/species/discount_timer.webp"),
  mushroomLocation: require("./catalogue/icons/species/location.webp"),
  mushroomLocationDark: require("./catalogue/icons/species/dark/location.webp"),
  locationPost: require("./catalogue/icons/species/location_post.webp"),
  mushroomCapturePopup: require("./catalogue/icons/species/capture_popup.webp"),
  microphonePopup: require("./common/icons/microphone.png"),
  identifyMethodPopup: require("./common/icons/identify_option_icon.png"),
  askAiScan: require("./askai/scan.webp"),
  mushroomLocationLock: require("./catalogue/icons/species/location_lock.webp"),
  mushroomSetting: require("./catalogue/icons/species/setting.webp"),
  mushroomSettingDark: require("./catalogue/icons/species/dark/setting.webp"),
  mushroomStayUpdated: require("./catalogue/icons/species/stay_updated.webp"),
  mushroomIdentificationDisclaimer: require("./catalogue/icons/species/identification_disclaimer.png"),
  mushroomIdentificationDisclaimerDark: require("./common/iconfix/disclaimer_dark.png"),

  avatarHome: require("./home/avatar.png"),
  avatarCover: require("./home/avatar_cover.png"),

  socialApple: require("./common/social/apple.webp"),
  socialAppleDark: require("./common/social/apple_dark.png"),
  socialFacebook: require("./common/social/facebook.webp"),
  socialGoogle: require("./common/social/google.webp"),
  socialEmail: require("./catalogue/icons/species/email.png"),

  aiChatCenterImage: require("./askai/find_mushroom_center_image.webp"),
  aiChatIcon: require("./askai/chat_avatar.webp"),
  aiChatSend: require("./askai/send.png"),

  emptyCatalogue: require("./catalogue/icons/species/no_mushroom.webp"),
  noCatalogue: require("./catalogue/icons/species/no_catalogue.png"),
  emptyCatalogueLight: require("./catalogue/icons/empty_catalogue_lights.webp"),
  emptyCatalogueDark: require("./catalogue/icons/empty_catalogue_darks.webp"),
  emptyCollection: require("./catalogue/icons/species/no_collection.webp"),
  emptyCollectionLight: require("./collection/icons/empty_collection_light.webp"),
  emptyCollectionDark: require("./collection/icons/empty_collection_dark.webp"),
  emptySearch: require("./catalogue/icons/empty_catalogue_lights.webp"),
  emptySearchDark: require("./catalogue/icons/empty_catalogue_darks.webp"),
  emptyResult: require("./common/emptystate/empty_result.png"),
  /** Catalogue — no results after applying filters (folder + magnifying glass) */
  emptyFilter: require("./common/emptystate/empty_search.png"),
  /** Catalogue / search — no results (Figma: magnifying glass + documents) */
  catalogueNoResults: require("./catalogue/icons/species/search.webp"),
  emptyFeed: require("./catalogue/icons/species/no_post.webp"),
  popupFeed: require("./feed/popup_feed.png"),

  feedLight: require("./feed/feed_my_posts.webp"),
  feedDark: require("./feed/dark/feed_my_posts.png"),
  feedLike: require("./feed/thumbs_up_not_selected.png"),
  feedLikeSelected: require("./feed/thumbs_selected.png"),
  feedLikeDark: require("./feed/thumbs_up_dark.png"),
  feedLikeSelectedDark: require("./feed/thumbs_up_selected_dark.png"),
  feedComment: require("./feed/comment.png"),
  feedCommentDark: require("./feed/comment_dark.png"),
  feedShare: require("./feed/share.png"),
  feedShareDark: require("./feed/share_dark.png"),

  arrowDown: require("./onboarding/auth/light/icons/arrow_down.png"),
  arrowDownLight: require("./onboarding/auth/light/icons/arrow_down.png"),
  arrowDownDark: require("./home/popup/icons/arrow_down_dark.png"),

  mushroomPersonalityImage: require("./askai/find_mushroom_center_image.webp"),
  uploadIconDark: require("./common/iconfix/upload_dark.png"),

  /** Mushroom card wishlist stars — iconfix/home (catalogue, collection, top matches). */
  mushroomWishlistStar: require("./common/iconfix/home/star.png"),
  mushroomWishlistStarFilled: require("./common/iconfix/home/star_filled.png"),
  starFilled: require("./common/iconfix/home/star_filled.png"),
  starUnfilled: require("./common/iconfix/home/star.png"),
  starFilledLight: require("./common/iconfix/home/star_filled.png"),
  starUnfilledLight: require("./common/iconfix/home/star.png"),
  starFilledDark: require("./common/iconfix/home/star_filled.png"),
  starUnfilledDark: require("./common/iconfix/home/star.png"),
  star: require("./common/iconfix/home/star.png"),
  starRateFilled: require("./catalogue/icons/species/star_rate_filled.webp"),
  starRateUnfilled: require("./catalogue/icons/species/star_rate_unfilled.webp"),

  banner1: require("./home/images/banner/light/identify_banner.webp"),
  banner1Dark: require("./home/images/banner/dark/identify_banner.png"),

  rateUsPopupIllustration: require("./home/popup/mushroom/light/rate_us_popup.webp"),
  rateUsSheetBgLight: require("./home/popup/mushroom/light/rate_us.webp"),
  /** Dark Rate Us + Feedback share the same pop_up sheet art. */
  rateUsSheetBgDark: require("./home/popup/mushroom/dark/pop_up.webp"),
  popUp50Light: require("./home/popup/mushroom/light/pop_up.webp"),
  popUp50Dark: require("./home/popup/mushroom/dark/pop_up.webp"),
  popUp70Light: require("./home/popup/mushroom/light/subs_offer_bg.webp"),
  popUp70Dark: require("./subscription/background/dark/popup_70.png"),

  subscriptionPopup50Light: require("./home/popup/mushroom/light/subs_pop_org.webp"),
  subscriptionPopup50Dark: require("./home/popup/mushroom/dark/pop_up.webp"),
  subscriptionPopup70Light: require("./home/popup/mushroom/light/subs_offer_bg.webp"),
  subscriptionPopup70Dark: require("./subscription/background/dark/popup_70.png"),

  /** Limit-reached upgrade sheet — full popUp/mushroom artwork (bg + illustration). */
  subscriptionPopupIconCollection: require("./home/popup/mushroom/light/collection.webp"),
  subscriptionPopupIconCollectionDark: require("./home/popup/mushroom/dark/collection.webp"),
  subscriptionPopupIconIdentification: require("./home/popup/mushroom/light/identify_popup_bg.webp"),
  subscriptionPopupIconIdentificationDark: require("./home/popup/mushroom/dark/identify_popup_bg.webp"),
  subscriptionPopupIconDetails: require("./home/popup/mushroom/light/detail.webp"),
  subscriptionPopupIconDetailsDark: require("./home/popup/mushroom/dark/detail.webp"),
  subscriptionPopupIconFeed: require("./home/popup/mushroom/light/feed_popup_bg.png"),
  subscriptionPopupIconFeedDark: require("./home/popup/mushroom/dark/feed_popup_bg.png"),
  /** Sound library storage limit — upgrade sheet hero art. */
  subscriptionPopupIconSoundGallery: require("./home/popup/mushroom/light/sound_popup_bg.webp"),
  subscriptionPopupIconSoundGalleryDark: require("./home/popup/mushroom/dark/sound_popup_bg.webp"),
  /** Daily sound ID limit — upgrade sheet hero art. */
  subscriptionPopupIconSoundIdentification: require("./home/popup/mushroom/light/sound_identify_popup_bg.webp"),
  subscriptionPopupIconSoundIdentificationDark: require("./home/popup/mushroom/dark/sound_identify_popup_bg.webp"),
  subscriptionPopupIconMushroomOfDay: require("./home/popup/mushroom/light/bird_of_the_day_popup.webp"),
  subscriptionPopupIconMushroomOfDayDark: require("./home/popup/mushroom/dark/mushroom_of_the_day.webp"),
  subscriptionPopupIconAiChat: require("./home/popup/mushroom/light/chat_popup_bg.webp"),
  subscriptionPopupIconAiChatDark: require("./home/popup/mushroom/dark/chat_popup_bg.webp"),

  bannerLight: require("./home/images/banner/light/discount_banner.webp"),
  bannerDark: require("./home/images/banner/dark/discount_banner.png"),
  discountCountdownStickyBgDark: require("./home/images/banner/dark/discount_countdown_sticky_bg.png"),

  mushroomGift: require("./home/species_of_day.webp"),
  mushroomGiftDark: require("./home/species_of_day.webp"),
  homeGiftBox: require("./subscription/discount/subscription_gift_icon.png"),
  homeDiscountStickyNest: require("./home/discount_sticky_banner_nest.png"),
  homeDiscountBannerBird: require("./home/discount_banner_bird.png"),
  /** Figma 8975:41033 — full light banner (gradient + bird), 335×160 */
  homeDiscountBannerLight: require("./home/images/banner/light/discount_banner_figma.png"),

  trashLight: require("./catalogue/icons/species/trash.webp"),
  trashDark: require("./catalogue/icons/species/dark/trash.webp"),
  detailPinned: require("./collection/details/pinned.png"),
  detailOverview: require("./collection/details/overview.png"),
  detailLeftArrow: require("./collection/details/left_arrow.png"),
  detailLeftArrowLight: require("./collection/details/left_arrow_light.png"),
  locationEdit: require("./collection/details/location_edit.png"),
  tabBatch: require("./collection/details/overview.png"),
  card_image_placeholder: require("./collection/details/card_image_placeholder.webp"),

  goPro: require("./home/go_pro_home.png"),
  goProDark: require("./home/go_pro_home.png"),
  youArePro: require("./home/you_are_pro.png"),
  fullSubsBanner: require("./home/images/banner/light/full_subs_banner.png"),
  recordingLimitReachedBanner: require("./home/popup/recording_limit_reached_banner.png"),
  splashBird: require("./branding/splash/splash_bird.png"),
  noSound: require("./catalogue/icons/no_sound.png"),
  soundLibraryEmptyBird: require("./discovery/sound_library_empty_bird.png"),
  /** Shared full-screen background — subs, feed, post-auth onboarding, Ask AI, Find Your Bird */
  commonBg: require("./home/common_bg.webp"),

  navGoBack: require("./common/navigation/go_back.png"),
  navCancel: require("./common/navigation/cancel.png"),

  splashBgLight: require("./branding/splash/background/light/splash_background.webp"),
  splashBgDark: require("./branding/splash/background/dark/splash_background.webp"),
  splashDark: require("./branding/splash/background/dark/splash.webp"),

  analysisBg: require("./askai/ask_ai_bg.webp"),
  newOnboardBgLight: require("./onboarding/post_auth/light/background.webp"),
  newOnboardBgDark: require("./onboarding/post_auth/dark/background.webp"),
  onboardingNotification: require("./onboarding/post_auth/light/notification.webp"),
  onboardingNotificationDark: require("./onboarding/post_auth/light/notification.webp"),
  onboardingGift: require("./onboarding/post_auth/light/gift.webp"),
  onboardingGiftDark: require("./onboarding/post_auth/light/gift.webp"),
  onboarding50Percent: require("./onboarding/post_auth/light/50_off.webp"),
  onboarding50PercentDark: require("./onboarding/post_auth/light/50_off.webp"),
  analyseAi: require("./askai/ask_ai_bg.webp"),
  analyseAiDark: require("./askai/dark/ask_ai_bg.webp"),
  whichMushroomAreYouBg: require("./askai/which_mushroom_are_you_bg.png"),
  findYourMushroomBg: require("./askai/find_your_mushroom_bg.png"),
  identifyBg: require("./identification/light/identification_bg.webp"),
  identifyBgDark: require("./identification/dark/identification_bg.webp"),
  whichMushroomLightBg: require("./askai/which_shroom_result_bg.png"),
  whichMushroomDarkBg: require("./askai/dark/which_mushroom_are_you_bg.webp"),
  findYourMushroomBgDark: require("./askai/dark/find_your_mushroom_bg.png"),
  collectionBgLight: require("./home/popup/mushroom/light/collection.webp"),
  collectionBgDark: require("./home/popup/mushroom/dark/collection.webp"),
  collectionAltBgLight: require("./home/popup/mushroom/light/collection_1.webp"),
  collectionAltBgDark: require("./home/popup/mushroom/dark/collection_1.webp"),

  cameraIcon: require("./home/identify.webp"),
  askAiCaptureMushroom: require("./askai/capture_mushroom.png"),
  findYourMushCamera: require("./askai/find_mush_camera.png"),
  askAiUploadMushroom: require("./askai/upload_mushroom.png"),

  bottomTabHome: require("./common/bottomTab/home.png"),
  bottomTabCatalogue: require("./common/bottomTab/catalogue.png"),
  bottomTabIdentify: require("./common/bottomTab/identification_dark.webp"),
  bottomTabIdentifyDark: require("./common/bottomTab/identification_dark.webp"),
  bottomTabCollection: require("./common/bottomTab/collections_bookmark.png"),
  bottomTabFeed: require("./common/bottomTab/feed.png"),

  authError1: IDENTIFICATION_TIP_LIGHT_IMAGES.tooDark,
  authError2: IDENTIFICATION_TIP_LIGHT_IMAGES.tooBright,
  authError3: IDENTIFICATION_TIP_LIGHT_IMAGES.blurry,
  authError4: IDENTIFICATION_TIP_LIGHT_IMAGES.tooFar,

  identificationTipTooDark: IDENTIFICATION_TIP_LIGHT_IMAGES.tooDark,
  identificationTipTooBright: IDENTIFICATION_TIP_LIGHT_IMAGES.tooBright,
  identificationTipBlurry: IDENTIFICATION_TIP_LIGHT_IMAGES.blurry,
  identificationTipTooFar: IDENTIFICATION_TIP_LIGHT_IMAGES.tooFar,
  identificationTipBirdTooSmall: IDENTIFICATION_TIP_LIGHT_IMAGES.birdTooSmall,
  identificationTipBirdMedium: IDENTIFICATION_TIP_LIGHT_IMAGES.birdMedium,
  identificationTipBirdGoodSize: IDENTIFICATION_TIP_LIGHT_IMAGES.birdGoodSize,
  identificationTipBirdTooClose: IDENTIFICATION_TIP_LIGHT_IMAGES.birdTooClose,
  identificationPopupIcon: require("./identification/light/identification_popup_icon.webp"),
  /** Alert icon for camera identification tips — light art in all themes */
  identificationAlertIcon: IDENTIFICATION_TIP_LIGHT_IMAGES.alertIcon,

  authListDark: require("./home/find_species.webp"),

  closeSheet: require("./common/iconfix/close_sheet.png"),
  closeSheetDark: require("./common/iconfix/close_sheet_dark.png"),
  closePopup: require("./common/iconfix/close_popup.png"),
  closePopupDark: require("./common/iconfix/close_popup_dark.png"),
  aiScanError: require("./identification/light/scan_error.webp"),
  aiScanErrorDark: require("./identification/light/scan_error.webp"),
  searchHome: require("./common/iconfix/search_home.png"),
  searchHomeDark: require("./common/iconfix/search_home_dark.png"),
  informationCircle: require("./common/iconfix/information_circle.png"),
  rateUsSent: require("./common/iconfix/rate_us_sent.png"),
  addCollectionLight: require("./common/iconfix/add_collection_light.png"),
  addCollectionDark: require("./common/iconfix/add_collection_dark.png"),
  iconfixInfo: require("./common/iconfix/info.png"),
  iconfixUpload: require("./common/iconfix/upload.png"),
  iconfixUploadDark: require("./common/iconfix/upload_dark.png"),
  iconfixCameraRepeat: require("./identification/camera/light/repeat.webp"),
  iconfixFlash: require("./identification/camera/light/flash.png"),
  iconfixFlashOff: require("./common/iconfix/flash_off.png"),
  iconfixCamera: require("./common/iconfix/camera.webp"),
  iconfixCameraDark: require("./common/iconfix/camera_dark.webp"),
  alertCameraIcon: require("./common/iconfix/alert_camera.webp"),
  iconEdit: require("./common/iconfix/edit.webp"),
  iconSave: require("./common/iconfix/save.webp"),
  iconMove: require("./common/iconfix/move.webp"),
  soundPlay: require("./common/iconfix/sound/play.webp"),
  soundSpectrogram: require("./camera/sound/spectrogram.png"),
  soundListeningSpinner: require("./camera/sound/listening_spinner.png"),
  soundIdentifyHero: require("./camera/sound/identify_by_sound_hero.png"),
  soundPause: require("./common/icons/pause_sound.png"),
  soundRecord: require("./common/iconfix/sound/record.webp"),
  soundRecordStop: require("./common/iconfix/sound/record_stop.webp"),
  soundVolumeHigh: require("./common/iconfix/sound/volume_high.webp"),
  soundRecordCta: require("./collection/details/sound/record_cta.webp"),
  soundDetailsIcon: require("./collection/details/sound/sound_details.webp"),
  plusIcon: require("./common/iconfix/plus_icon.png"),
  uploadFeed: require("./common/iconfix/upload_feed.png"),
  uploadFeedDark: require("./common/iconfix/upload_feed_dark.png"),
  /** Permission sheets — full-bleed art (same approach as upgrade/limit-reached). */
  popupNotificationPermissionBg: require("./home/popup/mushroom/light/notification_permission_bg.webp"),
  popupNotificationPermissionBgDark: require("./home/popup/mushroom/dark/notification_permission_bg.webp"),
  popupLocationPermissionBg: require("./home/popup/mushroom/light/location_permission_bg.webp"),
  popupLocationPermissionBgDark: require("./home/popup/mushroom/dark/location_permission_bg.webp"),
  popupCongratulationsBg: require("./home/popup/mushroom/light/congratulations_bg.webp"),
  popupCongratulationsBgDark: require("./home/popup/mushroom/dark/congratulations_bg.webp"),
  popupStoragePermissionBg: require("./home/popup/mushroom/light/storage_permission_bg.webp"),
  popupStoragePermissionBgDark: require("./home/popup/mushroom/dark/storage_permission_bg.webp"),

  mushroomEdible: require("./collection/details/mushroom/edible.webp"),
  mushroomInedible: require("./collection/details/mushroom/inedible.webp"),
  mushroomToxic: require("./collection/details/mushroom/toxic.webp"),
  mushroomPsychoactive: require("./collection/details/mushroom/psychoactive.webp"),
  mushroomGoPro: require("./collection/details/mushroom/go_pro.webp"),
  mushroomSubsToPremium: require("./collection/details/mushroom/subs_to_premium.webp"),
  mushroomBlurredLocation: require("./collection/details/mushroom/blurred_location.webp"),
  mushroomToday: require("./home/popup/mushroom/light/bird_of_the_day_popup.webp"),
  mushroomTodayDark: require("./home/popup/mushroom/dark/mushroom_of_the_day_header.webp"),
  mushroomOfTheDayPopupBg: require("./home/popup/mushroom/light/mushroom_of_the_day.webp"),
  mushroomOfTheDayPopupBgDark: require("./home/popup/mushroom/dark/mushroom_of_the_day.webp"),
  mushroomGlowingStar: require("./home/glowing_star.webp"),
  mushroomOuterCard: require("./home/outer_card.webp"),
  homeFindShrooms: require("./home/find_species.webp"),
  homeFindShroomsDark: require("./home/dark/find_species.png"),
  homeAskAiCard: require("./home/ask_ai.webp"),
  homeAskAiCardDark: require("./home/dark/ask_ai.png"),
  homeMushroomOfDay: require("./home/species_of_day.webp"),
  homeMushroomOfDayDark: require("./home/dark/species_of_day.png"),
  homeIdentifyBanner: require("./home/images/banner/light/identify_banner.webp"),
  homeIdentifyBannerDark: require("./home/images/banner/dark/identify_banner.png"),
  homeIdentifyBySound: require("./home/identify_by_sound_inner.png"),
  homeIdentifyByPhoto: require("./home/identify_by_photo_inner.png"),
  homeWizardBanner: require("./home/wizard_banner.png"),
  wizardFindYourBird: require("./discovery/wizard/find_your_bird.png"),
  homeExploreNearYouMap: require("./home/explore_near_you_map.png"),
  homeExploreNearYouBanner: require("./home/explore_near_you_banner.png"),
  homeBirdOfDayCard: require("./home/bird_of_the_day_home.webp"),
  homeAskAiCardIcon: require("./home/ask_ai_home.webp"),
  homeBirdSoundLibrary: require("./home/bird_sound_home.webp"),
  iconGlobalSearch: require("./catalogue/icons/species/global_search.webp"),
  passwordEye: require("./catalogue/icons/species/eye.webp"),
  passwordEyeOff: require("./catalogue/icons/species/eye_off.webp"),
  filterIcon: require("./catalogue/icons/species/filter.png"),
};

/** Standard render size for back-navigation arrows (wrapper + hit target). */
export const NAV_BACK_ICON_SIZE = 20;
/** Auth flows — Figma back arrow (160px asset). */
export const AUTH_NAV_BACK_ICON_SIZE = 22;
/** Auth password fields — Figma visibility toggle (96px asset). */
export const PASSWORD_VISIBILITY_ICON_SIZE = 24;

export { default as DetailsMoreAddStarLight } from "./common/iconfix/details_more/light/add_star.svg";
export { default as DetailsMoreAddStarDark } from "./common/iconfix/details_more/dark/add_star.svg";
export { default as DetailsMoreRemoveStarLight } from "./common/iconfix/details_more/light/remove_star.svg";
export { default as DetailsMoreRemoveStarDark } from "./common/iconfix/details_more/dark/remove_star.svg";
export { default as DetailsMoreShareLight } from "./common/iconfix/details_more/light/share.svg";
export { default as DetailsMoreShareDark } from "./common/iconfix/details_more/dark/share.svg";
export { default as DetailsMoreEditLight } from "./common/iconfix/details_more/light/edit.svg";
export { default as DetailsMoreEditDark } from "./common/iconfix/details_more/dark/edit.svg";
export { default as DetailsMoreReportLight } from "./common/iconfix/details_more/light/report.svg";
export { default as DetailsMoreReportDark } from "./common/iconfix/details_more/dark/report.svg";
export { default as DetailsMoreRemoveLight } from "./common/iconfix/details_more/light/remove.svg";
export { default as DetailsMoreRemoveDark } from "./common/iconfix/details_more/dark/remove.svg";
export { default as DualLineSvg } from "./common/iconfix/dual_line.svg";
