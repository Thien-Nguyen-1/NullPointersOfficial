from rest_framework.test import APITestCase
from returnToWork.serializers import UserPasswordChangeSerializer
from django.contrib.auth import get_user_model
from unittest.mock import Mock

User = get_user_model()


class UserPasswordChangeSerializerTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@janedoe",
            password="password123"
        )

        self.mock_request = Mock()
        self.mock_request.user = self.user
        self.context = {"request" : self.mock_request}

    def test_valid_password_change(self):
        data = {
            "old_password": "password123",
            "new_password": "newPassword",
            "confirm_new_password": "newPassword"
        }
        serializer = UserPasswordChangeSerializer(data = data, context = self.context)
        self.assertTrue(serializer.is_valid())

        user = serializer.save()
        self.assertTrue(user.check_password("newPassword"))

    def test_invalid_old_password(self):
        data = {
            "old_password": "password1234",
            "new_password": "newPassword",
            "confirm_new_password": "newPassword"
        }
        serializer = UserPasswordChangeSerializer(data = data, context = self.context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("old_password", serializer.errors)

    def test_invalid_new_password(self):
        data = {
            "old_password": "password123",
            "new_password": "newPassword",
            "confirm_new_password": "newPassword1"
        }
        serializer = UserPasswordChangeSerializer(data = data, context = self.context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password", serializer.errors)

    def test_missing_field(self):
        data = {
            "old_password": "password123"
        }
        serializer = UserPasswordChangeSerializer(data = data, context = self.context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password", serializer.errors)
        self.assertIn("confirm_new_password", serializer.errors)