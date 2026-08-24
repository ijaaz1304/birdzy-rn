#!/usr/bin/env node

/**
 * Run ESLint (with --fix) and Prettier (--write) only on changed files.
 * Usage: node scripts/lint-changed.js [baseRef]
 *   baseRef: git ref to diff against (e.g. origin/main, HEAD~1). Default: origin/main
 * In CI, pass the base ref (e.g. ${{ github.event.pull_request.base.sha }} or origin/main).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const ROOT = path.resolve(__dirname, '..');

function getChangedFiles(baseRef = 'origin/main') {
  try {
    const out = execSync(`git diff --name-only ${baseRef}...HEAD`, {
      encoding: 'utf8',
      cwd: ROOT,
    });
    return out.trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

function filterCodeFiles(files) {
  return files.filter(
    f =>
      (f.startsWith('src/') || f.startsWith('src\\')) &&
      EXTENSIONS.some(ext => f.endsWith(ext)),
  );
}

/** Keep only files that exist on disk (skip deleted/renamed from diff). */
function filterExistingFiles(files) {
  return files.filter(f => fs.existsSync(path.join(ROOT, f)));
}

function runEslint(files) {
  if (files.length === 0) return;
  execSync(`npx eslint --fix ${files.map(f => `"${f}"`).join(' ')}`, {
    stdio: 'inherit',
    cwd: ROOT,
  });
}

function runPrettier(files) {
  if (files.length === 0) return;
  execSync(`npx prettier --write ${files.map(f => `"${f}"`).join(' ')}`, {
    stdio: 'inherit',
    cwd: ROOT,
  });
}

const baseRef = process.argv[2] || process.env.GIT_BASE_REF || 'origin/main';
const changed = getChangedFiles(baseRef);
const codeFiles = filterExistingFiles(filterCodeFiles(changed));

if (codeFiles.length === 0) {
  console.log('No changed code files to lint.');
  process.exit(0);
}

console.log(`Linting ${codeFiles.length} changed file(s)...`);
runPrettier(codeFiles);
runEslint(codeFiles);
