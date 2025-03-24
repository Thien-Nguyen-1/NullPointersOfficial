from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from returnToWork.models import User  

class RequestPasswordResetViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe",
            email="johndoe@example.com",
            password="password123",
            user_type="Service user"
        )
        self.url = reverse('request-password-reset')  

    def test_valid_password_reset_request(self):
        data = {"email": "johndoe@example.com"}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Password reset link sent successfully")

    def test_invalid_password_reset_request(self):
        data = {}  
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
