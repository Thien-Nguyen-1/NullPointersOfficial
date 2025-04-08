from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.models import Conversation, Message  # Adjust import path if needed
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class MessageModelTest(TestCase):
    def setUp(self):

        self.service_user = User.objects.create_user(username='serviceuser', password='password123', user_type='service user', email='test@gmail.com')

        self.admin_user = User.objects.create_user(username='adminuser', password='password123', user_type='admin', email='test2@gmail.com')

        self.conversation = Conversation.objects.create(user=self.service_user, admin=self.admin_user)

    def test_create_message_without_file(self):
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.service_user,
            text_content="Hello, this is a test message."
        )

        self.assertEqual(message.conversation, self.conversation)
        self.assertEqual(message.sender, self.service_user)
        self.assertEqual(message.text_content, "Hello, this is a test message.")
        self.assertFalse(message.file)
        self.assertIsNotNone(message.timestamp)

    def test_create_message_with_file(self):
        test_file = SimpleUploadedFile("testfile.txt", b"File content here")
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.admin_user,
            text_content="Here's a file!",
            file=test_file
        )

     
        self.assertEqual(message.text_content, "Here's a file!")
        self.assertEqual(message.sender, self.admin_user)

    def test_str_representation(self):
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.service_user,
            text_content="Just testing str method"
        )

        expected_str = "Text sent: Just testing str method"
        self.assertEqual(str(message), expected_str)