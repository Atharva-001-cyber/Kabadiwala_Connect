"""Check actual COCO class coverage before admitting an external source.

Read-only. A matching dataset title/supercategory never counts as a target label.
Passing this check is not semantic, licence or image-quality approval.
"""
import argparse
from collections import Counter
import json
from pathlib import Path

def inspect(path, target_names):
    data = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    categories = data['categories']
    ids = [category['id'] for category in categories]
    if len(set(ids)) != len(ids):
        raise ValueError('Duplicate category IDs')
    names = {category['id']:category['name'] for category in categories}
    image_ids = {image['id'] for image in data['images']}
    if len(image_ids) != len(data['images']):
        raise ValueError('Duplicate image IDs')
    counts = Counter()
    for annotation in data['annotations']:
        if annotation['category_id'] not in names or annotation['image_id'] not in image_ids:
            raise ValueError('Unknown annotation category/image')
        counts[names[annotation['category_id']]] += 1
    targets = {name:counts[name] for name in target_names}
    return {'source':str(path), 'images':len(image_ids),
            'class_annotations':{name:counts[name] for name in names.values()},
            'requested_target_annotations':targets,
            'target_coverage_present':bool(targets) and all(targets.values()),
            'training_approved':False,
            'pending':['visual box review', 'licence/provenance', 'split leakage checks']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('annotations', type=Path)
    parser.add_argument('--target', action='append', required=True)
    args = parser.parse_args()
    result = inspect(args.annotations, args.target)
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['target_coverage_present'] else 2)
