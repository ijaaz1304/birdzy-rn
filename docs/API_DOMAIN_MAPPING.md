# Shroomzy → Birdzy API & Domain Mapping

> **Purpose:** Systematic migration map. Change API/domain code against this document — not ad hoc grep fixes.  
> **Prerequisite:** Clone/cleanup phase complete; builds verified locally.  
> **Related:** `docs/API_AUTH.md`, `docs/API_CORE.md`, `docs/DOMAIN_MIGRATION_INVENTORY.md`

---

## How to read each row

```
Shroomzy feature
    ↓
Current HTTP endpoint (Birdzy code today)
    ↓
Request shape
    ↓
Response shape
    ↓
FE chain: API → Service → Store/Repository → Screen
    ↓
Bird equivalent + migration action
```

**Legend**

| Action | Meaning |
|--------|---------|
| ✅ KEEP | Path/method unchanged; types/UI may still need Bird fields |
| 🔄 RETYPE | Same endpoint; replace mushroom/mineral models & mappers |
| ➕ ADD | New Bird-only endpoint — not in Birdzy yet |
| ❌ REMOVE | Legacy Shroom/minerals endpoint — drop after Bird UI wired |
| ⚠️ VERIFY | Confirm with Bird backend before implementing |

---

## 0. Configuration layer

### API base URLs

| Environment | Host (`API_BASE_URL`) | Auth module | Core module |
|-------------|----------------------|-------------|-------------|
| Dev / staging | `https://birds-api.trackzio.com` | `…/auth` | `…/core` |
| Production | `https://birds-api-prod.trackzio.com` | `…/auth` | `…/core` |

Set in `.env.dev` / `.env.prod`. Exported from `src/constants/env.ts` as `BIRDS_API_BASE_URL`, `AUTH_API_BASE_URL`, `CORE_API_BASE_URL`.

### Notification service

| Environment | `NOTIFICATION_BASE_URL` | `APP_CODE` (header `x-app-code`) |
|-------------|-------------------------|----------------------------------|
| Dev | `https://notification-service.trackzio.com` | `BirdsDev` |
| Prod | `https://notification-service.trackzio.com` | `Birds` |

Same notification host for all Trackzio apps; backend distinguishes apps by `APP_CODE`. Register codes on the notification service before push works in the wild.

### Live verification (dev host — Aug 2026)

Smoke-tested against `https://birds-api.trackzio.com` with guest JWT:

| Endpoint | Result | Notes |
|----------|--------|-------|
| `POST /auth/guest-login` | ✅ 200 | New + refresh via `{ guestId }` |
| `GET /auth/me` | ✅ 200 | Profile |
| `GET /auth/refresh-auth-token` | ⚠️ 500 for guests | Expected — app refreshes guests via `guest-login` |
| `GET /core/archetypes/filteritems` | ✅ 200 | Bird field flags |
| `POST /core/archetypes/fetchAll` | ✅ 200 | Query: `pageNo`, `pageSize`; body filters |
| `GET /core/archetypes/stats` | ✅ 200 | `{ all, raptors, songbirds, … }` |
| `GET /core/archetypes/getDetails/:id` | ✅ 200 | |
| `POST /core/archetypes/step-by-step` | ✅ 200 | Body: `{ location: { lat, lng }, seenDate? }` |
| `GET /core/archetypes/specimens-of-the-day` | ✅ 200 | Bird of the day |
| `PUT/DELETE …/wishlist/*` | ✅ 200 | |
| `GET /core/collections/fetchAll` | ✅ 200 | Auto “Identified” collection |
| `POST /core/specimen/fetchAll` | ✅ 200 | |
| `GET /core/gallery/audio` | ✅ 200 | **Not** `/gallery/audio` (404) — fixed in `api.ts` |
| `GET /core/specimen/filteritems` | ❌ 500 | Do not use — use archetypes filteritems |
| `POST /got-bitten` | ❌ 404 on dev | Optional feature; confirm path with backend |
| `POST /core/chat` | ⚠️ 500 | “ornithological database unreachable” — backend/data |
| `/maps/*` | ❌ 404 | Not on Bird host; app uses OSM geocode + Google Static Maps |

