# Core Module — API Reference & Birdzy Migration Map

> Trackzio Bird API Core module. All endpoints require `Authorization: Bearer <JWT>`.
> Source in code: `src/constants/api.ts` (CORE), `src/services/api/features/core.api.ts`, `core.api.types.ts`

**Base URL:** `{API_BASE_URL}` — must be configured in `.env` (Bird API host).

---

## Endpoint coverage summary

| Status | Count | Notes |
|--------|-------|-------|
| ✅ Path + method match, implemented | **21** | Shared Trackzio core architecture |
| ❌ Missing from Birdzy code | **4** | Bird-specific new endpoints |
| ⚠️ In Birdzy code, not in Bird API doc | **8+** | Legacy mushroom/minerals endpoints |
| 🔄 Endpoint exists, **types/UI need Bird migration** | **21** | Mushroom domain models throughout |

---

## AI endpoints

| Method | Path | Bird API | Birdzy code | Status |
|--------|------|----------|-------------|--------|
| POST | `/core/ai/identify` | Image identify (≤2 files, `files[]`) | `CORE.IDENTIFY` → `coreApi.identify()` | ✅ Path match — **types are mushroom** |
| POST | `/core/ai/identify-sound` | Audio identify (1 file, `files[]`) | `CORE.IDENTIFY_SOUND` → `coreApi.identifySound()` | ✅ Path in code — verify with audio file on device |
| POST | `/core/chat` | BirdBot multipart (`message`, `images[]`) | `CORE.CHAT` → `coreApi.chat()` | ✅ Path match — empty-reply canned responses exist |

### Identify response — Bird vs current code

| Bird API field | Current `MushroomMatch` | Action |
|----------------|-------------------------|--------|
| `birdsLifeId` | `gbifId` / missing | **ADD** — map as primary external ID |
| `commonName` | `commonNames[]` | **CHANGE** — single string vs array |
| `birdType`, `flightPattern`, `flightAltitude` | — | **ADD** |
| `birdWatchingTips` | — | **ADD** |
| `diet`, `habitat`, `conservationStatus` | `habitatType`, `edibility` | **REPLACE** mushroom fields |
| `soundUrls`, `userCapturedSounds` | — | **ADD** — audio gallery feature |
| `keyIdentificationMarks`, `dominantColors`, `sexDifferences` | mushroom cap/stem fields | **REPLACE** |
| `rangeDetails`, `lengthRange`, `wingspanRange`, `weightRange` | mineral/mushroom size fields | **REPLACE** |
| `metrics`, `debug` | partial similarity | **ADD** optional |
| `similarBirds` | `lookAlikes` / `confusedWith` | **RENAME** |
| `edibility`, `toxicitySeverity`, `capShape`… | present | **REMOVE** from Bird model |

### Chat known issue

Bird API documents empty first-reply on image upload. Birdzy already has canned responses in `src/constants/mushroomOptions.ts` → `EMPTY_CHAT_CANNED_RESPONSES`. ✅

---

## Specimen management (private collection)

| Method | Path | Bird API | Birdzy constant | Status |
|--------|------|----------|-----------------|--------|
| POST | `/core/specimen/add` | Add bird specimen | `SPECIMEN_ADD` | ✅ — **request body is mushroom/mineral shaped** |
| POST | `/core/specimen/fetchAll` | List + filter + pagination | `SPECIMEN_FETCH_ALL` | ✅ |
| GET | `/core/specimen/getDetails/:id` | Full specimen detail | `SPECIMEN_DETAILS` | ✅ |
| PATCH | `/core/specimen/update/:id` | Dot-notated flat keys | `SPECIMEN_UPDATE` | ✅ — **editable fields are mushroom** |
| DELETE | `/core/specimen/delete/:id` | Delete specimen | `SPECIMEN_DELETE` | ✅ |

### Bird specimen add — required fields (API)

```
scientificName, imageUrls (≥1), _collections (ObjectId[])
```

### Bird specimen add — optional Bird-specific fields

```
birdsLifeId, commonName, summary, soundUrls, userCapturedImages, userCapturedSounds,
scientificClassification.*, birdType, flightPattern, flightAltitude, birdWatchingTips.*,
diet, habitat, conservationStatus, keyIdentificationMarks, dominantColors, sexDifferences,
rangeDetails.*, lengthRange, wingspanRange, weightRange, similarBirds, _archetype, ...
```

### Current code problem

`AddMushroomSpecimenRequest` requires `canonicalName`, `gbifId`, `mindatId` — **not in Bird API**. Must be replaced with Bird fields.

`EditMushroomDetailsScreen` / `editMushroomDetails.utils.ts` — mushroom-only PATCH fields.

---

## Collection management

