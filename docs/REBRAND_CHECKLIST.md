# Shroom AI / Birdzy rebrand checklist

> **Note (Aug 2026):** App display name is **Birdzy**. Product spec modules A–Q are implemented in code; see `docs/PRODUCT_SPEC_TRACKER.md` for current status. This checklist covers store/Firebase/backend items that still need manual action.

This app was forked from **Rockzy** (Rocks & Minerals / `com.trackzio.minerals`). Use this document to track what was updated in code and what still needs manual work before shipping **Birdzy** (`com.trackzio.birds` / `com.trackzio.birds.dev`).

---

## Already updated in this repo

### App identity & bundle IDs

| Item | Old | New |
|------|-----|-----|
| Android `applicationId` | `com.trackzio.minerals` | `com.trackzio.birds` |
| Android dev suffix | `.dev` → `com.trackzio.minerals.dev` | `com.trackzio.birds.dev` |
| iOS `PRODUCT_BUNDLE_IDENTIFIER` | `com.trackzio.minerals` | `com.trackzio.birds` |
| iOS dev bundle ID | `com.trackzio.minerals.dev` | `com.trackzio.birds.dev` |
| Android Kotlin/Java package | `com.trackzio.minerals` | `com.trackzio.birds` |
| RN module name (`app.json`) | `RockAndMinerals` | `Birdzy` |
| Display name | Rockzy | Shroom AI |
| Dev display name | Rockzy Dev | Shroom AI Dev |
| `PLAY_STORE_ID` / `ANDROID_PACKAGE_ID` | `com.trackzio.minerals` | `com.trackzio.birds` |
| Notification `APP_CODE` default | `Minerals` / `MineralsDev` | `Mushrooms` / `MushroomsDev` |
| Analytics `domain` | `Minerals` | `Mushrooms` |

### Deep linking

| Item | Old | New |
|------|-----|-----|
| Custom URL scheme | `rockzy://` | `birdzy://` |
| Auth reset link scheme | `rockzy` | `birdzy` |
| iOS URL name | `com.trackzio.minerals.auth` | `com.trackzio.birds.auth` |
| AASA / assetlinks bundle IDs | `com.trackzio.minerals` | `com.trackzio.birds` |
| Firebase Hosting fallback page | Rockzy branding | Shroom AI branding |

### User-facing copy (partial)

- String catalogs under `src/config/strings/` (auth, home, FAQ, collection, camera, modals, etc.)
- Onboarding slides and sample chat
- Share messages, community rules intro, push notification titles
- Subscription paywall **display** name → Shroom AI
- Legal URL constants → `privacy-policy-shroom-ai`, `shroom-ai-terms-of-service`

### Firebase config files (already aligned)

- `android/app/src/dev/google-services.json` → `com.trackzio.birds.dev`
- `android/app/src/prod/google-services.json` → `com.trackzio.birds`
- `ios/Birdzy/GoogleService-Info*.plist` → mushroom bundle IDs

---

## Still requires manual action

### 1. App Store & Play Console (critical)

- [ ] Create **new** App Store Connect app with bundle ID `com.trackzio.birds`
- [ ] Create **new** Play Console app with package `com.trackzio.birds`
- [ ] Create dev/staging builds with `com.trackzio.birds.dev` if you use a separate dev listing
- [ ] Update store listing title, subtitle, description, screenshots, and keywords for mushrooms (not rocks)
- [ ] Set `APP_STORE_ID` in `.env` to the new Apple app ID
- [ ] Confirm `PLAY_STORE_ID=com.trackzio.birds` in `.env`

### 2. In-app purchases (critical — not renamed in code)

Product IDs still use **Rockzy** naming from the source app:

- `lifetime_rockzy`, `yearly_rockzy_pack`, `monthly_rockzy_pack`, etc.
- Config file: `src/data/subscription/rockzyPacks.json`

**Options:**

1. **New app, new IAP:** Create new subscription/product IDs in App Store Connect & Play Console (e.g. `yearly_birdzy_pack`), update `rockzyPacks.json` (or rename to `shroomPacks.json`) and all plan loaders.
2. **Reuse products temporarily:** Keep Rockzy product IDs only if this build is internal/testing — do **not** ship to production consumers with wrong product branding.

Also update:

- [ ] `SUBSCRIPTION_VALUE` env URL if you host a remote pack list JSON
- [ ] Trial offer IDs (`yearly-rockzy-pack-trial`, etc.) in store consoles
- [ ] Shared secret / App Store Connect IAP for the **new** app

### 3. Backend & API (critical)

The app still calls the **minerals** backend:

| Config | Current value |
|--------|----------------|
| `MINERALS_API_BASE_URL` | `http://minerals-api.trackzio.com:9090` |
| Archetype / catalogue APIs | `minerals.api.ts`, `core.api.ts` |
| `APP_CODE` for notifications | `Mushrooms` / `MushroomsDev` (must match server) |

**Action:**

- [ ] Provision mushroom API (or repoint env to new base URL)
- [ ] Register `Mushrooms` / `MushroomsDev` on notification service
- [ ] Replace or extend archetype data for mushroom species (current types: `MineralDetail`, `minerals.types.ts`, etc.)
- [ ] Update `.env.example` with mushroom API URLs

### 4. Firebase & deep-link hosting (critical)

Deep links still point at **minerals** Firebase Hosting projects:

| Environment | Hosts (in `deepLink.constants.ts` / AndroidManifest) |
|-------------|------------------------------------------------------|
| Prod | `minerals-app-480613.web.app`, `minerals-app-480613.firebaseapp.com` |
| Dev | `minerals-app-dev.web.app`, `minerals-app-dev.firebaseapp.com` |

**Action:**