| Shroomzy | Birdzy today | Bird target | FE touchpoints | Action |
|----------|--------------|-------------|----------------|--------|
| `mushrooms-api.trackzio.com` | `birds-api.trackzio.com` (dev) | Same Trackzio pattern | `env.ts`, `axios.ts`, `.env.*` | ✅ Done |
| `APP_CODE=Mushrooms` / `MushroomsDev` | `Birds` / `BirdsDev` in `.env.*` | Match notification service | `env.ts`, `notification.api.ts` | ✅ Env templates |
| Google/Firebase (Shroom project) | Placeholder `PENDING_BIRDZY_*` | Birdzy Firebase project | `google-services.json`, `GoogleService-Info.plist` | Replace when credentials ready |
| IAP product IDs (`*_shroomzy`) | `birdzyPacks.json` placeholders | Birdzy SKUs | `src/data/subscription/birdzyPacks.json` | Configure in stores |

---

## 1. Auth module (19 endpoints)

**Status:** ✅ All paths implemented — **config-only migration**.

| Layer | Files |
|-------|-------|
| Constants | `src/constants/api.ts` → `AUTH.*` |
| API | `src/services/api/features/auth.api.ts` |
| Types | `src/services/api/features/auth.api.types.ts` |
| Store | `src/features/auth/auth.store.ts` |

Full endpoint table: **`docs/API_AUTH.md`**.

| Shroomzy | Current endpoint | Bird equivalent | Action |
|----------|------------------|-----------------|--------|
| Email signup/login, social, guest, profile, referrals, IAP | `/auth/*` (19 routes) | Same Trackzio auth API | ✅ KEEP |

**No request/response shape changes expected** for auth between Shroom and Bird apps on shared Trackzio backend.

---

## 2. AI — Image identification

| | |
|--|--|
| **Shroomzy feature** | Mushroom / mineral photo ID (camera or gallery) |
| **Current endpoint** | `POST /core/ai/identify` |
| **Constant** | `API_ENDPOINTS.CORE.IDENTIFY` |
| **Bird equivalent** | Same path — Bird CNN identification |
| **Action** | ✅ KEEP path — 🔄 RETYPE response |

### Request

| Field | Shroomzy code | Bird API |
|-------|---------------|----------|
| Auth | `Authorization: Bearer <JWT>` | Same |
| Body | `multipart/form-data`, field **`files`** (array, max 2) | Same |
| Optional | `userLocation` JSON `[lat, lng]` | Same |

**Sender:** `coreApi.identify()` → `aiService.identifyMushroom()` → camera identify flow

### Response (top level)

| Field | Shroomzy `IdentifyResponse` | Bird API |
|-------|----------------------------|----------|
| `error` | boolean | Same |
| `confidence` | — | **ADD** top-level + nested |
| `userLocation` | — | **ADD** |
| `data.imageUrls` | string[] | Same |
| `data.matchesFoundCount` | number | Same |
| `data.matches[]` | `MushroomMatch[]` | Bird match objects |

### Match object — field migration

| Shroomzy (`MushroomMatch` / UI) | Bird API field | Migration |
|---------------------------------|----------------|-----------|
| `gbifId`, `mindatId` | `birdsLifeId` | Replace primary external ID |
| `commonNames[]` | `commonName` (string) | Single name + optional `alternativeNames` |
| `edibility`, `toxicitySeverity`, `psychoactive` | — | **Remove** — use `conservationStatus`, safety copy |
| `capShape`, `capSurface`, `stemPresence`, `volvaPresent`… | — | **Remove** |
| `habitatType` | `habitat[]` | Rename |
| — | `birdType`, `flightPattern`, `flightAltitude` | **Add** |
| — | `birdWatchingTips` | **Add** |
| — | `soundUrls`, `userCapturedSounds` | **Add** (audio features) |
| — | `keyIdentificationMarks`, `dominantColors`, `sexDifferences` | **Add** |
| — | `rangeDetails`, `lengthRange`, `wingspanRange`, `weightRange` | **Add** |
| `lookAlikes` | `similarBirds` | Rename |
| `similarityScore` | `similarityScore` | Keep |
| — | `metrics`, `debug` | Optional — dev/diagnostics |

