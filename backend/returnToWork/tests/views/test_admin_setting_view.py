from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status


User = get_user_model()

class AdminSettingsViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            first_name = "john",
            last_name = "doe",
            password ="password123",
            user_type = "Admin"
        )
        self.client.force_authenticate(user=self.user)

        self.url = "/api/admin/settings/"

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
