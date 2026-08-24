#!/usr/bin/env node
/**
 * Finalize Birdzy asset structure:
 * 1. Delete verified-unused assets (from asset-audit.json)
 * 2. Move loose root folders into common/home/branding/feature structure
 * 3. Update import paths across src/
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "src/assets");
const SRC = path.join(ROOT, "src");
const AUDIT = path.join(ROOT, "docs/asset-audit.json");

/** [fromRelative, toRelative] — directories or files under src/assets */
const MOVES = [
  // Common shared UI
  ["fonts", "common/fonts"],
  ["emptystate", "common/emptystate"],
  ["navigation", "common/navigation"],
  ["modal", "common/modal"],
  ["social", "common/social"],
  ["bottomTab", "common/bottomTab"],
  // Branding / splash
  ["background", "branding/splash/background"],
  // Home
  ["banner", "home/images/banner"],
  // Feature folders
  ["auth", "onboarding/auth"],
  ["post_onboarding", "onboarding/post_auth"],
  ["discount", "subscription/discount"],
  ["camera", "identification/camera"],
  ["details", "collection/details"],
  ["popUp", "home/popup"],
  ["icons/catalogue", "catalogue/icons"],
  ["icons/collection", "collection/icons"],
  ["icons/mushroom", "catalogue/icons/species"],
  // Merge lone ai/ file
  ["ai/send.png", "askai/send.png"],
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function movePath(fromRel, toRel) {
  const from = path.join(ASSETS, fromRel);
  const to = path.join(ASSETS, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`SKIP missing: ${fromRel}`);
    return false;
  }
  ensureDir(path.dirname(to));
  if (fs.existsSync(to)) {
    console.warn(`SKIP exists: ${toRel}`);
    return false;
  }
  fs.renameSync(from, to);
  console.log(`MOVED: ${fromRel} → ${toRel}`);
  return true;
}

function deleteUnused() {
  const audit = JSON.parse(fs.readFileSync(AUDIT, "utf8"));
  let deleted = 0;
  for (const rel of audit.unused) {
    const p = path.join(ASSETS, rel);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`DELETED: ${rel}`);
      deleted++;
    }
  }
  // Remove empty ai/ after moving send.png
  const aiDir = path.join(ASSETS, "ai");
  if (fs.existsSync(aiDir) && fs.readdirSync(aiDir).length === 0) {
    fs.rmdirSync(aiDir);
    console.log("REMOVED empty: ai/");
  }
  // Remove empty icons/ if all subdirs moved
  const iconsDir = path.join(ASSETS, "icons");
  if (fs.existsSync(iconsDir)) {
    const remaining = fs.readdirSync(iconsDir);
    if (remaining.length === 0) fs.rmdirSync(iconsDir);
    else console.log(`icons/ still has: ${remaining.join(", ")}`);
  }
  // Remove empty subscription/icon if unused icons deleted
  for (const d of ["subscription/icon", "subscription/background/light", "subscription/background/dark"]) {
    const full = path.join(ASSETS, d);
    if (fs.existsSync(full) && fs.readdirSync(full).length === 0) {
      fs.rmdirSync(full);
      console.log(`REMOVED empty: ${d}/`);
    }
  }
  console.log(`Deleted ${deleted} unused assets`);
}

function walkTs(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules") walkTs(p, files);
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
  return files;
}

function updateImportPaths() {
  const replacements = MOVES.map(([from, to]) => ({
    from: `./${from}`,
    to: `./${to}`,
  }));
  // Also update paths without leading ./
  for (const [from, to] of MOVES) {
    replacements.push({ from: `assets/${from}`, to: `assets/${to}` });
  }

  const files = [path.join(ASSETS, "index.ts"), path.join(ASSETS, "identificationTipImages.ts")].filter(fs.existsSync);
  let changed = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    let orig = content;
    for (const { from, to } of replacements) {
      content = content.split(from).join(to);
    }
    if (content !== orig) {
      fs.writeFileSync(file, content);
      changed++;
    }
  }
  console.log(`Updated imports in ${changed} source files`);
}

function updateRootConfigs() {
  const rnConfig = path.join(ROOT, "react-native.config.js");
  let c = fs.readFileSync(rnConfig, "utf8");
  c = c.replace("./src/assets/fonts/", "./src/assets/common/fonts/");
  fs.writeFileSync(rnConfig, c);
  console.log("Updated react-native.config.js fonts path");
}

// Run
console.log("=== Finalize Birdzy Assets ===\n");
console.log("-- Deleting unused --");
deleteUnused();
console.log("\n-- Moving folders --");
for (const [from, to] of MOVES) movePath(from, to);
console.log("\n-- Updating imports --");
updateImportPaths();
updateRootConfigs();
console.log("\nDone.");
