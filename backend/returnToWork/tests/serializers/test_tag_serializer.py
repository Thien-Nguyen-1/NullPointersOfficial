from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.models import Tags, Module
from returnToWork.serializers import TagSerializer

User = get_user_model()

class TagSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.module1 = Module.objects.create(
            title="Anxiety",
            description="Deep dive into how you feel.",
            pinned=True,
            upvotes=22
        )
        cls.module2 = Module.objects.create(
            title="Superpowers",
            description="Learn your superpowers.",
            pinned=False,
            upvotes=15
        )
        cls.tag = Tags.objects.create(tag='Anxiety')
        cls.tag.modules.add(cls.module1, cls.module2)

    def test_serialize_tag_data(self):
        """ Test serialization of Tags data including nested modules """
        serializer = TagSerializer(instance=self.tag)
        data = serializer.data
        self.assertEqual(data['tag'], 'anxiety')  
        self.assertIn('modules', data)
        self.assertEqual(len(data['modules']), 2)  # Check correct serialization of modules

        # Verify that each module is correctly serialized
        module_titles = [module['title'] for module in data['modules']]
        self.assertIn('Anxiety', module_titles)
        self.assertIn('Superpowers', module_titles)

    def test_tag_normalization_on_creation(self):
        """ Test that the tag is normalized to lowercase on creation """
        new_tag = Tags.objects.create(tag='conFidence')
        self.assertEqual(new_tag.tag, 'confidence')

    def test_module_link_to_tag(self):
        """ Test modules are linked correctly to the tag """
        self.assertEqual(self.tag.modules.count(), 2)
        self.assertTrue(self.module1 in self.tag.modules.all())
        self.assertTrue(self.module2 in self.tag.modules.all())
