# Image Asset Audit — Light & Dark Mode

Audit of which app flows use which images, organized by asset folder. All assets live under `src/assets/` and are exported from `src/assets/index.ts`.

**How theme switching works:** Most components use `isDark ? darkAsset : lightAsset` (or `theme.mode === 'dark'`).

**Generated:** June 2026

---

## Table of Contents

1. [Folder Inventory](#folder-inventory)
2. [Flow-by-Flow Breakdown](#flow-by-flow-breakdown)
3. [Shared UI Components](#shared-ui-components)
4. [Gaps & Issues](#gaps--issues)
5. [Unused Assets](#unused-assets)
6. [Architecture Diagram](#architecture-diagram)

---

## Folder Inventory

| Folder | Total Files | Light | Dark | Shared | Used in Code |
|--------|-------------|-------|------|--------|--------------|
| `auth/light` + `auth/dark` | 13 | 7 | 6 | — | ✅ All used |
| `background/light` + `background/dark` | 7 | 5 | 2 | — | ✅ All used |
| `banner/light` + `banner/dark` | 11 | 6 | 5 | 1 shared | ⚠️ 3 dark assets unused |
| `feed/` | 17 | 2 | 8 | 7 | ✅ 15/17 used |
| `iconfix/` (+ `details_more/light\|dark`) | 42 | 13 | 17 | 12 | ✅ All used |
| `popUp/subscription_upgrade/light\|dark` | 12 | 6 | 6 | — | ⚠️ Used via config, not direct imports |
| `subscription/background/light\|dark` | 6 | 3 | 3 | — | ✅ All used |
| `details/rateMatch/light\|dark` | 10 | 5 | 5 | — | ✅ All used |
| `details/mineralIcons/` | 18 | — | — | 18 shared | ❌ Exported but never used |
| `zodiacSign/` | 18 | 1 bg | 1 bg | 16 shared | ❌ Not in index.ts, not referenced |
| `modal/` | 5 | — | — | 5 shared | ⚠️ Only `notification.png` used |

---

## Flow-by-Flow Breakdown

### 1. App Lifecycle (Splash / ScreenContainer)

| Mode | Folder | Asset |
|------|--------|-------|
| Light | `background/light/` | `background.png` |
| Dark | `background/dark/` | `background.png` |
| Shared | `app_icon/` | `app_icon.png` |

**Screens:** `SplashScreen`, `ScreenContainer`

**Export keys:** `Images.splashBgLight`, `Images.splashBgDark`, `Images.appIcon`

---

### 2. Pre-Auth Onboarding

| Page | Light (`auth/light/`) | Dark (`auth/dark/`) |
|------|----------------------|---------------------|
| Scan intro | `auth_scan.webp` | `auth_scan.webp` |
| Identify | `auth_identify.webp` | `auth_cards.png` (cards swap) |
| Cards / list | `auth_cards.png` | `auth_list.webp` |
| Minerals | `auth_mins.webp` | `auth_mins.webp` |
| Fallback | — | — | `auth/analysis_rock.png` (shared) |

**Screens:** `OnboardingScreen`, `OnboardingPage`

**Export keys:** `Images.mineralCardsLight`, `Images.mineralCardsDark`, `Images.mineralsLight`, `Images.mineralsDark`, `Images.authIdentifyIllustration`, `Images.authListDark`, `Images.mineralSample`

---

### 3. Post-Auth Onboarding

| Element | Light | Dark |
|---------|-------|------|
| Background | `background/new_onboard_bg_light.webp` | `background/new_onboard_bg_dark.webp` |
| Notification | `iconfix/common/onboarding_notification.webp` | `iconfix/common/onboarding_notification_dark.webp` |
| Mineral | `iconfix/common/onboarding_mineral.webp` | `iconfix/common/onboarding_mineral_dark.webp` |
| App icon | `iconfix/common/onboarding_icon.webp` | `iconfix/common/onboarding_icon_dark.webp` |
| 50% offer | `iconfix/common/50_percent.webp` | `iconfix/common/50_percent_dark.webp` |

**Screens:** `PostAuthOnboardingScreen`

**Export keys:** `Images.newOnboardBgLight`, `Images.newOnboardBgDark`, `Images.onboardingNotification`, `Images.onboardingNotificationDark`, `Images.onboardingMineral`, `Images.onboardingMineralDark`, `Images.onboardingIcon`, `Images.onboardingIconDark`, `Images.onboarding50Percent`, `Images.onboarding50PercentDark`

---

### 4. Auth (Login, SignUp, Forgot Password, etc.)

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Apple sign-in | `social/apple.png` | `social/apple_dark.png` | — |
| Google / Facebook / Email | — | — | `social/*.png` |
| Nav back / cancel | — | — | `navigation/go_back.png`, `cancel.png` |

**Screens:** `LoginScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `VerifyEmailScreen`, `CompleteProfileScreen`, `AuthScreen`

**Note:** Auth screens mostly use color tokens; image usage is minimal.

---

### 5. Home

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Search icon | `iconfix/search_home.png` | `iconfix/search_home_dark.png` | — |
| Ask AI banner | `banner/light/ask_ai_full.png` | `banner/dark/ask_ai_full.png` | — |
| Home carousel banners | `banner/light/banner_2.png` | `banner/dark/banner_1.png` | — |
| Avatar / Go Pro | — | — | `home/avatar.png`, `home/go_pro.png`, etc. |

**Screens:** `HomeScreen`, `ImageCarousel`, `AppPromoCardAskAI`

**Export keys:** `Images.searchHome`, `Images.searchHomeDark`, `Images.aiBannerFull`, `Images.aiBannerFullDark`, `Images.banner2`, `Images.banner1Dark`

---

### 6. Camera / Identify

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Camera icon | `iconfix/camera.png` | `iconfix/camera_dark.png` | — |
| Close popup | `iconfix/close_popup.png` | `iconfix/close_popup_dark.png` | — |
| Background | — | — | `background/identify_bg.webp` |
| Analysis loading | — | — | `background/analysis_bg.webp`, `auth/analysis_rock.png`, `details/scanner_analysis.png` |
| Flash / upload / info | — | — | `iconfix/flash.png`, `upload.png`, `info.png` |

**Screens:** `CameraCaptureScreen`, `CameraPermissionGate`, `DiagnosisLoadingScreen`, `CameraAccessPopup`, `GalleryAccessPopup`

**Export keys:** `Images.iconfixCamera`, `Images.iconfixCameraDark`, `Images.closePopup`, `Images.closePopupDark`, `Images.identifyBg`, `Images.analysisBg`, `Images.scannerAnalysis`

---

### 7. Collection / Mineral Details

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Back arrow | `details/left_arrow_light.png` | `details/left_arrow.png` | — |
| Rate match emojis | `details/rateMatch/light/*.svg` (5 files) | `details/rateMatch/dark/*.svg` (5 files) | — |
| More menu actions | `iconfix/details_more/light/*.svg` (6 files) | `iconfix/details_more/dark/*.svg` (6 files) | — |
| Add to collection | `iconfix/add_collection_light.png` | `iconfix/add_collection_dark.png` | — |
| Empty collection | `icons/collection/empty_collection_light.png` | ⚠️ dark exists but not used | — |
| Placeholder / tabs | — | — | `details/card_image_placeholder.png`, `tab_batch.png`, etc. |

**Screens:** `MushroomDetailsScreen`, `EditMushroomDetailsScreen`, `CollectionDetailsScreen`, `EmptyCollections`, `MushroomDetailSections`

**SVG exports:** `RateMatchSad01Light/Dark`, `RateMatchSad02Light/Dark`, `RateMatchFlushedLight/Dark`, `RateMatchHappyLight/Dark`, `RateMatchStarFaceLight/Dark`, `DetailsMoreAddStarLight/Dark`, `DetailsMoreRemoveStarLight/Dark`, `DetailsMoreShareLight/Dark`, `DetailsMoreEditLight/Dark`, `DetailsMoreReportLight/Dark`, `DetailsMoreRemoveLight/Dark`

---

### 8. Catalogue

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Empty state | `icons/collection/empty_collection_light.png` only | ⚠️ dark unused | — |
| Close sheet | `iconfix/close_sheet.png` | `iconfix/close_sheet_dark.png` | — |
| Empty search | — | — | `emptystate/empty_search.png` |

**Screens:** `CatalogueScreen`, `SearchScreen`, `EmptyState`

**Gap:** `icons/catalogue/empty_catalogue_lights.png` / `empty_catalogue_darks.png` are exported but never used.

---

### 9. Feed

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Feed header bg | `feed/feed_light.png` | `feed/feed_dark.png` | — |
| No feed empty | `feed/no_feed_light.png` | `feed/no_feed_dark.png` | — |
| Like / comment / share | `thumbs_up_not_selected.png`, `comment.png`, `share.png` | `thumbs_up_dark.png`, `comment_dark.png`, `share_dark.png` | — |
| Like selected | — | `thumbs_up_selected_dark.png` | `thumbs_selected.png` (light) |
| Notifications | `feed/notification.svg` | `feed/notification_dark.svg` | — |
| Upload feed | `iconfix/upload_feed.png` | `iconfix/upload_feed_dark.png` | — |
| Cancel | `icons/cancel.svg` | `icons/cancel_dark.svg` | — |
| Post actions menu | `iconfix/details_more/light/` (edit, remove, report) | `iconfix/details_more/dark/` | — |

**Screens:** `FeedScreen`, `FeedCard`, `CreatePostScreen`, `NotificationsList`, `PostActionSheet`

**Export keys:** `Images.feedLight`, `Images.feedDark`, `Images.noFeedLight`, `Images.noFeedDark`, `Images.feedLike`, `Images.feedLikeDark`, `Images.feedLikeSelected`, `Images.feedLikeSelectedDark`, `Images.feedComment`, `Images.feedCommentDark`, `Images.feedShare`, `Images.feedShareDark`, `Images.uploadFeed`, `Images.uploadFeedDark`

---

### 10. Ask AI

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Chat background | `background/analysis_bg.webp` | `background/analyse_ai_dark.webp` | — |
| Chat icon / send | — | — | `ai/ai_chat_icon.png`, `ai/send.png` |
| Camera / upload | `iconfix/camera.png` | `iconfix/camera_dark.png` | `iconfix/upload.png`, `icons/upload.svg` |

**Screens:** `AskAIScreen`, `AskAIImageSourceScreen`

**Unused exports:** `ai/ai_chat_icon_light.png`, `ai/pro_avatar.png`, `ai/random_boy_avatar.png`, `ai/random_girl_avatar.svg`, `ai/upload_camera.png`

---

### 11. Subscription / Paywall / Discount

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Paywall background | `subscription/background/light/subscription_bg.svg` | `subscription/background/dark/subscription_bg.svg` | — |
| Discount popup bg | `subscription/background/light/popup_50.webp`, `popup_70.webp` | `subscription/background/dark/popup_50.webp`, `popup_70.webp` | — |
| Sheet backgrounds | `popUp/background/light_mode/background_50.webp`, `background_70.png` | `popUp/background/dark_mode/background_50.webp`, `background_70.webp` | — |
| Limit-reached icons | `popUp/subscription_upgrade/light/*` | `popUp/subscription_upgrade/dark/*` | — |
| Limit-reached bg (light only) | `background/light/collection_bg_light.webp`, `details_bg_light.webp`, `identification_bg_light.webp` | No dark equivalents | — |
| Feature icons | — | — | `subscription/icon/*.png` (same for both modes) |
| Gift box | — | — | `subscription/gift_box_50.webp` (shared) |

**Screens:** `SubscriptionPaywallScreen`, `SubscriptionIntroScreen`, `DiscountPopup`, `DiscountBottomSheet`, `Discount50BottomSheet`, `AppSheet` (limit reached)

**Note:** Limit-reached icons are resolved dynamically via `subscription.config.ts` → `Images[imageKey]`, so static analysis won't show direct imports even though they are used at runtime.

**Limit-reached icon mapping (`subscription.config.ts`):**

| Limit Type | Light Key | Dark Key | Light File | Dark File |
|------------|-----------|----------|------------|-----------|
| Collection | `subscriptionPopupIconCollection` | `subscriptionPopupIconCollectionDark` | `popUp/subscription_upgrade/light/collection.png` | `popUp/subscription_upgrade/dark/collection_dark.png` |
| Identification | `subscriptionPopupIconIdentification` | `subscriptionPopupIconIdentificationDark` | `popUp/subscription_upgrade/light/identification.png` | `popUp/subscription_upgrade/dark/identification_dark.png` |
| Details | `subscriptionPopupIconDetails` | `subscriptionPopupIconDetailsDark` | `popUp/subscription_upgrade/light/details.png` | `popUp/subscription_upgrade/dark/details_dark.png` |
| Feed | `subscriptionPopupIconFeed` | `subscriptionPopupIconFeedDark` | `popUp/subscription_upgrade/light/post.webp` | `popUp/subscription_upgrade/dark/post_dark.png` |
| Rock | `subscriptionPopupIconRock` | `subscriptionPopupIconRockDark` | `popUp/subscription_upgrade/light/rocks.webp` | `popUp/subscription_upgrade/dark/rocks_dark.webp` |
| AI Chat | `subscriptionPopupIconAiChat` | `subscriptionPopupIconAiChatDark` | `popUp/subscription_upgrade/light/chat.png` | `popUp/subscription_upgrade/dark/chat_dark.png` |

---

### 12. Rock Personality

| Element | Light | Dark | Shared |
|---------|-------|------|--------|
| Intro/analysis bg | `background/analysis_bg.webp` | `background/analyse_ai_dark.webp` | — |
| Which rock quiz bg | `background/light/which_rock_light_bg.webp` | `background/dark/which_rock_dark_bg.webp` | — |
| Camera / upload | `icons/camera_light.png`, `upload_light.png` | `icons/camera_dark.png`, `upload_dark.png` | — |
| Hero image | — | — | `ai/rock.webp` |
| Scanner / close | — | `iconfix/close_popup_dark.png` | `iconfix/scanner.png`, `close_popup.png` |

**Screens:** `RockPersonalityIntroScreen`, `PhotoSelectionScreen`, `RockPersonalityAnalysisScreen`, `RockPersonalityResultScreen`, `RockPersonalityQuestionnaireScreen`

---

### 13. Navigation (Bottom Tabs)

| Tab | Light / Shared | Dark-Only |
|-----|----------------|-----------|
| Home, Catalogue, Collection, Feed | `bottomTab/*.png` | — |
| Identify | `bottomTab/identify.png` | `bottomTab/identify_dark.png` |

**File:** `MainTabs.tsx`

---

## Shared UI Components

Used across many flows (modals, sheets, banners):

| Category | Light | Dark |
|----------|-------|------|
| Close sheet/popup | `iconfix/close_sheet.png` | `iconfix/close_sheet_dark.png`, `close_popup_dark.png` |
| Trash (delete) | `icons/trash_light.png` | `icons/trash_dark.png` |
| Cancel | `icons/cancel.svg` | `icons/cancel_dark.svg` |
| Stars (rate us) | `auth/light/star_*.png` | `auth/dark/star_*.png` |
| AI scan error | `iconfix/ai_scan_error.png` | `iconfix/ai_scan_error_dark.png` |
| Discount banner | `banner/light/discount_banner_light.webp` | `banner/dark/sale_banner.png` |
| Rock gift modal | `home/rock_gift.png` | `home/rock_gift_dark.png` |
| Notification popup | `popUp/lightMode/notification_big.png` | `popUp/darkmode/notification.png` |
| Dropdown arrow | `auth/light/icons/arrow_down.png` | `popUp/icons/arrow_down_dark.png` |

**Components:** `AppModal`, `AppSheet`, `AppPopup`, `DynamicModal`, `DiscountBanner`, `BackgroundHeader`, `DeleteAccountConfirmation`, `DeleteCollectionConfirmation`, `RemoveFromWishlistModal`, `AIErrorModal`, `Dropdown`, `MultiSelectDropdown`

---

## Gaps & Issues

### Empty states always use light variant

These components always pass `Images.emptyCollection` (light) — `Images.emptyCollectionDark` is never used:

- `EmptyCollections.tsx`
- `EmptyState.tsx` (catalogue)
- `CollectionDetailsScreen.tsx`

Similarly, `Images.emptyCatalogue` / `Images.emptyCatalogueDark` are exported but never referenced.

### Light-only assets (no dark pair)

| Asset | Notes |
|-------|-------|
| `auth/light/auth_identify.webp` | Dark onboarding uses cards instead |
| `background/light/collection_bg_light.webp` | Limit-reached sheet bg |
| `background/light/details_bg_light.webp` | Limit-reached sheet bg |
| `background/light/identification_bg_light.webp` | Limit-reached sheet bg |
| `popUp/background/light_mode/background_70.png` | Dark uses `.webp` variant |

### Subscription feature icons — no real dark variants

`subscription/icon/*.png` dark export keys point to the **same file** as light (placeholder until dark assets are added):

```ts
subscriptionIconIdentificationDark: require('./subscription/icon/identification.png'), // same as light
```

### Possible trash icon inversion (2 components)

Most components use: dark mode → `trashDark`, light → `trashLight`.

These two do the **opposite**:

- `RemoveFromCollectionModal.tsx` — `theme.mode === 'dark' ? Images.trashLight : Images.trashDark`
- `RemoveFromWishlistConfirmation.tsx` — same pattern

Verify visually — may be intentional if PNG colors are inverted.

### Orphan asset folders

| Folder | Status |
|--------|--------|
| `zodiacSign/` (18 files) | Not in `index.ts`, not referenced anywhere |
| `details/mineralIcons/` (18 files) | Exported in `Images.mineralIcons` but never used in code |
| `modal/` (5 files) | Only `notification.png` used |

---

## Unused Assets

58 exported assets are never referenced in code. Notable ones:

### AI (`ai/`)
- `ai_chat_icon_light.png`
- `pro_avatar.png`
- `random_boy_avatar.png`
- `random_girl_avatar.svg`
- `upload_camera.png`

### Banners (`banner/`)
- `banner/dark/banner_2.png`
- `banner/dark/rock_of_the_day.png`
- `banner/light/rock_of_the_day.png`

### Details (`details/`)
- `delete.png`, `share.png`, `report.png`
- All 18 `mineralIcons/` files

### Empty states (`emptystate/`, `icons/catalogue/`)
- `emptystate/photo_empty.png`
- `emptystate/scan_error.png`
- `feed/no_feed.png`
- `icons/catalogue/empty_catalogue_lights.png`
- `icons/catalogue/empty_catalogue_darks.png`
- `icons/collection/empty_collection_dark.png`

### Modal (`modal/`)
- `alarm.png`, `camera.png`, `location.png`, `trash.png`

### Subscription (`subscription/`, `popUp/subscription_upgrade/`)
- `subscription/subscription.png`
- `subscription/subscription_failed.png`
- `subscription/minerals.png`
- `subscription/rocks.webp`
- All `popUp/subscription_upgrade/light/*` and `dark/*` (used only via dynamic config keys)

### Other
- `navigation/vert_move.png`
- `home/surprise-box.png` (featurePlant/featureMineral/offerBox)
- `feed/notification_dark.png` (PNG; SVG variant is used instead)

---

## Architecture Diagram

```
src/assets/
├── auth/
│   ├── light/          → Onboarding (pages 1–4)
│   └── dark/           → Onboarding (pages 1–4)
├── background/
│   ├── light/          → Splash, limit-reached sheets, rock personality
│   └── dark/           → Splash, rock personality
├── banner/
│   ├── light/          → Home carousel, Ask AI, discount
│   └── dark/           → Home carousel, Ask AI, discount
├── feed/               → Feed screen, cards, notifications
├── iconfix/
│   ├── common/         → Post-auth onboarding
│   ├── details_more/
│   │   ├── light/      → Details more menu, feed post actions
│   │   └── dark/
│   └── *.png           → Camera, close, search, upload (shared UI)
├── popUp/
│   ├── background/
│   │   ├── light_mode/ → Discount sheets, modals
│   │   └── dark_mode/
│   ├── lightMode/      → Notification popup
│   ├── darkmode/       → Notification popup
│   └── subscription_upgrade/
│       ├── light/      → Limit-reached icons (via config)
│       └── dark/
├── subscription/
│   ├── background/
│   │   ├── light/      → Paywall, discount popups
│   │   └── dark/
│   └── icon/           → Paywall feature list (shared L/D)
├── details/
│   ├── rateMatch/
│   │   ├── light/      → Identification feedback emojis
│   │   └── dark/
│   └── mineralIcons/   → ❌ UNUSED
└── zodiacSign/         → ❌ NOT IN INDEX
```

---

## Quick Reference — Export Pattern

```ts
// Standard light/dark toggle
const icon = isDark ? Images.closeSheetDark : Images.closeSheet;

// SVG with theme variants
import { RateMatchHappyLight, RateMatchHappyDark } from '../../assets';
const Icon = isDark ? RateMatchHappyDark : RateMatchHappyLight;

// Dynamic key lookup (subscription limit sheets)
const imageKey = isDark ? item.imageDark : item.imageLight;
const imageSource = Images[imageKey];

// Light-only backgrounds for limit-reached sheets
const bg = !isDark && limitType === 'collection'
  ? Images.collectionBgLight
  : isDark ? Images.popUp50Dark : Images.popUp50Light;
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/assets/index.ts` | Central asset registry — all `Images.*` and SVG exports |
| `src/config/subscription.config.ts` | Limit-reached icon key mapping |
| `src/hooks/useTheme.ts` | `useTheme()`, `useIsDark()` helpers |
| `src/app/ThemeProvider.tsx` | Theme context provider |
