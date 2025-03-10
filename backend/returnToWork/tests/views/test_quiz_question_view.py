from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from returnToWork.models import User, Task, QuizQuestion, Module
import uuid

class QuizQuestionViewTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='@testuser',
            email='test@example.com',
            password='testpassword123',
            first_name='Test',
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
            title='Test Quiz',
            description='A test quiz description',
            quiz_type='text_input',
            author=self.user,
            moduleID=self.module
        )
        
        # Create another task for testing task updates
        self.another_task = Task.objects.create(
            title='Another Test Quiz',
            description='Another test quiz description',
            quiz_type='text_input',
            author=self.user,
            moduleID=self.module
        )
        
        # Create a test question
        self.question = QuizQuestion.objects.create(
            task=self.task,
            question_text='What is your opinion on this topic?',
            hint_text='Share your thoughts',
            order=1
        )
        
        # Create additional questions for ordering tests
        self.question2 = QuizQuestion.objects.create(
            task=self.task,
            question_text='How would you implement this in practice?',
            hint_text='Be specific',
            order=2
        )
        
        self.question3 = QuizQuestion.objects.create(
            task=self.task,
            question_text='What are potential challenges?',
            hint_text='Consider constraints',
            order=3
        )
        
        # Set up the client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    # POST tests - Creating and Updating questions
    
    def test_create_question_success(self):
        """Test successful creation of a new question"""
        data = {
            'task_id': str(self.task.contentID),
            'question_text': 'What are the advantages of this approach?',
            'hint_text': 'Think about efficiency and effectiveness',
            'order': 4
        }
        
        url = reverse('quiz_questions')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['text'], data['question_text'])
        self.assertEqual(response.data['hint'], data['hint_text'])
        self.assertEqual(response.data['order'], data['order'])
        
        # Verify question was created in database
        new_question_id = response.data['id']
        self.assertTrue(QuizQuestion.objects.filter(id=new_question_id).exists())
    
    def test_create_question_missing_fields(self):
        """Test creation fails when required fields are missing"""
        # Missing question_text
        data1 = {
            'task_id': str(self.task.contentID),
            'hint_text': 'Think about efficiency',
            'order': 4
        }
        
        url = reverse('quiz_questions')
        response = self.client.post(url, data1, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Task ID and question text are required')
        
        # Missing task_id
        data2 = {
            'question_text': 'What are the advantages?',
            'hint_text': 'Think about efficiency',
            'order': 4
        }
        
        response = self.client.post(url, data2, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Task ID and question text are required')
    
    def test_create_question_nonexistent_task(self):
        """Test creation fails when task doesn't exist"""
        data = {
            'task_id': str(uuid.uuid4()),  # Random non-existent UUID
            'question_text': 'What are the advantages?',
            'hint_text': 'Think about efficiency',
            'order': 4
        }
        
        url = reverse('quiz_questions')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Task not found')
    
    def test_update_question_success(self):
        """Test successful update of an existing question"""
        data = {
            'task_id': str(self.task.contentID),
            'question_text': 'Updated question text',
            'hint_text': 'Updated hint text',
            'order': 10
        }
        
        url = reverse('quiz_question_detail', args=[self.question.id])
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['text'], data['question_text'])
        self.assertEqual(response.data['hint'], data['hint_text'])
        self.assertEqual(response.data['order'], data['order'])
        
        # Verify question was updated in database
        updated_question = QuizQuestion.objects.get(id=self.question.id)
        self.assertEqual(updated_question.question_text, data['question_text'])
        self.assertEqual(updated_question.hint_text, data['hint_text'])
        self.assertEqual(updated_question.order, data['order'])
    
    def test_update_question_change_task(self):
        """Test updating a question to belong to a different task"""
        data = {
            'task_id': str(self.another_task.contentID),
            'question_text': 'Updated question for different task',
            'hint_text': 'Updated hint',
            'order': 1
        }
        
        url = reverse('quiz_question_detail', args=[self.question.id])
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify question was updated to new task
        updated_question = QuizQuestion.objects.get(id=self.question.id)
        self.assertEqual(updated_question.task.contentID, self.another_task.contentID)
    
    def test_update_nonexistent_question(self):
        """Test updating a question that doesn't exist"""
        data = {
            'task_id': str(self.task.contentID),
            'question_text': 'Updated question text',
            'hint_text': 'Updated hint',
            'order': 1
        }
        
        url = reverse('quiz_question_detail', args=[9999])  # Non-existent ID
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Question not found')
        
    def test_update_question_missing_task_id(self):
        """Test updating a question with missing task_id (covers lines 387-393)"""
        data = {
            # No task_id provided
            'question_text': 'Updated question text',
            'hint_text': 'Updated hint text',
            'order': 10
        }
        
        url = reverse('quiz_question_detail', args=[self.question.id])
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Task ID and question text are required')
    
    def test_update_question_missing_question_text(self):
        """Test updating a question with missing question_text (covers lines 387-393)"""
        data = {
            'task_id': str(self.task.contentID),
            # No question_text provided
            'hint_text': 'Updated hint text',
            'order': 10
        }
        
        url = reverse('quiz_question_detail', args=[self.question.id])
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Task ID and question text are required')
    
    def test_update_question_nonexistent_task(self):
        """Test updating a question with non-existent task_id (covers lines 396-403)"""
        data = {
            'task_id': str(uuid.uuid4()),  # Random non-existent UUID
            'question_text': 'Updated question text',
            'hint_text': 'Updated hint text',
            'order': 10
        }
        
        url = reverse('quiz_question_detail', args=[self.question.id])
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Task not found')
    
    # GET tests - Retrieving questions
    
    def test_get_specific_question(self):
        """Test retrieving a specific question by ID"""
        url = reverse('quiz_question_detail', args=[self.question.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.question.id)
        self.assertEqual(response.data['text'], self.question.question_text)
        self.assertEqual(response.data['hint'], self.question.hint_text)
        self.assertEqual(response.data['order'], self.question.order)
        self.assertEqual(response.data['task_id'], str(self.task.contentID))
    
    def test_get_nonexistent_question(self):
        """Test retrieving a question that doesn't exist"""
        url = reverse('quiz_question_detail', args=[9999])  # Non-existent ID
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_list_questions_for_task(self):
        """Test listing all questions for a specific task"""
        url = reverse('quiz_questions')
        response = self.client.get(f"{url}?task_id={str(self.task.contentID)}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # 3 questions for the task
        
        # Verify questions are in correct order
        self.assertEqual(response.data[0]['id'], self.question.id)
        self.assertEqual(response.data[1]['id'], self.question2.id)
        self.assertEqual(response.data[2]['id'], self.question3.id)
    
    def test_list_questions_missing_task_id(self):
        """Test listing questions without providing task_id"""
        url = reverse('quiz_questions')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'task_id parameter is required')
    
    def test_list_questions_nonexistent_task(self):
        """Test listing questions for a task that doesn't exist"""
        url = reverse('quiz_questions')
        response = self.client.get(f"{url}?task_id={str(uuid.uuid4())}")  # Random UUID
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_list_questions_empty_task(self):
        """Test listing questions for a task with no questions"""
        # Create a new task with no questions
        empty_task = Task.objects.create(
            title='Empty Quiz',
            description='A quiz with no questions',
            quiz_type='text_input',
            author=self.user,
            moduleID=self.module
        )
        
        url = reverse('quiz_questions')
        response = self.client.get(f"{url}?task_id={str(empty_task.contentID)}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Empty list
    
    # DELETE tests
    
    def test_delete_question_success(self):
        """Test successful deletion of a question"""
        url = reverse('quiz_question_detail', args=[self.question.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify question was deleted from database
        self.assertFalse(QuizQuestion.objects.filter(id=self.question.id).exists())
    
    def test_delete_nonexistent_question(self):
        """Test deleting a question that doesn't exist"""
        url = reverse('quiz_question_detail', args=[9999])  # Non-existent ID
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Question not found')