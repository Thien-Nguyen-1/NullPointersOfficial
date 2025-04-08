import sys
import unittest
from unittest import mock
import importlib

class TestManagePy(unittest.TestCase):
    @mock.patch.dict(sys.modules, {'django.core.management': None})
    def test_importerror_is_raised_when_django_is_missing(self):
        if "manage" in sys.modules:
            del sys.modules["manage"]
        import manage  
        with self.assertRaises(ImportError) as context:
            manage.main()  
        self.assertIn("Couldn't import Django", str(context.exception))
