"""Read-only inventory of legacy material labels; never certify semantics."""
import argparse
from collections import Counter
import json
from pathlib import Path
from prepare_device_dataset import parse_label
from semantic_preflight import QUARANTINED_PREFIXES

NAMES = ['PCB', 'Battery', 'CRT', 'FlatPanel', 'Cable_Wire',
         'Electric_Motor', 'Magnet_bearing_Assembly', 'Mixed_EWaste']

def audit(root):
    result = {'splits': {}, 'training_ready': False,
              'blocking_issues': ['Visual/source review pending',
                  'Mixed_EWaste labels do not establish Plastic Body coverage',
                  'Whole HDD annotations must not be reused as exposed magnet labels']}
    for split in ('train', 'val', 'test'):
        labels = root / split / 'labels'
        if not labels.is_dir():
            raise ValueError(f'Missing label directory: {labels}')
        objects, images, blocked = Counter(), Counter(), Counter()
        invalid = []
        for path in sorted(labels.glob('*.txt')):
            present = set()
            for row in path.read_text(encoding='utf-8-sig').splitlines():
                if not row.strip():
                    continue
                try:
                    name, _ = parse_label(row, NAMES)
                except ValueError as error:
                    invalid.append({'file':path.name, 'error':str(error)})
                    continue
                objects[name] += 1
                present.add(name)
            for name in present:
                images[name] += 1
                if any(path.name.startswith(prefix) for prefix in QUARANTINED_PREFIXES):
                    blocked[name] += 1
        result['splits'][split] = {'labelled_images':dict(images),
            'objects':dict(objects), 'known_quarantined_images':dict(blocked),
            'invalid_labels':invalid}
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    print(json.dumps(audit(parser.parse_args().root), indent=2))
