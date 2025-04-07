from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from unittest.mock import patch
from returnToWork.models import User 

User = get_user_model()

class ServiceUserSettingsViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            first_name = "john",
            last_name = "doe",
            password ="password123",
            user_type = "Service user",
            firebase_token="test_token"
        )
        self.client.force_authenticate(user=self.user)

        self.url = "/api/worker/settings/"

    def test_get_user_settings(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "@johndoe")

    def test_put_user_settingss(self):
        updated_data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "@admin123"
        }
        response = self.client.put(self.url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.user.first_name, "Jane")

    def test_invalid_put_user_settingss(self):
        invalid_data = {
            "first_name": "",
            "username": "@admin123"
        }
        response = self.client.put(self.url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)


    def test_delete_user_settings(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())

    def test_delete_user_failure(self):
        with patch.object(self.user, "delete", return_value=None):
            response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "User account not deleted")
        self.assertTrue(User.objects.filter(username=self.user.username).exists())