"""Bundle only reviewed training artifacts; no secrets, app source or user photos."""
import argparse
from pathlib import Path
import zipfile

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit('Output exists; choose a new archive path.')
    scripts = Path(__file__).resolve().parent
    allowed_root_files = {'data.yaml','audit.json','manifest.json','README.dataset.txt','README.roboflow.txt'}
    with zipfile.ZipFile(args.output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for filename in ('prepare_device_dataset.py','train_device_model.py','DEVICE_TRAINING_COLAB.md'):
            archive.write(scripts/filename, filename)
        for path in sorted(args.data.rglob('*')):
            if not path.is_file() or path.is_symlink():
                continue
            relative = path.relative_to(args.data)
            if len(relative.parts) == 1:
                allowed = relative.name in allowed_root_files
            else:
                allowed = (len(relative.parts) == 3 and relative.parts[0] in ('train','val','test')
                           and relative.parts[1] in ('images','labels')
                           and path.suffix.lower() in ('.jpg','.jpeg','.png','.txt'))
            if allowed:
                archive.write(path, 'dataset/'+relative.as_posix())
    print(f'Training kit: {args.output.resolve()} ({args.output.stat().st_size/1024**2:.1f} MiB)')

if __name__ == '__main__':
    main()
