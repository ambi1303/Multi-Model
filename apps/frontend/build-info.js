#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate build info
const buildInfo = {
  buildTime: new Date().toISOString(),
  timestamp: Date.now(),
  version: process.env.npm_package_version || '1.0.0',
  nodeVersion: process.version,
  platform: process.platform,
  buildHash: Math.random().toString(36).substr(2, 9),
};

// Write build info to dist directory
const distDir = path.join(__dirname, 'dist');
const buildInfoPath = path.join(distDir, 'build-info.json');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log('Build info generated:');
console.log(JSON.stringify(buildInfo, null, 2));
console.log(`Written to: ${buildInfoPath}`); 