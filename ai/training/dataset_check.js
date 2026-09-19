#!/usr/bin/env node
/**
 * Kabadiwala Connect — Dataset Validation & Integrity Checker (Node.js Port)
 * SIH 2026 Problem Statement 26229 — Genuine Edge AI Pipeline
 *
 * Implements the identical 12-point quality gates as ai/training/dataset_check.py:
 *   1. Image readability and format integrity (magic bytes)
 *   2. Missing labels and orphan label files
 *   3. YOLO label format validity (class_id cx cy w h)
 *   4. Normalized coordinate boundaries [0.0, 1.0]
 *   5. Class IDs strictly in range 0..7
 *   6. Hard-negative background validation (verified 0-byte label files)
 *   7. Exact duplicate detection via file hashing (SHA-256)
 *   8. Cross-split session leakage detection
 *   9. Class balance and instance distribution statistics
 *   10. Invalid bounding boxes (w <= 0, h <= 0)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FROZEN_CLASSES = {
  0: 'PCB_Circuit_Board',
  1: 'Battery',
  2: 'CRT',
  3: 'LCD_LED_Display',
  4: 'Cable_Wire',
  5: 'Electric_Motor',
  6: 'Magnet_bearing_Assembly',
  7: 'Mixed_EWaste'
};

const VALID_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);

function computeFileHash(filepath) {
  try {
    const buf = fs.readFileSync(filepath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch (e) {
    return null;
  }
}

function verifyImageHeader(filepath) {
  try {
    const fd = fs.openSync(filepath, 'r');
    const buf = Buffer.alloc(32);
    const bytesRead = fs.readSync(fd, buf, 0, 32, 0);
    fs.closeSync(fd);
    if (bytesRead < 8) return { valid: false, msg: 'File is under 8 bytes (truncated)' };
    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { valid: true, type: 'JPEG' };
    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { valid: true, type: 'PNG' };
    // WEBP
    if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return { valid: true, type: 'WEBP' };
    // BMP
    if (buf[0] === 0x42 && buf[1] === 0x4d) return { valid: true, type: 'BMP' };
    return { valid: false, msg: `Unrecognized magic bytes: ${buf.slice(0, 4).toString('hex')}` };
  } catch (e) {
    return { valid: false, msg: e.message };
  }
}

function extractSessionId(filename) {
  const stem = path.parse(filename).name;
  const parts = stem.split('_');
  if (parts.length >= 2 && ['session', 'lot', 'batch', 'set'].includes(parts[0].toLowerCase())) {
    return `${parts[0].toLowerCase()}_${parts[1].toLowerCase()}`;
  }
  return null;
}

function auditDataset(targetDir) {
  const rootPath = path.resolve(targetDir);
  console.log('\n' + '='.repeat(70));
  console.log('KABADIWALA CONNECT — E-WASTE DATASET INTEGRITY AUDIT');
  console.log(`Target Directory: ${rootPath}`);
  console.log('='.repeat(70) + '\n');

  if (!fs.existsSync(rootPath)) {
    console.log(`[ERROR] Target dataset directory does not exist: ${rootPath}`);
    return { success: false, report: { error: 'Directory does not exist' } };
  }

  const splits = ['train', 'val', 'test'];
  const report = {
    dataset_root: rootPath,
    splits_found: {},
    summary: {
      total_images: 0,
      total_labels: 0,
      total_instances: 0,
      hard_negatives: 0,
      corrupt_images: 0,
      missing_labels: 0,
      orphan_labels: 0,
      invalid_boxes: 0,
      out_of_range_classes: 0,
      duplicate_images: 0,
      session_leakages: 0
    },
    class_distribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    split_stats: {},
    issues: []
  };

  const imageHashes = new Map();
  const sessionToSplits = new Map();

  for (const split of splits) {
    const splitDir = path.join(rootPath, split);
    const imgDir = path.join(splitDir, 'images');
    const lblDir = path.join(splitDir, 'labels');

    const splitStat = {
      images: 0,
      labels: 0,
      hard_negatives: 0,
      instances: 0,
      class_counts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
      errors: []
    };

    if (!fs.existsSync(splitDir)) {
      console.log(`[WARNING] Partition '${split}/' not found in ${rootPath}`);
      report.splits_found[split] = false;
      continue;
    }

    report.splits_found[split] = true;
    const imgDirExists = fs.existsSync(imgDir);
    const lblDirExists = fs.existsSync(lblDir);

    if (!imgDirExists) {
      const issue = `Missing images directory: ${split}/images`;
      splitStat.errors.push(issue);
      report.issues.push(issue);
      console.log(`[ERROR] ${issue}`);
      continue;
    }

    if (!lblDirExists) {
      const issue = `Missing labels directory: ${split}/labels`;
      splitStat.errors.push(issue);
      report.issues.push(issue);
      console.log(`[ERROR] ${issue}`);
      continue;
    }

    // Collect image files
    const imageFiles = new Map();
    fs.readdirSync(imgDir).forEach(f => {
      const ext = path.extname(f).toLowerCase();
      if (VALID_IMAGE_EXTENSIONS.has(ext)) {
        imageFiles.set(path.parse(f).name, path.join(imgDir, f));
      }
    });

    // Collect label files
    const labelFiles = new Map();
    fs.readdirSync(lblDir).forEach(f => {
      if (path.extname(f).toLowerCase() === '.txt') {
        labelFiles.set(path.parse(f).name, path.join(lblDir, f));
      }
    });

    splitStat.images = imageFiles.size;
    splitStat.labels = labelFiles.size;
    report.summary.total_images += imageFiles.size;
    report.summary.total_labels += labelFiles.size;

    console.log(`--- Checking Partition: ${split.toUpperCase()} ---`);
    console.log(`  Images Found: ${imageFiles.size}`);
    console.log(`  Labels Found: ${labelFiles.size}`);

    // 1. Check images for readability & duplicate hash
    for (const [stem, imgPath] of imageFiles.entries()) {
      const hdr = verifyImageHeader(imgPath);
      if (!hdr.valid) {
        const issue = `Corrupt image header in ${split}/images/${path.basename(imgPath)}: ${hdr.msg}`;
        report.summary.corrupt_images++;
        splitStat.errors.push(issue);
        report.issues.push(issue);
      }

      const fhash = computeFileHash(imgPath);
      if (fhash) {
        if (imageHashes.has(fhash)) {
          const orig = imageHashes.get(fhash);
          const issue = `Duplicate image: ${split}/${path.basename(imgPath)} is identical to ${orig.split}/${path.basename(orig.path)}`;
          report.summary.duplicate_images++;
          report.issues.push(issue);
        } else {
          imageHashes.set(fhash, { split, path: imgPath });
        }
      }

      const sessId = extractSessionId(path.basename(imgPath));
      if (sessId) {
        if (!sessionToSplits.has(sessId)) sessionToSplits.set(sessId, new Set());
        sessionToSplits.get(sessId).add(split);
      }

      if (!labelFiles.has(stem)) {
        const issue = `Missing label: Image ${split}/images/${path.basename(imgPath)} has no matching .txt in ${split}/labels/`;
        report.summary.missing_labels++;
        splitStat.errors.push(issue);
        report.issues.push(issue);
      }
    }

    // 2. Check orphan labels
    for (const [stem, lblPath] of labelFiles.entries()) {
      if (!imageFiles.has(stem)) {
        const issue = `Orphan label: ${split}/labels/${path.basename(lblPath)} has no matching image in ${split}/images/`;
        report.summary.orphan_labels++;
        splitStat.errors.push(issue);
        report.issues.push(issue);
      }
    }

    // 3. Validate label contents
    for (const [stem, lblPath] of labelFiles.entries()) {
      let content = '';
      try {
        content = fs.readFileSync(lblPath, 'utf8').trim();
      } catch (e) {
        const issue = `Cannot read label ${split}/labels/${path.basename(lblPath)}: ${e.message}`;
        report.issues.push(issue);
        continue;
      }

      // Hard negative check
      if (!content) {
        splitStat.hard_negatives++;
        report.summary.hard_negatives++;
        continue;
      }

      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        splitStat.hard_negatives++;
        report.summary.hard_negatives++;
        continue;
      }

      lines.forEach((line, lineIdx) => {
        const tokens = line.split(/\s+/);
        if (tokens.length !== 5) {
          const issue = `Invalid YOLO format in ${split}/labels/${path.basename(lblPath)} line ${lineIdx + 1}: Expected 5 values, found ${tokens.length}: '${line}'`;
          report.summary.invalid_boxes++;
          report.issues.push(issue);
          return;
        }

        const cid = parseInt(tokens[0]);
        const cx = parseFloat(tokens[1]);
        const cy = parseFloat(tokens[2]);
        const w = parseFloat(tokens[3]);
        const h = parseFloat(tokens[4]);

        if (isNaN(cid) || isNaN(cx) || isNaN(cy) || isNaN(w) || isNaN(h)) {
          const issue = `Non-numeric values in ${split}/labels/${path.basename(lblPath)} line ${lineIdx + 1}: '${line}'`;
          report.summary.invalid_boxes++;
          report.issues.push(issue);
          return;
        }

        if (FROZEN_CLASSES[cid] === undefined) {
          const issue = `Out-of-range class ID ${cid} in ${split}/labels/${path.basename(lblPath)} line ${lineIdx + 1}. Allowed class IDs are 0 to 7.`;
          report.summary.out_of_range_classes++;
          report.issues.push(issue);
        } else {
          splitStat.class_counts[cid]++;
          report.class_distribution[cid]++;
        }

        const coordsValid = (
          cx >= 0.0 && cx <= 1.0 &&
          cy >= 0.0 && cy <= 1.0 &&
          w > 0.0 && w <= 1.0 &&
          h > 0.0 && h <= 1.0 &&
          (cx - w / 2) >= -0.05 &&
          (cx + w / 2) <= 1.05 &&
          (cy - h / 2) >= -0.05 &&
          (cy + h / 2) <= 1.05
        );

        if (!coordsValid) {
          const issue = `Invalid box geometry in ${split}/labels/${path.basename(lblPath)} line ${lineIdx + 1}: cx=${cx}, cy=${cy}, w=${w}, h=${h}`;
          report.summary.invalid_boxes++;
          report.issues.push(issue);
        }

        splitStat.instances++;
        report.summary.total_instances++;
      });
    }

    report.split_stats[split] = {
      images: splitStat.images,
      labels: splitStat.labels,
      hard_negatives: splitStat.hard_negatives,
      instances: splitStat.instances,
      class_counts: splitStat.class_counts
    };
    console.log(`  Valid Instances: ${splitStat.instances}`);
    console.log(`  Hard Negatives (0-byte): ${splitStat.hard_negatives}\n`);
  }

  // 4. Session leakage
  for (const [sessId, splitSet] of sessionToSplits.entries()) {
    if (splitSet.size > 1) {
      const issue = `Session Leakage: ${sessId} is split across multiple partitions: ${Array.from(splitSet).sort().join(', ')}`;
      report.summary.session_leakages++;
      report.issues.push(issue);
    }
  }

  // Print Summary Table
  console.log('='.repeat(70));
  console.log('DATASET INTEGRITY AUDIT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Images Analyzed:       ${report.summary.total_images}`);
  console.log(`Total Labels Analyzed:       ${report.summary.total_labels}`);
  console.log(`Total Bounding Boxes:        ${report.summary.total_instances}`);
  console.log(`Verified Hard Negatives:     ${report.summary.hard_negatives}`);
  console.log(`Corrupt Images:              ${report.summary.corrupt_images}`);
  console.log(`Missing Labels:              ${report.summary.missing_labels}`);
  console.log(`Orphan Labels:               ${report.summary.orphan_labels}`);
  console.log(`Invalid Bounding Boxes:      ${report.summary.invalid_boxes}`);
  console.log(`Out-of-Range Class IDs:      ${report.summary.out_of_range_classes}`);
  console.log(`Duplicate Images:            ${report.summary.duplicate_images}`);
  console.log(`Session Leakages:            ${report.summary.session_leakages}`);
  console.log('-'.repeat(70));

  console.log('\nCLASS INSTANCE DISTRIBUTION (FROZEN 8 TAXONOMY):');
  console.log(`ID   Class Name                   Instances    % of Total`);
  console.log('-'.repeat(60));
  const totalInst = Math.max(1, report.summary.total_instances);
  for (let cid = 0; cid < 8; cid++) {
    const cname = FROZEN_CLASSES[cid].padEnd(28, ' ');
    const cnt = (report.class_distribution[cid] || 0).toString().padEnd(12, ' ');
    const pct = (((report.class_distribution[cid] || 0) / totalInst) * 100).toFixed(2).padStart(6, ' ') + '%';
    console.log(`${cid}    ${cname} ${cnt} ${pct}`);
  }
  console.log('-'.repeat(60) + '\n');

  const hasErrors = (
    report.summary.corrupt_images > 0 ||
    report.summary.missing_labels > 0 ||
    report.summary.invalid_boxes > 0 ||
    report.summary.out_of_range_classes > 0 ||
    report.summary.session_leakages > 0
  );

  if (hasErrors) {
    console.log(`[STATUS] AUDIT FAILED — ${report.issues.length} issues detected. Fix before training.`);
  } else if (report.summary.total_images === 0) {
    console.log(`[STATUS] DATASET DIRECTORY IS EMPTY — No training data present.`);
  } else {
    console.log(`[STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.`);
  }

  return { success: !hasErrors && report.summary.total_images > 0, report };
}

const targetDir = process.argv[2] || 'd:\\Sih_229Anti\\dataset_ewaste_v1';
const { success, report } = auditDataset(targetDir);

if (process.argv.includes('--json')) {
  fs.writeFileSync('dataset_qc_report.json', JSON.stringify(report, null, 2));
  console.log('Detailed report written to dataset_qc_report.json');
}

process.exit(success ? 0 : 1);
