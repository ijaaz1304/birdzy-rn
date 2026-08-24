# Birdzy Product Spec Tracker

Maps product overview modules A–Q to code status.  
**Legend:** ✅ Done · 🟡 Partial · 🔧 Ops / backend only · 🎨 Asset / design

Last updated: Aug 2026

---

## Summary

| Module | Status | Notes |
|--------|--------|-------|
| A Identification | ✅ | Photo + sound + wizard hub; live suggestions; sound error modals |
| B Bird detail | ✅ | Sounds/range premium-gated; StaticMap range overview; month bars |
| C Global catalogue | ✅ | Bird tabs + Near You + bird filter modal labels |
| D Collections | ✅ | Life list, wishlist, 2 custom / 100 sightings |
| E Sound library | ✅ | Gallery + 20 cap |
| F AI chat | ✅ | Bird copy, 5/day; tab + root stack |
| G Community feed | ✅ | 1 post/day, like/comment/report |
| H Subscription | ✅ | Plans + limit sheets aligned to spec |
| I Rating & feedback | ✅ | Existing Trackzio flow |
| J Notifications | ✅ | Category toggles + FCM topic sync on save/grant |
| K Permissions | ✅ | Camera, mic, gallery, location |
| L Onboarding | ✅ | Bird copy + bird illustration assets |
| M Settings & profile | ✅ | Region preference wired to discovery |
| N Authentication | ✅ | Guest, Google, Apple, email |
| O Navigation | ✅ | Spec tab labels + Identify hub + AI Chat tab |
| P Error states | ✅ | Sound no-bird / noise modals on diagnosis fail |
| Q Free vs premium limits | ✅ | All spec numbers wired |

---

## Polish pass (Aug 2026)

| Item | Status | Notes |
|------|--------|-------|
| User-visible copy cleanup | ✅ | Collection health/attributes, hosting page |
| Bird catalogue filters | ✅ | API-driven + bird static fallbacks in `filterOptions.ts` |
| Design system colors | ✅ | Primitive → Semantic → Component; theme exposes `content` / `borderSemantic` / `surfaceSemantic` |
| Semantic hooks | ✅ | `useSemanticColors`, `useComponentColors` |
| Quiz bird UX | ✅ | Copy + Ask AI flow (images deferred) |
| Edit bird sighting form | ✅ | Bird tabs/fields + dropdown fallbacks |

---

## Q. Limits (spec vs code)

| Feature | Spec (free) | Code |
|---------|-------------|------|
| Photo ID | 2/day | ✅ |
| Sound ID | 2/day | ✅ |
| Wizard | Unlimited | ✅ |
| Custom collections | 2 | ✅ |
| Sightings | 100 | ✅ |
| Recordings | 20 | ✅ |
| AI chat | 5/day | ✅ |
| Community | 1/day | ✅ |
| Bird detail (sounds, range, habitat, ID) | Premium | ✅ PremiumLockedSection |

---

## Remaining — ops / backend / assets

| Item | Owner | Status |
|------|--------|--------|
| Firebase Console FCM topics (`birdzy_*`) | DevOps | 🔧 |
| Firebase RC keys in console (photo/sound limits) | DevOps | 🔧 |
| `API_BASE_URL` + `APP_CODE` in `.env` | DevOps | 🔧 See `.env.example` |
| Firebase Hosting for universal links | DevOps | 🔧 |
| Store listings + IAP product IDs (`birdzyPacks.json`) | Product | 🔧 |
| App icon, splash, in-app bird art | Design | 🎨 See `docs/BRANDING_PLACEHOLDERS.md` |
| Quiz bundled images (`which_shroom/`) | Design | 🎨 Deferred |
| Species-specific range polygons (vs StaticMap) | Backend + design | 🔧 |
| Internal route renames (`MushroomDetails`, etc.) | Engineering | 🟡 Optional cleanup PR |

---

## Verification

```bash
npx tsc --noEmit
npm run lint
```
