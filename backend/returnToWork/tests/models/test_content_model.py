from django.test import TestCase
from django.contrib.auth import get_user_model
from uuid import UUID
from returnToWork.models import InfoSheet, Video, Task  # Import your models
from returnToWork.models import Module  # Assuming there is a Module model
from django.core.files.uploadedfile import SimpleUploadedFile
import uuid


User = get_user_model()


class ContentModelTests(TestCase):

    def setUp(self):
        """Set up test dependencies"""
        self.user = User.objects.create_user(username="testuser", password="password123")
        self.module = Module.objects.create(title="Test Module", description="A test module")

    def test_content_uuid_auto_generated(self):
        """Ensure UUID is auto-generated and unique for Content objects"""
        task1 = Task.objects.create(title="Task 1", moduleID=self.module, author=self.user, text_content="Content")
        task2 = Task.objects.create(title="Task 2", moduleID=self.module, author=self.user, text_content="Content")

        self.assertNotEqual(task1.contentID, task2.contentID)
        self.assertIsInstance(task1.contentID, uuid.UUID)

    def test_content_default_values(self):
        """Check that default values are properly set"""
        infosheet = InfoSheet.objects.create(title="Default Test", moduleID=self.module, author=self.user)

        self.assertFalse(infosheet.is_published)  # Default is False
        self.assertIsNotNone(infosheet.created_at)
        self.assertIsNotNone(infosheet.updated_at)

    def test_create_infosheet(self):
        """Test creating an InfoSheet object"""
        infosheet = InfoSheet.objects.create(
            title="Test InfoSheet",
            moduleID=self.module,
            author=self.user,
            description="This is a test infosheet",
            is_published=True,
            infosheet_file=SimpleUploadedFile("infosheet.pdf", b"file_content"),
            infosheet_content="Infosheet content"
        )

        self.assertEqual(infosheet.title, "Test InfoSheet")
        self.assertEqual(infosheet.author, self.user)
        self.assertEqual(infosheet.infosheet_content, "Infosheet content")
        self.assertEqual(str(infosheet), "Test InfoSheet")

    def test_create_video(self):
        """Test creating a Video object"""
        video = Video.objects.create(
            title="Test Video",
            moduleID=self.module,
            author=self.user,
            description="This is a test video",
            is_published=False,
            video_file=SimpleUploadedFile("video.mp4", b"video_content"),
            duration=120
        )

        self.assertEqual(video.title, "Test Video")
        self.assertEqual(video.duration, 120)
        self.assertFalse(video.is_published)
        self.assertEqual(str(video), "Test Video")

    def test_create_task(self):
        """Test creating a Task object"""
        task = Task.objects.create(
            title="Test Task",
            moduleID=self.module,
            author=self.user,
            description="This is a test task",
            is_published=True,
            text_content="Task content here"
        )

        self.assertEqual(task.text_content, "Task content here")
        self.assertTrue(task.is_published)
        self.assertEqual(str(task), "Test Task")

    def test_foreign_key_relationships(self):
        """Check that Content instances are properly linked to Module and User"""
        video = Video.objects.create(title="Linked Video", moduleID=self.module, author=self.user, duration=100)

        self.assertEqual(video.moduleID, self.module)
        self.assertEqual(video.author, self.user)
        self.assertIn(video, self.module.video_contents.all())  # Reverse lookup


    def test_blank_and_null_constraints(self):
        """Ensure fields accept blank/null where applicable"""
        infosheet = InfoSheet.objects.create(title="Blank Test", moduleID=self.module, author=self.user)

        self.assertIsNone(infosheet.description)
        self.assertIsNone(infosheet.infosheet_content)