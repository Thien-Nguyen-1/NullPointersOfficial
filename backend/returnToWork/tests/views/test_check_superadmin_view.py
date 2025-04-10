from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class CheckSuperAdminViewTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.superadmin = User.objects.create_user(
            username='admin',
            password='pass',
            email='admin@example.com',
            user_type='superadmin'
        )
        self.normal_user = User.objects.create_user(
            username='user',
            password='pass',
            email='user@example.com',
            user_type='service user'
        )
        self.url = reverse('check-superadmin')

    def test_superadmin_returns_true(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'isSuperAdmin': True})

    def test_non_superadmin_returns_false(self):
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'isSuperAdmin': False})

    def test_unauthenticated_user_denied(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
