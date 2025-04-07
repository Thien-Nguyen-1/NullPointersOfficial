from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class LogOutViewTest(APITestCase):
    permission_classes = [IsAuthenticated]
    def setUp(self):
        self.user = User.objects.create_user(
            username ="@johndoe",
            password ="password123"
        )
        self.logout_url = reverse("logout")
        
    def test_succsesful_logout(self):
        refresh = RefreshToken.for_user(self.user)
        # Since we're using JWT, we don't need the Token authentication
        # but we still need to authenticate the user
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.logout_url, 
            {"refresh": str(refresh)},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Successfully logged out")
            
    def test_unauthnticated_user_cant_logout(self):
        self.client.force_authenticate(user=None)
        refresh = RefreshToken.for_user(self.user)
        response = self.client.post(
            self.logout_url,
            {"refresh": str(refresh)},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_with_invalid_token(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.logout_url,
            {"refresh": "invalidtoken"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

        