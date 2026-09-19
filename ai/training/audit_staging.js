const fs = require('fs');
const path = require('path');

function auditDataset(name, dir, classMapNames) {
  console.log('======================================================================');
  console.log(`AUDIT: ${name} (${dir})`);
  console.log('======================================================================');
  
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const splits = ['train', 'valid', 'test', 'val'];
  let totalImages = 0;
  let totalLabels = 0;
  let totalBoxes = 0;
  const classCounts = {};

  for (const split of splits) {
    const splitDir = path.join(dir, split);
    if (!fs.existsSync(splitDir)) continue;

    const imgDir = path.join(splitDir, 'images');
    const lblDir = path.join(splitDir, 'labels');

    if (!fs.existsSync(imgDir) || !fs.existsSync(lblDir)) {
      console.log(`Split ${split}: missing images or labels dir`);
      continue;
    }

    const imgFiles = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    const lblFiles = fs.readdirSync(lblDir).filter(f => f.endsWith('.txt'));

    let splitBoxes = 0;
    const splitClassCounts = {};

    for (const lbl of lblFiles) {
      const content = fs.readFileSync(path.join(lblDir, lbl), 'utf8').trim();
      if (!content) continue;
      const lines = content.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const clsId = parseInt(parts[0], 10);
          splitBoxes++;
          splitClassCounts[clsId] = (splitClassCounts[clsId] || 0) + 1;
          classCounts[clsId] = (classCounts[clsId] || 0) + 1;
        }
      }
    }

    totalImages += imgFiles.length;
    totalLabels += lblFiles.length;
    totalBoxes += splitBoxes;

    console.log(`Split [${split}]: ${imgFiles.length} images, ${lblFiles.length} labels, ${splitBoxes} boxes`);
    for (const [clsId, count] of Object.entries(splitClassCounts)) {
      const clsName = (classMapNames && classMapNames[clsId]) ? classMapNames[clsId] : `class_${clsId}`;
      console.log(`  - Class ${clsId} (${clsName}): ${count}`);
    }
  }

  console.log(`TOTAL: ${totalImages} images, ${totalLabels} label files, ${totalBoxes} boxes`);
  console.log('Class Totals:');
  for (const [clsId, count] of Object.entries(classCounts)) {
    const clsName = (classMapNames && classMapNames[clsId]) ? classMapNames[clsId] : `class_${clsId}`;
    console.log(`  Class ${clsId} (${clsName}): ${count}`);
  }
}

auditDataset('Electric Motor Housing', 'dataset_staging/roboflow_motor', ['Electric-motor-housing', 'rusty electric-motor-housing']);
auditDataset('TRC E-Waste Detection Model', 'dataset_staging/roboflow_trc', [
  '9V Battery', 'Battery', 'HDD', 'Keyboard', 'NetworkSwitch', 
  'Printed Circuit Board PCB', 'Remote control', 'Router', 'Smart Phone', 
  'USB Flash Drive', 'cable', 'computer mouse', 'internal HDD'
]);
auditDataset('CRT', 'dataset_staging/roboflow_crt', ['CRT']);
