#!/usr/bin/env node

/**
 * Hardcoded colors – report and optional replace
 *
 * Source of truth: theme/colors.ts (APP_COLORS). Imports use src/config/colors.
 *
 * 1) Report mode (default): finds #hex and rgba(...) in .tsx/.ts under src only.
 *    Skips: comment content (line // and block), color-constant files (config/colors,
 *    constants/colorConstants, subscriptionColors, uiConstants, design-system/colors,
 *    themes, shadows), and intentional palette files (MohsHardnessBar, ColorScale,
 *    VerticalMeter). Linear gradients are left as-is. Only actionable code literals are reported.
 *
 * 2) Replace mode: with --replace=scripts/config/color-replace.json, applies
 *    replacements (literal → APP_COLORS.*) and adds import from config/colors when needed.
 *
 * Usage:
 *   node scripts/report-hardcoded-colors.js
 *   node scripts/report-hardcoded-colors.js --replace=scripts/config/color-replace.json
 *   node scripts/report-hardcoded-colors.js --replace=... --dry-run
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');

const HEX_REGEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGBA_REGEX = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)/g;

function isCommentOnlyLine(line) {
  const t = line.trimStart();
  return (
    t.startsWith('//') ||
    t.startsWith('*') ||
    t.startsWith('/*') ||
    t.startsWith('/**')
  );
}

/** True if match at matchIndex is inside a line or block comment. */
function isMatchInsideComment(content, matchIndex) {
  const before = content.slice(0, matchIndex);
  const lineStart = before.lastIndexOf('\n') + 1;
  const lineToMatch = content.slice(lineStart, matchIndex);
  const matchOffsetInLine = matchIndex - lineStart;
  if (/\/\/[^\n]*$/.test(lineToMatch)) return true;
  let i = 0;
  const snippet = content.slice(
    lineStart,
    Math.min(content.length, matchIndex + 20),
  );
  while (i < snippet.length) {
    const openBlock = snippet.indexOf('/*', i);
    const openLine = snippet.indexOf('//', i);
    if (
      openLine >= 0 &&
      openLine < matchOffsetInLine &&
      (openBlock < 0 || openLine < openBlock)
    )
      return true;
    if (openBlock < 0) break;
    const closeBlock = snippet.indexOf('*/', openBlock + 2);
    if (closeBlock < 0) return true;
    if (matchOffsetInLine >= openBlock && matchOffsetInLine <= closeBlock + 2)
      return true;
    i = closeBlock + 2;
  }
  return false;
}

