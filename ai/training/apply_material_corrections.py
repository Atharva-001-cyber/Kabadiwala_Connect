"""Write reviewed proposal labels to a NEW isolated directory; not a training kit."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image
from prepare_device_dataset import parse_label
from audit_material_coverage import NAMES

def apply(root, corrections, output):
    root, output = Path(root).resolve(), Path(output).resolve()
    if output.exists() or output.is_relative_to(root):
        raise ValueError('Output must be fresh and outside original dataset')
    config = json.loads(Path(corrections).read_text(encoding='utf-8'))
    prepared = []
    for item in config['corrections']:
        source = (root/item['image']).resolve()
        if not source.is_relative_to(root):
            raise ValueError('Unsafe source path')
        if hashlib.sha256(source.read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Source image hash mismatch')
        with Image.open(source) as image:
            image.load()
            if image.size != (item['width'], item['height']) or image.getexif().get(274,1) != 1:
                raise ValueError('Image dimensions/orientation mismatch')
        x1,y1,x2,y2 = item['box_xyxy']
        w,h = item['width'],item['height']
        if not (0 <= x1 < x2 <= w and 0 <= y1 < y2 <= h):
            raise ValueError('Invalid correction box')
        label = f"{item['class_id']} {(x1+x2)/(2*w):.8f} {(y1+y2)/(2*h):.8f} {(x2-x1)/w:.8f} {(y2-y1)/h:.8f}\n"
        parse_label(label,NAMES)
        prepared.append((source,label))
    output.mkdir(parents=True)
    (output/'images').mkdir()
    (output/'labels').mkdir()
    for source,label in prepared:
        shutil.copy2(source,output/'images'/source.name)
        (output/'labels'/source.with_suffix('.txt').name).write_text(label,encoding='utf-8')
    config['training_approved'] = False
    (output/'review.json').write_text(json.dumps(config,indent=2),encoding='utf-8')
    return len(prepared)

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data',type=Path,required=True)
    parser.add_argument('--corrections',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    print(f'{apply(args.data,args.corrections,args.output)} correction proposals written; NOT training-approved.')
