# Scripts

Code cleanup, migration, and tooling scripts. Run from project root. Use `--dry-run` where supported before applying.

---

## Lint (ESLint & Prettier)

- **`npm run lint`** – Reports issues only on `src` (no file changes).
- **`npm run lint:fix`** – Applies auto-fixes on `src` (e.g. removes unused imports).
- **`npm run lint:fix:warnings`** – Prefixes remaining unused identifiers with `_` (see Unused vars below).
- **`npm run lint:fix:all`** – Full pass: `lint:fix` → fix-unused-vars → `lint:fix`.
- **`npm run lint:cleanup`** – Full cleanup: `lint:fix` → fix-unused-vars → `prettier:write`.
- **`npm run lint:changed`** – Run ESLint (--fix) and Prettier only on changed files (vs `origin/main`). Pass a base ref as first arg if needed, e.g. `node scripts/lint-changed.js HEAD~1`.

**Disabled rule groups** (in `.eslintrc.js`): `react-native/no-inline-styles`, `react-native/no-raw-text`, `react-native/no-accessibility-*`, and all `jsx-a11y/*` rules. Remaining issues are real (e.g. `react-hooks/exhaustive-deps`, `no-unreachable`) and need manual edits.

---

## Environment switcher

**`switch-env.js`** – Copies `.env.dev` or `.env.prod` to `.env` so the app loads the chosen config.

```bash
node scripts/switch-env.js dev
node scripts/switch-env.js prod
```

- **`npm run env:dev`** – Switch to dev and copy `.env.dev` → `.env`.
- **`npm run env:prod`** – Switch to prod and copy `.env.prod` → `.env`.

---

## 1. Font migration

**`migrate-font-weight-to-fonts.js`** – Replace inline `fontWeight` with `fontFamily: FONTS.<weight>` and add the `FONTS` import when missing.

```bash
node scripts/migrate-font-weight-to-fonts.js
node scripts/migrate-font-weight-to-fonts.js --dry-run
```

---

## 2. Hardcoded colors

**`report-hardcoded-colors.js`** – Report mode lists all `#hex` and `rgba(...)` in `src` (skips comments and colorConstants). Replace mode applies a config and adds imports.

```bash
node scripts/report-hardcoded-colors.js
node scripts/report-hardcoded-colors.js --replace=scripts/config/color-replace.json
node scripts/report-hardcoded-colors.js --replace=scripts/config/color-replace.json --dry-run
```

- **Config:** `scripts/config/color-replace.json` – `constantsPath`: `"config/colors"`, `replacements`: map literals to `APP_COLORS.*` (source: `theme/colors.ts`).
- **Excluded:** Intentional palette files are skipped (MohsHardnessBar, ColorScale, VerticalMeter). Linear gradient arrays are left as-is.

---

## 3. Import path aliases

**`migrate-import-paths.js`** – Replaces path-alias imports (e.g. `@/services/notifications`) with relative paths. Also checks root `App.tsx`.

```bash
node scripts/migrate-import-paths.js
node scripts/migrate-import-paths.js --dry-run
```

- **Config:** `scripts/config/import-aliases.json` – `aliases`: `{ "@": "src" }`. Default used if file missing.

---

## 4. Magic numbers (radius / spacing)

**`migrate-magic-numbers.js`** – Replaces literal layout values (e.g. `borderRadius: 12`, `padding: 16`) with design tokens and adds imports.

```bash
node scripts/migrate-magic-numbers.js
node scripts/migrate-magic-numbers.js --dry-run
node scripts/migrate-magic-numbers.js --config=scripts/config/magic-numbers.json
```

- **Config:** `scripts/config/magic-numbers.json` – `replacements`: `[{ "find": "borderRadius: 12", "replaceWith": "borderRadius: Radius.md", "import": { "symbol": "Radius", "from": "design" } }]`. Edit to avoid unwanted replacements (e.g. broad `padding: 16`).

---

## 5. Unused imports and components

**`remove-unused-imports-and-components.js`** – Runs ESLint --fix to remove unused imports, and reports (optionally deletes) source files that are **not imported by any other file and not navigated to from anywhere** (i.e. no references via imports or routing).

```bash
node scripts/remove-unused-imports-and-components.js
node scripts/remove-unused-imports-and-components.js --dry-run
node scripts/remove-unused-imports-and-components.js --no-fix-imports --report-unused
node scripts/remove-unused-imports-and-components.js --delete-unused-files   # use with care
```

- **`--fix-imports`** / **`--no-fix-imports`** – Run ESLint --fix for unused imports (default: fix).
- **`--report-unused`** / **`--no-report-unused`** – Report files never imported (default: report).
- **`--delete-unused-files`** – Delete unreferenced source files (use with care; prefer `--dry-run` first).
- **`--dry-run`** – Only report; no ESLint --fix or file deletion.

Unused is determined by **import analysis only** (no scan of navigation/routes). Screens that are only reached via navigator name or `navigation.navigate('...')` can still appear in the list—review before deleting. Entry points (e.g. `App.tsx`, `index.tsx`) and patterns under `services/`, `*.service.*`, and map-related paths are never treated as unused.

---

## 6. Unused vars (fix warnings)

**`fix-unused-vars.js`** – Fixes `unused-imports/no-unused-vars` warnings by prefixing unused identifiers with `_`. Run after `lint:fix` (which removes unused imports). Use `--dry-run` to preview.

```bash
node scripts/fix-unused-vars.js --dry-run
node scripts/fix-unused-vars.js
```

Or use npm scripts:

- **`npm run lint:fix:warnings`** – Run the script once (prefix unused vars with `_`).
- **`npm run lint:fix:all`** – Run `lint:fix`, then this script, then `lint:fix` again to clear remaining fixable issues.

---

## 7. Missing testIDs (E2E)

**`report-missing-testids.js`** – Lists interactive components (TouchableOpacity, Pressable, Button, etc.) that have no `testID` prop, to prioritize adding testIDs for E2E.

```bash
node scripts/report-missing-testids.js
node scripts/report-missing-testids.js --components=Button,Pressable
```

- **`--components=Comma,List`** – Override the default component list to scan.

---

## Config files

| File                                 | Purpose                                           |
| ------------------------------------ | ------------------------------------------------- |
| `scripts/config/color-replace.json`  | Color literal → constant mapping for replace mode |
| `scripts/config/import-aliases.json` | Path alias → directory (e.g. `@` → `src`)         |
| `scripts/config/magic-numbers.json`  | Literal → token + import for layout numbers       |

---

**Recommendation:** Run with `--dry-run` first. Commit one script’s changes at a time and run tests/lint after each.
