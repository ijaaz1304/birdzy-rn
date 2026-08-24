#!/usr/bin/env node

/**
 * Migrate path-alias imports to relative paths
 *
 * Replaces imports like:
 *   import { x } from '@/services/notifications'
 * with the correct relative path from the current file to the target.
 *
 * Config: scripts/config/import-aliases.json
 *   { "aliases": { "@": "src" } }  → @/foo/bar → resolve from src/ to project root, then relative from file
 *
 * Usage:
 *   node scripts/migrate-import-paths.js
 *   node scripts/migrate-import-paths.js --dry-run
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const CONFIG_PATH = path.join(__dirname, 'config', 'import-aliases.json');

const DRY_RUN = process.argv.includes('--dry-run');

const defaultConfig = {
  aliases: { '@': 'src' },
};

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return {
      ...defaultConfig,
      ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')),
    };
  }
  return defaultConfig;
}

function getRelativePath(fromFile, toModulePath, aliasRoot) {
  const aliasPrefix = Object.keys(aliasRoot)[0];
  if (
    !toModulePath.startsWith(aliasPrefix + '/') &&
    toModulePath !== aliasPrefix
  )
    return null;
  const subPath = toModulePath.slice(aliasPrefix.length).replace(/^\//, '');
  const targetDir = path.join(ROOT, aliasRoot[aliasPrefix], subPath);
  let target = targetDir;
  if (!fs.existsSync(target)) {
    if (fs.existsSync(targetDir + '.ts')) target = targetDir + '.ts';
    else if (fs.existsSync(targetDir + '.tsx')) target = targetDir + '.tsx';
    else if (fs.existsSync(path.join(targetDir, 'index.ts')))
      target = path.join(targetDir, 'index.ts');
    else if (fs.existsSync(path.join(targetDir, 'index.tsx')))
      target = path.join(targetDir, 'index.tsx');
  }
  if (!fs.existsSync(target)) return null;
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, path.dirname(target));
  if (!rel.startsWith('.')) rel = './' + rel;
  const base = path.basename(target, path.extname(target));
  if (base === 'index') {
    return rel.replace(/\\/g, '/');
  }
  return (rel ? rel + '/' : './') + base;
}

function processFile(filePath, config) {
  const content = fs.readFileSync(filePath, 'utf8');
  const aliasRoot = config.aliases || { '@': 'src' };
  let out = content;
  let changed = false;

  const importRegex =
    /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  const replacements = [];
  while ((match = importRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const spec = match[1];
    for (const alias of Object.keys(aliasRoot)) {
      if (spec !== alias && !spec.startsWith(alias + '/')) continue;
      const rel = getRelativePath(filePath, spec, {
        [alias]: aliasRoot[alias],
      });
      if (rel) {
        const newImport = fullMatch.replace(spec, rel.replace(/\\/g, '/'));
        replacements.push({ from: fullMatch, to: newImport });
        changed = true;
      }
      break;
    }
  }

  if (changed) {
    replacements.forEach(({ from, to }) => {
      out = out.replace(from, to);
    });
    if (!DRY_RUN) fs.writeFileSync(filePath, out);
  }
  return changed;
}

function walk(dir, config) {
  let count = 0;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) count += walk(full, config);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      if (processFile(full, config)) {
        console.log(DRY_RUN ? '[dry-run] Would update: ' : '✔ Updated: ', full);
        count++;
      }
    }
  });
  return count;
}

const config = loadConfig();
let total = walk(SRC_DIR, config);
const appTsx = path.join(ROOT, 'App.tsx');
if (fs.existsSync(appTsx) && processFile(appTsx, config)) {
  console.log(DRY_RUN ? '[dry-run] Would update: ' : '✔ Updated: ', appTsx);
  total++;
}
console.log(
  DRY_RUN
    ? `\n✅ Dry run: ${total} file(s) would be updated.`
    : `\n✅ Import path migration complete. ${total} file(s) updated.`,
);
