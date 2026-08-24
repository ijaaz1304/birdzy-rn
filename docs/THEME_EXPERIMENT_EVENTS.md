# Dark / Light Mode Experiment — Firebase Events

Shroom AI dark-mode A/B (`dark_mode_test`). Copy these names into Firebase Console, DebugView, and GA4.

**Projects:** `mushrooms-app-dev` (dev) → `mushrooms-app-dfdc5` (prod)

You do **not** pre-create Analytics event names in Console. They appear after the app logs them. Remote Config **does** need to be added and published.

---

## Experiment plan

| Arm | Remote Config `theme_default` | Theme | Settings → Appearance |
|-----|-------------------------------|-------|------------------------|
| **Variant A (control)** | `system` or `variant_a` | Follows device | Visible |
| **Variant B** | `light` or `variant_b` | Locked to Light | Hidden |

- Split: 50 / 50 in Firebase A/B Testing (not in app code).
- In-app default if RC is missing: `system` (Variant A).
- Returning users who already picked a theme stay on Variant A behavior (preference is not overwritten).
- Variant B always forces Light and hides Appearance.

**Goals:** D1 retention, D7 retention. Secondary: session duration, `identification_done_success`.

---

## Remote Config (add in Console)

**Firebase → Remote Config → Add parameter → Publish**

| Parameter | Type | Default | Allowed values |
|-----------|------|---------|----------------|
| `theme_default` | String | `system` | `system`, `light`, `variant_a`, `variant_b` |

`darkModeEnabled` already exists. This experiment uses **`theme_default` only**.

---

## Analytics events

Every event also gets auto-attached context: `date`, `time`, `user_id`, `country`, `platform`.

All custom params are **strings** (booleans are sent as `"true"` / `"false"`).

### 1. `theme_experiment_variant_assigned`

Fired once per app process on cold start, when the experiment assignment is applied.

| Param | Example | Meaning |
|-------|---------|---------|
| `variant` | `variant_a` / `variant_b` | Arm |
| `theme_default` | `system` / `light` / `variant_a` / `variant_b` | Raw RC value |
| `initial_theme` | `system` / `light` | Mapped initial theme mode |
| `appearance_enabled` | `true` / `false` | Whether Appearance is shown |

### 2. `experiment_exposure`

Fired once with assignment (same moment as above). Use for A/B exposure cross-check.

| Param | Example | Meaning |
|-------|---------|---------|
| `experiment_id` | `dark_mode_test` | Experiment name |
| `variant` | `variant_a` / `variant_b` | Arm |
| `theme_default` | `system` / `light` | Raw RC value |
| `rc_source` | `remote_config` | Source |

### 3. `theme_default_applied`

Fired once when the RC default is written into the theme store.

**Variant B**

| Param | Example |
|-------|---------|
| `variant` | `variant_b` |
| `theme_default` | `light` |
| `theme` | `light` |
| `source` | `remote_config` |
| `changed` | `true` / `false` |
| `locked` | `true` |

**Variant A** (only if the user has not already chosen a theme)

| Param | Example |
|-------|---------|
| `variant` | `variant_a` |
| `theme_default` | `system` |
| `theme` | `system` |
| `source` | `remote_config` |
| `changed` | `true` / `false` |

### 4. `appearance_settings_opened`

Fired when the user taps **Settings → Appearance** (Variant A only).

| Param | Example |
|-------|---------|
| `current_theme` | `light` / `dark` / `system` |
| `experiment_variant` | `variant_a` / `variant_b` |

### 5. `theme_changed`

Fired when the user picks Light, Dark, or System on the Appearance screen.

| Param | Example |
|-------|---------|
| `previous_theme` | `system` |
| `new_theme` | `dark` |
| `experiment_variant` | `variant_a` |

### 6. `theme_mode_changed`

Same user action as `theme_changed`, with an explicit `theme_mode` + `source` (matches Rockzy).

| Param | Example |
|-------|---------|
| `theme_mode` | `light` / `dark` / `system` |
| `previous_theme` | `system` |
| `source` | `appearance_settings` |
| `experiment_variant` | `variant_a` |

---

## User properties

Set on assignment and updated when the user changes Appearance.

| Property | Values |
|----------|--------|
| `theme_exp_variant` | `variant_a`, `variant_b` |
| `theme_default` | `system`, `light`, `variant_a`, `variant_b` |
| `theme_mode` | `light`, `dark`, `system` |

---

## Copy-paste list (Firebase / GA4)

```
theme_experiment_variant_assigned
theme_default_applied
experiment_exposure
appearance_settings_opened
theme_changed
theme_mode_changed
```

Optional conversions / A/B secondary metrics: `theme_changed`, `theme_mode_changed`, `identification_done_success`.

---

## Where they fire in code

| Event | File |
|-------|------|
| Assignment, exposure, default applied | `src/features/theme/themeExperiment.service.ts` |
| Appearance opened | `src/features/settings/screens/SettingsScreen.tsx` |
| Theme changed | `src/features/settings/screens/AppearanceScreen.tsx` |
| Event name catalog | `src/services/analytics/analytics.events.ts` |

---

## How to verify

1. Rebuild the app (events are in this build, not Console).
2. Firebase → **Analytics → DebugView**.
3. Cold start → expect `theme_experiment_variant_assigned`, `experiment_exposure`, `theme_default_applied`.
4. Variant A: Settings → Appearance → change mode → `appearance_settings_opened`, `theme_changed`, `theme_mode_changed`.
5. Variant B: force `theme_default` = `light` in Remote Config (Test with device) → Appearance row gone; no appearance events.

Events list in Console can lag up to 24 hours. DebugView is immediate.
