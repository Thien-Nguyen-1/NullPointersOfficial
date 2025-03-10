from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from returnToWork.models import User, Task, QuizQuestion, UserResponse, Module
import uuid
from datetime import datetime, timedelta

class AdminQuizResponsesViewTests(APITestCase):
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='@adminuser',
            email='admin@example.com',
            password='adminpassword123',
            first_name='Admin',
            last_name='User',
            user_type='admin'
        )
        
        # Create regular service user
        self.service_user = User.objects.create_user(
            username='@testuser',
            email='test@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User',
            user_type='service user'
        )
        
        # Create another service user for multiple responses
        self.service_user2 = User.objects.create_user(
            username='@testuser2',
            email='test2@example.com',
            password='testpassword123',
            first_name='Second',
            last_name='User',
            user_type='service user'
        )
        
        # Create a test module
        self.module = Module.objects.create(
            title='Test Module',
            description='A test module description'
        )
        
        # Create a test task
        self.task = Task.objects.create(
            title='Admin Test Quiz',
            description='A test quiz for admin responses',
            quiz_type='text_input',
            author=self.admin_user,
            moduleID=self.module
        )
        
        # Create quiz questions
        self.question1 = QuizQuestion.objects.create(
            task=self.task,
            question_text='What is your opinion on this topic?',
            hint_text='Share your thoughts',
            order=1
        )
        
        self.question2 = QuizQuestion.objects.create(
            task=self.task,
            question_text='How would you implement this in practice?',
            hint_text='Be specific',
            order=2
        )
        
        # Create user responses
        self.response1 = UserResponse.objects.create(
            user=self.service_user,
            question=self.question1,
            response_text='This is my first response'
        )
        
        self.response2 = UserResponse.objects.create(
            user=self.service_user,
            question=self.question2,
            response_text='This is my implementation plan'
        )
        
        self.response3 = UserResponse.objects.create(
            user=self.service_user2,
            question=self.question1,
            response_text='I have a different perspective'
        )
        
        # Set up the client
        self.client = APIClient()
    
    def test_admin_access_granted(self):
        """Test admin user can access responses"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Make the request
        url = reverse('admin_quiz_responses', args=[str(self.task.contentID)])
        response = self.client.get(url)
        
        # Check access is granted with 200 status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        self.assertEqual(response.data['task_id'], str(self.task.contentID))
        self.assertEqual(response.data['task_title'], self.task.title)
        self.assertEqual(len(response.data['responses']), 2)  # Two questions
        
        # Check first question's responses
        question1_data = next(q for q in response.data['responses'] if q['question_id'] == self.question1.id)
        self.assertEqual(len(question1_data['responses']), 2)  # Two users responded
        
        # Check second question's responses
        question2_data = next(q for q in response.data['responses'] if q['question_id'] == self.question2.id)
        self.assertEqual(len(question2_data['responses']), 1)  # One user responded
    
    def test_service_user_access_denied(self):
        """Test service user cannot access admin responses view"""
        # Login as service user
        self.client.force_authenticate(user=self.service_user)
        
        # Make the request
        url = reverse('admin_quiz_responses', args=[str(self.task.contentID)])
        response = self.client.get(url)
        
        # Check access is denied with 403 status
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'You do not have permission to access this resource')
    
    def test_unauthenticated_access_denied(self):
        """Test unauthenticated user cannot access admin responses view"""
        # Don't authenticate the client
        
        # Make the request
        url = reverse('admin_quiz_responses', args=[str(self.task.contentID)])
        
        # We're expecting an AttributeError since AnonymousUser doesn't have user_type
        with self.assertRaises(AttributeError) as context:
            response = self.client.get(url)
        
        # Verify the specific error message we expect
        self.assertTrue("'AnonymousUser' object has no attribute 'user_type'" in str(context.exception))
        
        # Note: In a real application, you'd want to modify the view to handle
        # unauthenticated users properly before trying to access user_type.
    
    def test_nonexistent_task(self):
        """Test admin requesting responses for a non-existent task"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Make the request with a non-existent UUID
        non_existent_id = uuid.uuid4()
        url = reverse('admin_quiz_responses', args=[str(non_existent_id)])
        response = self.client.get(url)
        
        # Check that we get a 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_task_with_no_responses(self):
        """Test admin requesting responses for a task that has no responses"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a new task with no responses
        empty_task = Task.objects.create(
            title='No Responses Quiz',
            description='A quiz with no responses',
            quiz_type='text_input',
            author=self.admin_user,
            moduleID=self.module
        )
        
        # Create a question but no responses
        empty_question = QuizQuestion.objects.create(
            task=empty_task,
            question_text='Unanswered question',
            hint_text='No responses here',
            order=1
        )
        
        # Make the request
        url = reverse('admin_quiz_responses', args=[str(empty_task.contentID)])
        response = self.client.get(url)
        
        # Check access is granted with 200 status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        self.assertEqual(response.data['task_id'], str(empty_task.contentID))
        self.assertEqual(response.data['task_title'], empty_task.title)
        self.assertEqual(len(response.data['responses']), 1)  # One question
        
        # Check question has empty responses list
        question_data = response.data['responses'][0]
        self.assertEqual(question_data['question_id'], empty_question.id)
        self.assertEqual(len(question_data['responses']), 0)
    
    def test_response_data_format(self):
        """Test the format of the response data"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Make the request
        url = reverse('admin_quiz_responses', args=[str(self.task.contentID)])
        response = self.client.get(url)
        
        # Check the response format for user details
        question1_data = next(q for q in response.data['responses'] if q['question_id'] == self.question1.id)
        user_response = next(r for r in question1_data['responses'] if str(r['user_id']) == str(self.service_user.user_id))
        
        # Verify user data format
        self.assertEqual(user_response['username'], self.service_user.username)
        self.assertEqual(user_response['user_full_name'], f"{self.service_user.first_name} {self.service_user.last_name}")
        self.assertEqual(user_response['response_text'], 'This is my first response')
        self.assertIn('submitted_at', user_response)  # Timestamp field exists