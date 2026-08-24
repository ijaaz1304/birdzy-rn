#!/usr/bin/env node

/**
 * Environment Switcher Script
 *
 * This script helps switch between different environment files.
 * Usage: node scripts/switch-env.js [dev|prod]
 */

const fs = require('fs');
const path = require('path');

const envFiles = {
  dev: '.env.dev',
  prod: '.env.prod',
  default: '.env',
};

const targetEnv = process.argv[2] || 'dev';

if (!envFiles[targetEnv]) {
  console.error(`❌ Invalid environment: ${targetEnv}`);
  console.error(`   Available: dev, prod`);
  process.exit(1);
}

const sourceFile = path.join(__dirname, '..', envFiles[targetEnv]);
const targetFile = path.join(__dirname, '..', envFiles.default);

if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Source file not found: ${sourceFile}`);
  console.error(`   Please create ${envFiles[targetEnv]} first.`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✅ Switched to ${targetEnv} environment`);
  console.log(`   Copied ${envFiles[targetEnv]} → ${envFiles.default}`);
} catch (error) {
  console.error(`❌ Failed to switch environment:`, error.message);
  process.exit(1);
}
