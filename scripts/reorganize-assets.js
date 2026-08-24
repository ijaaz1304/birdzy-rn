#!/usr/bin/env node
/**
 * Reorganize Birdzy assets into common/, branding/, and feature folders.
 * Updates src/assets/index.ts import paths after moves.
 */
const fs = require("fs");
const path = require("path");

const ASSETS_ROOT = path.join(__dirname, "../src/assets");
const INDEX_FILE = path.join(ASSETS_ROOT, "index.ts");

/** Moves: [fromRelative, toRelative] */
const MOVES = [
  // Common UI icons
  ["icons/cancel.svg", "common/icons/cancel.svg"],
  ["icons/cancel_dark.svg", "common/icons/cancel_dark.svg"],
  ["icons/upload.svg", "common/icons/upload.svg"],
  ["feed/notification.svg", "common/icons/notification.svg"],
  ["feed/notification_dark.svg", "common/icons/notification_dark.svg"],
  // Branding
  ["onboarding/light/app_icon.webp", "branding/app-icon/app_icon.webp"],
  // Home assets — rename mushroom-specific filenames to neutral placeholders
  ["home/mushroom_of_day.webp", "home/species_of_day.webp"],
  ["home/dark/mushroom_of_day.png", "home/dark/species_of_day.png"],
  ["home/find_shrooms.webp", "home/find_species.webp"],
  ["home/dark/find_shrooms.png", "home/dark/find_species.png"],
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveAsset(fromRel, toRel) {
  const from = path.join(ASSETS_ROOT, fromRel);
  const to = path.join(ASSETS_ROOT, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`SKIP (missing): ${fromRel}`);
    return false;
  }
  ensureDir(to);
  fs.renameSync(from, to);
  console.log(`MOVED: ${fromRel} → ${toRel}`);
  return true;
}

function updateIndexImports() {
  let content = fs.readFileSync(INDEX_FILE, "utf8");
  for (const [fromRel, toRel] of MOVES) {
    const fromPath = `./${fromRel}`.replace(/\.(webp|png|svg|jpg)$/, "");
    const toPath = `./${toRel}`.replace(/\.(webp|png|svg|jpg)$/, "");
    // Replace require/import paths
    content = content.split(`"${fromPath}`).join(`"${toPath}`);
    content = content.split(`'${fromPath}`).join(`'${toPath}`);
    // Also handle full paths with extension in require()
    const fromWithExt = `./${fromRel}`;
    const toWithExt = `./${toRel}`;
    content = content.split(fromWithExt).join(toWithExt);
  }
  fs.writeFileSync(INDEX_FILE, content);
  console.log("Updated index.ts imports");
}

// Create feature folder structure (only if not exists)
const FEATURE_DIRS = [
  "common/icons",
  "common/images",
  "common/illustrations",
  "branding/app-icon",
  "branding/splash",
  "branding/logo",
  "home/icons",
  "home/images",
  "identification",
  "collection",
  "catalogue",
  "feed",
  "onboarding",
];
for (const dir of FEATURE_DIRS) {
  fs.mkdirSync(path.join(ASSETS_ROOT, dir), { recursive: true });
}

// Move iconfix to common (entire folder contents)
const iconfixSrc = path.join(ASSETS_ROOT, "iconfix");
const iconfixDest = path.join(ASSETS_ROOT, "common/iconfix");
if (fs.existsSync(iconfixSrc) && !fs.existsSync(iconfixDest)) {
  fs.renameSync(iconfixSrc, iconfixDest);
  console.log("MOVED: iconfix/ → common/iconfix/");
  let content = fs.readFileSync(INDEX_FILE, "utf8");
  content = content.split("./iconfix/").join("./common/iconfix/");
  fs.writeFileSync(INDEX_FILE, content);
}

for (const [from, to] of MOVES) {
  moveAsset(from, to);
}

updateIndexImports();
console.log("Asset reorganization complete.");
