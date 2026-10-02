import io
import tempfile
import unittest
from pathlib import Path
import zipfile
from PIL import Image
from prepare_device_dataset import parse_label, safe_members, prepare, SOURCE_CLASSES
from train_device_model import label_digest

class DevicePipelineTests(unittest.TestCase):
    def test_label_hash_portable_but_detects_edits(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'label.txt'
            path.write_bytes(b'0 .5 .5 .2 .4\n')
            baseline = label_digest(path)
            path.write_bytes(b'0 .5 .5 .2 .4\r\n')
            self.assertEqual(label_digest(path), baseline)
            path.write_bytes(b'1 .5 .5 .2 .4\r\n')
            self.assertNotEqual(label_digest(path), baseline)

    def test_boxes_and_polygons(self):
        self.assertEqual(parse_label('0 .5 .5 .2 .4', ['Keyboard']), ('Keyboard', (.5,.5,.2,.4)))
        self.assertEqual(parse_label('0 .2 .2 .8 .2 .8 .8 .2 .8', ['Keyboard'])[0], 'Keyboard')
        for row in ('0 nan .5 .2 .4', '1 .5 .5 .2 .4', '0 .5 .5 0 .1', '0 .9 .9 .9 .9'):
            with self.assertRaises(ValueError): parse_label(row, ['Keyboard'])

    def test_unsafe_archive(self):
        data = io.BytesIO()
        with zipfile.ZipFile(data, 'w') as archive:
            archive.writestr('../outside.txt', 'bad')
        data.seek(0)
        with zipfile.ZipFile(data) as archive:
            with self.assertRaises(ValueError): safe_members(archive)

    def test_leakage_priority_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root/'input.zip'
            data = io.BytesIO()
            Image.new('RGB', (10,10), (40,50,60)).save(data, format='PNG')
            classes = list(SOURCE_CLASSES)
            cls = classes.index('Computer-Keyboard')
            with zipfile.ZipFile(path, 'w') as archive:
                archive.writestr('data.yaml', 'names: '+repr(classes))
                for split in ('train','valid','test'):
                    archive.writestr(f'{split}/images/photo.rf.{split}.png', data.getvalue())
                    archive.writestr(f'{split}/labels/photo.rf.{split}.txt', f'{cls} .5 .5 .8 .8')
            result = prepare(path, root/'output', None)
            self.assertEqual(result['counts']['test']['images'], 1)
            self.assertEqual(result['counts']['train']['images'], 0)
            self.assertEqual(result['skipped']['cross_split_source_overlap'], 2)
            with self.assertRaises(ValueError): prepare(path, root/'output', None)

if __name__ == '__main__':
    unittest.main()
