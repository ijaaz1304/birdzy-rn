# Birdzy — What's Left Checklist

**Last updated:** Aug 2026  
**Status:** Product spec modules **A–Q are done in code**. This list is everything still needed before production / App Store.

Use `- [ ]` / `- [x]` as you complete items.

---

## Quick status

| Area | Status |
|------|--------|
| Feature spec (A–Q) | ✅ Done in code |
| Typecheck / lint (0 errors) | ✅ |
| Bird copy (major flows) | ✅ |
| Color design system (tokens) | ✅ Defined |
| Semantic colors in all screens | 🟡 High-traffic detail/range uses tokens; full sweep optional |

| Production-ready assets | ❌ Placeholders |
| Backend / env / stores | ❌ Manual setup |

---

## 1. Environment & API (critical)

- [x] Set `API_BASE_URL` / `BIRDS_API_BASE_URL` in `.env.dev` / `.env.prod`
- [x] Set `APP_CODE` — `BirdsDev` (dev) / `Birds` (prod) for notification service
- [x] Set `NOTIFICATION_BASE_URL` → `https://notification-service.trackzio.com` (dev + prod)
- [ ] Confirm production Bird API host `birds-api-prod.trackzio.com` with backend team
- [x] Verify auth + core API against Bird backend (see `docs/API_DOMAIN_MAPPING.md`) — Aug 2026 live smoke on `birds-api.trackzio.com`; fixed `/core/gallery/audio` path; see mapping doc §0.1
- [ ] Replace / confirm Firebase `google-services.json` + `GoogleService-Info.plist` for Birdzy project
- [ ] Set `GOOGLE_WEB_CLIENT_ID` and `GOOGLE_MAPS_API_KEY` in `.env`
- [ ] Smoke test: sign-in, catalogue load, photo ID, sound ID, AI chat

**Reference:** `.env.example`

---

## 2. Firebase & push (critical)

- [ ] Create / select Birdzy Firebase project(s) (dev + prod)
- [ ] Deploy Remote Config template (`remoteconfig.template.json`) with limit keys
- [ ] Create FCM topics in Firebase Console (match `notificationTopics.service.ts` — `birdzy_*` naming)
- [ ] Test notification opt-in → topic subscribe on Settings / Notifications screen
- [ ] Verify Crashlytics / Analytics receiving `bird_*` events

**Reference:** `docs/FIREBASE_SETUP.md`

---

## 3. Deep linking & hosting (critical)

- [ ] Provision Firebase Hosting for Birdzy (replace empty hosts in `deepLink.constants.ts`)
- [ ] Deploy `hosting/public/` (AASA, assetlinks, `index.html`) to new hosting URLs
- [ ] Update `AndroidManifest.xml` universal link hosts
- [ ] Update iOS Associated Domains entitlements
- [ ] Test: `birdzy://identify`, `birdzy://catalogue`, `birdzy://ask-ai`, `birdzy://quiz`
- [ ] Set `APP_STORE_ID` in hosting fallback page / `.env` when Apple app exists

**Reference:** `docs/deep-linking-checklist.md`, `docs/DEEP_LINKING_PLATFORM_PLAYBOOK.md`

---

## 4. App Store & Play Console (critical)

- [ ] Create App Store Connect app — bundle `com.trackzio.birds`
- [ ] Create Play Console app — package `com.trackzio.birds`
- [ ] Dev builds: `com.trackzio.birds.dev` if separate listing
- [ ] Store title, subtitle, description, keywords, screenshots (birding, not mushrooms/rocks)
- [ ] Set `APP_STORE_ID` and `PLAY_STORE_ID` in `.env`
- [ ] Privacy policy URL live — `https://trackzio.com/privacy-policy-shroom-ai` (or Birdzy-specific URL)
- [ ] Terms of service URL live
- [ ] iOS provisioning profiles + CI secrets updated for new bundle IDs

**Reference:** `docs/REBRAND_CHECKLIST.md` §1–2, 6, 10

---

## 5. In-app purchases (critical)

- [ ] Create IAP / subscription products in App Store Connect + Play Console
- [ ] Match product IDs in `src/data/subscription/birdzyPacks.json` (`weekly_pack_birdzy`, `yearly_birdzy_pack`, `lifetime_birdzy`, etc.)
- [ ] Set `SUBSCRIPTION_VALUE` env URL if using remote pack JSON
- [ ] Test purchase flow on dev build with sandbox accounts
- [ ] Confirm premium unlocks: unlimited ID, bird detail sections, collection limits

---

## 6. Design & assets (block release)

