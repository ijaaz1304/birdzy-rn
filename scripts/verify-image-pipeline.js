#!/usr/bin/env node
/**
 * Audit: all UI images should go through AppImage; flag stray RN Image JSX.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const jsxImage = [];
const rnImageImport = [];
const fastImageDisplay = [];

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, "utf8");

  if (rel === "components/AppImage/AppImage.tsx") continue;

  if (/<Image(?!Background|[A-Za-z])[\s/>]/.test(content)) {
    jsxImage.push(rel);
  }

  if (
    /^import\s+\{[^}]*\bImage\b[^}]*\}\s+from\s+["']react-native["']/m.test(
      content
    ) &&
    !/\bImage\.(resolveAssetSource|getSize|prefetch|queryCache)\b/.test(content)
  ) {
    rnImageImport.push(rel);
  }

  if (
    /from\s+["']react-native-fast-image["']/.test(content) &&
    !rel.includes("prefetchImages") &&
    !rel.includes("AppImage/AppImage")
  ) {
    fastImageDisplay.push(rel);
  }
}

console.log("=== Image pipeline audit ===\n");
console.log(`JSX <Image> outside AppImage (${jsxImage.length}):`);
jsxImage.forEach((f) => console.log("  -", f));
console.log(`\nRN Image import without API usage (${rnImageImport.length}):`);
rnImageImport.slice(0, 20).forEach((f) => console.log("  -", f));
if (rnImageImport.length > 20)
  console.log(`  ... and ${rnImageImport.length - 20} more`);
console.log(`\nDirect FastImage in UI (${fastImageDisplay.length}):`);
fastImageDisplay.forEach((f) => console.log("  -", f));

const assets = fs.readFileSync(path.join(ROOT, "assets/index.ts"), "utf8");
const webp = (assets.match(/\.webp"/g) || []).length;
const png = (assets.match(/\.png"/g) || []).length;
console.log(`\nAssets index: ${webp} WebP, ${png} PNG (${webp + png} total)`);
console.log(
  "\nDiagnosis: iOS RN Image fails on bundled WebP (~140 assets). Bundled PNG (~90) use RN Image on iOS. Remote URLs use FastImage (cache + WebP)."
);
console.log("\nRun full audit: npm run verify:image-pipeline");

process.exit(jsxImage.length + rnImageImport.length + fastImageDisplay.length > 0 ? 1 : 0);
