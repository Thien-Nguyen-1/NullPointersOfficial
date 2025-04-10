from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from returnToWork.models import User, AdminVerification
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
import uuid

class AdminEmailVerificationTests(APITestCase):
    def setUp(self):
        self.admin_valid = User.objects.create_user(
            username='@admin_valid', 
            email='valid@example.com', 
            password='adminpass', 
            user_type='admin'
        )
        self.valid_verification = AdminVerification.objects.create(
            admin=self.admin_valid,
            verification_token=str(uuid.uuid4()),
            is_verified=False
        )
        self.admin_verified = User.objects.create_user(
            username='@admin_verified', 
            email='verified@example.com', 
            password='adminpass', 
            user_type='admin'
        )
        self.used_verification = AdminVerification.objects.create(
            admin=self.admin_verified,
            verification_token=str(uuid.uuid4()),
            is_verified=True
        )
        self.admin_expired = User.objects.create_user(
            username='@admin_expired', 
            email='expired@example.com', 
            password='adminpass', 
            user_type='admin'
        )
        self.expired_verification = AdminVerification.objects.create(
            admin=self.admin_expired,
            verification_token=str(uuid.uuid4()),
            is_verified=False
        )
        self.expired_verification.token_created_at = timezone.now() - timedelta(days=4)
        self.expired_verification.save()
        self.service_user = User.objects.create_user(
            username='@notadmin', 
            email='user@example.com', 
            password='userpass', 
            user_type='service user'
        )
        self.non_admin_verification = AdminVerification.objects.create(
            admin=self.service_user,
            verification_token=str(uuid.uuid4()),
            is_verified=False
        )

    def test_verify_valid_token(self):
        url = reverse('verify_admin_email', args=[self.valid_verification.verification_token])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Email verified successfully. You can now log in as an admin.')
        self.assertEqual(response.data['redirect_url'], '/login')

    def test_verify_already_verified_token(self):
        url = reverse('verify_admin_email', args=[self.used_verification.verification_token])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Email already verified. You can now log in as an admin.')

    def test_verify_expired_token(self):
        url = reverse('verify_admin_email', args=[self.expired_verification.verification_token])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Verification token has expired. Please request a new one.')

    def test_verify_invalid_token(self):
        url = reverse('verify_admin_email', args=['invalid-token-123'])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Invalid or expired verification token')

    def test_verify_non_admin_user(self):
        url = reverse('verify_admin_email', args=[self.non_admin_verification.verification_token])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'This verification link is only valid for admin users.')
