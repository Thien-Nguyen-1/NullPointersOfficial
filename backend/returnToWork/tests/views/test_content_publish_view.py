# from django.test import TestCase
# from django.urls import reverse
# from rest_framework.test import APIClient, APITestCase
# from rest_framework import status
# from django.contrib.auth import get_user_model
# from returnToWork.models import (Module, RankingQuestion, AudioClip, Document, EmbeddedVideo, User, Tags)
# from returnToWork.serializers import (RankingQuestionSerializer,  AudioClipSerializer,DocumentSerializer, EmbeddedVideoSerializer)
# import json
# from django.core.files.uploadedfile import SimpleUploadedFile


# class ContentPublishViewTest(APITestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.url = reverse('publish-module')
#         self.user = User.objects.create(username="@user1", first_name="John", last_name="Doe",user_type="service user",email = "ex@example.org")
#         self.client.force_authenticate(user=self.user)

#         # Create a default user for unauthenticated requests
#         self.default_user = User.objects.create_user(username="default_user", password="defaultpass",email = "defaul@example.org")

#     def test_publish_module_authenticated(self):
#         """Test publishing a module as an authenticated user"""
#         data = {
#             'title': 'Test Module',
#             'description': 'Test Description',
#             'elements': [
#                 {
#                     'type': 'Ranking Question',
#                     'title': 'Test Ranking',
#                     'data': ['Tier 1', 'Tier 2', 'Tier 3']
#                 }
#             ]
#         }

#         response = self.client.post(self.url, data, format='json')
#         self.assertEqual(response.status_code, status.HTTP_201_CREATED)
#         self.assertIn('module_id', response.data)
#         self.assertIn('message', response.data)
#         self.assertEqual(Module.objects.count(), 1)

#     def test_publish_module_unauthenticated(self):
#         """Test publishing a module as an unauthenticated user"""
#         self.client.force_authenticate(user=None)

#         data = {
#             'title': 'Test Module Unauth',
#             'description': 'Test Description',
#             'elements': [
#                 {
#                     'type': 'Ranking Question',
#                     'title': 'Test Ranking',
#                     'data': ['Tier 1', 'Tier 2', 'Tier 3']
#                 }
#             ]
#         }

#         response = self.client.post(self.url, data, format='json')
#         self.assertEqual(response.status_code, status.HTTP_201_CREATED)

#         # Verify the module was created with the default user
#         module = Module.objects.last()
#         ranking_question = RankingQuestion.objects.filter(moduleID=module).last()
#         self.assertEqual(ranking_question.author, self.default_user)
        
#     def test_publish_invalid_data(self):
#         """Test publishing with invalid data"""
#         data = {
#             'title': '',  # Empty title
#             'elements': []
#         }

#         response = self.client.post(self.url, data, format='json')
#         self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)