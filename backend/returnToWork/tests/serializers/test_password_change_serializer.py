from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.serializers import PasswordChangeSerializer
from rest_framework.exceptions import ValidationError

User = get_user_model()

class PasswordChangeSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="@johndoe", password="OldPassword123")

    def test_valid_password_change(self):
        data = {
            "old_password": "OldPassword123",
            "new_password": "NewSecurePass123",
            "confirm_new_password": "NewSecurePass123"
        }
        serializer = PasswordChangeSerializer(data=data, instance=self.user)
        self.assertTrue(serializer.is_valid())

        updated_user = serializer.save()  
        self.assertTrue(updated_user.check_password("NewSecurePass123"))  

    def test_password_mismatch_raises_validation_error(self):
        data = {
            "old_password": "OldPassword123",
            "new_password": "NewSecurePass123",
            "confirm_new_password": "WrongPass123"
        }
        serializer = PasswordChangeSerializer(data=data, instance=self.user)
        
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True) 

        self.assertEqual(str(context.exception.detail[0]), "New passwords do not match")

    def test_old_password_incorrect_raises_validation_error(self):
        data = {
            "old_password": "WrongOldPass",
            "new_password": "NewSecurePass123",
            "confirm_new_password": "NewSecurePass123"
        }
        serializer = PasswordChangeSerializer(data=data, instance=self.user)

        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
            serializer.save() 
        self.assertEqual(str(context.exception.detail[0]), "Old password is incorrect")
