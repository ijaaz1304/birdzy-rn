#!/usr/bin/env node
/**
 * Remove unused imports (via ESLint --fix) and find/report unused component files.
 * Does not delete unused component files by default; use --delete-unused-files to remove them.
 *
 * Usage:
 *   node scripts/remove-unused-imports-and-components.js [options]
 *
 * Options:
 *   --fix-imports       Run ESLint --fix to remove unused imports (default: true)
 *   --no-fix-imports    Skip ESLint fix
 *   --report-unused     Report list of files that are never imported (default: true)
 *   --no-report-unused Skip unused-files report
 *   --delete-unused-files  Delete source files that are never imported (use with care)
 *   --dry-run           Only report; do not run ESLint --fix or delete files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const SRC = path.join(projectRoot, 'src');

// Path aliases from tsconfig (baseUrl ".", paths)
const PATH_ALIASES = {
  '@': 'src',
  '@atoms': 'src/atoms',
  '@molecules': 'src/molecules',
  '@organisms': 'src/organisms',
  '@features': 'src/features',
  '@services': 'src/services',
  '@config': 'src/config',
  '@hooks': 'src/hooks',
  '@utils': 'src/utils',
  '@assets': 'src/assets',
  '@design': 'src/design-system',
};

// Entry points: never considered "unused" even if nothing imports them
const ENTRY_PATTERNS = [
  /[/\\]App\.(tsx?|jsx?)$/,
  /[/\\]index\.(tsx?|jsx?)$/,
  /__tests__[/\\]/,
  /\.test\.(tsx?|jsx?)$/,
  /\.spec\.(tsx?|jsx?)$/,
];

// Never report as unused: services, map-related files
const IGNORE_PATTERNS = [
  /[/\\]services[/\\]/, // any file under src/services/
  /\.service\.(tsx?|jsx?)$/, // *.service.ts/tsx
  /[/\\][^/\\]*[Mm]ap[^/\\]*\.(tsx?|jsx?)$/, // MapPreview, UserLocationMap, maps.api, etc.
  /[/\\][^/\\]*[Mm]ap[/\\]/, // any file under a directory named *map*
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    fixImports: true,
    reportUnused: true,
    deleteUnusedFiles: false,
    dryRun: false,
  };
  for (const a of args) {
    if (a === '--no-fix-imports') opts.fixImports = false;
    else if (a === '--fix-imports') opts.fixImports = true;
    else if (a === '--no-report-unused') opts.reportUnused = false;
    else if (a === '--report-unused') opts.reportUnused = true;
    else if (a === '--delete-unused-files') opts.deleteUnusedFiles = true;
    else if (a === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

function resolveImportSpecifier(spec, fromDir) {
  // spec can be: "@/foo", "@atoms/Button", "react", "./Bar", "../utils"
  const trimmed = spec.replace(/['"]/g, '').trim();
  if (!trimmed) return null;

  for (const [alias, basePath] of Object.entries(PATH_ALIASES)) {
    if (trimmed === alias || trimmed.startsWith(alias + '/')) {
      const sub = trimmed === alias ? '' : trimmed.slice(alias.length + 1);
      const joined = path.join(projectRoot, basePath, sub);
      return resolveToFile(joined);
    }
  }
  // Relative import
  if (trimmed.startsWith('.')) {
    const joined = path.resolve(fromDir, trimmed);
    return resolveToFile(joined);
  }
  // External package – ignore
  return null;
}

function resolveToFile(joined) {
  const ext = path.extname(joined);
  if (
    ext &&
    (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx')
  ) {
    return fs.existsSync(joined) ? path.normalize(joined) : null;
  }
  for (const e of ['.tsx', '.ts', '.jsx', '.js']) {
    const withExt = joined + e;
    if (fs.existsSync(withExt)) return path.normalize(withExt);
  }
  if (fs.existsSync(joined)) return path.normalize(joined);
  return null;
}

function getAllSourceFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (
        e.name !== 'node_modules' &&
        e.name !== '__tests__' &&
        !e.name.startsWith('.')
      ) {
        getAllSourceFiles(full, list);
      }
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      list.push(path.normalize(full));
    }
  }
  return list;
}

function extractImports(content) {
  const imports = [];
  // import X from 'Y'; import { A } from 'Y'; import * as Z from 'Y'; import 'Y';
  const re = /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    imports.push(m[1].trim());
  }
  return imports;
}

function isEntryPoint(filePath) {
  const normalized = path.normalize(filePath);
  return ENTRY_PATTERNS.some(re => re.test(normalized));
}

function isIgnored(filePath) {
  const normalized = path.normalize(filePath);
  return IGNORE_PATTERNS.some(re => re.test(normalized));
}

function runFixImports(dryRun) {
  if (dryRun) {
    console.log('[dry-run] Would run: npx eslint src --ext .ts,.tsx --fix');
    return;
  }
  console.log('Running ESLint --fix to remove unused imports...');
  try {
    execSync('npx eslint src --ext .ts,.tsx --fix', {
      cwd: projectRoot,
      stdio: 'inherit',
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log('ESLint --fix completed.');
  } catch (e) {
    console.warn(
      'ESLint --fix exited with errors. Unused imports may still have been fixed.',
    );
  }
}

function findUnusedFiles() {
  const allFiles = getAllSourceFiles(SRC);
  const importedFiles = new Set();

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const fromDir = path.dirname(file);
    for (const spec of extractImports(content)) {
      const resolved = resolveImportSpecifier(spec, fromDir);
      if (resolved && resolved.startsWith(projectRoot)) {
        importedFiles.add(path.normalize(resolved));
      }
    }
  }

  // When an import resolves to a directory (e.g. @organisms/BottomNavBar), mark all
  // source files inside that directory as used (fixes barrel/component-folder imports).
  const toAdd = [];
  for (const p of importedFiles) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        const prefix = p + path.sep;
        for (const f of allFiles) {
          const norm = path.normalize(f);
          if (norm.startsWith(prefix)) toAdd.push(norm);
        }
      }
    } catch (_) {
      /* ignore */
    }
  }
  toAdd.forEach(f => importedFiles.add(f));

  const unused = allFiles.filter(f => {
    if (isEntryPoint(f)) return false;
    if (isIgnored(f)) return false;
    return !importedFiles.has(path.normalize(f));
  });

  return unused.sort();
}

function main() {
  const opts = parseArgs();

  if (opts.fixImports) {
    runFixImports(opts.dryRun);
  }

  if (opts.reportUnused) {
    const unused = findUnusedFiles();
    if (unused.length === 0) {
      console.log(
        'No unused component/source files found (every file is imported somewhere).',
      );
    } else {
      console.log('\nUnused files (never imported by any other source file):');
      unused.forEach(f => console.log('  ' + path.relative(projectRoot, f)));

      if (opts.deleteUnusedFiles && !opts.dryRun) {
        unused.forEach(f => {
          fs.unlinkSync(f);
          console.log('Deleted: ' + path.relative(projectRoot, f));
        });
      } else if (opts.deleteUnusedFiles && opts.dryRun) {
        console.log(
          '\n[dry-run] Would delete the above files. Run without --dry-run to delete.',
        );
      }
    }
  }
}

main();
