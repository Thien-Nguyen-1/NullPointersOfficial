from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from returnToWork.models import AdminVerification
import uuid

User = get_user_model()

class LogInViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username ="@johndoe",password ="password123",user_type = "admin")
        self.login_url = reverse("login")

    def test_succsesful_login(self):
        AdminVerification.objects.create(admin = self.user,is_verified =True, verification_token = str(uuid.uuid4()))
        data = {"username": "@johndoe","password":"password123",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unsuccesful_login_no_admin_veification(self):
        data = {"username": "@johndoe","password":"password123","user_type":"admin",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error",response.data )
        self.assertIn("verification_required",response.data )
        self.assertTrue(response.data["verification_required"])

    def test_no_verification(self):
        AdminVerification.objects.create(admin = self.user,is_verified =False, verification_token = str(uuid.uuid4()))
        data = {"username": "@johndoe","password":"password123",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error",response.data )
        self.assertIn("verification_required",response.data )
        
    def test_invalid_password(self):
        data = {"username": "@johndoe","password":"password12345",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_username(self):
        data = {"username": "@johndoe1","password":"password1234567",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password(self):
        data = {"username": "@johndoe",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_username(self):
        data = {"password": "password123",}
        response = self.client.post(self.login_url,data,format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
    
