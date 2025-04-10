from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from returnToWork.models import User, AdminVerification
from django.utils import timezone
from unittest.mock import patch
import uuid

class ResendAdminVerificationTests(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            username='@superadmin', email='super@example.com', password='superpass', user_type='superadmin'
        )
        self.admin_unverified = User.objects.create_user(
            username='@admin1', email='admin1@example.com', password='adminpass', user_type='admin')
        self.admin_verified = User.objects.create_user(
            username='@admin2', email='admin2@example.com', password='adminpass', user_type='admin'
        )
        AdminVerification.objects.create(admin=self.admin_verified, is_verified=True)

        self.service_user = User.objects.create_user(
            username='@normaluser', email='user@example.com', password='userpass', user_type='service user'
        )
        self.resend_url = lambda user_id: reverse('resend_admin_verification', args=[user_id])

    @patch('returnToWork.views.send_mail')
    def test_superadmin_can_resend_email(self, mock_send_mail):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.post(self.resend_url(self.admin_unverified.id))

        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['email'], self.admin_unverified.email)

        mock_send_mail.assert_called_once()
        verification = AdminVerification.objects.get(admin=self.admin_unverified)
        self.assertIsNotNone(verification.verification_token)

    def test_resend_fails_if_not_superadmin(self):
        self.client.force_authenticate(user=self.service_user)
        response = self.client.post(self.resend_url(self.admin_unverified.id))

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], 'Only superadmins can resend verification emails')

    def test_resend_fails_if_user_not_found_or_not_admin(self):
        self.client.force_authenticate(user=self.superadmin)
        non_existent_id = 999999 
        response = self.client.post(self.resend_url(non_existent_id))

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error'], 'Admin user not found')

    def test_resend_fails_if_already_verified(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.post(self.resend_url(self.admin_verified.id))

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'User is already verified')
