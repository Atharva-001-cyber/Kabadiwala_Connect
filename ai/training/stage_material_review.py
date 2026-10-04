"""Copy legacy samples into isolated pending/quarantine folders, NOT a training set."""
import argparse
from collections import Counter
import csv
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image
from prepare_material_review import review_rows

BLOCKERS = {'MISSING_LABEL', 'INVALID_LABEL', 'QUARANTINED_SOURCE', 'MIXED_IS_NOT_PLASTIC_BODY'}

def stage(root, output):
    root, output = root.resolve(), output.resolve()
    if output.exists() or output.is_relative_to(root):
        raise ValueError('Choose a fresh output directory outside the source dataset')
    rows = review_rows(root)
    seen = {}
    for index, row in enumerate(rows):
        issues = set(row['issue'].split('|'))
        image = root / row['image']
        try:
            with Image.open(image) as decoded:
                decoded.load()
                if decoded.getexif().get(274, 1) != 1:
                    issues.add('ORIENTATION_REVIEW_REQUIRED')
                rgb = decoded.convert('RGB')
                pixel_hash = hashlib.sha256(str(rgb.size).encode() + rgb.tobytes()).hexdigest()
                row['pixel_sha256'] = pixel_hash
                if pixel_hash in seen:
                    issues.add('EXACT_PIXEL_DUPLICATE')
                    # Both sides are held: no arbitrary preferred split or labels.
                    first = rows[seen[pixel_hash]]
                    first['issue'] += '|EXACT_PIXEL_DUPLICATE'
                else:
                    seen[pixel_hash] = index
        except (OSError, ValueError, Image.DecompressionBombError):
            issues.add('IMAGE_DECODE_FAILED')
        row['issue'] = '|'.join(sorted(issues))
        row.setdefault('pixel_sha256', '')
    output.mkdir(parents=True)
    counts = Counter()
    for row in rows:
        issues = set(row['issue'].split('|'))
        blocked = bool(issues & (BLOCKERS | {'EXACT_PIXEL_DUPLICATE', 'IMAGE_DECODE_FAILED', 'ORIENTATION_REVIEW_REQUIRED'}))
        row['bucket'] = 'quarantine' if blocked else 'pending_review'
        counts[row['bucket']] += 1
        for field in ('image', 'label'):
            source = root / row[field]
            if not source.is_file():
                continue
            target = output / row['bucket'] / row[field]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
    with (output/'review.csv').open('x', newline='', encoding='utf-8') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]) if rows else ['image'])
        writer.writeheader()
        writer.writerows(rows)
    report = {'images':len(rows), 'buckets':dict(counts), 'training_ready':False,
              'note':'All retained samples still need visual label/source/session review. No training YAML emitted. No originals changed.'}
    (output/'audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(stage(args.data, args.output), indent=2))
