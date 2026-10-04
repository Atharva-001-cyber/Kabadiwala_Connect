import json
from pathlib import Path
import tempfile
import unittest
from check_coco_source import inspect

class SourceTests(unittest.TestCase):
    def test_supercategory_is_not_target(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'source.json'
            data = {'images':[{'id':1}], 'categories':[
                {'id':0,'name':'cables'}, {'id':1,'name':'PSU','supercategory':'cables'}],
                'annotations':[{'category_id':1,'image_id':1}]}
            path.write_text(json.dumps(data))
            self.assertFalse(inspect(path,['cables'])['target_coverage_present'])
            data['annotations'].append({'category_id':0,'image_id':1})
            path.write_text(json.dumps(data))
            result = inspect(path,['cables'])
            self.assertTrue(result['target_coverage_present'])
            self.assertFalse(result['training_approved'])
            data['annotations'].append({'category_id':999,'image_id':1})
            path.write_text(json.dumps(data))
            with self.assertRaises(ValueError): inspect(path,['cables'])

if __name__ == '__main__': unittest.main()
