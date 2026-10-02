"""Prepare an isolated device-recognition dataset from the approved Roboflow ZIP.

Never modifies source ZIP, legacy component data or deployed weights. Requires Pillow.
Retains original test split; removes lower-priority duplicates/source variants.
This is a structural audit, NOT certification of label semantics.
"""
import argparse
import ast
from collections import Counter, defaultdict
import hashlib
import io
import json
import math
from pathlib import Path, PurePosixPath
import re
import zipfile
from PIL import Image, ImageOps

NAMES = ['PCB', 'Battery', 'CRT', 'FlatPanel', 'Keyboard', 'Smartphone',
         'Tablet', 'Laptop', 'HDD', 'Mouse', 'BarPhone']
SOURCE_CLASSES = {
    'PCB': 'PCB', 'Battery': 'Battery', 'CRT-Monitor': 'CRT', 'CRT-TV': 'CRT',
    'Flat-Panel-Monitor': 'FlatPanel', 'Flat-Panel-TV': 'FlatPanel',
    'Computer-Keyboard': 'Keyboard', 'Smartphone': 'Smartphone', 'Tablet': 'Tablet',
    'Laptop': 'Laptop', 'HDD': 'HDD', 'Computer-Mouse': 'Mouse', 'Bar-Phone': 'BarPhone',
}
PRIORITY = {'train': 0, 'valid': 1, 'test': 2}
# Visually reviewed on 2026-09-30: broken CRT tube labelled Flat-Panel-TV.
# Quarantine, rather than silently relabel an ambiguous damaged device.
QUARANTINED_HASHES = {'00780ad4198c088e1cb8199b381df08c7ca8b39dd2a0d1213ee54e749cd7e3a7'}

def parse_label(line, classes):
    values = [float(x) for x in line.split()]
    if not values or any(not math.isfinite(x) for x in values):
        raise ValueError('Empty/nonfinite annotation')
    cls = int(values[0])
    if cls != values[0] or not 0 <= cls < len(classes):
        raise ValueError('Invalid class ID')
    coords = values[1:]
    if len(coords) < 4 or any(x < 0 or x > 1 for x in coords):
        raise ValueError('Invalid normalized coordinates')
    if len(coords) == 4:
        cx, cy, w, h = coords
    elif len(coords) >= 6 and len(coords) % 2 == 0:
        xs, ys = coords[::2], coords[1::2]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        cx, cy = (max(xs) + min(xs))/2, (max(ys) + min(ys))/2
    else:
        raise ValueError('Invalid polygon')
    if w <= 0 or h <= 0 or cx-w/2 < -0.002 or cy-h/2 < -0.002 or cx+w/2 > 1.002 or cy+h/2 > 1.002:
        raise ValueError('Box outside image or zero area')
    return classes[cls], (cx, cy, w, h)

def safe_members(archive):
    names = set()
    total = 0
    for item in archive.infolist():
        path = PurePosixPath(item.filename.replace('\\', '/'))
        if path.is_absolute() or '..' in path.parts or ':' in str(path):
            raise ValueError('Unsafe archive path')
        if item.filename in names:
            raise ValueError('Duplicate archive member')
        if item.flag_bits & 1 or item.file_size > 64*1024*1024:
            raise ValueError('Encrypted or oversized member')
        names.add(item.filename)
        total += item.file_size
    if total > 8*1024**3:
        raise ValueError('Archive exceeds 8 GiB safety bound')
    return names

