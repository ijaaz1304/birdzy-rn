#!/usr/bin/env node
/** Fix import paths broken by overly broad asset migration replacements. */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../src");
const ASSETS_INDEX = path.join(SRC, "assets/index.ts");

const FIXES = [
  [/common\/navigation/g, "navigation"],
  [/from "\.\/common\/modals\.constants"/g, 'from "./modals.constants"'],
  [/from '\.\/common\/modals\.constants'/g, "from './modals.constants'"],
  [/from "\.\/common\/modals\.strings"/g, 'from "./modals.strings"'],
  [/from '\.\/common\/modals\.strings'/g, "from './modals.strings'"],
  [/from "\.\/common\/modalTokens"/g, 'from "./modalTokens"'],
  [/from '\.\/common\/modalTokens'/g, "from './modalTokens'"],
  [/from "\.\/onboarding\/authUtils"/g, 'from "./authUtils"'],
  [/from "\.\/common\/modalHelpers"/g, 'from "./modalHelpers"'],
  [/from '\.\/common\/modalHelpers'/g, "from './modalHelpers'"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules") walk(p, files);
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
  return files;
}

let fixed = 0;
for (const file of walk(SRC)) {
  if (file === ASSETS_INDEX) continue; // keep asset paths like ./common/navigation/go_back.png
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
console.log(`Fixed imports in ${fixed} files`);
