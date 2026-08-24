#!/usr/bin/env node
/**
 * Copy Birdzy art from /icons into src/assets, update index.ts requires,
 * remove consumed root icons, and emit docs/icon-migration-map.json.
 *
 * Home screen assets are intentionally skipped (see HOME_SKIP).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ICONS = path.join(ROOT, "icons");
const ASSETS = path.join(ROOT, "src/assets");
const INDEX = path.join(ASSETS, "index.ts");
const MAP_OUT = path.join(ROOT, "docs/icon-migration-map.json");

/** Root filenames kept for home screen — not migrated (empty: all home art migrated). */
const HOME_SKIP = new Set<string>([]);

/** Root filenames with no clear in-app target yet. */
const UNMATCHED: string[] = [];

/** [rootIcon, assetRelPath, imagesKey?, alsoDarkPath?] */
const COPIES = [
  // Onboarding (light)
  ["Onboarding_1.webp", "onboarding/light/background_1.webp", "onboardingBg1"],
  ["Onboarding_2.webp", "onboarding/light/background_2.webp", "onboardingBg2"],
  ["Onboarding_3.webp", "onboarding/light/background_3.webp", "onboardingBg3"],
  ["Onboarding_4.webp", "onboarding/light/background_4.webp", "onboardingBg4"],
  ["Onboarding.webp", "onboarding/light/background_5.webp", "onboardingBg5"],

  // Post-auth onboarding
  ["Gift_post_onboard.webp", "onboarding/post_auth/light/gift.webp", "onboardingGift"],
  ["postonboarding_notification.webp", "onboarding/post_auth/light/notification.webp", "onboardingNotification"],

  // Auth / branding
  ["auth_bg.webp", "branding/splash/background/dark/auth_bg.webp", "authBgDark"],

  // Identification camera / tips
  ["identification.webp", "identification/light/identification_bg.webp", "identifyBg"],
  ["blurry.webp", "identification/light/blurry.webp", "identificationTipBlurry"],
  ["too_bright.webp", "identification/light/too_bright.webp", "identificationTipTooBright"],
  ["too_dark.webp", "identification/light/too_dark.webp", "identificationTipTooDark"],
  ["too_far.webp", "identification/light/too_far.webp", "identificationTipTooFar"],
  ["tip_alert.webp", "identification/light/bell.webp", "identificationAlertIcon"],

  // Ask AI / scan
  ["analyse_snanner_view_bg.webp", "askai/ask_ai_bg.webp", "analyseAi"],
  ["Scan.webp", "askai/scan.webp", "askAiScan"],

  // Common UI icons
  ["camera_icon.webp", "common/iconfix/camera.webp", "iconfixCamera"],
  ["trash.webp", "catalogue/icons/species/trash.webp", "trashLight"],
  ["Setting.webp", "catalogue/icons/species/setting.webp", "mushroomSetting"],
  ["location_icon.webp", "catalogue/icons/species/location.webp", "mushroomLocation"],
  ["post_onboardng_location.webp", "catalogue/icons/species/location_post.webp", "locationPost"],

  // Empty states
  ["empty_catalogue.webp", "catalogue/icons/empty_catalogue_lights.webp", "emptyCatalogueLight"],
  ["empty_catalogue.webp", "catalogue/icons/empty_catalogue_darks.webp", "emptyCatalogueDark"],
  ["empty_inside_collection.webp", "catalogue/icons/species/no_collection.webp", "emptyCollection"],
  ["empty_collection_outside.webp", "collection/icons/empty_collection_light.webp", "emptyCollectionLight"],
  ["empty_collection_outside.webp", "collection/icons/empty_collection_dark.webp", "emptyCollectionDark"],
  ["no_post.webp", "catalogue/icons/species/no_post.webp", "emptyFeed"],

  // Collection details
  ["colelction_placeholder.webp", "collection/details/card_image_placeholder.webp", "card_image_placeholder"],
  ["subs_to_premium.webp", "collection/details/mushroom/subs_to_premium.webp", "mushroomSubsToPremium"],

  // Subscription list 1–6
  ["subs_1.webp", "subscription/list/light/1.webp", "subscriptionListIdentification"],
  ["subs_2.webp", "subscription/list/light/2.webp", "subscriptionListCollection"],
  ["subs_3.webp", "subscription/list/light/3.webp", "subscriptionListDetails"],
  ["subs_4.webp", "subscription/list/light/4.webp", "subscriptionListFeed"],
  ["subs_5.webp", "subscription/list/light/5.webp", "subscriptionListMushroomOfDay"],
  ["subs_6.webp", "subscription/list/light/6.webp", "subscriptionListAiChat"],

  // Subscription carousel (post-auth promo)
  ["identify_popup.webp", "subscription/carousel/light/identify.webp", "subscriptionIconIdentification"],
  ["collection_popup.webp", "subscription/carousel/light/collection.webp", "subscriptionIconCollection"],
  ["detail.webp", "subscription/carousel/light/detail.webp", "subscriptionIconDetails"],
  ["subs_0.webp", "subscription/carousel/light/shroom_of_the_day.webp", "subscriptionIconMushroomOfDay"],
  ["ask_ai_popup.webp", "subscription/carousel/light/ai.webp", "subscriptionIconAiChat"],
  ["subs_4.webp", "subscription/carousel/light/feed.webp", "subscriptionIconFeed"],

  // Popups / permission sheets (non-home)
  ["Congratulation_popup.webp", "home/popup/mushroom/light/congratulations_bg.webp", "popupCongratulationsBg"],
  ["location_popup.webp", "home/popup/mushroom/light/location_permission_bg.webp", "popupLocationPermissionBg"],
  ["notification_popup.webp", "home/popup/mushroom/light/notification_permission_bg.webp", "popupNotificationPermissionBg"],
  ["Rate_us_popup.webp", "home/popup/mushroom/light/rate_us_popup.webp", "rateUsPopupIllustration"],
  ["feedback_popup.webp", "home/popup/mushroom/light/rate_us.webp", "rateUsSheetBgLight"],

  // Limit-reached / upgrade sheet heroes
  ["identify_popup.webp", "home/popup/mushroom/light/identify_popup_bg.webp", "subscriptionPopupIconIdentification"],
  ["collection_popup.webp", "home/popup/mushroom/light/collection.webp", "subscriptionPopupIconCollection"],
  ["detail.webp", "home/popup/mushroom/light/detail.webp", "subscriptionPopupIconDetails"],
  ["ask_ai_popup.webp", "home/popup/mushroom/light/chat_popup_bg.webp", "subscriptionPopupIconAiChat"],
  ["collection_2_popup.webp", "home/popup/mushroom/light/collection_1.webp", "collectionAltBgLight"],
  ["subs_0.webp", "home/popup/mushroom/light/bird_of_the_day_popup.webp", "subscriptionPopupIconMushroomOfDay"],
];

