from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()
class ServiceUserListViewAPITest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="@johndoe",
            email="john@example.com",
            password="password123",
            user_type="service user"
        )
        self.user2 = User.objects.create_user(
            username="@janedoe",
            email="jane@example.com",
            password="password123",
            user_type="service user"
        )
        self.admin = User.objects.create_user(
            username="@adminuser",
            email="admin@example.com",
            password="password123",
            user_type="admin"
        )

    def test_list_all_service_users(self):
        url = reverse("service-users-list") 
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_filter_service_users_by_username(self):
        url = reverse("service-users-list")
        response = self.client.get(url, {"username": "john"})
        self.assertEqual(response.status_code, 200)
        for user in response.data:
            self.assertIn("john", user["username"])
