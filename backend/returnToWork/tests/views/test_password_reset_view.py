from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator


User = get_user_model()

class PasswordResetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            password ="password123"
        )
        self.uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)
        self.change_password_url = reverse("password-reset", kwargs={"uidb64":self.uidb64,"token": self.token})


    def test_succsesful_login(self):
        data = {
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
            "new_password":"password12345",
            "confirm_new_password":"password123456",

        }
        response = self.client.post(self.change_password_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(response.data["non_field_errors"][0], "New passwords do not match")

    def test_invalid_token_fails(self):
        invalid_token_url = reverse("password-reset", kwargs={"uidb64": self.uidb64, "token": "invalid-token"})
        data = {
            "new_password": "password12345",
            "confirm_new_password": "password12345",
        }
        response = self.client.post(invalid_token_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("token", response.data)

    def test_invalid_uid_fails(self):
        invalid_uid_url = reverse("password-reset", kwargs={"uidb64": "invalid-uid", "token": self.token})
        data = {
            "new_password": "password12345",
            "confirm_new_password": "password12345",
        }
        response = self.client.post(invalid_uid_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user", response.data)


