#!/usr/bin/env node

/**
 * Magic numbers → design tokens
 *
 * Replaces literal layout numbers (e.g. borderRadius: 12, padding: 16) with
 * tokens (Radius.md, spacing[4]) and adds the needed import when missing.
 *
 * Config: scripts/config/magic-numbers.json
 *   replacements: [ { find, replaceWith, import: { symbol, from } } ]
 *
 * Usage:
 *   node scripts/migrate-magic-numbers.js
 *   node scripts/migrate-magic-numbers.js --dry-run
 *   node scripts/migrate-magic-numbers.js --config=scripts/config/magic-numbers.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const configArg = process.argv.find(function (a) {
  return a.startsWith('--config=');
});
const DEFAULT_CONFIG = path.join(__dirname, 'config', 'magic-numbers.json');
const CONFIG_PATH = configArg
  ? path.join(__dirname, '..', configArg.split('=')[1])
  : DEFAULT_CONFIG;

function loadConfig() {
  const toLoad = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : DEFAULT_CONFIG;
  if (toLoad !== CONFIG_PATH && configArg) {
    console.warn(
      'Config not found:',
      CONFIG_PATH,
      '- using default:',
      DEFAULT_CONFIG,
    );
  }
  if (!fs.existsSync(toLoad)) {
    console.error('Config not found:', toLoad);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(toLoad, 'utf8'));
}

function getRelativeImportPath(filePath, fromModule) {
  const relativeDir = path.relative(ROOT_DIR, path.dirname(filePath));
  const depth =
    relativeDir === '.' || !relativeDir
      ? 0
      : relativeDir.split(path.sep).length;
  return `${'../'.repeat(depth)}${fromModule}`;
}

function hasImport(content, symbol) {
  return new RegExp(`import\\s*\\{[^}]*\\b${symbol}\\b[^}]*\\}`).test(content);
}

function addImport(content, symbol, importPath) {
  const line = `import { ${symbol} } from '${importPath}';\n`;
  if (hasImport(content, symbol)) return content;
  const importRegex = /^import\s+.+from\s+['\"][^'\"]+['\"];?\s*$/gm;
  let lastIndex = -1;
  let match;
  while ((match = importRegex.exec(content)) !== null)
    lastIndex = match.index + match[0].length;
  if (lastIndex === -1) return line + content;
  return content.slice(0, lastIndex) + '\n' + line + content.slice(lastIndex);
}

function processFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const addedImports = new Map();

  for (const { find, replaceWith, import: imp } of replacements) {
    if (!content.includes(find)) continue;
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, replaceWith);
    changed = true;
    if (imp && imp.symbol && imp.from) {
      addedImports.set(imp.symbol, imp.from);
    }
  }

  if (changed) {
    for (const [symbol, fromModule] of addedImports) {
      const importPath = getRelativeImportPath(filePath, fromModule);
      content = addImport(content, symbol, importPath);
    }
    if (!DRY_RUN) fs.writeFileSync(filePath, content);
  }
  return changed;
}

function walk(dir, config) {
  const replacements = config.replacements || [];
  let count = 0;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) count += walk(full, config);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      if (processFile(full, replacements)) {
        console.log(DRY_RUN ? '[dry-run] Would update: ' : '✔ Updated: ', full);
        count++;
      }
    }
  });
  return count;
}

const config = loadConfig();
const total = walk(ROOT_DIR, config);
console.log(
  DRY_RUN
    ? `\n✅ Dry run: ${total} file(s) would be updated.`
    : `\n✅ Magic numbers migration complete. ${total} file(s) updated.`,
);
