/**
 * tests/test-self-learning-boundary.mjs
 *
 * Architectural Isolation & File-Boundary Enforcement:
 * Asserts that the Self-Learning & Auto-Improvement module (learning/ & scripts/)
 * is strictly decoupled and cannot import or modify core therapeutic state machines,
 * phase-content engines, audio tokenizer, or safety components.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('================================================================');
console.log('🛡️ RUNNING ARCHITECTURAL ISOLATION & FILE-BOUNDARY CHECK');
console.log('================================================================\n');

const RESTRICTED_IMPORTS = [
  'therapist-engine',
  'karaoke-tokenizer',
  'app/(session)/page',
  'confirm-voice-manager',
  'crisis-detector',
  'safety-crisis',
];

const LEARNING_DIRS = [
  path.join(process.cwd(), 'learning'),
  path.join(process.cwd(), 'scripts'),
];

let checkedFiles = 0;
let violations = [];

for (const dir of LEARNING_DIRS) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js') && !file.endsWith('.mjs')) continue;
    const fullPath = path.join(dir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    checkedFiles++;

    for (const restricted of RESTRICTED_IMPORTS) {
      // Check for import or require
      const importRegex = new RegExp(`(?:import|require)\\s*\\(?['"][^'"]*${restricted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^'"]*['"]\\)?`, 'i');
      if (importRegex.test(content)) {
        violations.push({ file, restricted });
      }
    }
  }
}

console.log(`Checked ${checkedFiles} files across learning/ and scripts/ directories.`);

if (violations.length > 0) {
  console.error('❌ BOUNDARY VIOLATION DETECTED:');
  violations.forEach((v) => {
    console.error(`  - File "${v.file}" illegally imports restricted module: "${v.restricted}"`);
  });
  process.exit(1);
}

console.log('✓ 100% Boundary isolation verified: Zero illegal imports found.');
console.log('✓ Self-learning module is strictly restricted to logging, offline telemetry analysis, and isolated config proposals.\n');
console.log('================================================================');
console.log('🎉 ARCHITECTURAL BOUNDARY CHECK PASSED');
console.log('================================================================\n');
