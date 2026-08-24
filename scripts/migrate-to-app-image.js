#!/usr/bin/env node
/**
 * Migrates react-native Image / ImageBackground JSX to AppImage / AppImageBackground.
 * Skips files that only use Image for APIs (resolveAssetSource, getSize, etc.).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");
const SKIP = new Set([
  path.join(ROOT, "components", "AppImage", "AppImage.tsx"),
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function hasJsxImage(content) {
  return (
    /<Image(?!Background|[A-Za-z])[\s/>]/.test(content) ||
    /<ImageBackground[\s/>]/.test(content)
  );
}

function needsImageApi(content) {
  return /\bImage\.(resolveAssetSource|getSize|prefetch|queryCache)\b/.test(
    content
  );
}

function migrateFile(filePath) {
  if (SKIP.has(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf8");
  if (!hasJsxImage(content)) return false;

  const hadBackground = /<ImageBackground[\s/>]/.test(content);
  const hadImage = /<Image(?!Background|[A-Za-z])[\s/>]/.test(content);

  content = content.replace(/<ImageBackground(?=[\s/>])/g, "<AppImageBackground");
  content = content.replace(/<\/ImageBackground>/g, "</AppImageBackground>");
  content = content.replace(/<Image(?=[\s/>])/g, "<AppImage");
  content = content.replace(/<\/Image>/g, "</AppImage>");

  const usesAppImage = hadImage || /<AppImage[\s/>]/.test(content);
  const usesAppImageBackground =
    hadBackground || /<AppImageBackground[\s/>]/.test(content);

  const importLine = (() => {
    const parts = [];
    if (usesAppImage) parts.push("AppImage");
    if (usesAppImageBackground) parts.push("AppImageBackground");
    return `import { ${parts.join(", ")} } from "@/components/AppImage";\n`;
  })();

  if (!content.includes('@/components/AppImage"')) {
    const rnImport = content.match(
      /^import\s+\{[^}]+\}\s+from\s+["']react-native["'];?\s*\n/m
    );
    if (rnImport) {
      content = content.replace(rnImport[0], importLine + rnImport[0]);
    } else {
      content = importLine + content;
    }
  }

  content = content.replace(
    /^import\s+\{([^}]+)\}\s+from\s+["']react-native["'];?\s*\n/m,
    (match, specifiers) => {
      let specs = specifiers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const keepImageApi = needsImageApi(content);
      specs = specs.filter((s) => {
        if (s === "ImageBackground") return false;
        if (s === "Image" && !keepImageApi) return false;
        return true;
      });

      if (specs.length === 0) return "";
      return `import { ${specs.join(", ")} } from "react-native";\n`;
    }
  );

  // Normalize duplicate AppImage imports
  const appImageImports = content.match(
    /^import\s+\{[^}]+\}\s+from\s+["']@\/components\/AppImage["'];?\s*\n/gm
  );
  if (appImageImports && appImageImports.length > 1) {
    const merged = new Set();
    for (const imp of appImageImports) {
      const m = imp.match(/\{([^}]+)\}/);
      if (m) m[1].split(",").forEach((s) => merged.add(s.trim()));
    }
    content = content.replace(
      /^import\s+\{[^}]+\}\s+from\s+["']@\/components\/AppImage["'];?\s*\n/gm,
      ""
    );
    const firstImport = content.match(/^import\s+/m);
    const insertAt = firstImport ? firstImport.index : 0;
    const line = `import { ${[...merged].join(", ")} } from "@/components/AppImage";\n`;
    content = content.slice(0, insertAt) + line + content.slice(insertAt);
  }

  fs.writeFileSync(filePath, content);
  return true;
}

const files = walk(ROOT);
let count = 0;
for (const f of files) {
  if (migrateFile(f)) {
    count++;
    console.log("migrated:", path.relative(ROOT, f));
  }
}
console.log(`Done. Migrated ${count} files.`);
