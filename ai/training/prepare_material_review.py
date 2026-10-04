"""Create a review worklist, never silently relabel or train existing images."""
import argparse
import csv
import hashlib
from pathlib import Path
from prepare_device_dataset import parse_label
from audit_material_coverage import NAMES
from semantic_preflight import QUARANTINED_PREFIXES

FIELDS = ['image', 'label', 'split', 'sha256', 'existing_classes',
          'issue', 'review_status', 'source', 'use_permission', 'device_session_group',
          'reviewer', 'review_notes']

def review_rows(root):
    root = root.resolve()
    rows = []
    for split in ('train', 'val', 'test'):
        folder = root / split / 'images'
        if not folder.is_dir():
            raise ValueError(f'Missing split: {split}')
        for image in sorted(folder.iterdir()):
            if image.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
                continue
            if not image.resolve().is_relative_to(root):
                raise ValueError('Image points outside dataset')
            label = root / split / 'labels' / (image.stem + '.txt')
            classes, issues = set(), []
            if not label.resolve().is_relative_to(root):
                raise ValueError('Label points outside dataset')
            if not label.is_file():
                issues.append('MISSING_LABEL')
            else:
                for line in label.read_text(encoding='utf-8-sig').splitlines():
                    if not line.strip():
                        continue
                    try:
                        name, _ = parse_label(line, NAMES)
                        classes.add(name)
                    except ValueError:
                        issues.append('INVALID_LABEL')
            for prefix in QUARANTINED_PREFIXES:
                if image.name.startswith(prefix):
                    issues.append('QUARANTINED_SOURCE')
            if 'Mixed_EWaste' in classes:
                issues.append('MIXED_IS_NOT_PLASTIC_BODY')
            if not classes and not issues:
                issues.append('VERIFY_NEGATIVE_HAS_NO_TARGET_OBJECTS')
            rows.append(dict.fromkeys(FIELDS, '') | {
                'image':str(image.relative_to(root)),
                'label':str(label.relative_to(root)), 'split':split,
                'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),
                'existing_classes':'|'.join(sorted(classes)),
                'issue':'|'.join(sorted(set(issues))) or 'VISUAL_AND_SOURCE_REVIEW_REQUIRED',
                'review_status':'PENDING',
            })
    return rows

def write_review(root, output):
    rows = review_rows(root)
    # Exclusive creation: cannot overwrite reviewed work or original labels.
    with output.open('x', newline='', encoding='utf-8') as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    return rows

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    rows = write_review(args.data, args.output)
    print(f'{len(rows)} images inventoried. All PENDING; no labels changed, no model trained.')
