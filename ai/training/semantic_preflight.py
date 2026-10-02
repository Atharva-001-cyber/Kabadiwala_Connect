"""Block known semantically invalid sources, independently of YOLO syntax checks.

This is a denylist, not a claim that all remaining labels are correct.
Original data is never modified or deleted.
"""
from pathlib import Path
import argparse
import json

QUARANTINED_PREFIXES = {
    'crt_rf_': 'Source amandeep-etjdw/crt has class 0; inspected images are not CRT televisions/monitors.',
    'magnet_rf_': 'Whole HDD/internal HDD was mapped to magnet assembly without component annotation.',
}

def audit(root):
    root = Path(root)
    blocked = []
    counts = {}
    for split in ('train', 'val', 'test'):
        images = root / split / 'images'
        if not images.is_dir():
            raise ValueError(f'Missing split: {images}')
        counts[split] = 0
        for image in sorted(images.iterdir()):
            if image.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
                continue
            counts[split] += 1
            for prefix, reason in QUARANTINED_PREFIXES.items():
                if image.name.startswith(prefix):
                    blocked.append({'image': str(image.relative_to(root)), 'reason': reason})
    return {'counts': counts, 'blocked_count': len(blocked), 'blocked': blocked,
            'semantic_review_complete': False,
            'note': 'Passing this check only excludes known bad imports; visual label and source review are still required.'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root')
    args = parser.parse_args()
    result = audit(args.root)
    print(json.dumps(result, indent=2))
    raise SystemExit(2 if result['blocked_count'] else 0)
