# Birdzy Domain Migration Inventory

> **Status:** Core API/domain migration **largely complete in code** (Aug 2026).  
> **Master map:** `docs/API_DOMAIN_MAPPING.md`

---

## Completed in code

| Area | Status |
|------|--------|
| Bird API base URLs + auth/core smoke test | ✅ |
| Audio gallery path `/core/gallery/audio` | ✅ |
| Archetype filters (`/core/archetypes/filteritems`) | ✅ |
| Bird identify-sound, step-by-step, got-bitten endpoints in `core.api.ts` | ✅ |
| `birdApiMappers.ts` + `birds.store.ts` | ✅ |
| Internal routes: `BirdDetails`, `EditBirdDetails`, `BirdPersonalityStack` | ✅ |
| `features/bird-personality/` (was rock-personality) | ✅ |
| Deep links: `feed/post/:id`, `bird/:id`, `sighting/:id`, `bird-personality` | ✅ |
| Bird of the Day → `GET /core/archetypes/specimens-of-the-day` | ✅ |
| Community report → Firestore `reports` + local hide (`feed.service.ts`) | ✅ |
| String keys renamed (`birdOfTheDay`, `myBirds`, etc.) | ✅ |

---

## Still manual / backend-dependent

| Item | Owner |
|------|--------|
| Firebase project + Remote Config deploy | Ops |
| Prod API host confirm | Backend |
| Species range **GeoJSON polygons** on detail map | Backend + future client overlay |
| `POST /got-bitten` deploy on dev/prod | Backend |
| Store IAP SKUs + listings | App Store / Play |

---

## Legacy names (intentional shims)

| Old | New / shim |
|-----|------------|
| `mushrooms.store.ts` | Re-exports `birds.store.ts` |
| `mushroomApiMappers.ts` | Delegates to `birdApiMappers.ts` |
| Screen files `MushroomDetailsScreen.tsx`, etc. | Route names updated; file rename deferred |

---

## Related docs

- `docs/API_DOMAIN_MAPPING.md` — endpoint matrix + live verification
- `docs/API_CORE.md` — core module reference
- `docs/REMAINING_CHECKLIST.md` — release checklist
