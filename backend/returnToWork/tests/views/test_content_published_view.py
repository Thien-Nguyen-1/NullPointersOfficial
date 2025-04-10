# from rest_framework.test import APITestCase
# from django.urls import reverse
# from django.contrib.auth import get_user_model
# from returnToWork.models import Module
# from rest_framework import status

# User = get_user_model()

# class ContentPublishViewTests(APITestCase):

#     def setUp(self):
#         self.user = User.objects.create_user(
#             username='testuser', 
#             email='user@example.com', 
#             password='testpass123'
#         )

#         self.default_user = User.objects.create_user(
#             username='default_user', 
#             email='default@example.com', 
#             password='defaultpass'
#         )

#         self.url = reverse('publish-module') 

#         self.valid_data = {
#             'title': 'New Module',
#             'description': 'Module description here',
#             'elements': [
#             {   'type': 'Ranking Question',
#                 'title': 'Rank your preference',
#                 'data': ['Option 1', 'Option 2']
#             },
#             {   'type': 'Embedded Video',
#                 'title': 'Intro video',
#                 'data': 'https://www.youtube.com/watch?v=12345'
#             }
#         ]
#         }

#     def test_publish_module_authenticated_user(self):
#         self.client.force_authenticate(user=self.user)

#         response = self.client.post(self.url, data=self.valid_data, format='json')

#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data['message'], 'Module published successfully')

#         module_id = response.data['module_id']
#         module = Module.objects.get(id=module_id)

#         self.assertEqual(module.title, self.valid_data['title'])

#     def test_publish_module_unauthenticated_user(self):
#         response = self.client.post(self.url, data=self.valid_data, format='json')

#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data['message'], 'Module published successfully')

#         module_id = response.data['module_id']
#         module = Module.objects.get(id=module_id)

#         self.assertEqual(module.title, self.valid_data['title'])


# pinned and upvotes in serialzier - unexpected key word