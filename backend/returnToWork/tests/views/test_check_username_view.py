from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()

class CheckUsernameViewTest(APITestCase):
    def setUp(self):
        self.existing_user = User.objects.create_user(username="@testuser", password="password123")
        self.check_username_url = reverse("check-username") 

    def test_username_exists(self):
        response = self.client.get(self.check_username_url, {"username": "@testuser"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["exists"])

    def test_username_does_not_exist(self):
        response = self.client.get(self.check_username_url, {"username": "@nonexistent"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["exists"])

    def test_missing_username_parameter(self):
        response = self.client.get(self.check_username_url) 
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "Username is required")
