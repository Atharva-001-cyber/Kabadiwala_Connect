const fs = require('fs');
const path = require('path');

const trcDir = 'dataset_staging/roboflow_trc';
const splits = ['train', 'valid', 'test'];

for (const split of splits) {
  const lblDir = path.join(trcDir, split, 'labels');
  const files = fs.readdirSync(lblDir).filter(f => f.endsWith('.txt'));
  
  let cableOnly = 0;
  let hddOnly = 0;
  let cableWithOther = 0;
  let hddWithOther = 0;
  let totalCableImages = 0;
  let totalHddImages = 0;

  for (const f of files) {
    const lines = fs.readFileSync(path.join(lblDir, f), 'utf8').trim().split('\n').filter(Boolean);
    const classes = new Set();
    for (const l of lines) {
      const cls = parseInt(l.trim().split(/\s+/)[0], 10);
      classes.add(cls);
    }
    const hasCable = classes.has(10);
    const hasHdd = classes.has(2) || classes.has(12);
    const otherClasses = Array.from(classes).filter(c => c !== 10 && c !== 2 && c !== 12);

    if (hasCable) totalCableImages++;
    if (hasHdd) totalHddImages++;

    if (hasCable && otherClasses.length === 0) cableOnly++;
    if (hasCable && otherClasses.length > 0) cableWithOther++;

    if (hasHdd && otherClasses.length === 0) hddOnly++;
    if (hasHdd && otherClasses.length > 0) hddWithOther++;
  }

  console.log(`Split ${split}: Cable Images=${totalCableImages} (pure=${cableOnly}, mixed=${cableWithOther}), HDD Images=${totalHddImages} (pure=${hddOnly}, mixed=${hddWithOther})`);
}