function* findColorMatches(content, filePath) {
  const lines = content.split('\n');
  let lineNo = 0;
  let offset = 0;
  for (const line of lines) {
    lineNo++;
    const hexMatches = [...line.matchAll(HEX_REGEX)];
    const rgbaMatches = [...line.matchAll(RGBA_REGEX)];
    for (const m of hexMatches) {
      const match = m[0];
      const matchIndex = offset + m.index;
      if (isCommentOnlyLine(line)) continue;
      if (isMatchInsideComment(content, matchIndex)) continue;
      if (
        path.basename(filePath) === 'colorConstants.ts' &&
        /^\s*\w+:\s*['"]/.test(line)
      )
        continue;
      yield { lineNo, match, fullLine: line.trim() };
    }
    for (const m of rgbaMatches) {
      const match = m[0];
      const matchIndex = offset + m.index;
      if (isCommentOnlyLine(line)) continue;
      if (isMatchInsideComment(content, matchIndex)) continue;
      if (
        path.basename(filePath) === 'colorConstants.ts' &&
        /^\s*\w+:\s*['"]/.test(line)
      )
        continue;
      yield { lineNo, match, fullLine: line.trim() };
    }
    offset += line.length + 1;
  }
}

/** Skip files that define color constants (only report/replace in the rest of src). */
function isColorConstantFile(filePath) {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  return (
    normalized.includes('config/colors.') ||
    normalized.includes('constants/colorConstants.') ||
    normalized.includes('constants/subscriptionColors.') ||
    normalized.includes('constants/uiConstants.') ||
    normalized.includes('design-system/colors/') ||
    normalized.includes('design-system/themes/') ||
    normalized.includes('design-system/shadows/')
  );
}

/** Skip files that use intentional fixed palettes (Mohs scale, color scale, etc.). Linear gradients left as-is. */
const EXCLUDED_PALETTE_PATHS = [
  'MohsHardnessBar/',
  'ColorScale/',
  'VerticalMeter/',
];

function isExcludedPaletteFile(filePath) {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  return EXCLUDED_PALETTE_PATHS.some(seg => normalized.includes(seg));
}

function report(dir) {
  const results = [];
  function walk(d) {
    fs.readdirSync(d).forEach(file => {
      const full = path.join(d, file);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (
        (full.endsWith('.ts') || full.endsWith('.tsx')) &&
        !isColorConstantFile(full) &&
        !isExcludedPaletteFile(full)
      ) {
        const content = fs.readFileSync(full, 'utf8');
        for (const { lineNo, match, fullLine } of findColorMatches(
          content,
          full,
        )) {
          results.push({ file: full, lineNo, match, fullLine });
        }
      }
    });
  }
  walk(dir);
  return results;
}

function getRelativeImportPath(filePath, toFile) {
  const fromDir = path.dirname(filePath);
  const toDir = path.dirname(toFile);
  let rel = path.relative(fromDir, toDir);
  if (!rel.startsWith('.')) rel = './' + rel;
  const toName = path.basename(toFile, path.extname(toFile));
  return path.join(rel, toName).replace(/\\/g, '/');
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

function applyReplacements(dir, config, dryRun) {
  const { replacements, constantsPath = 'constants/colorConstants' } = config;
  const rootAbs = path.join(__dirname, '..');
  let total = 0;
  function walk(d) {
    fs.readdirSync(d).forEach(file => {
      const full = path.join(d, file);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (
        (full.endsWith('.ts') || full.endsWith('.tsx')) &&
        !isColorConstantFile(full) &&
        !isExcludedPaletteFile(full)
      ) {
        let content = fs.readFileSync(full, 'utf8');
        let changed = false;
        const relFromRoot = path.relative(rootAbs, full);
        const dirSegments = path
          .dirname(relFromRoot)
          .split(path.sep)
          .filter(Boolean);
        const depth = Math.max(0, dirSegments.length - 1);
        const importPath =
          depth === 0
            ? constantsPath
            : `${'../'.repeat(depth)}${constantsPath}`;
        const addedSymbols = new Set();
        for (const { find, replaceWith } of replacements) {
          if (!replaceWith.includes('.')) continue;
          const symbol = replaceWith.split('.')[0];
          if (content.includes(find)) {
            content = content.split(find).join(replaceWith);
            changed = true;
            addedSymbols.add(symbol);
          }
        }
        for (const sym of addedSymbols) {
          content = addImport(content, sym, importPath);
        }
        if (changed && !dryRun) fs.writeFileSync(full, content);
        if (changed) {
          total++;
          console.log(
            dryRun ? '[dry-run] Would update: ' : '✔ Updated: ',
            full,
          );
        }
      }
    });
  }
  walk(dir);
  return total;
}

const replaceArg = process.argv.find(a => a.startsWith('--replace='));
const replaceConfigPath = replaceArg ? replaceArg.split('=')[1] : null;
const dryRun = process.argv.includes('--dry-run');

if (replaceConfigPath) {
  const configPath = path.isAbsolute(replaceConfigPath)
    ? replaceConfigPath
    : path.join(__dirname, '..', replaceConfigPath);
  if (!fs.existsSync(configPath)) {
    console.error('Config not found:', configPath);
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const count = applyReplacements(ROOT_DIR, config, dryRun);
  console.log(
    dryRun
      ? `\n✅ Dry run: ${count} file(s) would be updated.`
      : `\n✅ Done. ${count} file(s) updated.`,
  );
} else {
  const results = report(ROOT_DIR);
  if (results.length === 0) {
    console.log('No hardcoded colors found.');
    process.exit(0);
  }
  console.log(`Found ${results.length} hardcoded color(s):\n`);
  let lastFile = '';
  for (const r of results) {
    if (r.file !== lastFile) {
      console.log(r.file);
      lastFile = r.file;
    }
    console.log(
      `  ${r.lineNo}: ${r.match}  ${r.fullLine.slice(0, 60)}${
        r.fullLine.length > 60 ? '...' : ''
      }`,
    );
  }
  console.log(
    '\nTo replace, run with --replace=scripts/config/color-replace.json (uses APP_COLORS from theme/colors.ts via config/colors).',
  );
}
