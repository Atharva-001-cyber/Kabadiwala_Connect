/**
 * ingest_battery_step5.js
 * 
 * STEP 5 Targeted Public Dataset Ingestion — Class 1: Battery
 * Sourced from Roboflow 100 Benchmark: cables-nl42k (CC BY 4.0)
 * 
 * Extracts verified Category 4 ("Batterie") instances:
 * - 40 images for train
 * - 8 images for val
 * - 8 images for test
 * Total = 56 images with real industrial battery packs/cells.
 * 
 * Converts COCO bboxes -> YOLO normalized coordinates (class 1).
 * Stages in dataset_staging/public_battery/
 * Runs strict Quality Control (QC):
 *   - JPEG header check
 *   - Label format and coordinate range [0, 1] check
 *   - SHA-256 deduplication against existing dataset_ewaste_v1
 *   - Zero cross-split leakage
 * Merges verified images and labels into dataset_ewaste_v1/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const TAR_ARCHIVE = path.resolve('dataset_staging', 'cables_nl42k.tar.gz');
const METADATA_DIR = path.resolve('dataset_staging', 'cables_metadata');
const STAGING_DIR = path.resolve('dataset_staging', 'public_battery');
const ACTIVE_DIR = path.resolve('dataset_ewaste_v1');

const SPLIT_TARGETS = {
  train: { cocoSplit: 'train', count: 40 },
  val: { cocoSplit: 'valid', count: 8 },
  test: { cocoSplit: 'test', count: 8 }
};

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  console.log('======================================================================');
  console.log('STEP 5 — CLASS 1 (BATTERY) INGESTION & CONVERSION PIPELINE');
  console.log('======================================================================');

  if (!fs.existsSync(TAR_ARCHIVE)) {
    throw new Error(`Archive not found: ${TAR_ARCHIVE}`);
  }

  // Ensure staging directories
  for (const split of ['train', 'val', 'test']) {
    ensureDir(path.join(STAGING_DIR, split, 'images'));
    ensureDir(path.join(STAGING_DIR, split, 'labels'));
  }

  // Load existing image hashes to ensure 0 duplicates
  const existingHashes = new Set();
  for (const split of ['train', 'val', 'test']) {
    const imgDir = path.join(ACTIVE_DIR, split, 'images');
    if (fs.existsSync(imgDir)) {
      for (const file of fs.readdirSync(imgDir)) {
        if (/\.(jpg|jpeg|png)$/i.test(file)) {
          const buf = fs.readFileSync(path.join(imgDir, file));
          existingHashes.add(sha256(buf));
        }
      }
    }
  }
  console.log(`Loaded ${existingHashes.size} existing image hashes from active dataset.`);

  const stagedRecords = { train: [], val: [], test: [] };
  const allStagedHashes = new Map();

  for (const [split, cfg] of Object.entries(SPLIT_TARGETS)) {
    console.log(`\n--- Processing Split: ${split.toUpperCase()} (Target: ${cfg.count} images) ---`);
    const jsonPath = path.join(METADATA_DIR, `${cfg.cocoSplit}__annotations.coco.json`);
    const coco = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Filter annotations for Category 4: Batterie
    const batteryAnns = coco.annotations.filter(a => a.category_id === 4);
    const imgMap = new Map(coco.images.map(img => [img.id, img]));

    // Group annotations by image
    const imgToAnns = new Map();
    for (const ann of batteryAnns) {
      if (!imgToAnns.has(ann.image_id)) imgToAnns.set(ann.image_id, []);
      imgToAnns.get(ann.image_id).push(ann);
    }

    // Sort candidate images by count of clean bounding boxes (prefer 2-10 boxes, clean areas)
    const candidates = [];
    for (const [imgId, anns] of imgToAnns.entries()) {
      const imgInfo = imgMap.get(imgId);
      if (!imgInfo) continue;
      // Validate bounding boxes
      const validBboxes = anns.filter(a => {
        const [x, y, w, h] = a.bbox;
        return w >= 10 && h >= 10 && x >= 0 && y >= 0 && (x + w) <= (imgInfo.width + 5) && (y + h) <= (imgInfo.height + 5);
      });
      if (validBboxes.length >= 1 && validBboxes.length <= 15) {
        candidates.push({ imgInfo, bboxes: validBboxes });
      }
    }

    console.log(`Found ${candidates.length} valid battery candidate images in ${cfg.cocoSplit}. Selecting top ${cfg.count}...`);

    let selected = 0;
    for (let i = 0; i < candidates.length && selected < cfg.count; i++) {
      const { imgInfo, bboxes } = candidates[i];
      const origFileName = imgInfo.file_name;
      const tarPath = `home/zuppif/Documents/Work/RoboFlow/ODinW-RF100-challenge/rf100/cables-nl42k/${cfg.cocoSplit}/${origFileName}`;

      // Extract specific file using tar to a temporary location
      const tempExtractDir = path.join(STAGING_DIR, '_temp');
      ensureDir(tempExtractDir);

      try {
        execSync(`tar -xzf "${TAR_ARCHIVE}" -C "${tempExtractDir}" "${tarPath}"`, { stdio: 'pipe' });
      } catch (err) {
        console.warn(`Failed to extract ${tarPath}:`, err.message);
        continue;
      }

      const extractedFilePath = path.join(tempExtractDir, tarPath);
      if (!fs.existsSync(extractedFilePath)) {
        console.warn(`Extracted file not found at ${extractedFilePath}`);
        continue;
      }

      const imgBuffer = fs.readFileSync(extractedFilePath);
      const imgHash = sha256(imgBuffer);

      // Check collision
      if (existingHashes.has(imgHash) || allStagedHashes.has(imgHash)) {
        console.warn(`Skipping duplicate image hash: ${imgHash.slice(0, 12)}`);
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
        continue;
      }

      // Check JPEG validity
      if (imgBuffer.length < 1000 || imgBuffer[0] !== 0xFF || imgBuffer[1] !== 0xD8) {
        console.warn(`Skipping invalid JPEG: ${origFileName}`);
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
        continue;
      }

      // Generate deterministic filename
      const hashShort = imgHash.slice(0, 8);
      const destBase = `battery_cables_${split}_${String(selected + 1).padStart(3, '0')}_${hashShort}`;
      const destImgPath = path.join(STAGING_DIR, split, 'images', `${destBase}.jpg`);
      const destLblPath = path.join(STAGING_DIR, split, 'labels', `${destBase}.txt`);

      // Write image
      fs.copyFileSync(extractedFilePath, destImgPath);

      // Convert COCO bboxes to YOLO normalized format:
      // class_id cx cy nw nh
      // class_id = 1 (Battery in frozen taxonomy)
      const yoloLines = [];
      const imgW = imgInfo.width;
      const imgH = imgInfo.height;

      for (const ann of bboxes) {
        let [x, y, w, h] = ann.bbox;
        // Clamp to image bounds
        if (x < 0) { w += x; x = 0; }
        if (y < 0) { h += y; y = 0; }
        if (x + w > imgW) w = imgW - x;
        if (y + h > imgH) h = imgH - y;

        if (w <= 2 || h <= 2) continue;

        let cx = (x + w / 2.0) / imgW;
        let cy = (y + h / 2.0) / imgH;
        let nw = w / imgW;
        let nh = h / imgH;

        // Clamp to valid range
        cx = Math.max(0.0001, Math.min(0.9999, cx));
        cy = Math.max(0.0001, Math.min(0.9999, cy));
        nw = Math.max(0.0001, Math.min(0.9999, nw));
        nh = Math.max(0.0001, Math.min(0.9999, nh));

        yoloLines.push(`1 ${cx.toFixed(6)} ${cy.toFixed(6)} ${nw.toFixed(6)} ${nh.toFixed(6)}`);
      }

      if (yoloLines.length === 0) {
        console.warn(`No valid bboxes remaining after clamping for ${origFileName}`);
        fs.unlinkSync(destImgPath);
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
        continue;
      }

      fs.writeFileSync(destLblPath, yoloLines.join('\n') + '\n', 'utf8');

      // Record
      allStagedHashes.set(imgHash, { split, destBase });
      stagedRecords[split].push({
        origFile: origFileName,
        destBase,
        imgHash,
        boxCount: yoloLines.length
      });

      selected++;
      // Clean up temp dir
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }

    console.log(`Successfully staged ${selected} battery images (${stagedRecords[split].reduce((sum, r) => sum + r.boxCount, 0)} boxes) for ${split}.`);
  }

  // Run Quality Control Audit on Staged Data
  console.log('\n======================================================================');
  console.log('QUALITY CONTROL AUDIT ON STAGED BATTERY DATA');
  console.log('======================================================================');

  let qcPassed = true;
  let totalStagedImages = 0;
  let totalStagedBoxes = 0;

  for (const split of ['train', 'val', 'test']) {
    const records = stagedRecords[split];
    totalStagedImages += records.length;
    const imgDir = path.join(STAGING_DIR, split, 'images');
    const lblDir = path.join(STAGING_DIR, split, 'labels');

    for (const rec of records) {
      totalStagedBoxes += rec.boxCount;
      const imgPath = path.join(imgDir, `${rec.destBase}.jpg`);
      const lblPath = path.join(lblDir, `${rec.destBase}.txt`);

      if (!fs.existsSync(imgPath) || !fs.existsSync(lblPath)) {
        console.error(`QC FAIL: Missing paired file for ${rec.destBase}`);
        qcPassed = false;
      }

      const imgBuf = fs.readFileSync(imgPath);
      if (imgBuf.length < 1000 || imgBuf[0] !== 0xFF || imgBuf[1] !== 0xD8) {
        console.error(`QC FAIL: Corrupt JPEG header for ${rec.destBase}`);
        qcPassed = false;
      }

      const lblContent = fs.readFileSync(lblPath, 'utf8').trim();
      if (!lblContent) {
        console.error(`QC FAIL: Empty label file for ${rec.destBase}`);
        qcPassed = false;
      }

      const lines = lblContent.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length !== 5) {
          console.error(`QC FAIL: Invalid YOLO parts count in ${rec.destBase}: ${line}`);
          qcPassed = false;
        }
        const [cls, cx, cy, nw, nh] = parts.map(Number);
        if (cls !== 1) {
          console.error(`QC FAIL: Unexpected class ID ${cls} in ${rec.destBase} (expected 1 for Battery)`);
          qcPassed = false;
        }
        if (cx <= 0 || cx >= 1 || cy <= 0 || cy >= 1 || nw <= 0 || nw >= 1 || nh <= 0 || nh >= 1) {
          console.error(`QC FAIL: Out of bounds coords in ${rec.destBase}: ${line}`);
          qcPassed = false;
        }
      }
    }
  }

  console.log(`Total Staged Images: ${totalStagedImages}`);
  console.log(`Total Staged Battery Bounding Boxes: ${totalStagedBoxes}`);
  console.log(`QC Audit Result: ${qcPassed ? 'PASSED (100% Valid)' : 'FAILED'}`);

  if (!qcPassed) {
    throw new Error('QC check failed. Aborting merge.');
  }

  // Merge into active dataset
  console.log('\n======================================================================');
  console.log('MERGING VERIFIED SAMPLES INTO ACTIVE DATASET (dataset_ewaste_v1/)');
  console.log('======================================================================');

  let mergedCount = 0;
  for (const split of ['train', 'val', 'test']) {
    const records = stagedRecords[split];
    for (const rec of records) {
      const srcImg = path.join(STAGING_DIR, split, 'images', `${rec.destBase}.jpg`);
      const srcLbl = path.join(STAGING_DIR, split, 'labels', `${rec.destBase}.txt`);

      const destImg = path.join(ACTIVE_DIR, split, 'images', `${rec.destBase}.jpg`);
      const destLbl = path.join(ACTIVE_DIR, split, 'labels', `${rec.destBase}.txt`);

      if (fs.existsSync(destImg) || fs.existsSync(destLbl)) {
        throw new Error(`Collision detected: ${destImg} already exists! Aborting merge.`);
      }

      fs.copyFileSync(srcImg, destImg);
      fs.copyFileSync(srcLbl, destLbl);
      mergedCount++;
    }
  }

  console.log(`Successfully merged ${mergedCount} new Battery images and labels into dataset_ewaste_v1/`);

  // Write Ingestion Manifest
  const manifestPath = path.join('dataset_staging', 'battery_ingestion_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    source: 'Francesco/cables-nl42k (Roboflow 100 / Hugging Face)',
    license: 'CC BY 4.0',
    provenanceUrl: 'https://huggingface.co/datasets/Francesco/cables-nl42k',
    totalImages: totalStagedImages,
    totalBoxes: totalStagedBoxes,
    splitBreakdown: {
      train: stagedRecords.train.length,
      val: stagedRecords.val.length,
      test: stagedRecords.test.length
    },
    records: stagedRecords
  }, null, 2), 'utf8');

  console.log(`Saved ingestion manifest to ${manifestPath}`);
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
