from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from returnToWork.models import TermsAndConditions  

User = get_user_model()

class TermsAndConditionsViewTests(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            username="@superadmin",
            email="superadmin@example.com",
            password="password123",
            user_type="superadmin"
        )
        self.service_user = User.objects.create_user(
            username="@serviceuser",
            email="user@example.com",
            password="password123",
            user_type="service user"
        )
        self.url = reverse("terms-and-conditions")  

    def test_get_terms_when_none_exist(self):
        self.client.force_authenticate(user=self.service_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["content"], "")
        self.assertIsNone(response.data["last_updated"])

    def test_get_latest_terms(self):
        TermsAndConditions.objects.create(
            content="hello",
            created_by=self.superadmin
        )
        latest = TermsAndConditions.objects.create(
            content="bye",
            created_by=self.superadmin
        )
        self.client.force_authenticate(user=self.service_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["content"], "bye")
        self.assertEqual(response.data["last_updated"], latest.updated_at)

    def test_put_terms_unauthenticated(self):
        response = self.client.put(self.url, {"content": "confirm"})
        self.assertEqual(response.status_code, 401)

    def test_put_terms_non_superadmin(self):
        self.client.force_authenticate(user=self.service_user)
        response = self.client.put(self.url, {"content": "confirm"})
        self.assertEqual(response.status_code, 403)

    def test_put_terms_missing_content(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_put_terms_success(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.put(self.url, {"content": "hi"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["content"], "hi")
        self.assertIsNotNone(response.data["last_updated"])
        self.assertTrue(TermsAndConditions.objects.filter(content="hi").exists())
