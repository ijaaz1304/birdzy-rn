# Birdzy Runtime Credentials Audit

> **Date:** 2026-08-22  
> **Scope:** Production-facing config only — not docs/scripts/historical generators.

## Verdict: **CLEAN**

No Shroomzy, minerals, or mushroom **production credentials** remain in runtime config, native Firebase files, `.env`, or `src/`.

The ~230 “old credentials” hits in `docs/reference-audit.json` are almost entirely in **`scripts/generate-firebase-docx.py`** (Shroom AI Firebase doc generator) and other **documentation/markdown** — not loaded by the app at runtime.

---

## Files checked

| Area | Path | Status |
|------|------|--------|
| Active env (dev) | `.env`, `.env.dev` | All secrets **empty**; `API_BASE_URL` unset |
| Active env (prod) | `.env.prod` | All secrets **empty**; `API_BASE_URL` unset |
| Env loader | `src/constants/env.ts` | No hardcoded API host fallback; empty strings + dev warnings |
| Android Firebase (dev) | `android/app/src/dev/google-services.json` | Placeholders: `PENDING_BIRDZY_*`, project `birdzy-app-dev` |
| Android Firebase (prod) | `android/app/src/prod/google-services.json` | Placeholders (same pattern) |
| iOS Firebase | `ios/Birdzy/GoogleService-Info.plist` | Placeholders: `PENDING_BIRDZY_*`, project `birdzy-app` |
| Source tree | `src/**` | **Zero** `AIzaSy…`, `mushrooms-api`, or `minerals-api` strings |
| Native ATS exceptions | `ios/Birdzy/Info.plist` | Legacy host names for **old API domains** (network policy only — not secrets) |

---

## Intentionally empty (configure in Bird migration phase)

| Variable | Purpose |
|----------|---------|
| `API_BASE_URL` | Bird core + auth API |
| `APP_CODE` | Notification service (`Birds` / `BirdsDev`) |
| `GOOGLE_WEB_CLIENT_ID` | Google Sign-In |
| `GOOGLE_MAPS_API_KEY` | Static maps (frontend) |
| `GEOCODING_API_KEY` | geocode.maps.co |
| `APP_SHARED_SECRET` | Apple IAP receipt validation |
| `SUBSCRIPTION_VALUE` | Remote subscription packs JSON URL |
| `META_INSTALL_REFERRER_DECRYPTION_KEY` | Meta install referrer |

---

## Shared infrastructure URLs (not Shroomzy-specific)

These are **Trackzio shared services**, not cloned Shroom credentials:

| Variable | Value |
|----------|-------|
| `NOTIFICATION_BASE_URL` | `https://notification-service.trackzio.com` |
| `RATING_FEEDBACK_API` | AWS Lambda feedback URL |
| `PUBLISHED_APPS` | Cross-promo apps JSON on S3 |
| `GEOCODING_API_BASE_URL` | `https://geocode.maps.co` |

---

## Non-runtime references (safe to ignore for clone gate)

| Location | Notes |
|----------|-------|
| `scripts/generate-firebase-docx.py` | Generates Shroom AI Firebase Word doc; contains historical Shroom project IDs in **doc content** |
| `docs/reference-audit.json` | Audit artifact listing old references |
| `docs/*.md` | Migration notes mentioning old API hosts |
| `node_modules/**` | Firebase/RN type doc examples with sample `AIzaSy…` strings |

---

## Release checklist (branding, not credentials)

Before App Store / Play release:

- [ ] Replace native launcher icons (currently solid `#1A5C6E` placeholders)
- [ ] Replace `src/assets/branding/app-icon/app_icon.webp` (still Shroomzy art — documented in `docs/BRANDING_PLACEHOLDERS.md`)
- [ ] Replace JS splash assets under `src/assets/branding/splash/`
- [ ] Drop real Bird Firebase files when available (replace `PENDING_BIRDZY_*`)
- [ ] Set production `.env.prod` values (never commit real secrets to git)

See `docs/BRANDING_PLACEHOLDERS.md` for full placeholder inventory.
