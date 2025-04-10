from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from returnToWork.models import AdminVerification

User = get_user_model()


class AdminUsersViewTest(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="superpass",
            user_type="superadmin"
        )

        self.admin = User.objects.create_user(
            username="admin1",
            email="admin1@example.com",
            password="adminpass",
            user_type="admin"
        )

        self.employee = User.objects.create_user(
            username="employee1",
            email="employee1@example.com",
            password="userpass",
            user_type="employee"
        )

        self.url = "/api/admin-users/"

    def test_get_admin_users_as_superadmin(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(u['username'] == 'admin1' for u in response.data))

    def test_get_admin_users_as_non_superadmin(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)

    def test_create_admin_user_requires_superadmin(self):
        self.client.force_authenticate(user=self.employee)
        data = {
            "username": "unauthorizedadmin",
            "email": "noadmin@example.com",
            "password": "somepass"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)

    def test_create_admin_user_success_with_verification(self):
        self.client.force_authenticate(user=self.superadmin)
        data = {
            "username": "verifyadmin",
            "email": "verify@example.com",
            "password": "pass1234",
            "require_verification": True
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "verifyadmin")
        verification = AdminVerification.objects.get(admin__username="verifyadmin")
        self.assertFalse(verification.is_verified)

    def test_create_admin_user_success_without_verification(self):
        self.client.force_authenticate(user=self.superadmin)
        data = {
            "username": "autoadmin",
            "email": "autoadmin@example.com",
            "password": "adminsecure",
            "require_verification": False
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        verification = AdminVerification.objects.get(admin__username="autoadmin")
        self.assertTrue(verification.is_verified)

    def test_create_admin_user_with_missing_fields(self):
        self.client.force_authenticate(user=self.superadmin)
        data = {
            "username": "missingfields"
            # missing email and password
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_admin_user_with_duplicate_username(self):
        self.client.force_authenticate(user=self.superadmin)
        data = {
            "username": "admin1",  # already exists
            "email": "new@example.com",
            "password": "somepass"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_admin_user_with_duplicate_email(self):
        self.client.force_authenticate(user=self.superadmin)
        data = {
            "username": "newadmin",
            "email": "admin1@example.com",  # already exists
            "password": "somepass"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
