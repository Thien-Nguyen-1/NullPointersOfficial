from django.test import TestCase
from returnToWork.models import ProgressTracker,Module,User

class ProgressTrackerModelTest(TestCase):
    
    def setUp(self):
        self.module = Module.objects.create(
            title="Handling WORK anxiety",
            description="This is a test module.",
            pinned=True,
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
            User = '@jackdoe',
            title = "Handling WORK anxiety",
            completed = True,
        )    