### FE chain

```
coreApi.identify()
  → aiService.identifyMushroom()          src/services/ai/ai.service.ts
  → mapIdentificationMatch()              src/utils/mushroomApiMappers.ts
  → MushroomIdentification                src/types/mushrooms.types.ts
  → identificationResults.store           src/features/camera/identificationResults.store.ts
  → DiagnosisLoadingScreen / results UI   src/features/camera/screens/*
  → identifyImageFlow.ts                  src/features/camera/identifyImageFlow.ts
```

### Bird migration tasks

1. Add `BirdMatch`, `BirdIdentification` types (or rename mushroom types)
2. Rewrite `mapIdentificationMatch()` for Bird fields
3. Replace edibility/toxicity UI with bird ID marks + conservation
4. Update safety disclaimers in `mushroomOptions.ts` → bird copy

---

## 3. AI — Sound identification

| | |
|--|--|
| **Shroomzy feature** | *Not present* |
| **Current endpoint** | — |
| **Bird equivalent** | `POST /core/ai/identify-sound` |
| **Action** | ➕ ADD |

### Request

- `multipart/form-data`, field **`files`**: exactly **1** audio file (mp3, wav, ogg, m4a)

### Response

- Same match shape as image identify, plus `data.soundUrls[]`

### Suggested FE chain (new)

```
coreApi.identifySound()          NEW in core.api.ts
  → aiService.identifyBirdSound() NEW
  → birdApiMappers               NEW
  → audio record UI              NEW (camera/mic feature)
  → gallery audio tab            ties to GET /core/gallery/audio
```

---

## 4. AI — BirdBot chat (Ask AI)

| | |
|--|--|
| **Shroomzy feature** | Ask AI — mushroom/mineral chat + image ID |
| **Current endpoint** | `POST /core/chat` |
| **Bird equivalent** | Same — BirdBot |
| **Action** | ✅ KEEP — 🔄 copy/domain only |

### Request

| Field | Code | Bird API |
|-------|------|----------|
| `message` | optional text | Same |
| `images` | optional, max 5, &lt;5MB each | Same |

**Sender:** `coreApi.chat()` → `aiService.chat()` → `AskAIScreen.tsx`

### Response

```json
{ "error": false, "data": { "reply": "..." } }
```

Empty reply handling already in `aiService.chat()` using `EMPTY_CHAT_CANNED_RESPONSES` from `mushroomOptions.ts`. ✅

### FE chain

```
coreApi.chat()
  → aiService.chat()                 src/services/ai/ai.service.ts
  → AskAIScreen                      src/features/ask-ai/screens/AskAIScreen.tsx
  → AskAIScreenBackground assets     src/assets/askai/* (placeholder Shroom art)
```

---

## 5. AI — Got bitten (Bird-only)

| | |
|--|--|
| **Shroomzy feature** | *Not present* |
| **Bird equivalent** | `POST /got-bitten` |
| **Action** | ➕ ADD |

Same multipart contract as `/core/chat` (`message` + `images`). New screen or mode in Ask AI / dedicated flow.

---

## 6. Public catalogue (archetypes)

| | |
|--|--|
| **Shroomzy feature** | Mushroom catalogue — browse, search, filter |
| **Primary endpoint** | `POST /core/archetypes/fetchAll` |
| **Also used via** | `API_ENDPOINTS.MUSHROOMS.FETCH_ALL` (duplicate constant) |
| **Bird equivalent** | Same |
| **Action** | ✅ KEEP — 🔄 filters + types |

### Request

| Part | Shape |
|------|-------|
| Query | `pageNo`, `pageSize`, optional `search` |
| Body | Filter object — **all values must be arrays** |

