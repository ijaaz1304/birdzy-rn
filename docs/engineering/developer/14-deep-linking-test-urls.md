# Deep linking — QA test URLs (Birdzy)

Manual QA URLs for deep link validation. Replace host for dev builds.

## Store URLs (web fallback)

| Platform | URL |
|----------|-----|
| Google Play (prod) | https://play.google.com/store/apps/details?id=com.trackzio.birds |
| Google Play (dev) | https://play.google.com/store/apps/details?id=com.trackzio.birds.dev |
| App Store | https://apps.apple.com/app/id6758651735 |

## HTTPS (prod)

Base: `https://mushrooms-app-dfdc5.web.app`

| Route | URL |
|-------|-----|
| Home | https://mushrooms-app-dfdc5.web.app/home |
| Identify | https://mushrooms-app-dfdc5.web.app/identify |
| Catalogue | https://mushrooms-app-dfdc5.web.app/catalogue |
| Collection | https://mushrooms-app-dfdc5.web.app/collection |
| Feed | https://mushrooms-app-dfdc5.web.app/feed |
| Premium | https://mushrooms-app-dfdc5.web.app/subs |
| Settings | https://mushrooms-app-dfdc5.web.app/settings |
| Ask AI | https://mushrooms-app-dfdc5.web.app/ask-ai |
| Guides | https://mushrooms-app-dfdc5.web.app/guides |
| Quiz | https://mushrooms-app-dfdc5.web.app/quiz |
| Rock Personality | https://mushrooms-app-dfdc5.web.app/personality |
| Invalid (no in-app nav) | https://mushrooms-app-dfdc5.web.app/invalid-path |

## HTTPS (dev)

Base: `https://mushrooms-app-dev.web.app` — same paths as prod.

## Custom scheme

| Route | Prod | Dev |
|-------|------|-----|
| Feed | `birdzy://feed` | `birdzy-dev://feed` |
| Collection | `birdzy://collection` | `birdzy-dev://collection` |
| Premium | `birdzy://subs` | `birdzy-dev://subs` |
| Identify | `birdzy://identify` | `birdzy-dev://identify` |

## Manual test mode (web)

Append `?manual=1` to disable automatic redirects:

```
https://mushrooms-app-dfdc5.web.app/subs?manual=1
```

## adb / simctl

```bash
# Android (prod)
adb shell am start -a android.intent.action.VIEW -d "birdzy://feed" com.trackzio.birds

# Android (dev)
adb shell am start -a android.intent.action.VIEW -d "birdzy-dev://collection" com.trackzio.birds.dev

# iOS Simulator (prod scheme)
xcrun simctl openurl booted "birdzy://subs"
```

## Unit tests

```bash
npm test -- --testPathPattern=deepLink
```

## Web store fallback QA

1. Open `https://mushrooms-app-dfdc5.web.app/subs` on a phone **without** the app installed.
2. **Android:** Should redirect to Play Store within ~2s (intent + `browser_fallback_url`).
3. **iOS:** Should attempt app open, then show App Store button after ~1.8s.
4. **Desktop:** Shows "Open on your phone" with Play Store link.
