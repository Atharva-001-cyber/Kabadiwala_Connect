import tempfile
import unittest
from pathlib import Path
from semantic_preflight import audit

class SemanticPreflightTest(unittest.TestCase):
    def test_quarantined_sources_blocked_without_mutation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for split in ('train', 'val', 'test'):
                (root / split / 'images').mkdir(parents=True)
            for name in ('crt_rf_train_001.jpg', 'magnet_rf_train_001.jpg', 'pcb_train_001.jpg'):
                (root / 'train' / 'images' / name).touch()
            result = audit(root)
            self.assertEqual(result['blocked_count'], 2)
            self.assertEqual(result['counts']['train'], 3)
            self.assertEqual(len(list((root / 'train' / 'images').iterdir())), 3)
            self.assertFalse(result['semantic_review_complete'])

    def test_missing_splits_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                audit(directory)

if __name__ == '__main__':
    unittest.main()