**Shroomzy filter fields (today):**

```
edibility, toxicitySeverity, psychoactive, capShape, capSurface,
undersideType, stemPresence, stemSurface, ringPresent, volvaPresent,
habitatType, geographicDistribution, scientificClassification.*
```

**Bird filter fields (target):**

```
birdType, diet, habitat, conservationStatus, flightPattern, flightAltitude,
birdWatchingTips.bestTime, birdWatchingTips.preferredLocations,
scientificClassification.*, customLocation, lifeExpectancyInWild
```

Defined in Bird API doc; labels today in `src/constants/mushroomOptions.ts` → replace with bird filter labels.

### Response (list item)

| Shroomzy `MushroomListItem` | Bird list row | Notes |
|----------------------------|---------------|-------|
| `archetypeId` | `archetypeId` | Same |
| `commonName` / `commonNames[]` | `commonName` | Bird returns single common name |
| `scientificName` | `scientificName` | Same |
| `imageUrls`, `defaultImageUrl` | Same | Same |
| `edibility`, `toxicitySeverity` | — | Remove |
| `isIdentified`, `isWishlisted`, `isOwned` | Same | Same |
| `entryType` (minerals legacy) | — | Remove from Bird UI |
| — | `birdsLifeId`, `summary`, `score` | Add |

### Filter items

| Shroomzy (wrong for Bird) | Bird |
|---------------------------|------|
| `GET /core/specimen/filteritems` via `coreApi.getFilterItems()` | ❌ REMOVE usage |
| `GET /core/archetypes/filteritems` via `coreApi.getArchetypeFilterItems()` | ✅ USE this only |

**Default filter params today:** `archetypeService.getFilterItems()` passes mushroom field names — **must switch to Bird fields**.

### Archetype detail

| | |
|--|--|
| **Endpoint** | `GET /core/archetypes/getDetails/:id` |
| **Service** | `archetypeService.getArchetypeDetails()` |
| **Normalizer** | `normalizeMushroomDetail()` in `mushroomApiMappers.ts` |
| **UI** | `MushroomDetailsScreen`, catalogue detail routes |

### Archetype stats (home / catalogue tabs)

| Shroomzy stats (`normalizeArchetypeStats`) | Bird API `/core/archetypes/stats` |
|-------------------------------------------|-----------------------------------|
| `all`, `edible`, `inedible`, `toxic`, `psychoactive`, `wood_growing` | `all`, `raptors`, `songbirds`, `waterBirds`, `threatened`, `soaring` |

**UI:** Home/catalogue category chips must be redesigned for Bird stats.

### Specimens / Bird of the day

| | |
|--|--|
| **Shroomzy** | `GET /core/archetypes/specimens-of-the-day` |
| **Used by** | `HomeScreen` → `archetypeService.getSpecimensOfTheDay()` |
| **Bird API doc** | *Not listed* — may be Bird-specific backend feature |
| **Action** | ⚠️ VERIFY with backend; keep endpoint until confirmed replacement |

### Step-by-step nearby birds (Bird-only)

| | |
|--|--|
| **Endpoint** | `POST /core/archetypes/step-by-step` |
| **Body** | `{ location: { lat, lng }, seenDate?, birdSize?[] }` |
| **Action** | ➕ ADD — likely replaces or supplements local discovery flow |

### FE chain (catalogue)

```
mushroomsAPIService.getMushroomsList/search/filter     src/services/api/mushrooms.api.ts
  → mushroomsRepository                                src/lib/repositories/mushrooms.repository.ts
  → mushrooms.store                                    src/features/catalogue/mushrooms.store.ts
  → CatalogueScreen, SearchScreen                      src/features/catalogue/screens/*
  → normalizeArchetypeListItem()                       src/utils/mushroomApiMappers.ts
  → MushroomListItem                                   src/types/mushrooms.types.ts
```

**Also:** bundled offline search `src/data/new_mushroom_search.json` — replace with Bird search data or rely on API-only search.

---

## 7. Legacy MUSHROOMS.* endpoints (minerals fork)

