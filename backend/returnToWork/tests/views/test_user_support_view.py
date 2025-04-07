from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from returnToWork.models import Conversation  # adjust to your actual import path
from django.utils import timezone

User = get_user_model()

class UserSupportViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

      
        self.service_user = User.objects.create_user(username='serviceuser', password='password123', user_type='service user', email='test@gmail.com')

        self.admin_user = User.objects.create_user(username='adminuser', password='password123', user_type='admin', email='test2@gmail.com')

        self.client.force_authenticate(user=self.service_user)

        self.url_ = reverse('user-support-view')

    def test_get_conversations_as_service_user(self):
   
        Conversation.objects.create(user=self.service_user)

        response = self.client.get(self.url_)  
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

    def test_post_conversation_service_user_under_limit(self):
        response = self.client.post(self.url_, {}) 
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Conversation.objects.filter(user=self.service_user).count(), 1)

    def test_post_conversation_service_user_over_limit(self):
       
        for _ in range(5):
            Conversation.objects.create(user=self.service_user)

        response = self.client.post(self.url_, {})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_post_conversation_admin_claims_conversation(self):
        self.client.force_authenticate(user=self.admin_user)
        conv = Conversation.objects.create(user=self.service_user)

        data = {
            "conversation_id": conv.id
        }

        response = self.client.post(self.url_, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        conv.refresh_from_db()
        self.assertTrue(conv.hasEngaged)
        self.assertEqual(conv.admin, self.admin_user)

    def test_post_conversation_admin_already_claimed(self):
        self.client.force_authenticate(user=self.admin_user)
        conv = Conversation.objects.create(user=self.service_user, hasEngaged=True, admin=self.admin_user)

        data = {
            "conversation_id": conv.id
        }

        response = self.client.post(self.url_, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_conversation(self):
        conv = Conversation.objects.create(user=self.service_user)

        data = {
            "conversation_id": conv.id
        }

        response = self.client.delete(self.url_, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Conversation.objects.filter(id=conv.id).exists())

    def test_delete_conversation_not_found(self):
        data = {
            "conversation_id": 9999
        }

        response = self.client.delete(self.url_, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    # def test_get_conversation_user_conversation_not_found(self):
        
    #      Conversation.objects.all().delete()
    
    #      data = {
    #             "conversation_id": 99999  
    #      }

    #      response = self.client.get(self.url_, data)
    #      self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    #      self.assertEqual(response.data["message"],  "Unable to source user conversation")

    def test_post_conversation_admin_conversation_not_found(self):
         self.client.force_authenticate(user=self.admin_user)
    
         data = {
                "conversation_id": 99999
         }

         response = self.client.post(self.url_, data)
         self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
         self.assertEqual(response.data["message"], "Conversation NOT found")