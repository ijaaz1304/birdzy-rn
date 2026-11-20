/** Prevent deleted mushroom assets and light-image dark aliases from returning. */
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const assetRoot = path.join(root, "src/assets");
const registry = fs.readFileSync(path.join(assetRoot, "index.ts"), "utf8");
const manifest = require("../docs/dark-assets-manifest.json");
const errors = [];
const rasterOrSvg = /\.(png|webp|svg|jpe?g)$/;
const isDarkPath = (value) => /\/dark\/|_dark(?:s)?\./.test(value);
let checked = 0;
for (const match of registry.matchAll(
  /(?:require\("([^"]+)"\)|from "([^"]+)")/g
)) {
  const relative = match[1] || match[2];
  if (!rasterOrSvg.test(relative)) continue;
  checked++;
  if (!fs.existsSync(path.resolve(assetRoot, relative)))
    errors.push(`Missing asset: ${relative}`);
}
for (const match of registry.matchAll(/(\w*Dark\w*): require\("([^"]+)"\)/g)) {
  if (!isDarkPath(match[2]))
    errors.push(`Dark alias uses non-dark asset: ${match[1]} -> ${match[2]}`);
}
for (const match of registry.matchAll(
  /default as (\w*Dark\w*) } from "([^"]+)"/g
)) {
  if (!isDarkPath(match[2]))
    errors.push(`Dark export uses non-dark asset: ${match[1]} -> ${match[2]}`);
}
// Supplied runtime dark artwork must remain present; light routes stay protected.
const suppliedList = Array.isArray(manifest.suppliedAssets)
  ? manifest.suppliedAssets
  : Object.keys(manifest.suppliedAssets || {});
for (const asset of suppliedList) {
  if (!fs.existsSync(path.join(root, asset))) {
    errors.push(`Missing supplied dark artwork: ${asset}`);
  }
}
if (fs.existsSync(path.join(root, "Dark Mode"))) {
  errors.push(
    "Root Dark Mode/ design dump should stay removed; runtime copies live under src/assets/dark/supplied/"
  );
}
for (const [key, relative] of Object.entries(
  manifest.protectedLightRoutes || {}
)) {
  if (!registry.includes(`${key}: require("${relative}")`))
    errors.push(`Light/shared asset route changed: ${key}`);
}
for (const removed of manifest.removedAssets) {
  if (fs.existsSync(path.join(root, removed)))
    errors.push(`Removed legacy asset returned: ${removed}`);
}
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.[jt]sx?$/.test(file)) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(
        /(?:require\(["']([^"']+)["']\)|from ["']([^"']+)["'])/g
      )) {
        const relative = match[1] || match[2];
        if (!relative.startsWith(".") || !rasterOrSvg.test(relative)) continue;
        if (!fs.existsSync(path.resolve(path.dirname(file), relative)))
          errors.push(
            `Broken asset reference in ${path.relative(
              root,
              file
            )}: ${relative}`
          );
      }
    }
  }
}
walk(path.join(root, "src"));
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Dark assets verified: ${checked} registry references; ${manifest.removedAssets.length} obsolete assets absent; all relative source asset references resolve.`
  );
}