/** Mirror light bird art into dark popup/subscription paths (no separate dark exports yet). */
const DARK_MIRRORS = [
  ["home/popup/mushroom/light/congratulations_bg.webp", "home/popup/mushroom/dark/congratulations_bg.webp"],
  ["home/popup/mushroom/light/location_permission_bg.webp", "home/popup/mushroom/dark/location_permission_bg.webp"],
  ["home/popup/mushroom/light/notification_permission_bg.webp", "home/popup/mushroom/dark/notification_permission_bg.webp"],
  ["home/popup/mushroom/light/identify_popup_bg.webp", "home/popup/mushroom/dark/identify_popup_bg.webp"],
  ["home/popup/mushroom/light/collection.webp", "home/popup/mushroom/dark/collection.webp"],
  ["home/popup/mushroom/light/detail.webp", "home/popup/mushroom/dark/detail.webp"],
  ["home/popup/mushroom/light/chat_popup_bg.webp", "home/popup/mushroom/dark/chat_popup_bg.webp"],
  ["home/popup/mushroom/light/bird_of_the_day_popup.webp", "home/popup/mushroom/dark/mushroom_of_the_day.webp"],
  ["catalogue/icons/species/location.webp", "catalogue/icons/species/dark/location.webp"],
  ["catalogue/icons/species/setting.webp", "catalogue/icons/species/dark/setting.webp"],
  ["catalogue/icons/species/trash.webp", "catalogue/icons/species/dark/trash.webp"],
  ["common/iconfix/camera.webp", "common/iconfix/camera_dark.webp"],
  ["askai/ask_ai_bg.webp", "askai/dark/ask_ai_bg.webp"],
  ["identification/light/identification_bg.webp", "identification/dark/identification_bg.webp"],
  ["subscription/list/light/1.webp", "subscription/list/dark/1.webp"],
  ["subscription/list/light/2.webp", "subscription/list/dark/2.webp"],
  ["subscription/list/light/3.webp", "subscription/list/dark/3.webp"],
  ["subscription/list/light/4.webp", "subscription/list/dark/4.webp"],
  ["subscription/list/light/5.webp", "subscription/list/dark/5.webp"],
  ["subscription/list/light/6.webp", "subscription/list/dark/6.webp"],
  ["subscription/carousel/light/identify.webp", "subscription/carousel/dark/identify.webp"],
  ["subscription/carousel/light/collection.webp", "subscription/carousel/dark/collection.webp"],
  ["subscription/carousel/light/detail.webp", "subscription/carousel/dark/detail.webp"],
  ["subscription/carousel/light/shroom_of_the_day.webp", "subscription/carousel/dark/shroom_of_the_day.webp"],
  ["subscription/carousel/light/ai.webp", "subscription/carousel/dark/ai.webp"],
  ["subscription/carousel/light/feed.webp", "subscription/carousel/dark/feed.webp"],
];

