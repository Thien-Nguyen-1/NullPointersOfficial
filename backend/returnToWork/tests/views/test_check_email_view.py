from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()

class CheckEmailViewTest(APITestCase):
    def setUp(self):
        self.existing_user = User.objects.create_user(username="@user", email = "user@example.co.uk")
        self.check_email_url = reverse("check-email") 

    def test_email_exists(self):
        response = self.client.get(self.check_email_url, {"email": "user@example.co.uk"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["exists"])

    def test_email_does_not_exist(self):
        response = self.client.get(self.check_email_url, {"email": "notuser@example.co.uk"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["exists"])

    def test_missing_email(self):
        response = self.client.get(self.check_email_url) 
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "Email is required")
