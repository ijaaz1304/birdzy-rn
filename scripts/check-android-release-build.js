#!/usr/bin/env node

/**
 * Pre-flight checks before Android release APK/AAB builds.
 * Catches Google Sign-In failures from wrong .env or missing prod keystore.
 *
 * Usage: node scripts/check-android-release-build.js dev|prod
 */

const fs = require('fs');
const path = require('path');

const flavor = (process.argv[2] || '').toLowerCase();
if (!['dev', 'prod'].includes(flavor)) {
  console.error('Usage: node scripts/check-android-release-build.js <dev|prod>');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const keystorePath = path.join(
  root,
  'android/app/src/prod/minerals-upload-key.jks',
);
const keystorePropsPath = path.join(root, 'android/app/keystore.properties');
const envPath = path.join(root, '.env');

const CONFIG = {
  dev: {
    label: 'Dev',
    webClientPrefix: '480281695791-',
    envCommand: 'npm run env:dev',
    googleServices: 'android/app/src/dev/google-services.json',
    packageName: 'com.trackzio.birds.dev',
    requiresKeystore: false,
  },
  prod: {
    label: 'Prod',
    webClientPrefix: '123389676792-',
    envCommand: 'npm run env:prod',
    googleServices: 'android/app/src/prod/google-services.json',
    packageName: 'com.trackzio.birds',
    requiresKeystore: true,
  },
};

const cfg = CONFIG[flavor];
let failed = false;

function fail(message) {
  console.error(`❌ ${message}`);
  failed = true;
}

function warn(message) {
  console.warn(`⚠️  ${message}`);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

console.log(`\n${cfg.label} Android release pre-checks\n`);

if (cfg.requiresKeystore && !fs.existsSync(keystorePath)) {
  fail(
    'Release keystore missing: android/app/src/prod/minerals-upload-key.jks\n' +
      '   Prod release APK must be signed with the upload key (SHA-1 in prod Firebase).\n' +
      '   Fix: copy the upload keystore into that path (see docs/CI_CD_SETUP.md).',
  );
} else if (cfg.requiresKeystore) {
  ok('Release keystore found');
} else {
  ok('Dev release uses debug signing (matches dev Firebase SHA-1)');
}

if (cfg.requiresKeystore && !fs.existsSync(keystorePropsPath)) {
  fail('Missing android/app/keystore.properties');
} else if (cfg.requiresKeystore) {
  ok('keystore.properties found');
}

if (!fs.existsSync(envPath)) {
  fail(`Missing .env — run ${cfg.envCommand} first`);
} else {
  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/^GOOGLE_WEB_CLIENT_ID=(.+)$/m);
  const clientId = match?.[1]?.trim() ?? '';
  if (!clientId) {
    fail(`GOOGLE_WEB_CLIENT_ID is empty in .env — run ${cfg.envCommand}`);
  } else if (!clientId.startsWith(cfg.webClientPrefix)) {
    fail(
      `GOOGLE_WEB_CLIENT_ID is for the wrong Firebase project.\n` +
        `   ${cfg.packageName} needs a client ID starting with ${cfg.webClientPrefix}\n` +
        `   Release APKs bake .env at build time — run ${cfg.envCommand} immediately before ./gradlew.`,
    );
  } else {
    ok(`GOOGLE_WEB_CLIENT_ID matches ${cfg.label.toLowerCase()} Firebase project`);
  }
}

const googleServicesPath = path.join(root, cfg.googleServices);
if (!fs.existsSync(googleServicesPath)) {
  fail(`Missing ${cfg.googleServices}`);
} else {
  ok(`${flavor} google-services.json present`);
}

if (failed) {
  console.error(
    '\nSee docs/GOOGLE_SIGNIN_TROUBLESHOOTING.md for SHA-1 / Play Console steps.',
  );
  process.exit(1);
}

console.log(`\n${cfg.label} Android release pre-checks passed.\n`);
