from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from returnToWork.models import Task, QuizQuestion, UserResponse, Module
from uuid import uuid4

User = get_user_model()

class TaskPdfViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe", 
            password="password123"
        )
        self.client.force_authenticate(user=self.user)  
        self.module = Module.objects.create(
            title = "Test modeule",
            description = "test modeule example"
        )
        self.task = Task.objects.create(
            title="Example Task", 
            contentID=uuid4(),
            author = self.user,
            moduleID = self.module,
            text_content = "task content"
        )
        self.question = QuizQuestion.objects.create(
            task=self.task, 
            question_text="How are you?"
        )
        self.response = UserResponse.objects.create(
            user=self.user,
            question=self.question,
            response_text="Good"
        )

    def test_valid_pdf_for_completed_task(self):
        url = f"/api/download-completed-task/{self.task.contentID}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("Content-Disposition", response)
        self.assertTrue(response["Content-Disposition"].startswith("attachment;"))

    def test_task_not_found(self):
        fake_uuid = uuid4()
        url = f"/api/download-completed-task/{fake_uuid}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "Task not found")

    def test_if_task_has_no_questions(self):
        task_no_questions = Task.objects.create(
            title="Empty Task", 
            contentID=uuid4(),
            author=self.user, 
            moduleID = self.module,
            text_content = "empty"    
        )
        url = f"/api/download-completed-task/{task_no_questions.contentID}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "No questions found for this task")

    def test_if_missing_user_response(self):
        UserResponse.objects.all().delete()
        url = f"/api/download-completed-task/{self.task.contentID}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
