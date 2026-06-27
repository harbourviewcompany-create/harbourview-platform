#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Generating design tokens from Figma via Style Dictionary...\n');

try {
  // Run Style Dictionary
  execSync('npx style-dictionary build --config ./style-dictionary.config.js', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log('\n✅ Design tokens generated successfully!');
  console.log('   → styles/design-tokens.css');
  console.log('   → lib/design-tokens.ts (optional)');
} catch (error) {
  console.error('❌ Token generation failed:', error.message);
  process.exit(1);
}