- [ ] Create new Firebase project(s) for Shroom AI (or repoint existing mushroom project)
- [ ] Deploy `hosting/public` (AASA, assetlinks, `index.html`) to the **new** hosting
- [ ] Update `DEEP_LINK_FIREBASE_HOSTING` in `src/navigation/deepLinking/deepLink.constants.ts`
- [ ] Update `AndroidManifest.xml` universal link hosts
- [ ] Update iOS Associated Domains entitlements (`BirdzyRelease-Dev.entitlements`, prod entitlements)
- [ ] Run `firebase use` / `.firebaserc` for the correct project
- [ ] Re-deploy Remote Config template (`remoteconfig.template.json`) to Firebase

### 5. iOS Xcode project structure — done

Internal Xcode names renamed to **Birdzy**:

- Folder: `ios/Birdzy/`
- Workspace: `Birdzy.xcworkspace`
- Schemes: `Birdzy`, `Birdzy-Dev`
- `package.json` scripts updated

- [x] Rename target, folder, schemes to `Birdzy`
- [x] Update `Podfile` target name
- [x] Run `bundle exec pod install`
- [x] Update CI scripts in `docs/CI_CD_SETUP.md`

### 6. Android signing & release

- [ ] Keystore file still named `minerals-upload-key.jks` — create/upload new key for mushroom app if required by Play
- [ ] Update `keystore.properties` passwords (currently reference Rockzy in comments/values)
- [ ] CI secrets: `ANDROID_KEYSTORE_*` for new package

### 7. Legal & marketing URLs

Code points to (must exist on trackzio.com):

- `https://trackzio.com/privacy-policy-shroom-ai`
- `https://trackzio.com/shroom-ai-terms-of-service`

**Action:**

- [ ] Publish legal pages
- [ ] Update Meta / Facebook app settings if linked to old Rockzy app
- [ ] Update email templates (password reset) to use `birdzy://reset-password?...`

### 8. Assets & branding (UI)

Not changed in this pass:

- [ ] App icon (`android/app/src/*/res/mipmap-*`, iOS `Images.xcassets`)
- [ ] Splash / launch screens
- [ ] Onboarding illustrations (`Images.mineralsLight`, `mineralCards`, etc.)
- [ ] Empty states, banners (`RockOfDayBanner`, gift graphics)
- [ ] Tab bar icons and marketing imagery

### 9. Internal code names (large refactor — optional)

Hundreds of files still use **mineral/rock** naming for types, screens, and stores. App works as-is; rename when you have time:

| Area | Examples |
|------|----------|
| Screens | `BirdDetailsScreen`, `MyBirdsScreen`, `MineralGuideScreen` |
| Components | `BirdCard`, `MineralOfTheDay`, `RockOfDayBanner` |
| State / API | `useMineralsStore`, `minerals.api.ts`, `minerals.types.ts` |
| Navigation routes | `MineralDetails`, `rockOfTheDay`, `RockPersonalityStack` |
| Constants | `MINERALS_API_BASE_URL`, `mineralOptions.ts`, color tokens `mineralGreen` |
| Data | `search_data.json` (rock/mineral search index) |

### 10. CI/CD & docs

- [ ] `docs/CI_CD_SETUP.md` — bundle IDs, provisioning profiles
- [ ] `docs/DEEP_LINKING_PLATFORM_PLAYBOOK.md` — still documents Rockzy
- [ ] `docs/engineering/developer/13-deep-linking.md` — still documents `rockzy://`
- [ ] GitHub Actions / Fastlane lanes if present
- [ ] `IOS_PROFILE_*` base64 profiles for `com.trackzio.birds(.dev)`

### 11. Environment files

Create and maintain:

```bash
.env.dev
.env.prod
```

Suggested keys to verify:

```env
ENV=development|production
APP_CODE=MushroomsDev|Mushrooms
PLAY_STORE_ID=com.trackzio.birds
APP_STORE_ID=<new-apple-id>
MINERALS_API_BASE_URL=<mushroom-api-url>
SUBSCRIPTION_VALUE=<optional-remote-pack-json-url>
```

### 12. Cross-promo & published apps

- [ ] `publishedAppsFilter.ts` — filters current app from “other apps” list; confirm mushroom package ID in remote `list.json`
- [ ] `PUBLISHED_APPS_URL` cross-promo JSON may still list Rockzy

### 13. Quiz & personality feature

- [ ] `src/features/quiz/data/quizQuestions.ts` — quiz buckets still reference **rocks** (Amethyst, Granite, etc.)
- [ ] `RockPersonality*` screens and `rock-personality` deep link route — consider `mushroom-personality`
- [ ] Replace quiz result species with mushroom species when content is ready

### 14. Zodiac feature

Copy still references “Zodiac stones” in places. Decide whether mushrooms app keeps zodiac mapping or removes the feature.

---

## Quick verification commands

```bash
# Remaining Rockzy / minerals references (expect IAP + internal code names)
rg -i 'rockzy|com\.trackzio\.minerals|Rocks & Minerals' --glob '!node_modules' --glob '!android/app/build' --glob '!ios/Pods'

# Bundle ID consistency
rg 'com\.trackzio\.mushrooms' android ios src hosting

# Deep link scheme
rg 'birdzy' android ios src hosting
```

## Build smoke test

```bash
npm run android:dev    # or android:prod
npm run ios:dev        # requires Xcode schemes Birdzy-Dev
```

After rebrand, confirm:

1. App shows **Shroom AI** on home screen
2. `birdzy://subs` opens subscription screen
3. Google Sign-In and Firebase Auth work with new `GoogleService-Info` / `google-services.json`
4. IAP loads prices (only after store products exist for the new bundle ID)

---

*Last updated: June 2026 — initial Shroom AI rebrand from Rockzy codebase.*
