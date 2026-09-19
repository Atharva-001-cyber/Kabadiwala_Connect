/**
 * Kabadiwala Connect — Step 4E Public Dataset Ingestion & Validation Script
 * SIH 2026 Problem Statement 26229 — Genuine Edge AI Pipeline
 *
 * Ingests verified public datasets (SanderGi MIT, Open Images CC BY 4.0, TACO CC BY 4.0)
 * into staging, validates integrity, and merges into dataset_ewaste_v1/
 * without modifying any existing 160 base images.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) loc = 'https://huggingface.co' + loc;
        fetchBuffer(loc).then(resolve).catch(reject);
      } else if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
    }).on('error', reject);
  });
}

function computeSha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function computeMd5Split(key) {
  const hash = crypto.createHash('md5').update(key).digest();
  const val = hash[0] % 100;
  if (val < 70) return 'train';
  if (val < 85) return 'val';
  return 'test';
}

function convertObbToYolo(obbText) {
  const lines = obbText.trim().split('\n');
  const yoloLines = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/).map(Number);
    if (parts.length >= 9) {
      // 0 x1 y1 x2 y2 x3 y3 x4 y4
      const xs = [parts[1], parts[3], parts[5], parts[7]];
      const ys = [parts[2], parts[4], parts[6], parts[8]];
      const xmin = Math.max(0, Math.min(...xs));
      const xmax = Math.min(1, Math.max(...xs));
      const ymin = Math.max(0, Math.min(...ys));
      const ymax = Math.min(1, Math.max(...ys));
      const w = xmax - xmin;
      const h = ymax - ymin;
      const cx = xmin + w / 2;
      const cy = ymin + h / 2;
      if (w > 0.005 && h > 0.005) {
        yoloLines.push(`0 ${cx.toFixed(6)} ${cy.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`);
      }
    }
  }
  return yoloLines.join('\n');
}

async function runIngestion() {
  console.log('='.repeat(70));
  console.log('KABADIWALA CONNECT — STEP 4E PUBLIC DATASET INGESTION PIPELINE');
  console.log('='.repeat(70));

  const existingFile = path.resolve('existing_images.json');
  const existingImages = new Set(JSON.parse(fs.readFileSync(existingFile, 'utf8')));
  console.log(`Verified base dataset image count: ${existingImages.size} (Protected from overwrite)`);

  const stagingRoot = path.resolve('dataset_staging');
  const sandergiDir = path.join(stagingRoot, 'public_sandergi');
  const openimagesDir = path.join(stagingRoot, 'public_openimages');
  const tacoDir = path.join(stagingRoot, 'public_taco');

  [sandergiDir, openimagesDir, tacoDir].forEach(d => {
    fs.mkdirSync(path.join(d, 'images'), { recursive: true });
    fs.mkdirSync(path.join(d, 'labels'), { recursive: true });
  });

  const manifest = [];
  const knownHashes = new Set();

  // -------------------------------------------------------------------------
  // 1. INGEST SANDERGI PCB DATASET (MIT LICENSE)
  // -------------------------------------------------------------------------
  console.log('\n--- Ingesting SanderGi PCB Dataset (Class 0: PCB_Circuit_Board) ---');

  const boardSplitMap = {
    train: ['BCG-E2422B', 'BCG-E2599A', 'BCG-E2694A', 'BCG-E2816A', 'DuetWIFI', 'HackRF', 'RPI3B'],
    val: ['BCG-E2946A', 'Spartan6'],
    test: ['Zedboard']
  };

  const hfBase = 'https://huggingface.co/api/datasets/SanderGi/pcb-detection-augmented-obb/tree/main';
  const imgListBuf = await fetchBuffer(`${hfBase}/images/train`);
  const imgList = JSON.parse(imgListBuf.toString());

  let sandergiCount = 0;
  for (const split of ['train', 'val', 'test']) {
    const targetBoards = boardSplitMap[split];
    const candidateFiles = imgList.filter(item => {
      const filename = path.basename(item.path);
      return targetBoards.some(b => filename.startsWith(b));
    });

    console.log(`Split '${split}': Found ${candidateFiles.length} candidate boards for [${targetBoards.join(', ')}]`);

    // Limit to 12 images per board session to keep high diversity
    const perBoardCounts = {};
    for (const item of candidateFiles) {
      const rawName = path.basename(item.path);
      const boardPrefix = rawName.split('_')[0];
      perBoardCounts[boardPrefix] = (perBoardCounts[boardPrefix] || 0) + 1;
      if (perBoardCounts[boardPrefix] > 10) continue; // max 10 per session

      const finalName = `pcb_${rawName.replace(/\.png$/, '.jpg')}`;
      if (existingImages.has(finalName)) continue;

      const imgUrl = `https://huggingface.co/datasets/SanderGi/pcb-detection-augmented-obb/resolve/main/images/train/${rawName}`;
      const lblUrl = `https://huggingface.co/datasets/SanderGi/pcb-detection-augmented-obb/resolve/main/labels/train/${rawName.replace(/\.png$/, '.txt')}`;

      try {
        const [imgBuf, lblBuf] = await Promise.all([fetchBuffer(imgUrl), fetchBuffer(lblUrl)]);
        const hash = computeSha256(imgBuf);
        if (knownHashes.has(hash)) continue;
        knownHashes.add(hash);

        const yoloLabel = convertObbToYolo(lblBuf.toString());
        if (!yoloLabel) continue; // empty detection

        const imgPath = path.join(sandergiDir, 'images', finalName);
        const lblPath = path.join(sandergiDir, 'labels', finalName.replace(/\.jpg$/, '.txt'));

        fs.writeFileSync(imgPath, imgBuf);
        fs.writeFileSync(lblPath, yoloLabel);

        manifest.push({
          filename: finalName,
          source_type: 'VERIFIED_PUBLIC_DATASET',
          source_name: 'SanderGi/pcb-detection-augmented-obb',
          source_url: 'https://huggingface.co/datasets/SanderGi/pcb-detection-augmented-obb',
          license: 'MIT License',
          split: split,
          session_id: boardPrefix,
          target_class: 0,
          class_name: 'PCB_Circuit_Board',
          is_hard_negative: false,
          sha256: hash
        });

        sandergiCount++;
        process.stdout.write(`\r  Downloaded SanderGi PCB: ${sandergiCount}`);
      } catch (err) {
        // skip failed item
      }
    }
  }
  console.log(`\n  Successfully staged ${sandergiCount} SanderGi PCB images.`);

  // -------------------------------------------------------------------------
  // 2. INGEST OPEN IMAGES V7 (CC BY 4.0)
  // -------------------------------------------------------------------------
  console.log('\n--- Ingesting Google Open Images v7 (LCD, Mixed E-Waste, Hard Negatives) ---');
  const oiCandidates = JSON.parse(fs.readFileSync('openimages_candidates.json', 'utf8'));

  // Separate candidates by stream
  const lcdCandidates = [];
  const mixedCandidates = [];
  const negativeCandidates = [];

  for (const imgId in oiCandidates) {
    const annos = oiCandidates[imgId];
    const hasClass3 = annos.some(a => a.target_class === 3);
    const hasClass7 = annos.some(a => a.target_class === 7);
    const allNeg = annos.every(a => a.target_class === -1);

    if (hasClass3) {
      lcdCandidates.push(imgId);
    } else if (hasClass7) {
      mixedCandidates.push(imgId);
    } else if (allNeg) {
      negativeCandidates.push(imgId);
    }
  }

  console.log(`Open Images available: LCD=${lcdCandidates.length}, Mixed=${mixedCandidates.length}, PureNeg=${negativeCandidates.length}`);

  let oiCount = 0;
  async function downloadOiItem(imgId, categoryType) {
    const finalName = `oi_${imgId}.jpg`;
    if (existingImages.has(finalName)) return;

    const url = `https://open-images-dataset.s3.amazonaws.com/validation/${imgId}.jpg`;
    try {
      const imgBuf = await fetchBuffer(url);
      const hash = computeSha256(imgBuf);
      if (knownHashes.has(hash)) return;
      knownHashes.add(hash);

      const split = computeMd5Split(imgId);
      const annos = oiCandidates[imgId];

      let labelText = '';
      let isNeg = false;
      let targetClassDesc = '';

      if (categoryType === 'neg') {
        isNeg = true;
        targetClassDesc = 'Hard_Negative';
        labelText = ''; // 0-byte file
      } else {
        const positiveBoxes = annos.filter(a => a.target_class >= 0);
        labelText = positiveBoxes.map(b => `${b.target_class} ${b.cx.toFixed(6)} ${b.cy.toFixed(6)} ${b.w.toFixed(6)} ${b.h.toFixed(6)}`).join('\n');
        targetClassDesc = positiveBoxes.map(b => b.target_class).join(',');
      }

      const imgPath = path.join(openimagesDir, 'images', finalName);
      const lblPath = path.join(openimagesDir, 'labels', finalName.replace(/\.jpg$/, '.txt'));

      fs.writeFileSync(imgPath, imgBuf);
      fs.writeFileSync(lblPath, labelText);

      manifest.push({
        filename: finalName,
        source_type: 'VERIFIED_PUBLIC_DATASET',
        source_name: 'Google Open Images v7',
        source_url: 'https://storage.googleapis.com/openimages/web/index.html',
        license: 'CC BY 4.0',
        split: split,
        session_id: `oi_${imgId.slice(0, 4)}`,
        target_class: targetClassDesc,
        class_name: categoryType === 'lcd' ? 'LCD_LED_Display' : categoryType === 'mixed' ? 'Mixed_EWaste' : 'Hard_Negative',
        is_hard_negative: isNeg,
        sha256: hash
      });

      oiCount++;
      process.stdout.write(`\r  Downloaded Open Images: ${oiCount}`);
    } catch (e) {
      // skip 404 or broken S3 object
    }
  }

  // Stage up to 35 LCD monitors
  for (const id of lcdCandidates.slice(0, 35)) {
    await downloadOiItem(id, 'lcd');
  }

  // Stage up to 45 Mixed E-Waste items
  for (const id of mixedCandidates.slice(0, 45)) {
    await downloadOiItem(id, 'mixed');
  }

  // Stage up to 30 Hard Negatives
  for (const id of negativeCandidates.slice(0, 30)) {
    await downloadOiItem(id, 'neg');
  }
  console.log(`\n  Successfully staged ${oiCount} Open Images items.`);

  // -------------------------------------------------------------------------
  // 3. INGEST TACO HARD NEGATIVES (CC BY 4.0)
  // -------------------------------------------------------------------------
  console.log('\n--- Ingesting TACO Dataset (Hard Negatives: Cans, Bottles, Cartons) ---');
  let tacoCount = 0;
  try {
    const tacoAnnBuf = await fetchBuffer('https://raw.githubusercontent.com/pedropro/TACO/master/data/annotations.json');
    const tacoData = JSON.parse(tacoAnnBuf.toString());

    // Filter categories that are strictly domestic litter and NOT electronics/battery
    // Category IDs: 4 (Bottle cap), 5 (Bottle), 6 (Broken glass), 7 (Can), 9 (Carton), 10 (Cup), 12 (Lid)
    const validCatIds = new Set([4, 5, 6, 7, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    const batteryCatId = 60; // strictly excluded

    const safeImages = [];
    const imgAnnos = {};
    tacoData.annotations.forEach(a => {
      if (!imgAnnos[a.image_id]) imgAnnos[a.image_id] = [];
      imgAnnos[a.image_id].push(a.category_id);
    });

    for (const img of tacoData.images) {
      const cats = imgAnnos[img.id] || [];
      const hasBattery = cats.includes(batteryCatId);
      const isCleanLitter = cats.length > 0 && cats.every(c => validCatIds.has(c));
      if (!hasBattery && isCleanLitter) {
        safeImages.push(img);
      }
    }

    console.log(`TACO safe non-electronic images found: ${safeImages.length}`);

    // Download up to 25 verified clean TACO hard negative images
    for (const img of safeImages.slice(25, 50)) {
      const rawFile = path.basename(img.file_name);
      const finalName = `taco_${rawFile}`;
      if (existingImages.has(finalName)) continue;

      const imgUrl = `https://raw.githubusercontent.com/pedropro/TACO/master/data/${img.file_name}`;
      try {
        const imgBuf = await fetchBuffer(imgUrl);
        const hash = computeSha256(imgBuf);
        if (knownHashes.has(hash)) continue;
        knownHashes.add(hash);

        const split = computeMd5Split(finalName);
        const imgPath = path.join(tacoDir, 'images', finalName);
        const lblPath = path.join(tacoDir, 'labels', finalName.replace(/\.(jpg|jpeg|png)$/i, '.txt'));

        fs.writeFileSync(imgPath, imgBuf);
        fs.writeFileSync(lblPath, ''); // 0-byte file

        manifest.push({
          filename: finalName,
          source_type: 'VERIFIED_PUBLIC_DATASET',
          source_name: 'TACO (Trash Annotations in Context)',
          source_url: 'https://github.com/pedropro/TACO',
          license: 'CC BY 4.0',
          split: split,
          session_id: `taco_batch_${img.id}`,
          target_class: -1,
          class_name: 'Hard_Negative',
          is_hard_negative: true,
          sha256: hash
        });

        tacoCount++;
        process.stdout.write(`\r  Downloaded TACO Hard Negatives: ${tacoCount}`);
        if (tacoCount >= 20) break;
      } catch (e) {
        // skip failed
      }
    }
  } catch (e) {
    console.log('TACO download warning:', e.message);
  }
  console.log(`\n  Successfully staged ${tacoCount} TACO hard negatives.`);

  // -------------------------------------------------------------------------
  // 4. STAGING INTEGRITY VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- Verifying Staged Data Integrity ---');
  console.log(`Total new images staged: ${manifest.length}`);

  let validHeaderCount = 0;
  let pairedLabelCount = 0;
  for (const item of manifest) {
    let sourceFolder = sandergiDir;
    if (item.source_name.includes('Open Images')) sourceFolder = openimagesDir;
    if (item.source_name.includes('TACO')) sourceFolder = tacoDir;

    const imgFile = path.join(sourceFolder, 'images', item.filename);
    const lblFile = path.join(sourceFolder, 'labels', item.filename.replace(/\.(jpg|jpeg|png)$/i, '.txt'));

    if (fs.existsSync(imgFile) && fs.existsSync(lblFile)) {
      pairedLabelCount++;
      const fd = fs.openSync(imgFile, 'r');
      const header = Buffer.alloc(8);
      fs.readSync(fd, header, 0, 8, 0);
      fs.closeSync(fd);

      // Check JPEG or PNG
      const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
      const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e;
      if (isJpeg || isPng) validHeaderCount++;
    }
  }

  console.log(`Paired files verified: ${pairedLabelCount}/${manifest.length}`);
  console.log(`Image headers valid:   ${validHeaderCount}/${manifest.length}`);

  if (validHeaderCount !== manifest.length || pairedLabelCount !== manifest.length) {
    console.error('[ERROR] Staging verification failed! Aborting merge.');
    return;
  }

  // -------------------------------------------------------------------------
  // 5. MERGE VERIFIED DATA INTO dataset_ewaste_v1/
  // -------------------------------------------------------------------------
  console.log('\n--- Merging Verified Data into dataset_ewaste_v1/ ---');
  let mergedCount = 0;

  for (const item of manifest) {
    let sourceFolder = sandergiDir;
    if (item.source_name.includes('Open Images')) sourceFolder = openimagesDir;
    if (item.source_name.includes('TACO')) sourceFolder = tacoDir;

    const srcImg = path.join(sourceFolder, 'images', item.filename);
    const srcLbl = path.join(sourceFolder, 'labels', item.filename.replace(/\.(jpg|jpeg|png)$/i, '.txt'));

    // Target split in dataset_ewaste_v1
    const dstImgDir = path.resolve(`dataset_ewaste_v1/${item.split}/images`);
    const dstLblDir = path.resolve(`dataset_ewaste_v1/${item.split}/labels`);

    const dstImg = path.join(dstImgDir, item.filename);
    const dstLbl = path.join(dstLblDir, item.filename.replace(/\.(jpg|jpeg|png)$/i, '.txt'));

    // Strict safety check: Never overwrite existing base images
    if (existingImages.has(item.filename)) {
      console.error(`[SAFETY VIOLATION] Attempted to overwrite base image ${item.filename}! Skipping.`);
      continue;
    }

    fs.copyFileSync(srcImg, dstImg);
    fs.copyFileSync(srcLbl, dstLbl);
    mergedCount++;
  }

  console.log(`Successfully merged ${mergedCount} new verified images into dataset_ewaste_v1/.`);

  // Save new manifest records
  fs.writeFileSync('step4e_manifest.json', JSON.stringify(manifest, null, 2));
  console.log('Ingestion manifest saved to step4e_manifest.json');
}

runIngestion().catch(console.error);
