from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.serializers import AdminUserSerializer
from returnToWork.models import AdminVerification  # Adjust import if needed

User = get_user_model()

class AdminUserSerializerTest(TestCase):
    def setUp(self):
        # Common users
        self.superadmin = User.objects.create_user(
            username='superadmin',
            email='super@admin.com',
            password='testpass123',
            user_type='superadmin'
        )

        self.verified_admin = User.objects.create_user(
            username='verifiedadmin',
            email='verified@admin.com',
            password='testpass123',
            user_type='admin'
        )
        AdminVerification.objects.create(admin=self.verified_admin, is_verified=True)

        self.unverified_admin = User.objects.create_user(
            username='unverifiedadmin',
            email='unverified@admin.com',
            password='testpass123',
            user_type='admin'
        )
        AdminVerification.objects.create(admin=self.unverified_admin, is_verified=False)

        self.no_verification_admin = User.objects.create_user(
            username='novfadmin',
            email='novf@admin.com',
            password='testpass123',
            user_type='admin'
        )

    def test_superadmin_is_always_verified(self):
        serializer = AdminUserSerializer(self.superadmin)
        self.assertTrue(serializer.data['is_verified'])

    def test_verified_admin_returns_true(self):
        serializer = AdminUserSerializer(self.verified_admin)
        self.assertTrue(serializer.data['is_verified'])

    def test_unverified_admin_returns_false(self):
        serializer = AdminUserSerializer(self.unverified_admin)
        self.assertFalse(serializer.data['is_verified'])

    def test_admin_with_no_verification_entry_returns_false(self):
        serializer = AdminUserSerializer(self.no_verification_admin)
        self.assertFalse(serializer.data['is_verified'])
