from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.models import Module, ProgressTracker
from returnToWork.serializers import ProgressTrackerSerializer
from django.db import IntegrityError

User = get_user_model()

class ProgressTrackerSerializerTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username="@testuser",
            email="testuser@example.com",
            password="testpassword123",
            user_type="service user"
        )

        # Create a test module
        self.module = Module.objects.create(
            title="Test Module",
            description="A test module for progress tracking",
            upvotes=0
        )

        # Create a second module for additional testing
        self.module2 = Module.objects.create(
            title="Second Test Module",
            description="Another test module",
            upvotes=0
        )

    def test_progress_tracker_serializer_valid_data(self):
        """
        Test serializer with valid data
        """
        valid_data = {
            'user': self.user.id,
            'module': self.module.id,
            'completed': False,
            'pinned': False,
            'hasLiked': False,
            'contents_completed': 0,
            'total_contents': 10,
            'progress_percentage': 0.0
        }

        serializer = ProgressTrackerSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), 
                        f"Serializer errors: {serializer.errors}")
        
        # Save the serializer and verify the instance
        progress_tracker = serializer.save()
        self.assertIsInstance(progress_tracker, ProgressTracker)
        self.assertEqual(progress_tracker.user, self.user)
        self.assertEqual(progress_tracker.module, self.module)
        self.assertFalse(progress_tracker.completed)
        self.assertFalse(progress_tracker.pinned)
        self.assertFalse(progress_tracker.hasLiked)
        self.assertEqual(progress_tracker.contents_completed, 0)
        self.assertEqual(progress_tracker.total_contents, 10)
        self.assertEqual(progress_tracker.progress_percentage, 0.0)

    def test_progress_tracker_serializer_partial_update(self):
        """
        Test partial update of progress tracker
        """
        # Create an initial progress tracker
        initial_progress = ProgressTracker.objects.create(
            user=self.user,
            module=self.module,
            completed=False,
            progress_percentage=0.0
        )

        # Partial update data
        update_data = {
            'progress_percentage': 50.0,
            'contents_completed': 5
        }

        serializer = ProgressTrackerSerializer(
            initial_progress, 
            data=update_data, 
            partial=True
        )
        self.assertTrue(serializer.is_valid(), 
                        f"Serializer errors: {serializer.errors}")
        
        updated_progress = serializer.save()
        self.assertEqual(updated_progress.progress_percentage, 50.0)
        self.assertEqual(updated_progress.contents_completed, 0)  # Should not change
        self.assertFalse(updated_progress.completed)  # Should not be completed yet

    def test_progress_tracker_serializer_progress_percentage_validation(self):
        """
        Test validation of progress percentage
        """
        # Test negative percentage
        invalid_data_negative = {
            'user': self.user.id,
            'module': self.module.id,
            'progress_percentage': -10
        }
        serializer = ProgressTrackerSerializer(data=invalid_data_negative)
        self.assertFalse(serializer.is_valid())
        self.assertIn('progress_percentage', serializer.errors)

        # Test percentage over 100
        invalid_data_over_100 = {
            'user': self.user.id,
            'module': self.module.id,
            'progress_percentage': 110
        }
        serializer = ProgressTrackerSerializer(data=invalid_data_over_100)
        self.assertFalse(serializer.is_valid())
        self.assertIn('progress_percentage', serializer.errors)

    def test_progress_tracker_serializer_completion_logic(self):
        """
        Test automatic completion based on progress percentage
        """
        # Ensure no existing progress tracker for this user-module combo
        ProgressTracker.objects.filter(user=self.user, module=self.module).delete()

        # Data with 100% progress
        complete_data = {
            'user': self.user.id,
            'module': self.module2.id,  # Use a different module to avoid unique constraint
            'progress_percentage': 100.0,
            'contents_completed': 10,
            'total_contents': 10
        }

        serializer = ProgressTrackerSerializer(data=complete_data)
        self.assertTrue(serializer.is_valid(), 
                        f"Serializer errors: {serializer.errors}")
        
        progress_tracker = serializer.save()
        self.assertTrue(progress_tracker.completed)

        # Data with less than 100% progress
        ProgressTracker.objects.filter(user=self.user, module=self.module).delete()
        incomplete_data = {
            'user': self.user.id,
            'module': self.module.id,
            'progress_percentage': 99.9,
            'contents_completed': 9,
            'total_contents': 10
        }

        serializer = ProgressTrackerSerializer(data=incomplete_data)
        self.assertTrue(serializer.is_valid(), 
                        f"Serializer errors: {serializer.errors}")
        
        progress_tracker = serializer.save()
        self.assertFalse(progress_tracker.completed)

    def test_progress_tracker_serializer_unique_constraint(self):
        """
        Test unique constraint for user-module combination
        """
        # Create first progress tracker
        first_data = {
            'user': self.user.id,
            'module': self.module.id,
            'progress_percentage': 30.0
        }
        first_serializer = ProgressTrackerSerializer(data=first_data)
        self.assertTrue(first_serializer.is_valid())
        first_progress = first_serializer.save()

        # Attempt to create another progress tracker for same user-module
        with self.assertRaises(IntegrityError):
            ProgressTracker.objects.create(
                user=self.user,
                module=self.module
            )

    def test_progress_tracker_serializer_read_only_fields(self):
        """
        Test read-only fields are not modifiable
        """
        # Create an initial progress tracker
        initial_progress = ProgressTracker.objects.create(
            user=self.user,
            module=self.module,
            contents_completed=5,
            total_contents=10
        )

        # Try to modify read-only fields
        update_data = {
            'contents_completed': 100,  # Attempt to modify read-only field
            'total_contents': 200
        }

        serializer = ProgressTrackerSerializer(
            initial_progress, 
            data=update_data, 
            partial=True
        )
        
        # Verify serializer validates
        self.assertTrue(serializer.is_valid())
        
        # Save and verify read-only fields were not modified
        updated_progress = serializer.save()
        self.assertEqual(updated_progress.contents_completed, 5)
        self.assertEqual(updated_progress.total_contents, 10)

    def test_progress_tracker_serializer_default_values(self):
        """
        Test default values when not provided
        """
        minimal_data = {
            'user': self.user.id,
            'module': self.module.id
        }

        serializer = ProgressTrackerSerializer(data=minimal_data)
        self.assertTrue(serializer.is_valid())
        
        progress_tracker = serializer.save()
        self.assertFalse(progress_tracker.completed)
        self.assertFalse(progress_tracker.pinned)
        self.assertFalse(progress_tracker.hasLiked)
        self.assertEqual(progress_tracker.contents_completed, 0)
        self.assertEqual(progress_tracker.total_contents, 0)
        self.assertEqual(progress_tracker.progress_percentage, 0.0)