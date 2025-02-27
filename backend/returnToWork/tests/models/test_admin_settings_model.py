from django.test import TestCase
from returnToWork.models import AdminSettings,User

class AdminSettingsModelTset(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@TestUser",
            first_name = "john",
            last_name="doe",
            password="password123"

        )
        self.admin_settings = AdminSettings.objects.create(
            user=self.user,
            username="@TestUser",
            first_name = "john",
            last_name="doe"

        )

    def test_creating_admin_setting(self):
        self.assertEqual(self.admin_settings.user.username, "@TestUser")
        self.assertEqual(self.admin_settings.first_name, "john")
        self.assertEqual(self.admin_settings.last_name, "doe")
        self.assertEqual(self.admin_settings.username, "@TestUser")

    def test_deleting_admin_setting(self):
        self.assertTrue(User.objects.filter(username= "@TestUser").exists())
        self.assertTrue(AdminSettings.objects.filter(username= "@TestUser").exists())

        self.admin_settings.delete_account()

        self.assertFalse(User.objects.filter(username= "@TestUser").exists())
        self.assertFalse(AdminSettings.objects.filter(username= "@TestUser").exists())


        with self.assertRaises(User.DoesNotExist):
            User.objects.get(username = "@TestUser")

        with self.assertRaises(AdminSettings.DoesNotExist):
            AdminSettings.objects.get(username = "@TestUser")
        
    def test_admin_str(self):
        string = f"Settings for {self.admin_settings.user.username} {self.admin_settings.user.first_name} {self.admin_settings.user.last_name}" 
        self.assertEqual(str(self.admin_settings),string)