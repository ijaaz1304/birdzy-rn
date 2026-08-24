#!/usr/bin/env node
/**
 * Revert feature/service import paths that were incorrectly changed
 * when asset folders were moved (assets/auth ≠ features/auth, etc.).
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../src");
const SKIP = path.join(SRC, "assets");

/** [regex, replacement] — applied only outside src/assets/ */
const FIXES = [
  // features/auth was wrongly prefixed with onboarding/
  [/features\/onboarding\/auth/g, "features/auth"],
  [/from "\.\.\/\.\.\/onboarding\/auth\/auth\.store"/g, 'from "../../auth/auth.store"'],
  [/from "\.\.\/onboarding\/auth\.store"/g, 'from "../auth.store"'],
  [/from "\.\/onboarding\/auth\.store"/g, 'from "./auth.store"'],
  [/from "\.\.\/onboarding\/auth\.services/g, 'from "../auth.services'],
  [/from "\.\.\/onboarding\/auth\.services/g, 'from "../auth.services'],

  // features/camera internal paths
  [/from "\.\.\/\.\.\/identification\/camera\//g, 'from "../../camera/'],
  [/from "\.\.\/identification\/camera\//g, 'from "../camera/'],
  [/from "\.\/identification\/camera\./g, 'from "./camera.'],
  [/from "\.\/identification\/camera\//g, 'from "./camera/'],
  [/export \* from "\.\/identification\/camera\./g, 'export * from "./camera.'],
  [/export \{ cameraStyles \} from "\.\/identification\/camera\./g, 'export { cameraStyles } from "./camera.'],

  // services/camera
  [/from "\.\/identification\/camera\//g, 'from "./camera/'],
  [/export \* from "\.\/identification\/camera\//g, 'export * from "./camera/'],

  // features/discount
  [/from "\.\.\/\.\.\/subscription\/discount\//g, 'from "../../discount/'],
  [/from "\.\.\/subscription\/discount\//g, 'from "../discount/'],

  // config strings
  [/from "\.\/onboarding\/auth\.strings"/g, 'from "./auth.strings"'],
  [/from "\.\/identification\/camera\.strings"/g, 'from "./camera.strings"'],
  [/from "\.\/subscription\/discount\.strings"/g, 'from "./discount.strings"'],
  [/export \* from "\.\/onboarding\/auth\.strings"/g, 'export * from "./auth.strings"'],
  [/export \* from "\.\/identification\/camera\.strings"/g, 'export * from "./camera.strings"'],
  [/export \* from "\.\/subscription\/discount\.strings"/g, 'export * from "./discount.strings"'],

  // services/background
  [/from "\.\/branding\/splash\/backgroundTask/g, 'from "./backgroundTask'],

  // api types
  [/from "\.\/onboarding\/auth\.api\.types"/g, 'from "./auth.api.types"'],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (p.startsWith(SKIP) && p !== SKIP) continue;
      if (ent.name === "node_modules") continue;
      walk(p, files);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      if (p.startsWith(SKIP)) continue;
      files.push(p);
    }
  }
  return files;
}

let fixed = 0;
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, "utf8");
  let orig = content;
  for (const [re, rep] of FIXES) {
    content = content.replace(re, rep);
  }
  if (content !== orig) {
    fs.writeFileSync(file, content);
    fixed++;
  }
}
console.log(`Fixed feature import paths in ${fixed} files`);
