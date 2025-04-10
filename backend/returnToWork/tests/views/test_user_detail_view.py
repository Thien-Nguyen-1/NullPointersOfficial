from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from returnToWork.models import User, Module, Tags
import uuid

class UserDetailTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='@testuser',
            email='test@example.com',
            password='pass1234',
            first_name='Test',
            last_name='User',
            user_type='service user',
            is_first_login=True
        )
        self.tag1 = Tags.objects.create(tag="Confidence")
        self.tag2 = Tags.objects.create(tag="Anxiety")

        self.module1 = Module.objects.create(title="Module 1", description="Test")
        self.module2 = Module.objects.create(title="Module 2", description="Test 2")

        self.client.force_authenticate(user=self.user)
        self.url = reverse('user-detail')

    def test_get_user_details(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        expected_keys = ['user_id', 'username', 'first_name', 'last_name', 'user_type', 
                         'completed_modules', 'in_progress_modules', 'total_modules', 'modules']
        for key in expected_keys:
            self.assertIn(key, response.data) 

    def test_put_updates_user_successfully(self):
        """Test PUT request updates user fields and tags/modules"""
        data = {
            "user_id": str(self.user.user_id),
            "is_first_login": False,
            "firebase_token": "fake-token-123",
            "tags": [
                {"id": self.tag1.id, "tag": self.tag1.tag},
                {"id": self.tag2.id, "tag": self.tag2.tag}
            ],
            "module": [
                {"id": self.module1.id},
                {"id": self.module2.id}
            ]
        }

        response = self.client.put(self.url, data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "Login Successful")
        self.assertFalse(User.objects.get(id=self.user.id).is_first_login)

        user = User.objects.get(id=self.user.id)
        self.assertEqual(user.firebase_token, "fake-token-123")
        self.assertEqual(user.tags.count(), 2)
        self.assertEqual(user.module.count(), 2)

    def test_put_fails_with_missing_tag_id(self):
        """Test PUT request fails when tag ID is missing"""
        data = {
            "user_id": str(self.user.user_id),
            "is_first_login": False,
            "firebase_token": "fake-token-123",
            "tags": [{"id": "", "tag": "Confidence"}],
            "module": [{"id": self.module1.id}]
        }
        response = self.client.put(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Tag ID is missing.", response.data["detail"])

    def test_put_fails_with_invalid_module_id(self):
        """Test PUT request fails when module ID is invalid"""
        data = {
            "user_id": str(self.user.user_id),
            "is_first_login": False,
            "firebase_token": "token123",
            "tags": [{"id": self.tag1.id, "tag": self.tag1.tag}],
            "module": [{"id": 999999}] 
        }
        response = self.client.put(self.url, data, format="json")
        self.assertEqual(response.status_code, 404)
        self.assertIn("Module ID not found.", response.data["detail"])
