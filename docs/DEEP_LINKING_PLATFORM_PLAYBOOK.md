# Deep linking — Shroom AI (Birdzy)

Platform playbook aligned with Trackzio Plants / Coinzy / Rockzy. See `docs/engineering/developer/13-deep-linking.md` for in-repo detail.

## Shroom AI identifiers

| Constant | Value |
|----------|--------|
| URL scheme | `birdzy` |
| Firebase prod project | `mushrooms-app-dfdc5` |
| Firebase dev project | `mushrooms-app-dev` |
| Prod HTTPS hosts | `mushrooms-app-dfdc5.web.app`, `mushrooms-app-dfdc5.firebaseapp.com` |
| Dev HTTPS hosts | `mushrooms-app-dev.web.app`, `mushrooms-app-dev.firebaseapp.com` |
| Prod bundle ID | `com.trackzio.birds` |
| Dev bundle ID | `com.trackzio.birds.dev` |
| Apple Team ID | `FUQBY8BYY3` |
| AASA app ID (prod) | `FUQBY8BYY3.com.trackzio.birds` |
| AASA app ID (dev) | `FUQBY8BYY3.com.trackzio.birds.dev` |

## Example URLs

```text
https://mushrooms-app-dfdc5.web.app/collection?utm_source=email
https://mushrooms-app-dev.web.app/identify
birdzy://identify
birdzy://subs
birdzy://reset-password?email=user@example.com&code=123456
```

## Pre-ship checklist

- [ ] Deploy hosting (AASA + assetlinks + `index.html`)
- [ ] Fill `assetlinks.json` SHA-256 fingerprints
- [ ] Apple Developer: Associated Domains on App ID
- [ ] Physical device: Universal Link opens correct tab
- [ ] Logged-out: link queues until MainTabs
- [ ] TestFlight build after hosting is live

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Opens web only | AASA not deployed, Associated Domains off, in-app browser |
| App opens, wrong screen | Path missing from parser or no session (pending) |
| Android HTTPS opens browser | Wrong `assetlinks.json` fingerprints |
| `birdzy://` does nothing | Scheme missing from native config or iOS SceneDelegate not forwarding to `RCTLinkingManager` |

Append `?manual=1` to HTTPS URLs to force the hosting landing page.

*Trackzio Shroom AI · 2026*
