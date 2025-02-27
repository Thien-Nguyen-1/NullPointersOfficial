from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from returnToWork.models import AdminSettings

User = get_user_model()

class AdminASettingsViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            first_name = "john",
            last_name = "doe",
            password ="password123",
            user_type = "admin"
        )
        self.client.force_authenticate(user=self.user)

        self.admin_settings = AdminSettings.objects.create(
            user=self.user,
            username =self.user.username,
            first_name = self.user.first_name,
            last_name = self.user.last_name
        )

        self.url = "/api/admin/settings"

    def test_get_admin_settings(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "@johndoe")

    def test_put_admin_settingss(self):
        updated_data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "@admin123"
        }
        response = self.client.put(self.url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin_settings.refresh_from_db()
        self.assertEqual(self.admin_settings.first_name, "Jane")

    def test_delete_admin_settings(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AdminSettings.objects.filter(user=self.user).exists())
