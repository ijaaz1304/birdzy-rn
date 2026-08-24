#!/usr/bin/env node

/**
 * Report interactive components that may need testID
 *
 * Lists TouchableOpacity, Pressable, Button, TouchableHighlight, etc.
 * that have no testID prop. Use to prioritize adding testIDs for E2E.
 *
 * Usage:
 *   node scripts/report-missing-testids.js
 *   node scripts/report-missing-testids.js --components=Button,Pressable
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');

const DEFAULT_COMPONENTS = [
  'TouchableOpacity',
  'Pressable',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'Button',
  'IconButton',
  'TouchableOpacity',
];

const componentArg = process.argv.find(a => a.startsWith('--components=''));
const components = componentArg
  ? componentArg.split('=')[1].split(',').map(s => s.trim())
  : DEFAULT_COMPONENTS;

const OPENING_TAG = new RegExp(
  `<(${components.join('|')})\\b(?![^>]*testID)[^>]*>`,
  'g',
);

function findMissingTestIds(content, filePath) {
  const results = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<(TouchableOpacity|Pressable|Button|TouchableHighlight|TouchableWithoutFeedback|IconButton)\b/.test(line)) continue;
    if (/testID\s*=/.test(line)) continue;
    const col = line.search(/<(TouchableOpacity|Pressable|Button|TouchableHighlight|TouchableWithoutFeedback|IconButton)\b/);
    if (col >= 0) {
      results.push({ lineNo: i + 1, line: line.trim().slice(0, 80) });
    }
  }
  return results;
}

function walk(dir) {
  const results = [];
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (full.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const hits = findMissingTestIds(content, full);
      if (hits.length) results.push({ file: full, hits });
    }
  });
  return results;
}

const all = walk(ROOT_DIR);
if (all.length === 0) {
  console.log('No interactive components without testID found.');
  process.exit(0);
}

console.log(`Found ${all.reduce((s, r) => s + r.hits.length, 0)} instance(s) without testID:\n`);
all.forEach(({ file, hits }) => {
  console.log(file);
  hits.forEach(({ lineNo, line }) => console.log(`  ${lineNo}: ${line}${line.length >= 80 ? '...' : ''}`));
  console.log('');
});
