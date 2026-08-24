#!/usr/bin/env node

/**
 * Font weight → FONTS migration
 *
 * Replaces inline fontWeight (e.g. fontWeight: '600') with fontFamily: FONTS.<weight>
 * and adds the FONTS import from common/typography when missing.
 *
 * Usage:
 *   node scripts/migrate-font-weight-to-fonts.js           # run migration
 *   node scripts/migrate-font-weight-to-fonts.js --dry-run # preview only, no writes
 *
 * FONTS mapping (Satoshi): 400/normal→regular, 500→medium, 600/700/bold→bold, 900→black
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');
const TYPOGRAPHY_PATH = 'common/typography';

const DRY_RUN = process.argv.includes('--dry-run');

const weightMap = {
  400: 'regular',
  500: 'medium',
  600: 'bold',
  700: 'bold',
  900: 'black',
  normal: 'regular',
  bold: 'bold',
};

function getRelativeImportPath(filePath) {
  const relativeDir = path.relative(ROOT_DIR, path.dirname(filePath));
  if (!relativeDir || relativeDir === '.') return `${TYPOGRAPHY_PATH}`;
  const depth = relativeDir.split(path.sep).length;
  return `${'../'.repeat(depth)}${TYPOGRAPHY_PATH}`;
}

function hasFONTSImport(content) {
  return /import\s*\{[^}]*\bFONTS\b[^}]*\}\s*from\s*['\"].*typography['\"]/m.test(
    content,
  );
}

function addFONTSImport(content, importPath) {
  const importLine = `import { FONTS } from '${importPath}';\n`;
  if (hasFONTSImport(content)) return content;
  // Find last import block: insert after the last line that looks like "import ... from '...';"
  const importRegex = /^import\s+.+from\s+['\"][^'\"]+['\"];?\s*$/gm;
  let lastIndex = -1;
  let match;
  while ((match = importRegex.exec(content)) !== null)
    lastIndex = match.index + match[0].length;
  if (lastIndex === -1) {
    return importLine + content;
  }
  return (
    content.slice(0, lastIndex) + '\n' + importLine + content.slice(lastIndex)
  );
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  Object.entries(weightMap).forEach(([weight, font]) => {
    const replacement = `fontFamily: FONTS.${font}`;
    const stringRegex = new RegExp(`fontWeight:\\s*["']${weight}["']`, 'g');
    const numericRegex = new RegExp(`fontWeight:\\s*${weight}\\b`, 'g');
    const before = content;
    content = content
      .replace(stringRegex, replacement)
      .replace(numericRegex, replacement);
    if (content !== before) changed = true;
  });

  if (changed && !hasFONTSImport(content)) {
    const importPath = getRelativeImportPath(filePath);
    content = addFONTSImport(content, importPath);
  }

  if (changed && !DRY_RUN) {
    fs.writeFileSync(filePath, content);
  }
  return changed;
}

function walk(dir) {
  let count = 0;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      count += walk(full);
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      if (processFile(full)) {
        console.log(DRY_RUN ? '[dry-run] Would update: ' : '✔ Updated: ', full);
        count++;
      }
    }
  });
  return count;
}

const count = walk(ROOT_DIR);
console.log(
  DRY_RUN
    ? `\n✅ Dry run: ${count} file(s) would be updated.`
    : `\n✅ Font migration complete. ${count} file(s) updated.`,
);
