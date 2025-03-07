from django.test import TestCase
from returnToWork.models import Module , Tags

class ModuleModelTest(TestCase):

    def setUp(self):
        # Create a tag
        self.tag = Tags.objects.create(tag="Stress")

        # Create a module
        self.module = Module.objects.create(
            title="Handling WORK stress",
            description="This is a test module.",
            upvotes=10
        )

        # Add the tag to the module
        self.module.tags.add(self.tag)

    def test_module_creation(self):
        """Test if the module is created successfully."""
        self.assertEqual(self.module.title, "Handling Work Stress")
        self.assertEqual(self.module.description, "This is a test module.")
        self.assertTrue(self.module.pinned)
        self.assertEqual(self.module.upvotes, 10)

    def test_upvote_method(self):
        """Test the upvote method."""
        self.module.upvote()
        self.assertEqual(self.module.upvotes, 11)

    def test_downvote_method(self):
        """Test the downvote method."""
        self.module.downvote()
        self.assertEqual(self.module.upvotes, 9)

    def test_module_string_representation(self):
        """Test the string representation of the module."""
        self.assertEqual(str(self.module), "Handling Work Stress")

    def test_module_tags(self):
        """Test if the module is associated with the correct tags."""
        tags = self.module.tags.all()
        self.assertEqual(tags.count(), 1)
        self.assertIn(self.tag, tags)