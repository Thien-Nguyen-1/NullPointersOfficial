# from django.test import TestCase
# from django.contrib.auth import get_user_model
# from returnToWork.serializers import SignUpSerializer
# from rest_framework.exceptions import ValidationError

# User = get_user_model()  

# class SignUpSerializerTest(TestCase):

#     def setUp(self):
#         self.valid_data = {
#             "username": "@newuser",
#             "first_name": "New",
#             "last_name": "User",
#             "user_type": "service user",
#             "password": "SecurePass123",
#             "confirm_password": "SecurePass123",
#         }

#     def test_password_mismatch_raises_validation_error(self):
#         invalid_data = self.valid_data.copy()
#         invalid_data["confirm_password"] = "WrongPass123"  

#         serializer = SignUpSerializer(data=invalid_data)
        
#         with self.assertRaises(ValidationError) as context:
#             serializer.is_valid(raise_exception=True)

#         self.assertIn("Password do not match", str(context.exception))

#     def test_create_user_successfully(self):
#         serializer = SignUpSerializer (data=self.valid_data)
#         self.assertTrue(serializer.is_valid())

#         user = serializer.save() 

#         self.assertIsInstance(user, User)
#         self.assertEqual(user.username, "@newuser")
#         self.assertTrue(user.check_password("SecurePass123"))  

#     def test_successful_validation(self):
#         serializer = SignUpSerializer(data=self.valid_data)
#         is_valid = serializer.is_valid()
#         self.assertTrue(is_valid)
