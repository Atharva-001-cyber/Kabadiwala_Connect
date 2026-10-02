"""Train/evaluate a candidate device detector; NEVER deploy or overwrite app weights.

GPU runner for Colab or a CUDA workstation. Full test split is evaluated once
after validation-based checkpoint selection. It is never used for early stopping.
"""
import argparse
import hashlib
import json
import platform
from pathlib import Path
import shutil
import subprocess
import sys

from prepare_device_dataset import NAMES, parse_label

def label_digest(path):
    # The preparation manifest hashes canonical UTF-8/LF text. Windows writes
    # CRLF by default; universal newline reading keeps both platforms identical.
    return hashlib.sha256(path.read_text(encoding='utf-8').encode('utf-8')).hexdigest()

def preflight(root):
    audit = json.loads((root/'audit.json').read_text(encoding='utf-8'))
    manifest = json.loads((root/'manifest.json').read_text(encoding='utf-8'))
    if audit['classes'] != NAMES:
        raise ValueError('Class order mismatch')
    seen = {}
    for record in manifest:
        path = (root/record['file']).resolve()
        if not path.is_relative_to(root.resolve()):
            raise ValueError('Unsafe manifest path')
        if hashlib.sha256(path.read_bytes()).hexdigest() != record['sha256']:
            raise ValueError(f'Image changed since audit: {path.name}')
        split = record['file'].split('/')[0]
        for key in ('pixel_sha256', 'source_group'):
            identity = (key, record[key])
            if identity in seen and seen[identity] != split:
                raise ValueError('Cross-split leakage in prepared manifest')
            seen[identity] = split
        label = root/split/'labels'/path.with_suffix('.txt').name
        if not label.is_file():
            raise ValueError('Missing label')
        if label_digest(label) != record['label_sha256']:
            raise ValueError('Label changed since audit; rebuild/review dataset first')
        for line in label.read_text().splitlines():
            parse_label(line, NAMES)
    for split, counts in audit['counts'].items():
        if not counts['images'] or any(n <= 0 for n in counts['objects'].values()):
            raise ValueError(f'Class missing from {split}; inspect audit before training')
    return audit

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--epochs', type=int, default=80)
    parser.add_argument('--batch', type=int, default=16)
    parser.add_argument('--allow-cpu', action='store_true', help='Explicit opt-in to slow CPU training')
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit('Choose a fresh output directory; no overwrite allowed.')
    if args.epochs < 1 or args.batch < 1:
        raise SystemExit('Epochs and batch must be positive')
    root = args.data.resolve()
    audit = preflight(root)
    try:
        import torch
        import yaml
        from ultralytics import YOLO
    except ImportError as error:
        raise SystemExit(f'Training dependencies unavailable: {error}. Use the supplied Colab notebook.')
    if not torch.cuda.is_available() and not args.allow_cpu:
        raise SystemExit('CUDA GPU unavailable. Select a Colab GPU runtime; no CPU job was started.')
    device = 0 if torch.cuda.is_available() else 'cpu'
    output = args.output.resolve()
    output.mkdir(parents=True)
    config = {'path':str(root), 'train':'train/images', 'val':'val/images',
              'test':'test/images', 'nc':len(NAMES), 'names':NAMES}
    config_path = output/'data.yaml'
    config_path.write_text(yaml.safe_dump(config), encoding='utf-8')
    (output/'environment.txt').write_text(platform.platform()+'\n'+subprocess.check_output([sys.executable,'-m','pip','freeze'], text=True), encoding='utf-8')
    # General pretrained weights: don't continue the contaminated old component model.
    model = YOLO('yolov8n.pt')
    model.train(data=str(config_path), epochs=args.epochs, imgsz=416,
                batch=args.batch, patience=15, device=device, workers=2,
                seed=42, deterministic=True, optimizer='AdamW', lr0=0.001,
                project=str(output), name='training', exist_ok=False,
                cache=False, save=True, save_period=10, plots=True,
                degrees=15, translate=0.1, scale=0.4, fliplr=0.5,
                hsv_h=0.015, hsv_s=0.4, hsv_v=0.4,
                mosaic=0.5, close_mosaic=10, mixup=0.0)
    best = Path(model.trainer.best)
    candidate = YOLO(str(best))
    evaluation = candidate.val(data=str(config_path), split='test', imgsz=416,
                               device=device, project=str(output), name='test', plots=True)
    per_class = []
    for index, class_id in enumerate(evaluation.box.ap_class_index):
        precision, recall, ap50, ap = evaluation.box.class_result(index)
        per_class.append({'class':NAMES[int(class_id)], 'precision':float(precision),
                          'recall':float(recall), 'ap50':float(ap50), 'ap50_95':float(ap)})
    exported = candidate.export(format='onnx', imgsz=416, batch=1, dynamic=False,
                                half=False, opset=12, simplify=False, nms=False)
    onnx_path = output/'device-candidate.onnx'
    shutil.copy2(exported, onnx_path)
    import onnxruntime as ort
    session = ort.InferenceSession(str(onnx_path), providers=['CPUExecutionProvider'])
    input_shape = session.get_inputs()[0].shape
    output_shape = session.get_outputs()[0].shape
    if input_shape != [1,3,416,416] or output_shape[1] != 4+len(NAMES):
        raise RuntimeError(f'Unexpected ONNX layout: {input_shape}, {output_shape}')
    report = {'model':'YOLOv8-Nano', 'classes':NAMES, 'imgsz':416,
              'onnx_sha256':hashlib.sha256(onnx_path.read_bytes()).hexdigest(),
              'source_zip_sha256':audit['zip_sha256'],
              'metrics':{k:float(v) for k,v in evaluation.results_dict.items()},
              'per_class':per_class, 'deployment_approved':False,
              'pending':['visual label review','perceptual/source-session leakage review',
                         'negative/mixed-object field tests','threshold calibration',
                         'ONNX/PyTorch numerical parity','Android latency','browser integration']}
    (output/'candidate-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    for filename in ('audit.json','README.dataset.txt','README.roboflow.txt'):
        shutil.copy2(root/filename, output/filename)
    archive = shutil.make_archive(str(output)+'-results', 'zip', output)
    print(f'Candidate training complete. NOT deployed. Return this archive for review: {archive}')

if __name__ == '__main__':
    main()
