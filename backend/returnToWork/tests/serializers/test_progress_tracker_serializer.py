
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import serializers

from returnToWork.serializers import ProgressTrackerSerializer
from returnToWork.models import ProgressTracker, Module

class ProgressTrackerSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # user and module object for testing
        cls.user = User.objects.create_user(username='testuser', password='12345')
        cls.module = Module.objects.create(
            title='Improve confidence',
            description='Learn to build confidence.',
            tags='self-worth, low-self-seteem, anxiety',
            pinned=False,
            upvotes=0
        )

        # Progress tracker object for testing
        cls.progress_tracker = ProgressTracker.objects.create(
            user=cls.user,
            module=cls.module,
            completed=True
        )

    def test_serialize_data(self):
        """ Test serialization of ProgressTracker data to JSON """
        serializer = ProgressTrackerSerializer(instance=self.progress_tracker)
        data = serializer.data
        self.assertEqual(set(data.keys()), {'id', 'user', 'module', 'completed'})
        self.assertEqual(data['user'], self.user.id)
        self.assertEqual(data['module'], self.module.id)
        self.assertTrue(data['completed'])

    def test_deserialize_data(self):
        """ Test deserialization of JSON to ProgressTracker data """
        input_data = {
            'user': self.user.id,
            'module': self.module.id,
            'completed': False
        }
        serializer = ProgressTrackerSerializer(data=input_data)
        self.assertTrue(serializer.is_valid())
        new_progress_tracker = serializer.save()

        self.assertEqual(new_progress_tracker.user, self.user)
        self.assertEqual(new_progress_tracker.module, self.module)
        self.assertFalse(new_progress_tracker.completed)