These exist in `API_ENDPOINTS.MUSHROOMS` and `mushrooms.api.ts` but **are not in the Bird API doc**. Several already call `fetchAll` with empty body as a workaround.

| Shroomzy usage | Endpoint constant | Actual HTTP | Bird equivalent | Action |
|----------------|-------------------|-------------|-----------------|--------|
| Catalogue list (primary) | `MUSHROOMS.FETCH_ALL` | `POST /core/archetypes/fetchAll` | Same | Consolidate to `CORE.ARCHETYPE_LIST` only |
| Search | `MUSHROOMS.SEARCH` | Was `/core/archetypes/search` | `fetchAll?search=` | ❌ REMOVE constant; use fetchAll |
| Filter | `MUSHROOMS.FILTER` | `/core/archetypes/filter` | `fetchAll` + body | ❌ REMOVE |
| Healing crystals | `MUSHROOMS.HEALING_CRYSTALS` | `/core/archetypes/healing-crystals` | — | ❌ REMOVE feature |
| Popular | `MUSHROOMS.POPULAR` | `/core/archetypes/popular` | — | ❌ REMOVE or replace with Bird stats tabs |
| Costliest | `MUSHROOMS.COSTLIEST` | `/core/archetypes/costliest` | — | ❌ REMOVE |
| Count | `MUSHROOMS.COUNT` | `/core/archetypes/count` | Use `stats.all` | ❌ REMOVE |
| Favorite toggle | `MUSHROOMS.FAVORITE` | `POST /core/archetypes/:id/favorite` | Wishlist PUT/DELETE | ❌ REMOVE — use wishlist endpoints |
| User collection | `MUSHROOMS.USER_COLLECTION` | `GET /users/:id/collection` | Specimen `fetchAll` | ❌ REMOVE |

**Store methods to delete or rewrite:** `getHealingCrystals`, `getPopularRocks`, `getCostliestStones`, `getTotalCount`, legacy `toggleFavorite` via mushrooms API.

**Correct wishlist path (already implemented):**

- `PUT /core/archetypes/wishlist/add/:id` → `archetypeService.addWishlistArchetype()`
- `DELETE /core/archetypes/wishlist/remove/:id` → `archetypeService.removeWishlistArchetype()`

---

## 8. Private collection — specimens

| | |
|--|--|
| **Shroomzy feature** | My mushrooms / identified specimens |
| **Endpoints** | CRUD under `/core/specimen/*` |
| **Bird equivalent** | Same paths |
| **Action** | ✅ KEEP — 🔄 types + edit forms |

| Operation | Method | Path | Service method |
|-----------|--------|------|----------------|
| Add | POST | `/core/specimen/add` | `mushroomSpecimenService.addSpecimen()` |
| List | POST | `/core/specimen/fetchAll` | `mushroomSpecimenService.fetchAllSpecimens()` |
| Detail | GET | `/core/specimen/getDetails/:id` | `mushroomSpecimenService.getSpecimenDetails()` |
| Update | PATCH | `/core/specimen/update/:id` | `mushroomSpecimenService.updateSpecimen()` |
| Delete | DELETE | `/core/specimen/delete/:id` | `mushroomSpecimenService.deleteSpecimen()` |

### Add specimen — required fields

| Shroomzy `AddMushroomSpecimenRequest` | Bird API |
|---------------------------------------|----------|
| `scientificName`, `imageUrls`, `_collections` | Same |
| `mindatId`, `gbifId`, `canonicalName` (required in code) | **Not in Bird API** — remove requirement |
| — | `birdsLifeId`, `soundUrls`, `userCapturedImages`, `userCapturedSounds`, bird fields |

### Update specimen — PATCH fields

Bird API uses **flat dot-notation** keys (e.g. `"scientificClassification.kingdom"`).  
Edit UI: `EditMushroomDetailsScreen`, `editMushroomDetails.utils.ts` — mushroom-only fields today.

### Legacy specimen endpoints

