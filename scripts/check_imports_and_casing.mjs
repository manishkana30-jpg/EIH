// scripts/check_imports_and_casing.mjs
import fs from 'fs';
import path from 'path';

function checkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', '.venv', 'reports'].includes(entry.name)) {
        checkDir(full);
      }
    } else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) {
      checkFile(full);
    }
  }
}

let issues = 0;
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /(?:import|from|export\s+.*from)\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const relPath = match[1];
    const resolvedBase = path.resolve(path.dirname(filePath), relPath);
    const parentDir = path.dirname(resolvedBase);
    const targetBaseName = path.basename(resolvedBase);
    if (!fs.existsSync(parentDir)) {
      console.log('MISSING PARENT:', filePath, relPath);
      issues++;
      continue;
    }
    const realFiles = fs.readdirSync(parentDir);
    const candidates = [
      targetBaseName,
      targetBaseName + '.ts',
      targetBaseName + '.tsx',
      targetBaseName + '.js',
      targetBaseName + '.jsx',
      targetBaseName + '.mjs',
      targetBaseName + '.json',
      path.join(targetBaseName, 'index.ts'),
      path.join(targetBaseName, 'index.tsx'),
      path.join(targetBaseName, 'index.js'),
    ];
    let found = false;
    for (const cand of candidates) {
      if (cand.includes(path.sep)) {
        const sub = cand.split(path.sep);
        if (realFiles.includes(sub[0]) && fs.existsSync(path.join(parentDir, cand))) {
          const actualSubFiles = fs.readdirSync(path.join(parentDir, sub[0]));
          if (actualSubFiles.includes(sub[1])) {
            found = true;
            break;
          }
        }
      } else if (realFiles.includes(cand)) {
        found = true;
        break;
      }
    }
    if (!found) {
      const lower = targetBaseName.toLowerCase();
      const matchCase = realFiles.find(f => f.toLowerCase() === lower || f.toLowerCase().startsWith(lower + '.'));
      if (matchCase) {
        console.log('CASE MISMATCH in', filePath, ':', relPath, '-> actual file on disk is:', matchCase);
        issues++;
      } else {
        console.log('UNRESOLVED IMPORT in', filePath, ':', relPath);
        issues++;
      }
    }
  }
}

checkDir(path.resolve('.'));
console.log('Total import/case issues:', issues);
