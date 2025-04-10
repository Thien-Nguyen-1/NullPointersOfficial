from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from returnToWork.models import Task, QuizQuestion, UserResponse, Module
import uuid

User = get_user_model()

class QuizUserResponsesViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='testpass123'
        )
        self.admin = User.objects.create_user(
            username='admin', 
            email='admin@example.com', 
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        self.module = Module.objects.create(
        title='Test Module', 
        description='Test module description')

        self.task = Task.objects.create(
            contentID=uuid.uuid4(),
            title='Sample Quiz Task',
            description='Test quiz description.',
            author = self.admin,
            moduleID = self.module
        )
        self.question1 = QuizQuestion.objects.create(
            task=self.task, question_text='Question 1'
        )
        self.question2 = QuizQuestion.objects.create(
            task=self.task, question_text='Question 2'
        )

        UserResponse.objects.create(
            user=self.user, question=self.question1, response_text='Answer to Q1'
        )
        UserResponse.objects.create(
            user=self.user, question=self.question2, response_text='Answer to Q2'
        )

    def test_quiz_user_responses_success(self):
        url = reverse('quiz-user-responses', args=[str(self.task.contentID)])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_quiz_user_responses_invalid_uuid(self):
        url = reverse('quiz-user-responses', args=['invalid-uuid'])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {'error': 'Quiz not found or invalid ID format'})

    def test_quiz_user_responses_task_not_found(self):
        random_uuid = uuid.uuid4()
        url = reverse('quiz-user-responses', args=[str(random_uuid)])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {'error': 'Quiz not found or invalid ID format'})

    def test_quiz_user_responses_no_responses(self):
        other_user = User.objects.create_user(
            username='otheruser', 
            email='other@example.com', 
            password='otherpass'
        )
        self.client.force_authenticate(user=other_user)
        url = reverse('quiz-user-responses', args=[str(self.task.contentID)])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            'task_id': str(self.task.contentID),
            'answers': {}
        })
