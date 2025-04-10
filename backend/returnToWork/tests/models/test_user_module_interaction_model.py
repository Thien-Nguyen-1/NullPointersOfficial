from django.test import TestCase
from returnToWork.models import UserModuleInteraction,User,Module

class UserModuleInteractionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='@testuser',
            password='password123'
            )
        self.module = Module.objects.create(
            title="Handling WORK stress",
            description="This is a test module.",
            upvotes=10
        )
        self.interaction = UserModuleInteraction.objects.create(
            user = self.user,
            module = self.module,
            hasPinned = True,
            hasLiked = True
        )

    def test_interaction_string_representation(self):
        expected_string = f"{self.user.username} - {self.module.title} - Pinned: {self.interaction.hasPinned} - Liked: {self.interaction.hasLiked}" 
        self.assertEqual(str(self.interaction),expected_string)