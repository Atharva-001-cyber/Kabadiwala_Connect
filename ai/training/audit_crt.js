const fs = require('fs');
const path = require('path');

const crtDir = 'dataset_staging/roboflow_crt/train/labels';
const files = fs.readdirSync(crtDir).filter(f => f.endsWith('.txt'));

console.log(`Total CRT label files: ${files.length}`);

// Group by base video frame name before .rf.
const frameGroups = new Map();
const boxCountDist = {};

for (const f of files) {
  const baseFrame = f.split('.rf.')[0];
  if (!frameGroups.has(baseFrame)) frameGroups.set(baseFrame, []);
  frameGroups.get(baseFrame).push(f);

  const lines = fs.readFileSync(path.join(crtDir, f), 'utf8').trim().split('\n').filter(Boolean);
  const count = lines.length;
  boxCountDist[count] = (boxCountDist[count] || 0) + 1;
}

console.log(`Distinct base frames: ${frameGroups.size}`);
console.log('Sample base frames:', Array.from(frameGroups.keys()).slice(0, 15));
console.log('Box count distribution (boxes per image : number of images):');
const sortedCounts = Object.keys(boxCountDist).map(Number).sort((a, b) => a - b);
for (const c of sortedCounts.slice(0, 15)) {
  console.log(`  ${c} boxes: ${boxCountDist[c]} images`);
}
