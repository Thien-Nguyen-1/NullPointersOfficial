from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch
from returnToWork.models import Conversation, Message  # adjust to your actual app name
from returnToWork.serializers import MessageSerializer
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class UserChatViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='password123',
            user_type='service user'
        )
        self.client.force_authenticate(user=self.user)

        self.conversation = Conversation.objects.create(user=self.user)
        self.room_id = self.conversation.id
        self.url = reverse('user-chat-view', kwargs={'room_id': self.room_id})

    def test_get_conversation_success(self):
        Message.objects.create(conversation=self.conversation, sender=self.user, text_content="Hello world")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['text_content'], "Hello world")

    def test_get_conversation_not_found(self):
        invalid_url = reverse('user-chat-view', kwargs={'room_id': 9999})

        response = self.client.get(invalid_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["message"], "Unable to find conversation")

    @patch("returnToWork.views.pusher.Pusher.trigger")  
    def test_post_message_success(self, mock_trigger):
        data = {
            "message": "Hey there!"
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(Message.objects.first().text_content, "Hey there!")
        mock_trigger.assert_called_once()

    def test_post_message_conversation_not_found(self):
        invalid_url = reverse('user-chat-view', kwargs={'room_id': 9999})
        data = {
            "message": "This should fail"
        }

        response = self.client.post(invalid_url, data)

        self.assertGreaterEqual(response.status_code, 400)

  