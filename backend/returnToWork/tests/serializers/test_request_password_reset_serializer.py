from django.test import TestCase
from returnToWork.serializers import RequestPasswordResetSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class RequestPasswordResetSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe",
            email="johndoe@example.com",
            password="password123"
        )

    def test_valid_email(self):
        data = {"email": "johndoe@example.com"}
        serializer = RequestPasswordResetSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["email"], "johndoe@example.com")

    def test_invalid_email(self):
        data = {"email": "nonexistent@example.com"}
        serializer = RequestPasswordResetSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("No user found with that email", str(serializer.errors))