/** Old png paths replaced by webp — remove after copy + patch index. */
const DEPRECATED_PNG = [
  "askai/ask_ai_bg.png",
  "catalogue/icons/empty_catalogue_lights.png",
  "catalogue/icons/empty_catalogue_darks.png",
  "catalogue/icons/species/location.png",
  "catalogue/icons/species/location_post.png",
  "catalogue/icons/species/dark/location.png",
  "catalogue/icons/species/dark/setting.png",
  "catalogue/icons/species/dark/trash.png",
  "collection/details/card_image_placeholder.png",
  "collection/icons/empty_collection_light.png",
  "collection/icons/empty_collection_dark.png",
  "common/iconfix/camera.png",
  "common/iconfix/camera_dark.png",
  "home/popup/mushroom/light/congratulations_bg.png",
  "home/popup/mushroom/light/collection.png",
  "home/popup/mushroom/light/detail.png",
  "home/popup/mushroom/light/identify_popup_bg.png",
  "home/popup/mushroom/light/chat_popup_bg.png",
  "home/popup/mushroom/light/location_permission_bg.png",
  "home/popup/mushroom/light/notification_permission_bg.png",
  "home/popup/mushroom/light/rate_us.png",
  "home/popup/mushroom/light/multiple_mushroom.png",
  "identification/dark/identification_bg.png",
  "subscription/list/dark/1.png",
  "subscription/list/dark/2.png",
  "subscription/list/dark/3.png",
  "subscription/list/dark/4.png",
  "subscription/list/dark/5.png",
  "subscription/list/dark/6.png",
  "subscription/carousel/dark/identify.png",
  "subscription/carousel/dark/collection.png",
  "subscription/carousel/dark/detail.png",
  "subscription/carousel/dark/shroom_of_the_day.png",
  "subscription/carousel/dark/ai.png",
  "subscription/carousel/dark/feed.png",
];

