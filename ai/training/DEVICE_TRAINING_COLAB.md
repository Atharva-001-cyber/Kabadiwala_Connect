# Device detector training (candidate only)

No live deployment, commit or push is part of this workflow. Existing application
weights stay unchanged. Training success is not approval for deployment.

## Manual step needed: GPU runtime

The local laptop has Intel Iris Xe, not an NVIDIA CUDA GPU. In Google Colab,
create a notebook and choose a GPU hardware accelerator. Do not buy a paid plan
just for this task. If a free GPU is unavailable, report that instead of starting
an unplanned paid job. Colab can disconnect; download results/checkpoints before
ending a session. Do not upload secrets, project source, private photos or .env.

Upload only the public-data training kit produced locally. It contains the
prepared dataset, attribution, audit and the two training scripts. The user-supplied
screen/keyboard photos remain local and are not included in training.

Run these notebook cells in order:

```python
from google.colab import files
uploaded = files.upload()  # choose device-training-kit.zip
```

```python
import pathlib, zipfile
root = pathlib.Path('/content/device-training-kit')
assert not root.exists(), 'Use a fresh runtime or a new folder; do not overwrite.'
with zipfile.ZipFile('/content/device-training-kit.zip') as z:
    for entry in z.infolist():
        p = pathlib.PurePosixPath(entry.filename)
        assert not p.is_absolute() and '..' not in p.parts and ':' not in entry.filename
    z.extractall(root)
```

```python
%pip install "ultralytics>=8.3,<9" "onnx>=1.15,<2" "onnxruntime>=1.17,<2" pyyaml pillow
import torch
assert torch.cuda.is_available(), 'Select GPU runtime first. No training started.'
print(torch.cuda.get_device_name(0))
```

```python
!python /content/device-training-kit/train_device_model.py --data /content/device-training-kit/dataset --output /content/device-candidate-v1 --epochs 80 --batch 16
```

If GPU runs out of memory, use a fresh output name and `--batch 8`. Do not reduce
epochs to a tiny number and describe the result as fully trained. Early stopping
may end before 80 epochs. Do not tune on the test results.

```python
from google.colab import files
files.download('/content/device-candidate-v1-results.zip')
```

Send the downloaded results ZIP's local path back. The runner stores dependency
versions, best/last weights, per-class evaluation metrics, a browser-shaped ONNX candidate
and audit provenance. It does NOT copy any file into frontend/public/models.

## Updated runner: next experiment

The small `device-training-runner-update.zip` contains updated scripts only, not
new images or trained weights. After extracting the existing full kit, replace
its two Python scripts with these versions before starting a new run. The original
full training ZIP has not been rebuilt; using it alone uses the old runner.

Use a new output folder and add `--profile field-rotation --evaluation-split val`
to the training command. Keep the baseline run for comparison. This profile uses
stronger rotation and modest scale/lighting augmentation at the same browser-
compatible 416 input size. It is an experiment, not a promised accuracy improvement.
Compare class-level validation results, including regressions in other classes.
The updated runner defaults to validation evaluation, not test. Only after model
and settings are frozen should `--evaluation-split test` be used for final reporting.
The existing test set was already evaluated for v1, so it is not a fresh field test.

The nine supplied keyboard screenshots remain diagnostic-only while provenance
and annotations are unresolved. This experiment can use the existing prepared
dataset, but cannot fix the lack of diverse tablet/HDD examples by augmentation
alone. Do not claim it trains on the new screenshots.

## Scope

Eleven recognition classes: PCB, Battery, CRT, FlatPanel, Keyboard, Smartphone,
Tablet, Laptop, HDD, Mouse, BarPhone. This is a device-recognition candidate,
not a replacement for cable/motor/magnet/plastic component recognition. Whole-device
names do not authorize material-category selection, pricing or ledger changes.

The dataset preparation removes known exact/source-filename overlaps and prior
component-dataset byte matches. This does not prove absence of perceptual similarity,
shared physical devices, label mistakes or incomplete annotations. Those reviews,
field photos and non-e-waste testing are mandatory before deployment.
