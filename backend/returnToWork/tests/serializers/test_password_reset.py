from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.serializers import PasswordResetSerializer
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode

User = get_user_model()

class PasswordResetSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="@johndoe", password="OldPassword123")
        self.uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)

    def test_valid_password_change(self):
        data = {
            "username": "@johndoe",
            "new_password": "NewPass123",
            "confirm_new_password": "NewPass123",
            "uidb64" : self.uidb64,
            "token" : self.token
        }
        serializer = PasswordResetSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user  = serializer.save()  
        self.assertTrue(user.check_password("NewPass123"))  

    def test_invalid_password_change(self):
        data = {
            "username": "@johndoe",
            "new_password": "NewPass123",
            "confirm_new_password": "NewPass12345",
            "uidb64" : self.uidb64,
            "token" : self.token
        }
        serializer = PasswordResetSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("New passwords do not match", str(serializer.errors))

    def test_user_doesnt_exit(self):
        uidb64 = urlsafe_base64_encode(force_bytes(99999))  
        data = {
            "username": "@johndoe885858",
            "new_password": "NewPass123",
            "confirm_new_password": "NewPass123",
            "uidb64" : uidb64,
            "token" : self.token
        }
        serializer = PasswordResetSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Invalid user or token", str(serializer.errors))
