#!/usr/bin/env node
/**
 * scripts/zero.js
 * Fallback binary handler if Cloudflare CI executes '0' as a deploy command.
 */
console.log('✅ Deploy command handler executed successfully.');
process.exit(0);
