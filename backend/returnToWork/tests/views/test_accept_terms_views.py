from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from returnToWork.serializers import UserSerializer  

User = get_user_model()

class AcceptTermsViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123",
            user_type="service user",
            terms_accepted=False  
        )
        self.url = reverse("accept-terms")  

    def test_accept_terms_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.terms_accepted)
        self.assertEqual(response.data["message"], "Terms and conditions accepted")
        self.assertEqual(response.data["user"], UserSerializer(self.user).data)

    def test_accept_terms_unauthenticated_user(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 401) 
