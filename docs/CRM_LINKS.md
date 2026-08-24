# Birdzy (Shroom AI) — CRM & Marketing Links

Reference for email, push, ads, and CRM campaigns. Use **prod** links for live users; use **dev** links only for internal QA on the dev build (`com.trackzio.birds.dev`).

Last verified against: `src/navigation/deepLinking/deepLink.constants.ts`, `parseDeepLinkUrl.ts`, `remoteconfig.template.json`.

---

## App identifiers

| | Production | Development |
|---|------------|-------------|
| App name | Birdzy | Birdzy (Dev) |
| iOS bundle ID | `com.trackzio.birds` | `com.trackzio.birds.dev` |
| Android package | `com.trackzio.birds` | `com.trackzio.birds.dev` |
| Firebase project | `mushrooms-app-dfdc5` | `mushrooms-app-dev` |
| Custom URL scheme | `birdzy://` | `birdzy://` (same scheme) |
| Apple Team ID | `FUQBY8BYY3` | `FUQBY8BYY3` |

---

## App store links (production app)

Use these when the app is not installed or for store campaigns. Same URLs for dev/prod builds listed on the stores.

| Platform | URL |
|----------|-----|
| iOS App Store | https://apps.apple.com/app/id6758651735 |
| Google Play | https://play.google.com/store/apps/details?id=com.trackzio.birds |

---

## HTTPS deep links (Universal Links / App Links)

Preferred for CRM. First path segment selects the in-app destination. Query params (e.g. UTM) are ignored by the app parser but safe to append for analytics.

**Primary host (recommended):** `{project}.web.app`  
**Alternate host (equivalent):** `{project}.firebaseapp.com`

| Feature | Path | Opens in app | Production URL | Development URL |
|---------|------|--------------|----------------|-----------------|
| Home | `home` | Home tab | https://mushrooms-app-dfdc5.web.app/home | https://mushrooms-app-dev.web.app/home |
| Identify / Camera | `identify` or `camera` | Camera / Identify tab | https://mushrooms-app-dfdc5.web.app/identify | https://mushrooms-app-dev.web.app/identify |
| Catalogue | `catalogue` or `catalog` | Catalogue tab | https://mushrooms-app-dfdc5.web.app/catalogue | https://mushrooms-app-dev.web.app/catalogue |
| Collection | `collection` | Collection tab | https://mushrooms-app-dfdc5.web.app/collection | https://mushrooms-app-dev.web.app/collection |
| Community feed | `feed` | Feed tab | https://mushrooms-app-dfdc5.web.app/feed | https://mushrooms-app-dev.web.app/feed |
| Subscription / paywall intro | `subs` or `subscription` | Subscription intro screen | https://mushrooms-app-dfdc5.web.app/subs | https://mushrooms-app-dev.web.app/subs |
| Settings | `settings` | Settings | https://mushrooms-app-dfdc5.web.app/settings | https://mushrooms-app-dev.web.app/settings |
| Ask AI | `ask-ai` or `askai` | Ask AI chat | https://mushrooms-app-dfdc5.web.app/ask-ai | https://mushrooms-app-dev.web.app/ask-ai |
| Guides | `guides` | Guides | https://mushrooms-app-dfdc5.web.app/guides | https://mushrooms-app-dev.web.app/guides |
| Quiz | `quiz` | Quiz | https://mushrooms-app-dfdc5.web.app/quiz | https://mushrooms-app-dev.web.app/quiz |
| Mushroom personality | `personality` or `rock-personality` | Personality quiz intro | https://mushrooms-app-dfdc5.web.app/personality | https://mushrooms-app-dev.web.app/personality |

### Alternate Firebase hosts (prod)

Same routes as above — swap the host:

- https://mushrooms-app-dfdc5.firebaseapp.com/{path}
- https://mushrooms-app-dev.firebaseapp.com/{path}

---

## Custom scheme links

Works when the app is installed. Does not distinguish dev vs prod build if both are installed — prefer HTTPS links for campaigns.

| Feature | Link |
|---------|------|
| Home | `birdzy://home` |
| Identify | `birdzy://identify` |
| Catalogue | `birdzy://catalogue` |
| Collection | `birdzy://collection` |
| Feed | `birdzy://feed` |
| Subscription | `birdzy://subs` |
| Settings | `birdzy://settings` |
| Ask AI | `birdzy://ask-ai` |
| Guides | `birdzy://guides` |
| Quiz | `birdzy://quiz` |
| Personality | `birdzy://personality` |

---

## CRM examples (with UTM)

```text
# Welcome email → collection
https://mushrooms-app-dfdc5.web.app/collection?utm_source=email&utm_medium=crm&utm_campaign=welcome

# Re-engagement → identify
https://mushrooms-app-dfdc5.web.app/identify?utm_source=push&utm_campaign=identify_reminder

# Upgrade / subscription promo
https://mushrooms-app-dfdc5.web.app/subs?utm_source=email&utm_campaign=premium_offer

# Dev QA (internal only)
https://mushrooms-app-dev.web.app/feed?utm_source=qa&utm_campaign=smoke_test
```

Append `?manual=1` to any HTTPS URL to force the Firebase Hosting landing page (useful for previewing the web fallback).

---

## Legal & support links

| | URL |
|---|-----|
| Privacy policy | https://trackzio.com/privacy-policy-birdzy-ai |
| Terms of service | https://trackzio.com/birdzy-terms-of-service |

---

## Backend API (not deep links — for integrations only)

| | URL |
|---|-----|
| Production API | https://mushrooms-api-prod.trackzio.com |
| Development API | https://mushrooms-api.trackzio.com |
| Notification service | https://notification-service.trackzio.com |

---

## Firebase Hosting deploy

Hosting must be live for HTTPS links to open the app (AASA + assetlinks):

```bash
npm run firebase:deploy:prod   # mushrooms-app-dfdc5
npm run firebase:deploy:dev    # mushrooms-app-dev
```

---

## Pre-send checklist

- [ ] Campaign uses **prod** host (`mushrooms-app-dfdc5.web.app`) for live users
- [ ] Path is in the supported list above (see `DEEP_LINK_SUPPORTED_ROUTE_NAMES`)
- [ ] Hosting deployed after any route changes
- [ ] Test on a **physical device** (simulator Universal Links are unreliable)
- [ ] Logged-out users: link queues until session is ready, then navigates
- [ ] `subs` / `subscription` opens **SubscriptionIntro**, not the main paywall screen

---

## In-app upgrade CTAs (bottom sheets)

Limit-reached / upgrade bottom sheets navigate via `navigateToSubscriptionMain()` → `SubscriptionStack` → `SubscriptionMain`. This is centralized in `src/utils/navigation.ts` and used across Camera, Collection, Ask AI, Feed, and related flows (fixes inconsistent `getParent()` chains, e.g. Ask AI stack).

---

## Related docs

- [Deep linking playbook](./DEEP_LINKING_PLATFORM_PLAYBOOK.md)
- [Developer deep linking](./engineering/developer/13-deep-linking.md)
- [Firebase setup](./FIREBASE_SETUP.md)

*Trackzio Shroom AI · 2026*