/** require() path substitutions in index.ts after migration */
const INDEX_REPLACEMENTS = [
  ['require("./askai/ask_ai_bg.png")', 'require("./askai/ask_ai_bg.webp")'],
  ['require("./catalogue/icons/empty_catalogue_lights.png")', 'require("./catalogue/icons/empty_catalogue_lights.webp")'],
  ['require("./catalogue/icons/empty_catalogue_darks.png")', 'require("./catalogue/icons/empty_catalogue_darks.webp")'],
  ['require("./catalogue/icons/species/location.png")', 'require("./catalogue/icons/species/location.webp")'],
  ['require("./catalogue/icons/species/location_post.png")', 'require("./catalogue/icons/species/location_post.webp")'],
  ['require("./catalogue/icons/species/dark/location.png")', 'require("./catalogue/icons/species/dark/location.webp")'],
  ['require("./catalogue/icons/species/dark/setting.png")', 'require("./catalogue/icons/species/dark/setting.webp")'],
  ['require("./catalogue/icons/species/dark/trash.png")', 'require("./catalogue/icons/species/dark/trash.webp")'],
  ['require("./collection/details/card_image_placeholder.png")', 'require("./collection/details/card_image_placeholder.webp")'],
  ['require("./collection/icons/empty_collection_light.png")', 'require("./collection/icons/empty_collection_light.webp")'],
  ['require("./collection/icons/empty_collection_dark.png")', 'require("./collection/icons/empty_collection_dark.webp")'],
  ['require("./common/iconfix/camera.png")', 'require("./common/iconfix/camera.webp")'],
  ['require("./common/iconfix/camera_dark.png")', 'require("./common/iconfix/camera_dark.webp")'],
  ['require("./identification/dark/identification_bg.png")', 'require("./identification/dark/identification_bg.webp")'],
  ['require("./home/popup/mushroom/light/congratulations_bg.png")', 'require("./home/popup/mushroom/light/congratulations_bg.webp")'],
  ['require("./home/popup/mushroom/light/collection.png")', 'require("./home/popup/mushroom/light/collection.webp")'],
  ['require("./home/popup/mushroom/light/detail.png")', 'require("./home/popup/mushroom/light/detail.webp")'],
  ['require("./home/popup/mushroom/light/identify_popup_bg.png")', 'require("./home/popup/mushroom/light/identify_popup_bg.webp")'],
  ['require("./home/popup/mushroom/light/chat_popup_bg.png")', 'require("./home/popup/mushroom/light/chat_popup_bg.webp")'],
  ['require("./home/popup/mushroom/light/location_permission_bg.png")', 'require("./home/popup/mushroom/light/location_permission_bg.webp")'],
  ['require("./home/popup/mushroom/light/notification_permission_bg.png")', 'require("./home/popup/mushroom/light/notification_permission_bg.webp")'],
  ['require("./home/popup/mushroom/light/rate_us.png")', 'require("./home/popup/mushroom/light/rate_us.webp")'],
  ['require("./home/popup/mushroom/light/multiple_mushroom.png")', 'require("./home/popup/mushroom/light/bird_of_the_day_popup.webp")'],
  ['require("./subscription/list/dark/1.png")', 'require("./subscription/list/dark/1.webp")'],
  ['require("./subscription/list/dark/2.png")', 'require("./subscription/list/dark/2.webp")'],
  ['require("./subscription/list/dark/3.png")', 'require("./subscription/list/dark/3.webp")'],
  ['require("./subscription/list/dark/4.png")', 'require("./subscription/list/dark/4.webp")'],
  ['require("./subscription/list/dark/5.png")', 'require("./subscription/list/dark/5.webp")'],
  ['require("./subscription/list/dark/6.png")', 'require("./subscription/list/dark/6.webp")'],
  ['require("./subscription/carousel/dark/identify.png")', 'require("./subscription/carousel/dark/identify.webp")'],
  ['require("./subscription/carousel/dark/collection.png")', 'require("./subscription/carousel/dark/collection.webp")'],
  ['require("./subscription/carousel/dark/detail.png")', 'require("./subscription/carousel/dark/detail.webp")'],
  ['require("./subscription/carousel/dark/shroom_of_the_day.png")', 'require("./subscription/carousel/dark/shroom_of_the_day.webp")'],
  ['require("./subscription/carousel/dark/ai.png")', 'require("./subscription/carousel/dark/ai.webp")'],
  ['require("./subscription/carousel/dark/feed.png")', 'require("./subscription/carousel/dark/feed.webp")'],
  [
    'subscriptionIconFeed: require("./subscription/list/light/4.webp")',
    'subscriptionIconFeed: require("./subscription/carousel/light/feed.webp")',
  ],
  [
    'subscriptionIconFeedDark: require("./subscription/carousel/dark/feed.png")',
    'subscriptionIconFeedDark: require("./subscription/carousel/dark/feed.webp")',
  ],
];

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFile(from, to) {
  ensureDirFor(to);
  fs.copyFileSync(from, to);
}