| Method | Path | Bird API | Birdzy | Status |
|--------|------|----------|--------|--------|
| POST | `/core/collections/add` | Create collection | `COLLECTION_ADD` | ✅ |
| GET | `/core/collections/fetchAll` | List + search + pagination | `COLLECTION_LIST` | ✅ |
| GET | `/core/collections/getDetails/:id` | Collection detail | `COLLECTION_DETAILS` | ✅ |
| PATCH | `/core/collections/update/:id` | Update name/description/imageUrl | `COLLECTION_UPDATE` | ✅ |
| DELETE | `/core/collections/delete/:id` | Delete collection | `COLLECTION_DELETE` | ✅ |
| GET | `/core/collections/stats` | `{ totalCollections }` | `COLLECTION_STATS` | ✅ |

Collection layer is **largely domain-agnostic** — minimal migration beyond UI copy.

---

## Archetype management (public catalogue)

| Method | Path | Bird API | Birdzy | Status |
|--------|------|----------|--------|--------|
| GET | `/core/archetypes/filteritems` | Distinct filter values | `ARCHETYPE_FILTER_ITEMS` | ✅ — **filter keys are mushroom in UI** |
| POST | `/core/archetypes/fetchAll` | Catalogue list + filters | `ARCHETYPE_LIST` | ✅ |
| GET | `/core/archetypes/getDetails/:id` | Archetype detail | `ARCHETYPE_DETAILS` | ✅ |
| PUT | `/core/archetypes/identified/add/:id` | Mark identified | `ARCHETYPE_IDENTIFIED_ADD` | ✅ |
| PUT | `/core/archetypes/wishlist/add/:id` | Add to wishlist | `WISHLIST_ADD` | ✅ |
| DELETE | `/core/archetypes/wishlist/remove/:id` | Remove wishlist | `WISHLIST_REMOVE` | ✅ |
| GET | `/core/archetypes/stats` | `{ all, raptors, songbirds, … }` | `ARCHETYPE_STATS` | ✅ — **stats keys differ from mushroom** |
| POST | `/core/archetypes/step-by-step` | Geo + date + size nearby birds | `ARCHETYPE_STEP_BY_STEP` → `coreApi.stepByStep()` | ✅ Verified on dev host |

### Bird catalogue filter fields (API)

```
scientificClassification.kingdom|phylum|class|order|family|genus|species
birdType, customLocation, flightPattern, flightAltitude
birdWatchingTips.bestTime, birdWatchingTips.preferredLocations
diet, habitat, lifeExpectancyInWild, conservationStatus
```

### Current filter labels (`mushroomOptions.ts`)

```
edibility, toxicitySeverity, psychoactive, capShape, capSurface, undersideType,
stemPresence, ringPresent, volvaPresent, habitatType, geographicDistribution
```

**Full replacement required** for catalogue filter UI.

---

## Missing / optional endpoints

| Method | Path | Purpose | Priority | Dev host |
|--------|------|---------|----------|----------|
| POST | `/got-bitten` | Bite analysis assistant | Low | ❌ 404 — confirm deploy/path with backend |

## Bird endpoints in Birdzy (verified or implemented)

| Method | Path | Purpose | Birdzy | Dev host |
|--------|------|---------|--------|----------|
| POST | `/core/ai/identify-sound` | Audio bird identification | `coreApi.identifySound()` | ⚠️ Not smoke-tested (needs audio file) |
| POST | `/core/archetypes/step-by-step` | Location-based discovery | `coreApi.stepByStep()` | ✅ 200 |
| GET | `/core/gallery/audio` | Audio gallery | `coreApi.getGalleryAudio()` | ✅ 200 — **not** `/gallery/audio` |

---

## Legacy endpoints in Birdzy (not in Bird API doc)

These exist in `API_ENDPOINTS.CORE` or `MUSHROOMS` but are **not documented** for Bird:

| Path | In code | Action |
|------|---------|--------|
| `GET /core/specimen/filteritems` | `FILTER_ITEMS` | **Do not use** — returns 500 on Bird dev; use `archetypes/filteritems` |
| `GET /core/specimen/stats` | `SPECIMEN_STATS` | Verify with backend or remove |
| `GET /core/archetypes/specimens-of-the-day` | `SPECIMENS_OF_THE_DAY` | ✅ Verified on dev — Bird of the Day |
| `POST /core/archetypes/search` | `MUSHROOMS.SEARCH` | **REMOVE** — use `fetchAll` + `search` query param |
| `POST /core/archetypes/healing-crystals` | `MUSHROOMS.HEALING_CRYSTALS` | **REMOVE** — minerals legacy |
| `POST /core/archetypes/popular` | `MUSHROOMS.POPULAR` | Verify or remove |
| `POST /core/archetypes/costliest` | `MUSHROOMS.COSTLIEST` | **REMOVE** — minerals legacy |
| `GET /core/archetypes/count` | `MUSHROOMS.COUNT` | Verify or remove |
| `/core/archetypes/{id}/favorite` | `MUSHROOMS.FAVORITE` | **REMOVE** — use wishlist endpoints |

---

## Code files requiring migration

### API layer (rename + retype)

