import tempfile
import unittest
from pathlib import Path
from PIL import Image
from stage_material_review import stage

class StageTests(unittest.TestCase):
    def test_quarantine_duplicates_and_preserve_originals(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            root = base/'source'
            for split in ('train', 'val', 'test'):
                (root/split/'images').mkdir(parents=True)
                (root/split/'labels').mkdir()
            for split, name, cls, color in [('train','cable',4,'red'),
                    ('val','copy',4,'red'), ('train','mixed',7,'blue'),
                    ('train','motor',5,'green')]:
                Image.new('RGB',(8,8),color).save(root/split/'images'/f'{name}.png')
                (root/split/'labels'/f'{name}.txt').write_text(f'{cls} .5 .5 .8 .8')
            report = stage(root, base/'review')
            self.assertEqual(report['buckets'], {'quarantine':3, 'pending_review':1})
            self.assertFalse(report['training_ready'])
            self.assertFalse((base/'review/data.yaml').exists())
            self.assertEqual((root/'train/labels/mixed.txt').read_text(), '7 .5 .5 .8 .8')
            with self.assertRaises(ValueError): stage(root, base/'review')

if __name__ == '__main__': unittest.main()
