from rest_framework.test import APITestCase
from django.urls import reverse
from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework import status
from returnToWork.models import User

User = get_user_model()

class DeleteServiceUserViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@deleteuser",
            email="deleteuser@example.com",
            password="password123",
            user_type="Service user"
        )
        self.url = reverse("delete-service-user", kwargs={"username": self.user.username})

    def test_delete_existing_user(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(username=self.user.username).exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Account deletion")
        self.assertIn("Dear @deleteuser, Your account has been deleted by the admin", mail.outbox[0].body)

    def test_delete_nonexistent_user(self):
        fake_url = reverse("delete-service-user", kwargs={"username": "@doesnotexist"})
        response = self.client.delete(fake_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "User not found")
