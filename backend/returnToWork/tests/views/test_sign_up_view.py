from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()

class SignUpViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@zaki135768",
            first_name ="jane",
            last_name= "doe",
            email = "jane@example.org",
            user_type = "service user",
            password ="password123",
        )
        self.login_url = reverse("signup")

    def test_succsesful_signup(self):
        data = {
            "username" :"@zaki1357680",
            "first_name" :"jane",
            "last_name":"doe",
            "email":"jane23@example.org",
            "user_type" : "service user",
            "password" :"password123",
            "confirm_password" : "password123"
        }
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertEqual(response.data["message"], "User registered successfully. Please verify your email to activate your account")

    def test_wrong_password(self):
        data = {
            "username": "@zaki17",
            "first_name": "jane",
            "last_name":"doe",
            "email":"jane1@example.org",
            "user_type":"service user",
            "password":"password12345",
            "confirm_password":"password1234567",

        }
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    def test_invalid_username(self):
        data = {
            "username": "",
            "password":"password1234567",
            "confirm_password":"password1234567",
        }
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_missing_password(self):
        data = {"username": "@zaki135768",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_missing_username(self):
        data = {"password": "password123",
                "confirm_password": "password123"}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_missing_email(self):
        data = {"username": "@zaki135768",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)