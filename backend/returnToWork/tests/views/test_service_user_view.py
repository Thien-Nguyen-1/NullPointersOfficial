# from django.test import TestCase
# from django.urls import reverse
# from rest_framework import status
# from rest_framework.test import APIClient
# from returnToWork.models import User, Tags
# from django.contrib.messages import get_messages

# class ServiceUserTests(TestCase):
#     def setUp(self):
#         self.url = reverse("service-users-list")

#         self.client = APIClient()
#         self.tag1 = Tags.objects.create(tag="Anxiety")
#         self.tag2 = Tags.objects.create(tag="Stress")
#         self.tag3 = Tags.objects.create(tag="Depression")

#         self.user1 = User.objects.create(username="@user1", first_name="John", last_name="Doe", user_type="service user")
#         self.user1.tags.add(self.tag1, self.tag2)

#         self.user2 = User.objects.create(username="@user2", first_name="Jane", last_name="Smith", user_type="service user")
#         self.user2.tags.add(self.tag3)

#         self.non_service_user = User.objects.create(username="@admin", first_name="Admin", last_name="User", user_type="admin")

#     def test_get_all_service_users(self):
#         self.assertEqual(self.url, '/service-users/')
#         response = self.client.get(self.url, follow=True)

#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 2)  # Only service users should be listed

#     def test_filter_service_user_by_username(self):
#         response = self.client.get(self.url, {"username": "@user1"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 1)
#         self.assertEqual(response.data[0]["username"], "@user1")

#     def test_filter_non_existent_user(self):
#         response = self.client.get(self.url, {"username": "@nonexistent"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 0)  # Should return an empty list
#     def test_no_service_users_exist(self):
#         User.objects.filter(user_type="service user").delete()
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 0)  # Should return an empty list

#     def test_delete_service_user_successful(self):
#         url = reverse("delete-service-user", kwargs={"username": "@user1"})
#         response = self.client.delete(url)

#         self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
#         self.assertFalse(User.objects.filter(username="@user1").exists())
#         self.assertEqual(response.data["message"], "User with username \"@user1\" has been deleted.")

#     def test_delete_nonexistent_user(self):
#         """Test attempting to delete a user that doesn't exist"""
#         url = reverse("delete-service-user", kwargs={"username": "@nonexistent"})
#         response = self.client.delete(url)

#         self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertEqual(response.data["error"], "User not found")

#     def test_delete_user_changes_count(self):
#         """Test that deleting a service user reduces the total count"""
#         initial_count = User.objects.filter(user_type="service user").count()
#         url = reverse("delete-service-user", kwargs={"username": "@user1"})
#         self.client.delete(url)

#         new_count = User.objects.filter(user_type="service user").count()
#         self.assertEqual(new_count, initial_count - 1)


