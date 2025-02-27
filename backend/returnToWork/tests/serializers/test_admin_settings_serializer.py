from django.test import TestCase
from returnToWork.serializers import AdminSettingSerializer
from returnToWork.models import AdminSettings,User


class AdminSettingSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe",
            first_name="John",
            last_name="Doe",
            user_type = "admin"
        )

    def test_admin_setting_serializer(self):
        valid_data = {
            "username":"@johndoe",
            "first_name":"John",
            "last_name":"Doe"
        }
        serializer = AdminSettingSerializer(data = valid_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["first_name"],"John")

    def test_admin_setting_invalid_serializer(self):
        invalid_data = {
            "first_name":"John",
            "last_name":"Doe"
        }
        serializer = AdminSettingSerializer(data = invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_admin_setting_serializer_from_instance(self):
        admin_settings = AdminSettings.objects.create(
            user=self.user,
            first_name="John",
            last_name="Doe",
            username="@johndoe"
        )
        serializer = AdminSettingSerializer(instance=admin_settings)
        expected_data = {
            "first_name": "John",
            "last_name": "Doe",
            "username": "@johndoe"
        }
        self.assertEqual(serializer.data, expected_data)
