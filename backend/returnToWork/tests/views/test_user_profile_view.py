from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token

User = get_user_model()

class UserProfileViewTest(APITestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe",
            first_name="John",
            last_name="Doe",
            password="password123"
        )
        self.profile_url = reverse("profile")  
        self.client.force_authenticate(user=self.user)

    def test_user_profile(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "@johndoe")
        self.assertEqual(response.data["first_name"], "John")
        self.assertEqual(response.data["last_name"], "Doe")

    def test_update_user_profile(self):
        data = {
            "first_name": "Joe",
            "last_name": "Smith"
        }
        response = self.client.put(self.profile_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Joe")
        self.assertEqual(response.data["last_name"], "Smith")


    def test_update_user_profile_with_invalid_data(self):
        data = {
            "first_name": "",  
            "last_name": "Yusuf"
        }
        response = self.client.put(self.profile_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)  
