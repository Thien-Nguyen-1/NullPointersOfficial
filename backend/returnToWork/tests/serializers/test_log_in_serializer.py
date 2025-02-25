from django.test import TestCase
from returnToWork.serializers import LogInSerializer
from django.contrib.auth import get_user_model, authenticate
from rest_framework.exceptions import ValidationError

User = get_user_model()


class LogInSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe",
            password = "password123"
        )

    def test_valid_login(self):
        serializer = LogInSerializer( data ={"username": "@johndoe", "password":"password123"})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["user"],self.user)

    def test_invalid_password_raises_validation_error(self):
        serializer = LogInSerializer( data ={"username": "@johndoe", "password":"password12345"})
        self.assertFalse(serializer.is_valid())

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception = True)

    def test_invalid_username_raises_validation_error(self):
        serializer = LogInSerializer( data ={"username": "@johnsmith", "password":"password123"})
        self.assertFalse(serializer.is_valid())

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception = True)
    
    def test_authentication(self):
        user = authenticate(username="@johndoe",password = "password123")
        self.assertIsNotNone(user)
        self.assertEqual(user,self.user)
    
    
    