from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()

class PasswordResetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            password ="password123"
        )
        self.change_password_url = reverse("change-password")

    def test_succsesful_login(self):
        data = {
            "username":"@johndoe",
            "new_password":"password12345",
            "confirm_new_password":"password12345",
        }
        response = self.client.post(self.change_password_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Password reset successfully")

        self.client.logout()
        login_successful = self.client.login(username = "@johndoe", password = "password12345")
        self.assertTrue(login_successful)

    def test_different_passwords(self):
        data ={
            "username":"@janedoe",
            "new_password":"password12345",
            "confirm_new_password":"password123456",

        }
        response = self.client.post(self.change_password_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(response.data["non_field_errors"][0], "New passwords do not match")


