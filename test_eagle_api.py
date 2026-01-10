import unittest
import tempfile
import os
from unittest.mock import patch, MagicMock
from eagle_integration import EagleClient
from eagle_bridge import EagleBridge

class TestEagleIntegration(unittest.TestCase):
    def setUp(self):
        self.client = EagleClient()

    @patch('eagle_integration.requests.post')
    def test_update_item_annotation(self, mock_post):
        # Mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "success", "data": {}}
        mock_post.return_value = mock_response

        item_id = "test_id"
        annotation = "This is a test summary."

        # Call the method (which we will implement)
        result = self.client.update_item_annotation(item_id, annotation)

        # Verify
        self.assertTrue(result)
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(kwargs['json'], {'id': item_id, 'annotation': annotation})
        self.assertIn('/item/update', args[0])

class TestEagleBridge(unittest.TestCase):
    def setUp(self):
        self.bridge = EagleBridge()
        self.bridge.eagle = MagicMock()

    def test_process_item_with_summary(self):
        # Mock item and localcura response
        item = {"id": "test_id", "name": "test_item"}

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b"dummy content")
            tmp_path = tmp.name

        try:
            self.bridge.eagle.get_item_file_path.return_value = tmp_path

            # Mock requests.post to LocalCura
            with patch('eagle_bridge.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.status_code = 200
                # Mock analysis with summary
                mock_response.json.return_value = {
                    "tags": ["tag1"],
                    "aesthetic": 8.5,
                    "analysis": {
                        "visual_style": "style1",
                        "summary": "This is a summary."
                    }
                }
                mock_post.return_value = mock_response

                self.bridge.process_item(item)

                # Verify update_item_annotation was called
                self.bridge.eagle.update_item_annotation.assert_called_with("test_id", "This is a summary.")
        finally:
            # Clean up
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

if __name__ == '__main__':
    unittest.main()