- [ ] **App icon** — Android mipmap + iOS AppIcon (replace teal placeholder)
- [ ] **Splash screen** — iOS LaunchScreen + `src/assets/branding/splash/`
- [ ] **Logo** — `src/assets/branding/logo/`
- [ ] **Onboarding** illustrations (replace any Shroomzy art)
- [ ] **Ask AI** hero / upload illustrations (`src/assets/askai/*`)
- [ ] **Subscription** paywall carousel art
- [ ] **Catalogue** species placeholder icons (`catalogue/icons/species/`)
- [ ] **Quiz** archetype images — replace `src/assets/quiz/which_shroom/` with bird art
- [ ] **Personality quiz** intro hero (currently mushroom center image)
- [ ] **Tab bar / empty state** icons if still mushroom-themed

**Reference:** `docs/BRANDING_PLACEHOLDERS.md`, `docs/ASSET_AUDIT.md`

---

## 7. Optional code cleanup (not blocking QA)

- [x] Rename internal routes — `MushroomDetails` → `BirdDetails`, `EditBirdDetails`, `MyBirds`, `BirdGuide`, `BirdPersonalityStack`
- [x] Rename stores / API — `birds.store.ts` (+ `mushroomApiMappers.ts` shim → `birdApiMappers.ts`)
- [x] Rename folder `features/rock-personality/` → `bird-personality/`
- [x] Migrate remaining screens from hardcoded hex → `useSemanticColors()` (range map legend + key detail sections)
- [x] Remove deprecated string keys (`mushroomOfTheDay`, `myMinerals`, etc.) — keys renamed; asset filenames unchanged
- [x] Remove legacy mineral/zodiac API fields from active filter UI (use bird filters; legacy types marked deprecated)
- [x] Update stale docs: `DOMAIN_MIGRATION_INVENTORY.md`

---

## 8. Backend / data (product + backend)

- [x] Species-specific **range polygons** on bird detail — month bars + static map with `rangeDetails` summary; **GeoJSON overlay awaits backend**
- [x] Confirm `GET /core/archetypes/filteritems` returns bird filter fields — verified on dev (see `API_DOMAIN_MAPPING.md` §0.1)
- [x] Bird of the Day / featured species endpoint wired — `archetypeService.getSpecimensOfTheDay()` on Home
- [x] Community feed moderation / reporting backend — Firestore `reports` collection + `reportPost()` in `feed.service.ts`
- [x] Deep-link resolution for shared bird sightings — `birdzy://bird/:id`, `birdzy://sighting/:id`, `birdzy://feed/post/:id`


---

## 9. QA before submit

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] Onboarding → guest or sign-up → main tabs
- [ ] Photo ID (free limit 2/day) + paywall
- [ ] Sound ID + error modals (no bird / noise)
- [ ] Step-by-step wizard + Near You with region setting
- [ ] Bird detail — premium gates on sounds, range, habitat, similar
- [ ] Add / edit sighting (bird fields)
- [ ] Collections + 100 sighting limit
- [ ] Audio gallery + 20 recording cap
- [ ] Ask AI — 5 messages/day limit
- [ ] Community — 1 post/day
- [ ] Which Bird Are You? quiz + share + Ask AI from result
- [ ] Settings — region, notifications, dark mode
- [ ] Subscription purchase + restore

---

## 10. Already done (no action needed)

- [x] Modules A–Q (identify, detail, catalogue, collections, sound, AI, feed, limits, nav, onboarding copy)
- [x] Premium gating on bird detail sections
- [x] FCM topic sync (client) on notification prefs
- [x] Bird FAQ / modals / collection strings (major flows)
- [x] Quiz bird copy + Ask AI from result
- [x] Edit sighting form (bird tabs + fields)
- [x] Color tokens: Primitive → Semantic → Component
- [x] Bird filter modal labels + static fallbacks
- [x] Deep link scheme `birdzy://` + bundle `com.trackzio.birds`
- [x] Hosting landing page bird copy (`hosting/public/index.html`)
- [x] `.env.example` template

---

## Related docs

| Doc | Purpose |
|-----|---------|
| `docs/PRODUCT_SPEC_TRACKER.md` | Module A–Q status |
| `docs/REBRAND_CHECKLIST.md` | Store / Firebase / legal deep dive |
| `docs/API_DOMAIN_MAPPING.md` | Bird API migration map |
| `docs/BRANDING_PLACEHOLDERS.md` | Asset paths to replace |
| `.env.example` | Required env keys |

---

*When in doubt: if it needs Firebase Console, App Store Connect, or design files — it's on this list, not in app code.*
