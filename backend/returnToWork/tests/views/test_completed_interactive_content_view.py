from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from returnToWork.models import Task, Module, ContentProgress
from uuid import uuid4

User = get_user_model()

class CompletedInteractiveContentViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="@johndoe",
            password="password123",
            user_type="service user"
        )
        self.client.force_authenticate(user=self.user)

        self.module = Module.objects.create(
            title="Test Module",
            description="A test module"
        )

        self.task = Task.objects.create(
            title="Test Task",
            contentID=uuid4(),
            author=self.user,
            moduleID=self.module,
            text_content="Sample content",
            quiz_type="text_input"
        )

        self.content_type = ContentType.objects.get_for_model(Task)
        
        self.viewed_task = ContentProgress.objects.create(
            user=self.user,
            content_type=self.content_type,
            object_id=self.task.contentID,
            viewed=True
        )

    def test_returns_completed_interactive_tasks(self):
        url = "/api/completed-interactive-content/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        task_data = response.data[0]
        self.assertEqual(task_data["content_id"], str(self.task.contentID))
        self.assertEqual(task_data["title"], self.task.title)
        self.assertEqual(task_data["quiz_type"], self.task.get_quiz_type_display())
        self.assertEqual(task_data["module_title"], self.module.title)

    def test_skips_invalid_content_object(self):
        broken_content_id = uuid4()  
        ContentProgress.objects.create(
            user=self.user,
            content_type=self.content_type,
            object_id=broken_content_id,
            viewed=True
        )

        url = "/api/completed-interactive-content/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["content_id"], str(self.task.contentID))