| Endpoint | Used by | Action |
|----------|---------|--------|
| `GET /core/specimen/filteritems` | `mushroomSpecimenService.getFilterItems()` | ❌ REMOVE — use archetype filteritems |
| `GET /core/specimen/stats` | verify usage | ❌ REMOVE if unused |

### FE chain

```
coreApi.* specimen methods              src/services/api/features/core.api.ts
  → mushroomSpecimenService             src/services/specimen/mushroomSpecimen.service.ts
  → normalizeSpecimenListItem()         src/utils/mushroomApiMappers.ts
  → MyMushroomsScreen, MushroomDetailsScreen, EditMushroomDetailsScreen
  → collectionInvalidation.store
```

---

## 9. Collections (folders)

| Shroomzy | Bird | Action |
|----------|------|--------|
| Mineral/mushroom collections | Bird specimen collections | ✅ KEEP — no domain type changes |

| Operation | Path | Service |
|-----------|------|---------|
| Create | `POST /core/collections/add` | `collectionService.addCollection()` |
| List | `GET /core/collections/fetchAll` | `collectionService.fetchAllCollections()` |
| Detail | `GET /core/collections/getDetails/:id` | `collectionService.getCollectionDetails()` |
| Update | `PATCH /core/collections/update/:id` | `collectionService.updateCollection()` |
| Delete | `DELETE /core/collections/delete/:id` | `collectionService.deleteCollection()` |
| Stats | `GET /core/collections/stats` | `collectionService.getCollectionStats()` |

**UI:** `CollectionDetailsScreen`, create/edit collection modals — mostly generic; rename copy only.

---

## 10. Identified / wishlist (archetype → specimen)

| User action | Endpoint | Service |
|-------------|----------|---------|
| Mark identified | `PUT /core/archetypes/identified/add/:id` | `archetypeService.addIdentifiedArchetype()` |
| Add wishlist | `PUT /core/archetypes/wishlist/add/:id` | `archetypeService.addWishlistArchetype()` |
| Remove wishlist | `DELETE /core/archetypes/wishlist/remove/:id` | `archetypeService.removeWishlistArchetype()` |

Creates/links **specimen** rows server-side. Wishlist sync logic in `archetypeService` is domain-agnostic — keep, update error strings ("mushroom" → "bird").

---

## 11. Audio gallery (Bird-only)

| | |
|--|--|
| **Shroomzy** | *Not present* |
| **Bird** | `GET /core/gallery/audio` |
| **Response** | `{ identified: { count, files[] }, unknown: { count, files[] } }` |
| **Action** | ➕ ADD endpoint + gallery UI |

Each file item links optional `specimen` (scientificName, commonName, images, sounds).

---

## 12. Maps & geocoding

| Feature | Shroomzy | Birdzy today | Action |
|---------|----------|--------------|--------|
| Backend maps proxy | `/maps/*` | `maps.api.ts` | ✅ KEEP if Bird backend exposes same |
| OpenStreetMap geocode | `GEOCODING_API_KEY` + geocode.maps.co | Same | ✅ KEEP — set key in env |
| Static maps | `GOOGLE_MAPS_API_KEY` in frontend | Same | ✅ KEEP — set key in env |
| Identify location | `userLocation` on identify | Same | ✅ KEEP |

---

## 13. Notifications

| | |
|--|--|
| **Endpoint** | `POST {NOTIFICATION_BASE_URL}/device` |
| **Header** | `x-app-code: APP_CODE` |
| **Shroomzy values** | `Mushrooms` / `MushroomsDev` |
| **Bird target** | `Birds` / `BirdsDev` |
| **Code** | `notification.api.ts`, `device.store.ts` |

---

## 14. Type & file rename plan

