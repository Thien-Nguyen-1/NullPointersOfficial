from django.test import TestCase
from returnToWork.models import User, Tags
from django.core.exceptions import ValidationError

class TagTestCase(TestCase):
    def setUp(self):
        # Create some sample tags
        self.tag1 = Tags.objects.create(tag="Anxiety")
        self.tag2 = Tags.objects.create(tag="Stress")
        self.tag3 = Tags.objects.create(tag="Depression")

    def _assert_tag_is_valid(self, tag_instance):
        try:
            tag_instance.full_clean()
        except ValidationError:
            self.fail("Tag should be valid.")

    def _assert_tag_is_invalid(self, tag_instance):
        with self.assertRaises(ValidationError):
            tag_instance.full_clean()

    def test_valid_tag(self):
        """Test that a valid tag passes validation."""
        self._assert_tag_is_valid(self.tag1)

    def test_tag_cannot_be_blank(self):
        """Test that a blank tag is invalid."""
        self.tag1.tag = ""
        self._assert_tag_is_invalid(self.tag1)

    def test_tag_must_be_unique(self):
        """Test that duplicate tags (case-insensitive) are invalid."""
        # Since tag1 ("Anxiety") is saved as "anxiety", trying to create another tag with "Anxiety"
        # should raise a validation error.
        duplicate_tag = Tags(tag="Anxiety")
        self._assert_tag_is_invalid(duplicate_tag)

    def test_tag_can_be_50_characters_long(self):
        """Test that a tag with exactly 50 characters is valid."""
        tag_value = "a" * 50
        tag_instance = Tags(tag=tag_value)
        self._assert_tag_is_valid(tag_instance)

    def test_tag_cannot_be_over_50_characters_long(self):
        """Test that a tag with more than 50 characters is invalid."""
        tag_value = "a" * 51
        tag_instance = Tags(tag=tag_value)
        self._assert_tag_is_invalid(tag_instance)

    def test_tag_is_normalized_to_lowercase(self):
        """Test that the tag value is normalized to lowercase upon saving."""
        tag_instance = Tags.objects.create(tag="HeAlTh")
        self.assertEqual(tag_instance.tag, "health")

    def test_str_representation(self):
        """Test that the __str__ method returns the capitalized tag."""
        # self.tag1 was created as "Anxiety" and then normalized to "anxiety".
        # Its __str__ method should return "Anxiety"
        self.assertEqual(str(self.tag1), "Anxiety")

    def test_get_valid(self):
        expected_tags = ["anxiety", "stress", "depression"] 
        actual_tags = Tags.get_valid_tags()
        self.assertCountEqual(actual_tags, expected_tags)
