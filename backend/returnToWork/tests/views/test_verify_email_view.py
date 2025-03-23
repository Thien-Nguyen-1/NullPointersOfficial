from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class VerifyEmailViewTests(APITestCase):
    def setUp(self):
        self.token = 'test-token-123'
        self.user_data = {
            'username': '@johndoe',
            'email': 'johndoe@example.com',
            'password': 'testpass123'
        }
        cache.set(self.token, self.user_data, timeout=300)

    def test_verify_email_success(self):
        url = reverse('verify-sign-up', kwargs={'token': self.token})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Email verified successfully')
        self.assertTrue(User.objects.filter(username='@johndoe').exists())
        self.assertIsNone(cache.get(self.token))

    def test_verify_email_invalid_token(self):
        url = reverse('verify-sign-up', kwargs={'token': 'invalid-token'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Invalid or expired verification token')
