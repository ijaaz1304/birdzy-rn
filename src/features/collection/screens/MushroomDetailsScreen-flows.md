# Mushroom Details Screen – Flow Chart

How the screen is shown based on **source** and **premium** status.

---

## Visual flow (Mermaid)

```mermaid
flowchart TB
  subgraph Entry["Route params"]
    source[source: catalogue | collection | identification | rockOfTheDay]
    isPremium[isPremium]
  end

  subgraph States["Screen states"]
    loading[loading?]
    noData[mineralData null?]
    layoutChoice[Which layout?]
  end

  subgraph AI["AI Layout (Hero → OtherMatches → Title → Tabs → Content)"]
    A1[Catalogue FREE]
    A2[Rock of the Day]
    A3[Identification]
    A1 --> A1t[Catalogue free: Physical/Chemical = Go Premium]
    A2 --> A2t[Rock of Day: All tabs full]
    A3 --> A3t[Identification: Physical/Chemical = Go Premium\n+ Other Matches + Rate match + Add to Collection + Wishlist btn]
  end

  subgraph Full["Full Layout (Carousel → Header → Tabs → Content)"]
    F1[Collection]
    F2[Catalogue PREMIUM]
    F1 --> F1t[All tabs full, Wishlist in header if not identification]
    F2 --> F2t[All tabs full, Wishlist in header]
  end

  source --> loading
  loading -->|yes| Skeleton[CardSkeleton]
  loading -->|no| noData
  noData -->|yes & identification| Empty[Empty state + tab bar]
  noData -->|yes & other| Skeleton
  noData -->|no| layoutChoice

  layoutChoice -->|Catalogue free OR RockOfDay OR Identification| AI
  layoutChoice -->|else| Full
```

---

## 1. Route params

| Param                   | Values / meaning                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `mineralId`             | ID of mineral (archetype or specimen)                                                                        |
| `source`                | `'catalogue'` \| `'collection'` \| `'identification'` \| `'rockOfTheDay'`                                    |
| `collectionName`        | e.g. `'Identified'` when from Identified tab                                                                 |
| `idType`                | `'specimen'` when opening by specimen ID                                                                     |
| `otherMatches`          | Array of other AI matches (identification only)                                                              |
| `fromCollectionDetails` | When true, Back returns to Collection Details (e.g. when opened from Identified/Wishlist/custom collection). |

**Collection Details navigation:** When opening from Collection Details screen, we pass an effective source so behavior matches identification or catalogue: from **Identified / created collection / Owned** we pass `source: 'identification'` (Go Pro for free, Add to Collection, etc.); from **Wishlist** we pass `source: 'catalogue'` and `collectionName: 'Wishlist'` (catalogue-style UI, wishlist CTA). Free users from any collection see the Go Pro prompt on Physical/Chemical/Maintenance/Spirituality tabs.

Derived:

- **isFromIdentification** = `source === 'identification'`
- **isCatalogueFreeUser** = `source === 'catalogue' && !isPremium`
- **isFromCollectionFreeUser** = `source === 'collection' && !isPremium` (legacy; collection details now pass identification/catalogue)
- **showGoProForFreeUser** = any of the above (Go Pro icon on gated tabs for free users)
- **canEdit** = identification **or** (collection + Identified tab)

---

## 2. Top-level flow

```
                    ┌─────────────────────┐
                    │ BirdDetailsScreen│
                    │ (route params in)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ loading === true ?  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │ YES            │                 │ NO
              ▼                │                 │
    ┌─────────────────┐        │                 │
    │ CardSkeleton   │        │                 │
    │ (no data yet)  │        │                 │
    └─────────────────┘        │                 │
                               │        ┌────────▼────────┐
                               │        │ mineralData     │
                               │        │ === null ?      │
                               │        └────────┬────────┘
                               │                 │
                               │     ┌───────────┼───────────┐
                               │     │ YES       │            │ NO
                               │     │           │            │
                               │     ▼           │            │
                               │  ┌──────────────▼──────────────┐
                               │  │ source === 'identification'? │
                               │  └──────────────┬──────────────┘
                               │                 │
                               │    ┌────────────┼────────────┐
                               │    │ YES        │            │ NO
                               │    ▼            │            │
                               │  Empty state:   │            │
                               │  Header +       │            │
                               │  "Mineral       │            │
                               │  details will   │            │
                               │  appear here"   │            │
                               │  + tab bar      │            │
                               │                 │            │
                               │                 │            ▼
                               │                 │   ┌────────────────────────────────┐
                               │                 │   │ Which LAYOUT branch?            │
                               │                 │   │ (isCatalogueFreeUser OR         │
                               │                 │   │  rockOfTheDay OR identification)│
                               │                 │   └────────────────┬───────────────┘
                               │                 │                    │
                               │                 │     ┌──────────────┴──────────────┐
                               │                 │     │ YES                         │ NO
                               │                 │     ▼                             ▼
                               │                 │  AI LAYOUT                    FULL LAYOUT
                               │                 │  (see §3)                     (see §4)
                               │                 │
```

---

## 3. AI Layout branch

**When:** `(source === 'catalogue' && !isPremium)` **OR** `source === 'rockOfTheDay'` **OR** `source === 'identification'`

**Structure:** One scroll with `MushroomDetailsAILayout` + `renderTabContent()` as children.

