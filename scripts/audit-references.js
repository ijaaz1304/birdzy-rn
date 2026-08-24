#!/usr/bin/env node
/**
 * Second-pass global search: classify remaining Shroom/Mushroom/infrastructure references.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PATTERNS = [
  { name: "Shroomzy/ShroomAI", re: /Shroomzy|shroomzy|ShroomAI|shroomai|SHROOMZY|SHROOMAI/gi },
  { name: "Shroom (non-shroomzy)", re: /\bshroom\b|\bShroom\b|\bshrooms\b|\bShrooms\b/gi },
  { name: "Mushroom domain", re: /\bmushroom\b|\bMushroom\b|\bmushrooms\b|\bMushrooms\b/gi },
  { name: "Old package ID", re: /com\.trackzio\.mushrooms/gi },
  { name: "mushrooms-api", re: /mushrooms-api/gi },
  { name: "Old Firebase projects", re: /mushrooms-app-dev|mushrooms-app-dfdc5/gi },
  { name: "Minerals legacy", re: /\bminerals\b|\bMinerals\b|\bmineral\b|\bMineral\b/gi },
  { name: "Old OAuth IDs", re: /921492151587|511567649411|googleusercontent\.apps\.\d+/gi },
  { name: "Old URL schemes", re: /shroomai-dev|shroomai_dl/gi },
];

const SKIP_DIRS = new Set(["node_modules", ".git", "build", "Pods", ".gradle", "android/app/build", "ios/build"]);
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".gradle", ".xml", ".plist", ".swift", ".kt", ".java", ".md", ".html", ".env", ".sh", ".py", ".rules", ".template.json"]);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    const rel = path.relative(ROOT, p);
    if (SKIP_DIRS.has(rel.split(path.sep)[0])) continue;
    if (ent.isDirectory()) walk(p, files);
    else {
      const ext = path.extname(ent.name).toLowerCase();
      if (EXT.has(ext) || ent.name.startsWith(".env")) files.push(p);
    }
  }
  return files;
}

function classify(file, line, patternName) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.includes("node_modules")) return "KEEP — third-party/library";
  if (rel.startsWith("scripts/migrate-to-birdzy.sh")) return "KEEP — migration script";
  if (rel.startsWith("scripts/generate-firebase-docx.py")) return "KEEP — historical doc generator";
  if (rel.includes("docs/domain-inventory") || rel.includes("docs/asset-audit")) return "KEEP — audit artifact";

  // Domain/API — next phase
  if (/mushroom|Mushroom|mushrooms-api|new_mushroom_search/.test(line)) {
    if (rel.startsWith("src/features/") || rel.startsWith("src/utils/mushroom") || rel.startsWith("src/data/"))
      return "PENDING — API/domain migration";
    if (rel.includes("hosting/public/index.html")) return "PENDING — API/domain migration";
    if (rel.includes("Info.plist") && /mushroom|mushrooms-api/.test(line)) return "PENDING — API/domain migration";
    if (rel.includes("assets/") || rel.includes("popUp/mushroom") || rel.includes("which_shroom"))
      return "PLACEHOLDER — temporary shell asset";
  }

  if (/Shroomzy|ShroomAI|shroomai|com\.trackzio\.mushrooms/.test(line))
    return "SHOULD REMOVE — accidental Shroomzy reference";

  if (/mushrooms-app-dev|mushrooms-app-dfdc5|921492151587|511567649411/.test(line))
    return "SHOULD REMOVE — old infrastructure credential";

  if (/minerals|Minerals/.test(line) && !rel.includes("SUBSCRIPTION_VALUE"))
    return "SHOULD REMOVE — legacy fork artifact";

  if (/PENDING_BIRDZY/.test(line)) return "PLACEHOLDER — awaiting Birdzy config";

  if (/notification-service\.trackzio|geocode\.maps|progresspal-assets/.test(line))
    return "COMMON — shared Trackzio infrastructure";

  return "REVIEW — manual classification needed";
}

const files = walk(ROOT);
const results = {};

for (const file of files) {
  let content;
  try { content = fs.readFileSync(file, "utf8"); } catch { continue; }
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0;
      if (re.test(line)) {
        const key = classify(file, line, name);
        if (!results[key]) results[key] = [];
        results[key].push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          line: i + 1,
          pattern: name,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  });
}

const out = path.join(ROOT, "docs/reference-audit.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(results, null, 2));

console.log("Reference audit summary:");
for (const [k, v] of Object.entries(results).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${k}: ${v.length}`);
}
console.log(`\nFull report: docs/reference-audit.json`);
