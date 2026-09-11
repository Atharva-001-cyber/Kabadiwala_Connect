import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(__dirname, '../../frontend/src');

function scanDir(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath, fileList);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = scanDir(srcDir);

console.log(`Scanning ${allFiles.length} files in frontend/src...`);

// Patterns to search for:
// 1. Status rendered directly: .status}
// 2. Category rendered directly without categoryLabels
// 3. Parentheses with English text: \([A-Za-z ]+\)
// 4. Words like "Uplift", "Collector", "Recycler", "Admin" inside JSX

allFiles.forEach(file => {
  if (file.includes('translations.ts')) return; // handled separately
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(srcDir, file);

  lines.forEach((l, idx) => {
    // Check for raw status display
    if (l.match(/\{[a-zA-Z0-9_.]+\.status\}/)) {
      console.log(`[RAW STATUS] ${relPath}:${idx + 1}: ${l.trim()}`);
    }

    // Check for mixed bracket patterns like "(Collector)", "(Take Photo)"
    const bracketMatch = l.match(/\([A-Z][a-zA-Z\s&/+-]{2,}\)/);
    if (bracketMatch && !l.includes('class') && !l.includes('import') && !l.includes('function') && !l.includes('const') && !l.includes('Date') && !l.includes('Math') && !l.includes('toFixed') && !l.includes('typeof')) {
      console.log(`[MIXED BRACKET] ${relPath}:${idx + 1}: ${l.trim()}`);
    }

    // Check for hardcoded "Uplift"
    if (l.match(/>.*?\bUplift\b.*?<|'.*?\bUplift\b.*?'|".*?\bUplift\b.*?"/) && !l.includes('translations')) {
      console.log(`[HARDCODED UPLIFT] ${relPath}:${idx + 1}: ${l.trim()}`);
    }
  });
});
