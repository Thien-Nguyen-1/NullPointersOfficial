from returnToWork.models import User, AdminVerification
from django.test import TestCase
from django.utils import timezone
import datetime

class AdminVerificationTestCase(TestCase):
    """Unit tests for the AdminVerification model."""
    
    def setUp(self):
        """Set up test dependencies"""
        self.admin_user = User.objects.create_user(
            username="@adminuser",
            password="adminpass123",
            first_name="Admin",
            last_name="User",
            email="admin@example.org",
            user_type="admin"
        )
    
    def test_str_representation(self):
        """Test the string representation of AdminVerification"""
        verification = AdminVerification.objects.create(
            admin=self.admin_user, 
            verification_token="test-token"
        )
        self.assertEqual(str(verification), f"Verification for {self.admin_user.username}")

    def test_token_expiration_with_valid_token(self):
        """Test token expiration with valid token"""
        verification = AdminVerification.objects.create(
            admin=self.admin_user, 
            verification_token="test-token"
        )
        self.assertFalse(verification.is_token_expired())

    def test_token_expiration_with_expired_token(self):
        """Test token expiration with token older than 48 hours"""
        verification = AdminVerification.objects.create(
            admin=self.admin_user, 
            verification_token="test-token"
        )
        # Use update() to bypass auto_now_add
        old_time = timezone.now() - timezone.timedelta(hours=49)
        AdminVerification.objects.filter(pk=verification.pk).update(token_created_at=old_time)
        verification.refresh_from_db()
        self.assertTrue(verification.is_token_expired())

    def test_token_expiration_with_empty_token(self):
        """Test token expiration with empty token string"""
        verification = AdminVerification.objects.create(
            admin=self.admin_user, 
            verification_token=""
        )
        self.assertTrue(verification.is_token_expired())

    def test_cascade_deletion(self):
        """Test that verifications are deleted when user is deleted"""
        verification = AdminVerification.objects.create(
            admin=self.admin_user, 
            verification_token="test-token"
        )
        self.admin_user.delete()
        self.assertEqual(AdminVerification.objects.count(), 0)