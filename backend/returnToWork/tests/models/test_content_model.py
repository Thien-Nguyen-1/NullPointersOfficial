from django.test import TestCase
from django.contrib.auth import get_user_model
from uuid import UUID
from returnToWork.models import InfoSheet, Video, Task, QuizQuestion, UserResponse
from returnToWork.models import RankingQuestion, Document, AudioClip, InlinePicture, EmbeddedVideo, Module, Content
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
import uuid
import time


User = get_user_model()


class ContentModelTests(TestCase):

    def setUp(self):
        """Set up test dependencies"""
        self.user = User.objects.create_user(
            username="@testuser",
            password="password123",
            first_name="Test",
            last_name="User",
            user_type="service user"
        )
        self.module = Module.objects.create(title="Test Module", description="A test module")

        # Create a task to use in the QuizQuestion and UserResponse tests
        self.task = Task.objects.create(
            title="Test Task",
            moduleID=self.module,
            author=self.user,
            description="A test task description",
            text_content="Test task content"
        )

    def test_content_model_abstract(self):
        """
        Test that Content model is abstract and cannot be instantiated
        """
        # Check if Content.objects.create raises AttributeError
        with self.assertRaises(AttributeError):
            Content.objects.create(
                title='Test Content',
                moduleID=self.module,
                author=self.user
            )

        # Alternative test - check if Content._meta.abstract is True
        self.assertTrue(Content._meta.abstract)

    def test_ranking_question_creation(self):
        """
        Test RankingQuestion model creation
        """
        ranking_question = RankingQuestion.objects.create(
            title='Test Ranking Question',
            moduleID=self.module,
            author=self.user,
            description='Ranking question description',
            tiers=['Anxiety', 'Stress', 'Panic']
        )

        self.assertEqual(ranking_question.title, 'Test Ranking Question')
        self.assertEqual(ranking_question.moduleID, self.module)
        self.assertEqual(ranking_question.author, self.user)
        self.assertEqual(ranking_question.tiers, ['Anxiety', 'Stress', 'Panic'])
        self.assertFalse(ranking_question.is_published)
        self.assertIsInstance(ranking_question.contentID, uuid.UUID)

    def test_inline_picture_creation(self):
        """
        Test InlinePicture model creation
        """
        # Create a test image file
        test_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'',
            content_type='image/jpeg'
        )

        inline_picture = InlinePicture.objects.create(
            title='Test Inline Picture',
            moduleID=self.module,
            author=self.user,
            description='Inline picture description',
            image_file=test_image
        )

        self.assertEqual(inline_picture.title, 'Test Inline Picture')
        self.assertEqual(inline_picture.moduleID, self.module)
        self.assertEqual(inline_picture.author, self.user)
        self.assertTrue(inline_picture.image_file.name.startswith('inline_pictures/'))
        self.assertFalse(inline_picture.is_published)

    # def test_audio_clip_creation(self):
    #     """
    #     Test AudioClip model creation
    #     """
    #     # Create a test audio file
    #     test_audio = SimpleUploadedFile(
    #         name='test_audio.mp3',
    #         content=b'',
    #         content_type='audio/mpeg'
    #     )

    #     audio_clip = AudioClip.objects.create(
    #         title='Test Audio Clip',
    #         moduleID=self.module,
    #         author=self.user,
    #         description='Audio clip description',
    #         audio_file=test_audio
    #     )

    #     self.assertEqual(audio_clip.title, 'Test Audio Clip')
    #     self.assertEqual(audio_clip.moduleID, self.module)
    #     self.assertEqual(audio_clip.author, self.user)
    #     self.assertTrue(audio_clip.audio_file.name.startswith('audio_clips/'))
    #     self.assertFalse(audio_clip.is_published)

    def test_document_creation(self):
        """
        Test Document model creation
        """
        documents = [
            {
                'name': 'document1.pdf',
                'title': 'First Document',
                'url': 'http://example.com/doc1.pdf',
                'fileType': 'pdf'
            },
            {
                'name': 'document2.docx',
                'title': 'Second Document',
                'url': 'http://example.com/doc2.docx',
                'fileType': 'docx'
            }
        ]

        document = Document.objects.create(
            title='Test Document Collection',
            moduleID=self.module,
            author=self.user,
            description='Document collection description',
            documents=documents
        )

        self.assertEqual(document.title, 'Test Document Collection')
        self.assertEqual(document.description, 'Document collection description')

        self.assertEqual(document.moduleID, self.module)
        self.assertEqual(document.author, self.user)
        self.assertEqual(document.documents, documents)
        self.assertFalse(document.is_published)

    def test_embedded_video_creation(self):
        """
        Test EmbeddedVideo model creation
        """
        embedded_video = EmbeddedVideo.objects.create(
            title='Test Embedded Video',
            moduleID=self.module,
            author=self.user,
            description='Embedded video description',
            video_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        )

        self.assertEqual(embedded_video.title, 'Test Embedded Video')
        self.assertEqual(embedded_video.moduleID, self.module)
        self.assertEqual(embedded_video.author, self.user)
        self.assertEqual(embedded_video.video_url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        self.assertFalse(embedded_video.is_published)

    def test_content_string_representation(self):
        """
        Test string representation of content models
        """
        ranking_question = RankingQuestion.objects.create(
            title='Ranking Question',
            moduleID=self.module,
            author=self.user,
            tiers=['Tier 1', 'Tier 2']
        )

        self.assertEqual(str(ranking_question), 'Ranking Question')

    def test_content_created_at_updated_at(self):
        """
        Test automatic creation and update timestamps
        """
        ranking_question = RankingQuestion.objects.create(
            title='Time Check Question',
            moduleID=self.module,
            author=self.user,
            tiers=['Tier 1', 'Tier 2']
        )

        # Check created_at is set
        self.assertIsNotNone(ranking_question.created_at)
        self.assertIsInstance(ranking_question.created_at, timezone.datetime)

        # Store initial timestamps
        initial_created_at = ranking_question.created_at
        initial_updated_at = ranking_question.updated_at

        # Wait a moment and update
        time.sleep(0.1)
        ranking_question.title = 'Updated Question'
        ranking_question.save()

        # Refresh the object from the database
        ranking_question.refresh_from_db()

        # Check updated_at changed
        self.assertEqual(ranking_question.created_at, initial_created_at)
        self.assertGreater(ranking_question.updated_at, initial_updated_at)

    def test_publishing_content(self):
        """
        Test publishing content
        """
        ranking_question = RankingQuestion.objects.create(
            title='Unpublished Question',
            moduleID=self.module,
            author=self.user,
            tiers=['Tier 1', 'Tier 2']
        )

        self.assertFalse(ranking_question.is_published)

        ranking_question.is_published = True
        ranking_question.save()

        self.assertTrue(ranking_question.is_published)
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
        # Updated assertion to match the current __str__ implementation which includes quiz type
        self.assertEqual(str(task), "Test Task (Text Input Quiz)")

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

    def test_quizquestion_str_method(self):
        """Test the string representation of QuizQuestion"""
        question = QuizQuestion.objects.create(
            task=self.task,
            question_text="This is a long question text that will be truncated in the string representation",
            hint_text="Some hint",
            order=1
        )
        # The actual implementation truncates to exactly what's returned, so we match that
        self.assertEqual(str(question), "This is a long question text t...")

    def test_userresponse_str_method(self):
        """Test the string representation of UserResponse"""
        question = QuizQuestion.objects.create(
            task=self.task,
            question_text="Test question",
            order=1
        )
        response = UserResponse.objects.create(
            user=self.user,
            question=question,
            response_text="My response"
        )
        expected_str = f"Response by {self.user.username} for {question}"
        self.assertEqual(str(response), expected_str)