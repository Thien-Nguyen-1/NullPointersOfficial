from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.serializers import PasswordResetSerializer
from rest_framework.exceptions import ValidationError

User = get_user_model()

class PasswordResetSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="@johndoe", password="OldPassword123")

    def test_valid_password_change(self):
        data = {
            "username": "@johndoe",
            "new_password": "NewPass123",
            "confirm_new_password": "NewPass123"
        }
        serializer = PasswordResetSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user  = serializer.save()  
        self.assertTrue(user.check_password("NewPass123"))  

    def test_invalid_password_change(self):
        data = {
            "username": "@johndoe",
            "new_password": "NewPass123",
            "confirm_new_password": "NewPass12345"
        }
        serializer = PasswordResetSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("New passwords do not match", str(serializer.errors))

    def test_user_doesnt_exit(self):
        data = {
            "username": "@johndoe885858",
            "new_password": "NewPass123",
            "confirm_new_password": "NewPass123"
        }
        serializer = PasswordResetSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        with self.assertRaises(ValidationError)as context:
            serializer.save()
        self.assertIn("User does not exist", str(context.exception))