function main() {
  const applied = [];
  const consumedRoots = new Set();

  for (const [rootName, assetRel, imagesKey] of COPIES) {
    if (HOME_SKIP.has(rootName)) continue;
    const src = path.join(ICONS, rootName);
    if (!fs.existsSync(src)) {
      console.warn(`Missing root icon: ${rootName}`);
      continue;
    }
    const dest = path.join(ASSETS, assetRel);
    copyFile(src, dest);
    applied.push({ root: rootName, asset: assetRel, imagesKey });
    consumedRoots.add(rootName);
    console.log(`OK ${rootName} → ${assetRel}`);
  }

  for (const [fromRel, toRel] of DARK_MIRRORS) {
    const from = path.join(ASSETS, fromRel);
    const to = path.join(ASSETS, toRel);
    if (fs.existsSync(from)) {
      copyFile(from, to);
      console.log(`MIRROR ${fromRel} → ${toRel}`);
    }
  }

  // Create carousel feed.webp from subs_4 if not written by COPIES (subs_4 goes to list first)
  const feedCarousel = path.join(ASSETS, "subscription/carousel/light/feed.webp");
  if (!fs.existsSync(feedCarousel)) {
    const subs4 = path.join(ICONS, "subs_4.webp");
    if (fs.existsSync(subs4)) copyFile(subs4, feedCarousel);
  }

  for (const rel of DEPRECATED_PNG) {
    const p = path.join(ASSETS, rel);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`REMOVED old ${rel}`);
    }
  }

  let index = fs.readFileSync(INDEX, "utf8");
  for (const [from, to] of INDEX_REPLACEMENTS) {
    index = index.split(from).join(to);
  }
  // analysisBg alias
  index = index.replace(
    'analysisBg: require("./askai/ask_ai_bg.png")',
    'analysisBg: require("./askai/ask_ai_bg.webp")'
  );
  // collectionBgLight uses collection popup
  index = index.replace(
    'collectionBgLight: require("./home/popup/mushroom/light/collection.png")',
    'collectionBgLight: require("./home/popup/mushroom/light/collection.webp")'
  );
  fs.writeFileSync(INDEX, index);
  console.log("Updated src/assets/index.ts");

  // Remove consumed root icons (+ home skip stays in icons/)
  for (const name of consumedRoots) {
    const p = path.join(ICONS, name);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`REMOVED root ${name}`);
    }
  }

  const remainingRoot = fs.readdirSync(ICONS).filter((f) => f.endsWith(".webp"));
  const report = {
    migratedAt: new Date().toISOString(),
    homeSkipped: [...HOME_SKIP].filter((f) => fs.existsSync(path.join(ICONS, f))),
    applied,
    unmatchedKeptInIcons: remainingRoot.filter((f) => UNMATCHED.includes(f)),
    homeSkippedKeptInIcons: remainingRoot.filter((f) => HOME_SKIP.has(f)),
    unmatchedNotInRoot: UNMATCHED.filter((f) => !fs.existsSync(path.join(ICONS, f)) && !consumedRoots.has(f)),
  };
  fs.writeFileSync(MAP_OUT, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${MAP_OUT}`);
  console.log(`Remaining in /icons: ${remainingRoot.length} files`);
}

main();
