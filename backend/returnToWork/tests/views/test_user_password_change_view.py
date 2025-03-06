from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from returnToWork.views import UserPasswordChangeView
from rest_framework import status
from django.urls import reverse

User = get_user_model()

class UserPasswordChangeViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@janedoe",
            password="oldpassword123"
        )
        self.client.force_authenticate(user=self.user) 

        self.url = reverse("user-password-change") 

    def test_successful_password_change(self):
        data = {
            "old_password": "oldpassword123",
            "new_password": "newSecurePassword",
            "confirm_new_password": "newSecurePassword"
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newSecurePassword"))

    def test_incorrect_old_password(self):
        data = {
            "old_password": "wrongpassword",
            "new_password": "newSecurePassword",
            "confirm_new_password": "newSecurePassword"
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.data) 

    def test_mismatched_new_passwords(self):
        data = {
            "old_password": "oldpassword123",
            "new_password": "newSecurePassword",
            "confirm_new_password": "differentPassword"
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  
        self.assertIn("new_password", response.data) 

    def test_missing_required_fields(self):
        data = {
            "old_password": "oldpassword123"
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  
        self.assertIn("new_password", response.data) 
        self.assertIn("confirm_new_password", response.data)  

    def test_unauthenticated_user_cannot_change_password(self):
        self.client.force_authenticate(user=None)
        data = {
            "old_password": "oldpassword123",
            "new_password": "newSecurePassword",
            "confirm_new_password": "newSecurePassword"
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)  