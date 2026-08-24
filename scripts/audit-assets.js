#!/usr/bin/env node
/**
 * Audit src/assets: find referenced vs unreferenced files.
 * Scans: index.ts, identificationTipImages.ts, all src/ imports, native res references.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "src/assets");
const SRC = path.join(ROOT, "src");
const ANDROID = path.join(ROOT, "android");
const IOS = path.join(ROOT, "ios");

const IMAGE_EXT = /\.(png|webp|svg|jpg|jpeg|gif|otf|ttf)$/i;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function readTextFiles(dir) {
  const out = [];
  for (const f of walk(dir)) {
    if (/node_modules|\.git|build|Pods/.test(f)) continue;
    const ext = path.extname(f).toLowerCase();
    if (![".ts", ".tsx", ".js", ".jsx", ".json", ".xml", ".plist", ".swift", ".kt", ".java", ".gradle", ".html", ".md"].includes(ext)) continue;
    try {
      out.push({ file: f, content: fs.readFileSync(f, "utf8") });
    } catch (_) {}
  }
  return out;
}

const assetFiles = walk(ASSETS).filter((f) => IMAGE_EXT.test(f) || f.endsWith(".ts"));
const searchCorpus = readTextFiles(SRC)
  .concat(readTextFiles(ANDROID))
  .concat(readTextFiles(IOS))
  .concat(readTextFiles(path.join(ROOT, "hosting")));

function basenameRef(p) {
  return path.basename(p);
}

function isReferenced(assetPath) {
  const rel = path.relative(ASSETS, assetPath).replace(/\\/g, "/");
  const base = path.basename(assetPath);
  const noExt = base.replace(/\.[^.]+$/, "");
  const relNoExt = rel.replace(/\.[^.]+$/, "");

  for (const { content } of searchCorpus) {
    if (content.includes(rel)) return true;
    if (content.includes(`./${relNoExt}`)) return true;
    if (content.includes(`assets/${rel}`)) return true;
    if (content.includes(`assets/${relNoExt}`)) return true;
    // require("./foo/bar.webp") partial match
    if (rel.includes("/") && content.includes(rel.split("/").slice(-2).join("/"))) return true;
    if (content.includes(base)) {
      // Avoid false positives on very short names
      if (base.length >= 8) return true;
    }
  }
  return false;
}

const used = [];
const unused = [];
const tsOnly = [];

for (const f of assetFiles) {
  if (f.endsWith(".ts")) {
    tsOnly.push(path.relative(ASSETS, f));
    continue;
  }
  if (isReferenced(f)) used.push(path.relative(ASSETS, f));
  else unused.push(path.relative(ASSETS, f));
}

const report = {
  totalImageAssets: used.length + unused.length,
  usedCount: used.length,
  unusedCount: unused.length,
  tsFiles: tsOnly,
  unused,
  used,
};

const outDir = path.join(ROOT, "docs");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "asset-audit.json"), JSON.stringify(report, null, 2));

console.log(`Total image/font assets: ${report.totalImageAssets}`);
console.log(`Referenced: ${report.usedCount}`);
console.log(`Unreferenced: ${report.unusedCount}`);
console.log(`\nUnused assets (${unused.length}):`);
unused.sort().forEach((u) => console.log(`  - ${u}`));
console.log(`\nReport: docs/asset-audit.json`);