| Current (Shroomzy name) | Target (Bird name) | Priority |
|-------------------------|-------------------|----------|
| `MushroomMatch` | `BirdMatch` | P0 |
| `MushroomSpecimen` | `BirdSpecimen` | P0 |
| `MushroomListItem` / `MushroomDetail` | `BirdListItem` / `BirdDetail` | P0 |
| `mushroomApiMappers.ts` | `birdApiMappers.ts` | P0 |
| `mushroomOptions.ts` | `birdOptions.ts` | P0 |
| `mushrooms.store.ts` | `birds.store.ts` or `catalogue.store.ts` | P1 |
| `mushrooms.api.ts` | Merge into `core.api.ts` or `catalogue.api.ts` | P1 |
| `mushrooms.repository.ts` | `catalogue.repository.ts` | P1 |
| `mushroomSpecimen.service.ts` | `birdSpecimen.service.ts` | P1 |
| `types/mushrooms.types.ts` | `types/birds.types.ts` | P0 |

---

## 15. UI / copy migration (non-API but coupled)

| Shroomzy UI | Bird target | Key files |
|-------------|-------------|-----------|
| Mushroom of the Day modal | Bird of the Day | `HomeScreen`, `HomeMushroomCornerSection`, `@birdzy_species_of_day_*` keys |
| Edibility / toxicity badges | Conservation status, ID marks | Detail screens, identify results |
| Mushroom safety disclaimer | Bird watching / no medical claims | `mushroomOptions.ts` |
| Quiz (`which_shroom`) | Bird quiz or remove | `src/features/quiz/` |
| Onboarding mineral art | Bird onboarding | `OnboardingScreen*` |
| Permission strings ("mushrooms") | "birds" | `ios/Birdzy/Info.plist`, Android strings |

---

## 16. Recommended migration order

```
Phase 0  Set API_BASE_URL, APP_CODE, Firebase (config)
Phase 1  Types + mappers (P0 files) — no UI
Phase 2  Identify + chat + catalogue list/detail (core flows)
Phase 3  Collection + specimen CRUD + edit forms
Phase 4  New Bird endpoints (sound ID, gallery, step-by-step, got-bitten)
Phase 5  Remove MUSHROOMS.* legacy + specimen/filteritems + bundled JSON
Phase 6  UI rename, assets, strings, analytics events
```

---

## 17. Quick reference — endpoint matrix

| Feature | HTTP | Shroomzy code | Bird doc | Status |
|---------|------|---------------|----------|--------|
| Image ID | POST `/core/ai/identify` | ✅ | ✅ | 🔄 retype |
| Sound ID | POST `/core/ai/identify-sound` | ❌ | ✅ | ➕ add |
| Chat | POST `/core/chat` | ✅ | ✅ | 🔄 copy |
| Got bitten | POST `/got-bitten` | ❌ | ✅ | ➕ add |
| Archetype list | POST `/core/archetypes/fetchAll` | ✅ | ✅ | 🔄 filters |
| Archetype detail | GET `/core/archetypes/getDetails/:id` | ✅ | ✅ | 🔄 retype |
| Archetype filters | GET `/core/archetypes/filteritems` | ✅ | ✅ | 🔄 fields |
| Archetype stats | GET `/core/archetypes/stats` | ✅ | ✅ | 🔄 shape |
| Step-by-step | POST `/core/archetypes/step-by-step` | ✅ | ✅ | ✅ verified dev |
| Specimens of day | GET `/core/archetypes/specimens-of-the-day` | ✅ | ⚠️ | ✅ verified dev |
| Identified | PUT `/core/archetypes/identified/add/:id` | ✅ | ✅ | ✅ keep |
| Wishlist | PUT/DELETE wishlist | ✅ | ✅ | ✅ verified dev |
| Specimen CRUD | `/core/specimen/*` | ✅ | ✅ | 🔄 retype |
| Collections CRUD | `/core/collections/*` | ✅ | ✅ | ✅ verified dev |
| Audio gallery | GET `/core/gallery/audio` | ✅ | ✅ | ✅ fixed path |
| Auth (19) | `/auth/*` | ✅ | ✅ | ✅ verified dev |
| Legacy search/healing/popular | various | ⚠️ partial | ❌ | ❌ remove |

---

*This document is the master map for Bird API/domain work. Update it when backend confirms ambiguous endpoints (specimens-of-the-day, maps proxy).*
