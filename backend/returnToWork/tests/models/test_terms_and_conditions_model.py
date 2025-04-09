from django.test import TestCase
from returnToWork.models import TermsAndConditions,User

class TermsAndConditionsModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='@testuser',
            password='password123'
            )
        self.tandc = TermsAndConditions.objects.create(
            content="Test Terms and Conditions",
            created_by=self.user
            )

    def test_tandc_string_representation(self):
        expected_string = f"Terms and Conditions (Updated: {self.tandc.updated_at.strftime('%Y-%m-%d')})"
        self.assertEqual(str(self.tandc), expected_string)