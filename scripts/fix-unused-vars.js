#!/usr/bin/env node
/**
 * Fix unused-imports/no-unused-vars warnings by prefixing identifiers with _.
 * Run after lint:fix (which removes unused imports). Use --dry-run to preview.
 *
 * Usage: node scripts/fix-unused-vars.js [--dry-run]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

function runEslintJson() {
  try {
    return execSync('npx eslint src --ext .ts,.tsx -f json', {
      encoding: 'utf-8',
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (e) {
    return e.stdout || '';
  }
}

function main() {
  const json = runEslintJson();
  let results;
  try {
    results = JSON.parse(json);
  } catch {
    console.error('Could not parse ESLint JSON output.');
    process.exit(1);
  }

  const fixesByFile = new Map();

  for (const file of results) {
    if (!file.messages || file.messages.length === 0) continue;
    const filePath = file.filePath;
    for (const msg of file.messages) {
      if (msg.ruleId !== 'unused-imports/no-unused-vars') continue;
      const line = msg.line;
      const column = msg.column;
      const endLine = msg.endLine ?? line;
      const endColumn = msg.endColumn ?? column + 1;

      if (!fixesByFile.has(filePath)) fixesByFile.set(filePath, []);
      fixesByFile.get(filePath).push({ line, column, endLine, endColumn });
    }
  }

  // Sort fixes per file from bottom to top so edits don't shift positions
  for (const arr of fixesByFile.values()) {
    arr.sort((a, b) =>
      b.line !== a.line ? b.line - a.line : b.column - a.column,
    );
  }

  let totalFixes = 0;
  for (const [filePath, fixes] of fixesByFile) {
    const relativePath = path.relative(projectRoot, filePath);
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    for (const { line, column, endLine, endColumn } of fixes) {
      const lineIdx = line - 1;
      if (lineIdx < 0 || lineIdx >= lines.length) continue;
      const lineContent = lines[lineIdx];
      const startIdx = column - 1;
      // endColumn from ESLint is 1-based, first column after the token
      const endIdx = endColumn;
      if (endIdx <= startIdx) continue;
      let current = lineContent.substring(startIdx, endIdx);
      // Trim trailing non-identifier chars (e.g. comma, bracket) - ESLint range can include them
      const idMatch = current.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      const idOnly = idMatch ? idMatch[1] : current;
      if (!idOnly || idOnly.startsWith('_')) continue;
      const replacement = '_' + idOnly + current.slice(idOnly.length);
      lines[lineIdx] =
        lineContent.substring(0, startIdx) +
        replacement +
        lineContent.substring(endIdx);
      totalFixes++;
      if (dryRun) {
        console.log(`${relativePath}:${line}:${column} ${idOnly} → _${idOnly}`);
      }
    }

    if (!dryRun && fixes.length > 0) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }
  }

  if (dryRun) {
    console.log(
      `\nDry run: would apply ${totalFixes} fix(es). Run without --dry-run to apply.`,
    );
  } else if (totalFixes > 0) {
    console.log(
      `Applied ${totalFixes} fix(es). Run npm run lint:fix to verify.`,
    );
  }
}

main();
