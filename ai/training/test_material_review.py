import tempfile
import unittest
from pathlib import Path
from prepare_material_review import write_review

class MaterialReviewTests(unittest.TestCase):
    def test_flags_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for split in ('train', 'val', 'test'):
                (root/split/'images').mkdir(parents=True)
                (root/split/'labels').mkdir()
            samples = {'magnet_rf_1': '6 .5 .5 .2 .2',
                       'mixed': '7 .5 .5 .2 .2',
                       'cable': '4 .5 .5 .2 .2', 'negative': '', 'bad': '4 nan .5 .2 .2'}
            for name, label in samples.items():
                (root/'train/images'/f'{name}.jpg').write_bytes(b'inventory-only')
                (root/'train/labels'/f'{name}.txt').write_text(label)
            rows = write_review(root, root/'review.csv')
            by_name = {Path(row['image']).stem:row for row in rows}
            self.assertEqual(by_name['cable']['existing_classes'], 'Cable_Wire')
            self.assertIn('QUARANTINED_SOURCE', by_name['magnet_rf_1']['issue'])
            self.assertIn('MIXED_IS_NOT_PLASTIC_BODY', by_name['mixed']['issue'])
            self.assertIn('VERIFY_NEGATIVE', by_name['negative']['issue'])
            self.assertIn('INVALID_LABEL', by_name['bad']['issue'])
            self.assertTrue(all(row['review_status'] == 'PENDING' for row in rows))
            self.assertEqual((root/'train/labels/mixed.txt').read_text(), samples['mixed'])
            with self.assertRaises(FileExistsError):
                write_review(root, root/'review.csv')

if __name__ == '__main__':
    unittest.main()
