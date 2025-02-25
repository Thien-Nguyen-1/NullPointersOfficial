from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()

class LogInViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            password ="password123"
        )
        self.login_url = reverse("login")

    def test_succsesful_login(self):
        data = {
            "username": "@johndoe",
            "password":"password123",
        }
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertEqual(response.data["message"], "Login Successful")
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], "@johndoe")

    def test_invalid_password(self):
        data = {
            "username": "@johndoe",
            "password":"password12345",
        }
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    def test_invalid_username(self):
        data = {
            "username": "@johndoe1",
            "password":"password1234567",
        }
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    def test_missing_password(self):
        data = {"username": "@johndoe",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_missing_username(self):
        data = {"password": "password123",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)