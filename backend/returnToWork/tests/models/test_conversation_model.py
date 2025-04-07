from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.models import Conversation  # Adjust the import path as needed

User = get_user_model()

class ConversationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="service_user", password="pass123", user_type="service user", email="user@gmail.com")
        self.admin = User.objects.create_user(username="admin_user", password="pass123", user_type="admin", email="admin@gmail.com")

    def test_create_conversation(self):
        conversation = Conversation.objects.create(
            user=self.user,
            admin=self.admin
        )

        self.assertEqual(conversation.user, self.user)
        self.assertEqual(conversation.admin, self.admin)
        self.assertFalse(conversation.hasEngaged)  
        self.assertEqual(conversation.lastMessage, "")  

    
        self.assertIsNotNone(conversation.created_at)
        self.assertIsNotNone(conversation.updated_at)

    def test_str_representation(self):
        conversation = Conversation.objects.create(user=self.user, admin=self.admin)
        expected_str = f"Conversation created for: {self.user} and {self.admin}"
        self.assertEqual(str(conversation), expected_str)
