from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token

User = get_user_model()

class LogOutViewTest(APITestCase):
    permission_classes = [IsAuthenticated]
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            password ="password123"
        )
        self.logout_url = reverse("logout")

        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
    def test_succsesful_logout(self):
        self.assertTrue(Token.objects.filter(user=self.user).exists())
        response = self.client.post(self.logout_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Successfully logged out")
        token_exists = Token.objects.filter(user=self.user).exists()
        self.assertFalse(token_exists, "Token wasnt dleted after logout")
        
    def test_unauthnticated_user_cant_logout(self):
        self.client.credentials()
        response = self.client.post(self.logout_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        