| File | Migration |
|------|-----------|
| `src/services/api/features/core.api.types.ts` | Replace `MushroomMatch`, `MushroomSpecimen`, `MushroomArchetype*` with `BirdMatch`, `BirdSpecimen`, `BirdArchetype*` |
| `src/services/api/features/core.api.ts` | Add missing endpoints; update comments |
| `src/constants/api.ts` | Add new endpoints; remove `MUSHROOMS` legacy block; rename to `BIRDS` or fold into `CORE` |
| `src/utils/mushroomApiMappers.ts` | **Major rewrite** → `birdApiMappers.ts` |
| `src/services/api/mushrooms.api.ts` | Rename → `birds.api.ts` or merge into repository |
| `src/lib/repositories/mushrooms.repository.ts` | Rename → `birds.repository.ts` |

### Feature modules

| Module | Files | Migration |
|--------|-------|-----------|
| **Camera / Identify** | `identifyImageFlow.ts`, `DiagnosisLoadingScreen.tsx`, `OtherPossibleMatchesScreen.tsx` | Bird match UI, sound ID entry point |
| **Ask AI** | `AskAIScreen.tsx`, chat hooks | Copy: mushroom → bird; keep canned responses |
| **Catalogue** | `CatalogueScreen.tsx`, `SearchScreen.tsx`, `mushrooms.store.ts` | Bird filters, stats tabs (raptors/songbirds/etc.) |
| **Collection** | `MushroomDetailsScreen.tsx`, `EditMushroomDetailsScreen.tsx` | Bird detail sections (sound, flight, range, conservation) |
| **Home** | `HomeMushroomCornerSection.tsx`, species of day | Bird of the Day |
| **Constants** | `mushroomOptions.ts`, `mushrooms.config.ts` | → `birdOptions.ts`, `birds.config.ts` |
| **Bundled data** | `new_mushroom_search.json` | Replace with Bird search index or remove (API search) |

### Types currently mushroom/mineral shaped

```
MushroomMatch          → BirdMatch (+ birdsLifeId, soundUrls, birdType, …)
MushroomSpecimen       → BirdSpecimen
MushroomArchetype      → BirdArchetype
AddMushroomSpecimenRequest → AddBirdSpecimenRequest (drop mindatId/gbifId requirements)
UpdateMushroomSpecimenRequest → UpdateBirdSpecimenRequest (bird PATCH fields)
MushroomArchetypeFilterRequest → BirdArchetypeFilterRequest (bird filter keys)
```

---

## Archetype stats — Bird API shape

```json
{
  "all": 11185,
  "raptors": 324,
  "songbirds": 6541,
  "waterBirds": 1109,
  "threatened": 1075,
  "soaring": 213
}
```

Current mapper (`mushroomApiMappers.ts`) expects mushroom-oriented stats — **must update catalogue tab logic**.

---

## Implementation priority (recommended order)

### Phase 1 — Types + mappers (no UI yet)
1. Add `BirdMatch`, `BirdSpecimen`, `BirdArchetype` types matching API doc
2. Rewrite `birdApiMappers.ts` from API responses
3. Add endpoint constants for missing paths

### Phase 2 — Wire existing flows to Bird types
4. Image identify flow (`/core/ai/identify`)
5. Catalogue (`filteritems` + `fetchAll` + `getDetails`)
6. Collection CRUD (`specimen/*`, `collections/*`)
7. Wishlist / identified (`archetypes/wishlist/*`, `identified/add`)
8. Ask AI chat (`/core/chat`)

### Phase 3 — New Bird features
9. Sound identification (`/core/ai/identify-sound`)
10. Audio gallery (`/core/gallery/audio`)
11. Step-by-step geo discovery (`/core/archetypes/step-by-step`)
12. Optional: `/got-bitten`

### Phase 4 — Cleanup
13. Remove legacy `MUSHROOMS.*` endpoints and minerals references
14. Replace bundled `new_mushroom_search.json`
15. Update all UI copy, safety disclaimers, filter labels

---

## Config checklist

| Item | Status |
|------|--------|
| `API_BASE_URL` → Bird API host | Empty — required |
| `APP_CODE` for notification service | Empty |
| Audio recording permissions (iOS/Android) | Needed for identify-sound + gallery |
| Bird safety disclaimers (replace mushroom edibility warnings) | Pending |

---

## Related files

| File | Role |
|------|------|
| `src/constants/api.ts` | Endpoint paths |
| `src/services/api/features/core.api.ts` | HTTP implementation |
| `src/services/api/features/core.api.types.ts` | Types (mushroom — needs Bird rewrite) |
| `src/utils/mushroomApiMappers.ts` | Response normalizers |
| `src/constants/mushroomOptions.ts` | Filter labels + chat canned responses |
| `src/features/catalogue/mushrooms.store.ts` | Catalogue state |
| `src/features/camera/identifyImageFlow.ts` | Identify pipeline |
| `docs/API_AUTH.md` | Auth module (already aligned) |