def prepare(zip_path, output, legacy):
    if output.exists():
        raise ValueError('Output already exists; choose a fresh directory. No overwrite allowed.')
    report = {'source': str(zip_path), 'classes': NAMES, 'skipped': Counter(),
              'invalid_examples': [], 'semantic_review_complete': False,
              'near_duplicate_review_complete': False, 'external_field_test_complete': False}
    digest = hashlib.sha256()
    with zip_path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024*1024), b''):
            digest.update(chunk)
    report['zip_sha256'] = digest.hexdigest()
    legacy_hashes = set()
    if legacy and legacy.is_dir():
        for item in legacy.glob('*/images/*'):
            if item.is_file():
                legacy_hashes.add(hashlib.sha256(item.read_bytes()).hexdigest())
    with zipfile.ZipFile(zip_path) as archive:
        members = safe_members(archive)
        config = archive.read('data.yaml').decode('utf-8-sig')
        match = re.search(r'^names:\s*(\[.*\])\s*$', config, re.M)
        if not match:
            raise ValueError('Expected inline YAML names list')
        source_classes = ast.literal_eval(match.group(1))
        if not isinstance(source_classes, list) or not all(isinstance(x, str) for x in source_classes):
            raise ValueError('Invalid source class names')
        missing = set(SOURCE_CLASSES) - set(source_classes)
        if missing:
            raise ValueError(f'Required source classes absent: {missing}')
        records = []
        for name in sorted(members):
            path = PurePosixPath(name)
            if len(path.parts) != 3 or path.parts[0] not in PRIORITY or path.parts[1] != 'images' or path.suffix.lower() not in ('.jpg','.jpeg','.png'):
                continue
            label_path = f'{path.parts[0]}/labels/{path.stem}.txt'
            if label_path not in members:
                raise ValueError(f'Missing annotation: {name}')
            try:
                labels = [parse_label(line, source_classes) for line in archive.read(label_path).decode('utf-8-sig').splitlines() if line.strip()]
            except ValueError as error:
                report['skipped']['invalid_annotation'] += 1
                if len(report['invalid_examples']) < 20:
                    report['invalid_examples'].append({'image':name, 'error':str(error)})
                continue
            # Do not erase unrelated annotations and teach the model those objects
            # are background. Skip the entire image when it contains other classes.
            if not labels or any(cls not in SOURCE_CLASSES for cls, _ in labels):
                report['skipped']['empty_or_other_classes'] += 1
                continue
            raw = archive.read(name)
            raw_hash = hashlib.sha256(raw).hexdigest()
            if raw_hash in QUARANTINED_HASHES:
                report['skipped']['visual_label_quarantine'] += 1
                continue
            if raw_hash in legacy_hashes:
                report['skipped']['legacy_overlap'] += 1
                continue
            try:
                with Image.open(io.BytesIO(raw)) as image:
                    image.load()
                    if image.getexif().get(274, 1) != 1:
                        raise ValueError('Non-normal orientation requires label rotation')
                    rgb = image.convert('RGB')
                    pixel_hash = hashlib.sha256(str(rgb.size).encode()+rgb.tobytes()).hexdigest()
            except Exception as error:
                raise ValueError(f'Image decode failed: {name}: {error}') from error
            mapped = [(NAMES.index(SOURCE_CLASSES[cls]), box) for cls, box in labels]
            records.append({'name':name, 'split':path.parts[0], 'pixel':pixel_hash,
                            'source_group': re.split(r'\.rf\.', path.stem)[0],
                            'raw':raw_hash, 'labels':mapped})
        # Union transitive exact-pixel and original filename groups, even when
        # an intermediate image connects two otherwise different groups.
        parent = list(range(len(records)))
        def find(i):
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i
        keys = {}
        for i, record in enumerate(records):
            for field in ('pixel', 'source_group'):
                key = (field, record[field])
                if key in keys:
                    parent[find(i)] = find(keys[key])
                keys[key] = i
        groups = defaultdict(list)
        for i, record in enumerate(records):
            groups[find(i)].append(record)
        retained = []
        for group in groups.values():
            split = max((r['split'] for r in group), key=PRIORITY.get)
            seen = set()
            for record in group:
                if record['split'] != split:
                    report['skipped']['cross_split_source_overlap'] += 1
                elif record['pixel'] in seen:
                    report['skipped']['same_split_exact_duplicate'] += 1
                else:
                    seen.add(record['pixel'])
                    retained.append(record)
        report['counts'] = {s: {'images':0, 'objects':dict.fromkeys(NAMES, 0), 'images_per_class':dict.fromkeys(NAMES, 0)} for s in ('train','val','test')}
        output.mkdir(parents=True)
        for split in report['counts']:
            for folder in ('images','labels'):
                (output/split/folder).mkdir(parents=True)
        manifest = []
        for record in retained:
            split = 'val' if record['split'] == 'valid' else record['split']
            filename = record['raw'] + PurePosixPath(record['name']).suffix.lower()
            (output/split/'images'/filename).write_bytes(archive.read(record['name']))
            lines = [' '.join([str(cls)]+[f'{x:.8f}' for x in box]) for cls, box in record['labels']]
            (output/split/'labels'/Path(filename).with_suffix('.txt')).write_text('\n'.join(lines)+'\n', encoding='utf-8')
            report['counts'][split]['images'] += 1
            for cls, _ in record['labels']:
                report['counts'][split]['objects'][NAMES[cls]] += 1
            for cls in {cls for cls, _ in record['labels']}:
                report['counts'][split]['images_per_class'][NAMES[cls]] += 1
            manifest.append({'file':f'{split}/images/{filename}', 'source':record['name'],
                             'label_sha256': hashlib.sha256(('\n'.join(lines)+'\n').encode()).hexdigest(),
                             'sha256':record['raw'], 'pixel_sha256':record['pixel'], 'source_group':record['source_group']})
        for filename in ('README.dataset.txt', 'README.roboflow.txt'):
            if filename in members:
                (output/filename).write_bytes(archive.read(filename))
        (output/'data.yaml').write_text('path: .\ntrain: train/images\nval: val/images\ntest: test/images\nnc: '+str(len(NAMES))+'\nnames: '+json.dumps(NAMES)+'\n', encoding='utf-8')
        (output/'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        report['low_support_classes'] = [name for name in NAMES if report['counts']['train']['images_per_class'][name] < 100 or report['counts']['test']['images_per_class'][name] < 30]
        (output/'audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
        print(json.dumps({k:v for k,v in report.items() if k != 'invalid_examples'}, indent=2))
        return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--zip', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--legacy', type=Path)
    args = parser.parse_args()
    prepare(args.zip.resolve(), args.output.resolve(), args.legacy)
