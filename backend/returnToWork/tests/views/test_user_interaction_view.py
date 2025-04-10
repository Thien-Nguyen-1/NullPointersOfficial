# from django.urls import reverse
# from rest_framework.test import APITestCase, APIClient
# from rest_framework import status
# from django.contrib.auth import get_user_model
# from returnToWork.models import Module, ProgressTracker

# User = get_user_model()

# class UserInteractionViewTest(APITestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.user = User.objects.create_user(
#             username='testuser', 
#             password='pass', 
#             email='test@example.com'
#         )
#         self.other_user = User.objects.create_user(
#             username='otheruser', 
#             password='pass', 
#             email='other@example.com'
#         )
#         self.module = Module.objects.create(title='Sample Module', description='Test module')
#         self.url = reverse('user-interaction', args=[self.module.id])

#     def test_get_interactions_authenticated_user_filter_user(self):
#         ProgressTracker.objects.create(
#             user=self.user, 
#             module=self.module, 
#             hasLiked=True, 
#             pinned=False
#         )
#         self.client.force_authenticate(user=self.user)
#         response = self.client.get(self.url + '?filter=user')
#         self.assertEqual(response.status_code, status.HTTP_200_OK)

#     def test_get_interactions_authenticated_all(self):
#         ProgressTracker.objects.create(user=self.user, module=self.module)
#         ProgressTracker.objects.create(user=self.other_user, module=self.module)
#         self.client.force_authenticate(user=self.user)
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)

#     def test_get_interactions_authenticated_none_found(self):
#         self.client.force_authenticate(user=self.user)
#         response = self.client.get(self.url + '?filter=user')
#         self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

#     def test_get_interactions_unauthenticated(self):
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

#     def test_post_interaction_creates_tracker_and_upvotes(self):
#         self.client.force_authenticate(user=self.user)
#         data = {'hasLiked': True, 'pinned': True}

#         response = self.client.post(self.url, data, format='json')
#         self.assertEqual(response.status_code, status.HTTP_200_OK)

#         tracker = ProgressTracker.objects.get(user=self.user, module=self.module)
#         self.assertTrue(tracker.hasLiked)
#         self.assertTrue(tracker.pinned)

#     def test_post_interaction_toggle_downvote(self):
#         ProgressTracker.objects.create(user=self.user, module=self.module, hasLiked=True, pinned=False)
#         self.module.upvotes = 1
#         self.module.save()
#         self.client.force_authenticate(user=self.user)
#         data = {'hasLiked': False, 'pinned': False}
#         response = self.client.post(self.url, data, format='json')
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         tracker = ProgressTracker.objects.get(user=self.user, module=self.module)
#         self.assertFalse(tracker.hasLiked)

#     def test_post_invalid_data(self):
#         self.client.force_authenticate(user=self.user)
#         data = {'hasLiked': True}  
#         response = self.client.post(self.url, data, format='json')
#         self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(response.data['message'], "sent data formatted incorrectly!")

#     def test_post_unauthenticated(self):
#         data = {'hasLiked': True, 'pinned': True}
#         response = self.client.post(self.url, data, format='json')
#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
