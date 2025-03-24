from django.test import TestCase
from returnToWork.models import ProgressTracker,Module,User

class ProgressTrackerModelTest(TestCase):
    
    def setUp(self):
        self.module = Module.objects.create(
            title="Handling work anxiety",
            description="This is a test module.",
            upvotes=9
        )
        self.user = User.objects.create_user(
            username = '@jackdoe',
            first_name = 'Jack',
            last_name = 'Doe',
            email = 'jackdoe@example.org',
            password = 'SecurePass123',
            user_type ='user',
        )
        self.progressTracker = ProgressTracker.objects.create(
            user = self.user,
            module = self.module,
            completed = True,
        )
    def test_create_progress_tracker(self):
        self.assertIsInstance(self.progressTracker, ProgressTracker)
        self.assertEqual(self.progressTracker.user.username, '@jackdoe')
        self.assertTrue(self.progressTracker.completed)

    def test_progress_tracker_field_values(self):
        self.assertEqual(self.progressTracker.user.username, '@jackdoe')
        self.assertEqual(self.progressTracker.module.title, "Handling Work Anxiety")
        self.assertTrue(self.progressTracker.completed)

    def test_model_relationships(self):
        self.assertEqual(self.progressTracker.user, self.user)
        self.assertEqual(self.progressTracker.module, self.module)

    def test_default_values(self):
        new_module = Module.objects.create(
        title="New Module",
        description="Another test module.",
        upvotes=5
        )
        new_tracker = ProgressTracker.objects.create(user=self.user, module=new_module)
        self.assertFalse(new_tracker.completed)

    def test_string_representation(self):
        expected_string = f'{self.user.username} - {self.module.title} - {'Completed'}'
        actual_string = str(self.progressTracker)
        self.assertEqual(actual_string, expected_string)
    


    def test_update_operations(self):
        self.progressTracker.completed = False
        self.progressTracker.save()
        updated_tracker = ProgressTracker.objects.get(id=self.progressTracker.id)
        self.assertFalse(updated_tracker.completed)

    def test_deletion(self):
        tracker_id = self.progressTracker.id
        self.progressTracker.delete()
        with self.assertRaises(ProgressTracker.DoesNotExist):
            ProgressTracker.objects.get(id=tracker_id)    