| Section                                        | Catalogue free | Rock of the Day | Identification                 |
| ---------------------------------------------- | -------------- | --------------- | ------------------------------ |
| Hero (carousel)                                | ✅             | ✅              | ✅                             |
| Other Possible Matches                         | ❌             | ❌              | ✅ (if `otherMatches?.length`) |
| Rock title (name, synonym, price, name origin) | ✅             | ✅              | ✅                             |
| Tabs (Overview / Physical / Chemical)          | ✅             | ✅              | ✅                             |
| **Tab content**                                | See below      | See below       | See below                      |
| Wishlist button (full width below tabs)        | ❌             | ❌              | ✅                             |
| Show more rocks (1/3) bar                      | ❌             | ✅              | ❌                             |

**Tab content in this branch:**

| Tab      | Catalogue free (not premium)    | Rock of the Day | Identification    |
| -------- | ------------------------------- | --------------- | ----------------- |
| Overview | Full content (renderAllContent) | Full content    | Full content      |
| Physical | Go Premium prompt (no scroll)   | Full content    | Go Premium prompt |
| Chemical | Go Premium prompt (no scroll)   | Full content    | Go Premium prompt |

- **Catalogue free:** Physical/Chemical show “Unlock Physical & Chemical properties with Premium” + Go Pro asset.
- **Identification:** Physical/Chemical show “Go Premium to view Physical & Chemical properties” + Go Pro asset.
- **Rock of the Day:** All tabs show full content (premium-style).

---

## 4. Full Layout branch

**When:** All other cases (e.g. `source === 'collection'`, or `source === 'catalogue'` with premium).

**Structure:** Classic layout in one scroll:

1. **Image carousel** (90% width, 180 height, arrows)
2. **Header block:** Name, scientific name, price, short description, name origin
3. **Wishlist button in header** (only if source is NOT catalogue / rockOfTheDay / identification)
4. **Tab bar** (`TabSwitch`: Overview / Physical / Chemical)
5. **Tab content** = `renderTabContent()` → always **full content** (renderAllContent); no Go Premium in this branch
6. **Identification-only:** full-width Wishlist button below tabs (same as in AI branch)

**Tab content:** Single scroll with all sections; switching tabs scrolls to Overview / Physical / Chemical sections (section refs).

---

## 5. renderAllContent() – what’s inside the scroll (both branches)

When the active tab shows “full content”, it’s this single block (order below). Some parts are conditional.

| Section / block                                                                              | Shown when                                                                                                                                      |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview (description, category, Wikipedia link if premium)                                  | Always (with heading)                                                                                                                           |
| Occurrence & location (commonly found in, map if premium)                                    | When data exists                                                                                                                                |
| Physical properties (flat list)                                                              | Always (heading + rows); for catalogue free / identification, user only sees this if they’re on Overview tab; Physical tab shows Go Pro instead |
| Chemical composition                                                                         | When data exists                                                                                                                                |
| Cleansing / care                                                                             | When data exists                                                                                                                                |
| Symbolism & Spirituality (toggle)                                                            | When `mineralData.isGem`                                                                                                                        |
| **Rate this match!** (emoji + message + Send)                                                | **Identification only** (`isFromIdentification`)                                                                                                |
| Other Possible Matches (horizontal list + See all)                                           | Identification only + `otherMatches?.length` (in full layout this is inside renderAllContent)                                                   |
| Add to Collection button                                                                     | Identification only and `source !== 'collection'`                                                                                               |
| (No extra “Add to Collection” in AI layout; that’s only in full content when identification) |

- **Catalogue free:** Bottom padding of tab content is 0 (blur/CTA can sit at bottom).
- **Identification:** Rate this match (and success state), Other Possible Matches, and Add to Collection are the identification-only extras.

---

## 6. Summary table – “What do I see?”

| Entry (source)      | Layout used | Other Matches | Physical/Chemical content | Rate this match | Add to Collection                                | Wishlist (where)                  |
| ------------------- | ----------- | ------------- | ------------------------- | --------------- | ------------------------------------------------ | --------------------------------- |
| Catalogue (free)    | AI Layout   | ❌            | Go Premium                | ❌              | ❌                                               | ❌                                |
| Catalogue (premium) | Full Layout | ❌            | Full                      | ❌              | ❌                                               | In header                         |
| Rock of the Day     | AI Layout   | ❌            | Full                      | ❌              | ❌                                               | ❌                                |
| Identification      | AI Layout   | ✅            | Go Premium                | ✅              | ✅ (below tabs in full branch; in content in AI) | Below tabs (full width)           |
| Collection          | Full Layout | ❌\*          | Full                      | ❌              | Only if identification + not from collection     | In header (if not identification) |

\* Other Possible Matches can appear inside renderAllContent when `isFromIdentification && otherMatches?.length`; identification can be reached from collection (e.g. tap a match), so in that case Other Matches can show in the full layout too.

---

## 7. Back button behavior

| source                      | Back goes to                           |
| --------------------------- | -------------------------------------- |
| catalogue                   | MainTabs → Catalogue → CatalogueMain   |
| rockOfTheDay                | MainTabs → Home                        |
| collection / identification | MainTabs → Collection → CollectionMain |
| (fallback)                  | MainTabs → Home                        |

---

## 8. Quick reference

- **AI Layout** = Hero → (Other Matches if identification) → Rock title → Tabs → Tab content; used for: catalogue free, rock of the day, identification.
- **Full Layout** = Carousel → Header (with optional wishlist) → Tabs → Tab content; used for: collection, catalogue premium.
- **Identification-only UI:** Other Possible Matches, Rate this match (with success state), Add to Collection, full-width Wishlist below tabs; Physical/Chemical tabs show Go Premium.
- **Catalogue free-only:** Physical/Chemical tabs show Go Premium; no Other Matches, no Rate this match, no Add to Collection.
