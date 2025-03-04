from django.test import TestCase
from returnToWork.serializers import UserSettingSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSettingSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe",
            first_name="John",
            last_name="Doe",
            user_type = "admin",
            password = "password123",
            user_id =1
        )

    def test_user_setting_serializer(self):
        serializer = UserSettingSerializer(instance=self.user)
        valid_data = {
            "username":"@johndoe",
            "first_name":"John",
            "last_name":"Doe",
            "user_type":"admin",
            "user_id": str(self.user.id)
        }
        self.assertEqual(serializer.data,valid_data)

    def test_user_setting_invalid_serializer(self):
        invalid_data = {
            "username":"",
            "first_name":"",
            "last_name":"",
            "user_type":"invalid_type",
            "user_id": "not-an-integer"
        }
        serializer = UserSettingSerializer(data = invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("first_name" ,serializer.errors)
        self.assertIn("username" ,serializer.errors)
        self.assertIn("user_type" ,serializer.errors)
        self.assertIn("last_name" ,serializer.errors)

    def test_user_setting_deserializer(self):
        invalid_data = {
            "username":"@johndoee",
            "first_name":"Johnv",
            "user_id": 6
        }
        serializer = UserSettingSerializer(data = invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("last_name", serializer.errors)
        self.assertIn("user_type", serializer.errors)
