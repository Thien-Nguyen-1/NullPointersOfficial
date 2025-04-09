from django.test import TestCase
from django.contrib.auth import get_user_model
from uuid import UUID
from returnToWork.models import (
    Task, QuizQuestion, UserResponse, RankingQuestion, 
    Document, AudioClip, Image, EmbeddedVideo, Module, Content
)
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
import uuid
import time
import os


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

    def test_image_creation(self):
        """
        Test Image model creation
        """
        # Create a test image file
        test_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'',
            content_type='image/jpeg'
        )

        image = Image.objects.create(
            title='Test Image',
            moduleID=self.module,
            author=self.user,
            description='Image description',
            file_url='/test/image.jpg',
            filename='test_image.jpg',
            file_size=1024,
            file_type='jpg',
            width=800,
            height=600
        )

        self.assertEqual(image.title, 'Test Image')
        self.assertEqual(image.moduleID, self.module)
        self.assertEqual(image.author, self.user)
        self.assertEqual(image.filename, 'test_image.jpg')
        self.assertEqual(image.width, 800)
        self.assertEqual(image.height, 600)
        self.assertFalse(image.is_published)

    def test_audio_clip_model_methods(self):
        """
        Test AudioClip model's methods including __str__, file_url, file_size_formatted, and delete
        """
        test_audio = SimpleUploadedFile(
            name='test_audio.mp3',
            content=b'x' * 3072,  # 3KB audio file for testing size formatting
            content_type='audio/mpeg'
        )
        
        audio_clip = AudioClip.objects.create(
            title='Test Audio',
            moduleID=self.module,
            author=self.user,
            description='Test audio clip methods',
            audio_file=test_audio,
            filename='test_audio.mp3',
            file_type='mp3',
            file_size=3072,
            duration=180.5
        )
        
        self.assertEqual(str(audio_clip), 'Test Audio')
        
        # Test __str__ with no title but with filename
        audio_clip.title = ''
        audio_clip.save()
        self.assertEqual(str(audio_clip), 'test_audio.mp3')
        
        # Test __str__ with no title and no filename (falls back to "Audio Clip")
        audio_clip.filename = ''
        audio_clip.save()
        self.assertEqual(str(audio_clip), 'Audio Clip')
        
        # Restore title for other tests
        audio_clip.title = 'Test Audio'
        audio_clip.save()
        
        # Test file_url property
        if hasattr(audio_clip, 'file_url'):
            self.assertIsInstance(audio_clip.file_url, str)
        
        # Test file_size_formatted property
        if hasattr(audio_clip, 'file_size_formatted'):
            self.assertEqual(audio_clip.file_size_formatted, '3.00 KB')
            audio_clip.file_size = None
            audio_clip.save()
            self.assertIsNone(audio_clip.file_size_formatted)
            audio_clip.file_size = 500  # Bytes
            audio_clip.save()
            self.assertEqual(audio_clip.file_size_formatted, '500.00 B')
            
            audio_clip.file_size = 1500000  # ~1.5 MB
            audio_clip.save()
            self.assertEqual(audio_clip.file_size_formatted, '1.43 MB')
            
            audio_clip.file_size = 2500000000  # ~2.5 GB
            audio_clip.save()
            self.assertEqual(audio_clip.file_size_formatted, '2.33 GB')
        
        # Test delete method (clean up files)
        if hasattr(audio_clip, 'audio_file') and audio_clip.audio_file:
            file_path = audio_clip.audio_file.path
            if os.path.exists(file_path):
                audio_clip.delete()
                self.assertFalse(os.path.exists(file_path))
                
        # Test creating without audio file
        empty_audio = AudioClip.objects.create(
            title='Empty Audio',
            moduleID=self.module,
            author=self.user
        )
        
        if hasattr(empty_audio, 'file_url'):
            self.assertIsNone(empty_audio.file_url)

    def test_document_model_methods(self):
        """
        Test Document model's methods including __str__, file_url, file_size_formatted, and delete
        """
        # Create a test document file
        test_file = SimpleUploadedFile(
            name='test_document.pdf',
            content=b'x' * 2048,  # 2KB file for testing size formatting
            content_type='application/pdf'
        )
        
        document = Document.objects.create(
            title='Test Document Methods',
            moduleID=self.module,
            author=self.user,
            description='Test document methods',
            file=test_file,
            filename='test_document.pdf',
            file_type='pdf',
            file_size=2048
        )
        
        self.assertEqual(str(document), document.filename)
        
        # Test file_url property
        if hasattr(document, 'file_url'):
            self.assertIsInstance(document.file_url, str)
            
        # Test file_size_formatted property
        if hasattr(document, 'file_size_formatted'):
            self.assertEqual(document.file_size_formatted, '2.00 KB')
            
            # Test with different file sizes
            document.file_size = 500 
            self.assertEqual(document.file_size_formatted, '500.00 B')
            document.file_size = 1500000 
            self.assertEqual(document.file_size_formatted, '1.43 MB')
            document.file_size = 2500000000 
            self.assertEqual(document.file_size_formatted, '2.33 GB')
        
        # Test delete method (clean up files)
        if hasattr(document, 'file') and document.file:
            file_path = document.file.path
            if os.path.exists(file_path):
                document.delete()
                self.assertFalse(os.path.exists(file_path))
        
        # Test with empty filename
        empty_doc = Document.objects.create(
            title='Empty Document',
            moduleID=self.module,
            author=self.user
        )
        
        # Test file_url with no file
        if hasattr(empty_doc, 'file_url'):
            self.assertIsNone(empty_doc.file_url)

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
        document = Document.objects.create(title="Default Test", moduleID=self.module, author=self.user)

        self.assertFalse(document.is_published)  # Default is False
        self.assertIsNotNone(document.created_at)
        self.assertIsNotNone(document.updated_at)

    def test_create_document(self):
        """Test creating a Document object"""
        document = Document.objects.create(
            title="Test Document",
            moduleID=self.module,
            author=self.user,
            description="This is a test document",
            is_published=True,
            file=SimpleUploadedFile("document.pdf", b"file_content"),
            filename="document.pdf"
        )

        self.assertEqual(document.title, "Test Document")
        self.assertEqual(document.author, self.user)
        self.assertEqual(document.filename, "document.pdf")
        if hasattr(document, '__str__'):
            self.assertEqual(str(document), "document.pdf")

    def test_create_task(self):
        """Test creating a Task object"""
        task = Task.objects.create(
            title="Test Task",
            moduleID=self.module,
            author=self.user,
            description="This is a test task",
            is_published=True,
            text_content="Task content here",
            quiz_type="text_input"
        )

        self.assertEqual(task.text_content, "Task content here")
        self.assertTrue(task.is_published)
        if hasattr(task, '__str__'):
            self.assertIn("Test Task", str(task))

    def test_foreign_key_relationships(self):
        """Check that Content instances are properly linked to Module and User"""
        document = Document.objects.create(
            title="Linked Document", 
            moduleID=self.module, 
            author=self.user, 
            filename="linked.pdf"
        )

        self.assertEqual(document.moduleID, self.module)
        self.assertEqual(document.author, self.user)
        
        # Test reverse relationship if it exists
        if hasattr(self.module, 'document_contents'):
            self.assertIn(document, self.module.document_contents.all())

    def test_blank_and_null_constraints(self):
        """Ensure fields accept blank/null where applicable"""
        document = Document.objects.create(title="Blank Test", moduleID=self.module, author=self.user)

        self.assertIsNone(document.description)
        # For file field, check if it exists but is empty
        self.assertFalse(bool(document.file))

    def test_quizquestion_str_method(self):
        """Test the string representation of QuizQuestion"""
        question = QuizQuestion.objects.create(
            task=self.task,
            question_text="This is a long question text that will be truncated in the string representation",
            hint_text="Some hint",
            order=1
        )
        # The string representation should include part of the question text
        if hasattr(question, '__str__'):
            self.assertIn("This is a long question text", str(question))

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
        
        if hasattr(response, '__str__'):
            expected_str = f"Response by {self.user.username} for {question}"
            self.assertEqual(str(response), expected_str)