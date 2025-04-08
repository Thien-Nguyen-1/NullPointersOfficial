from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid

from returnToWork.models import (
    ContentProgress, ProgressTracker, 
    Module, Document, EmbeddedVideo, Task, Image, AudioClip, RankingQuestion
)

User = get_user_model()

class ContentProgressTests(TestCase):
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(
            username='@testuser', 
            email='test@example.com', 
            password='password123',
            first_name='Test',
            last_name='User',
            user_type='service user'
        )
        
        # Create another user for testing
        self.other_user = User.objects.create_user(
            username='@otheruser', 
            email='other@example.com', 
            password='password123',
            first_name='Other',
            last_name='User',
            user_type='service user'
        )
        
        # Create author user (for content items)
        self.author = User.objects.create_user(
            username='@authoruser', 
            email='author@example.com', 
            password='password123',
            first_name='Author',
            last_name='User',
            user_type='admin'
        )
        
        # Create test module
        self.module = Module.objects.create(
            title="Test Module",
            description="Test module description"
        )
        
        # Create another module for testing
        self.other_module = Module.objects.create(
            title="Other Module",
            description="Another test module"
        )
        
        # Create test content objects 
        self.document = Document.objects.create(
            title="Test Document",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            description="Test document description",
            filename="test.pdf",
            file_type="pdf"
        )
        
        self.video = EmbeddedVideo.objects.create(
            title="Test Video",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            description="Test video description",
            video_url="https://www.youtube.com/watch?v=test"
        )
        
        self.task = Task.objects.create(
            title="Test Quiz",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            text_content="Test quiz content",
            quiz_type="text_input"
        )
        
        # Create content in other module
        self.other_document = Document.objects.create(
            title="Other Document",
            contentID=uuid.uuid4(),
            moduleID=self.other_module,
            author=self.author,
            description="Document in other module",
            filename="other.pdf",
            file_type="pdf"
        )
        
        # Get content types
        self.document_ct = ContentType.objects.get_for_model(Document)
        self.video_ct = ContentType.objects.get_for_model(EmbeddedVideo)
        self.task_ct = ContentType.objects.get_for_model(Task)

    def test_mark_as_viewed(self):
        """Test the mark_as_viewed method updates fields correctly"""
        # Clear any existing data to ensure a clean test
        ContentProgress.objects.filter(user=self.user).delete()
        ProgressTracker.objects.filter(user=self.user).delete()
        
        progress = ContentProgress.objects.create(
            user=self.user,
            content_type=self.document_ct,
            object_id=self.document.contentID
        )
        
        # Initial state
        self.assertFalse(progress.viewed)
        self.assertIsNone(progress.viewed_at)
        
        # Mark as viewed
        progress.mark_as_viewed()
        
        # Refresh from DB
        progress.refresh_from_db()
        
        # Check fields updated
        self.assertTrue(progress.viewed)
        self.assertIsNotNone(progress.viewed_at)
        
        # Check a progress tracker was created
        self.assertTrue(
            ProgressTracker.objects.filter(user=self.user, module=self.module).exists()
        )

    def test_multiple_content_completion(self):
        """Test that completing multiple content items updates progress correctly"""
        # Clear any existing data to ensure a clean test
        ContentProgress.objects.filter(user=self.user).delete()
        ProgressTracker.objects.filter(user=self.user).delete()
        
        # Mark document as viewed
        progress1 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.document_ct,
            object_id=self.document.contentID
        )
        progress1.mark_as_viewed()
        
        # Get module progress
        module_progress = ProgressTracker.objects.get(user=self.user, module=self.module)
        first_count = module_progress.contents_completed
        
        # Mark video as viewed
        progress2 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.video_ct,
            object_id=self.video.contentID
        )
        progress2.mark_as_viewed()
        
        # Refresh progress tracker
        module_progress.refresh_from_db()
        second_count = module_progress.contents_completed
        
        # Check that count increased by 1
        self.assertEqual(second_count, first_count + 1)
        
        # Mark task as viewed
        progress3 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.task_ct,
            object_id=self.task.contentID
        )
        progress3.mark_as_viewed()
        
        # Refresh progress tracker
        module_progress.refresh_from_db()
        third_count = module_progress.contents_completed
        
        # Check that count increased by 1 again
        self.assertEqual(third_count, second_count + 1)
        
        # Ensure progress is tracking correctly
        self.assertGreaterEqual(module_progress.progress_percentage, 0)
        self.assertLessEqual(module_progress.progress_percentage, 100)

    def test_progress_tracking_across_modules(self):
        """Test that progress is tracked independently for different modules"""
        # Clear any existing data to ensure a clean test
        ContentProgress.objects.filter(user=self.user).delete()
        ProgressTracker.objects.filter(user=self.user).delete()
        
        # Mark document in first module as viewed
        progress1 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.document_ct,
            object_id=self.document.contentID
        )
        progress1.mark_as_viewed()
        
        # Mark document in second module as viewed
        progress2 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.document_ct,
            object_id=self.other_document.contentID
        )
        progress2.mark_as_viewed()
        
        # Check progress trackers were created for both modules
        self.assertTrue(
            ProgressTracker.objects.filter(user=self.user, module=self.module).exists()
        )
        self.assertTrue(
            ProgressTracker.objects.filter(user=self.user, module=self.other_module).exists()
        )
        
        # Get progress for second module
        other_module_progress = ProgressTracker.objects.get(user=self.user, module=self.other_module)
        
        # There's only one content item in the other module, so it should be complete
        self.assertEqual(other_module_progress.progress_percentage, 100.0)
        self.assertTrue(other_module_progress.completed)

    def test_progress_independence_across_users(self):
        """Test that progress is tracked independently for different users"""
        # Clear any existing data to ensure a clean test
        ContentProgress.objects.all().delete()
        ProgressTracker.objects.all().delete()
        
        # First user views document
        progress1 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.document_ct,
            object_id=self.document.contentID
        )
        progress1.mark_as_viewed()
        
        # Second user views video
        progress2 = ContentProgress.objects.create(
            user=self.other_user,
            content_type=self.video_ct,
            object_id=self.video.contentID
        )
        progress2.mark_as_viewed()
        
        # Check both users have progress trackers
        self.assertTrue(
            ProgressTracker.objects.filter(user=self.user, module=self.module).exists()
        )
        self.assertTrue(
            ProgressTracker.objects.filter(user=self.other_user, module=self.module).exists()
        )
        
        # Verify different content is marked as viewed for each user
        user1_viewed = ContentProgress.objects.filter(
            user=self.user, 
            viewed=True
        ).values_list('object_id', flat=True)
        
        user2_viewed = ContentProgress.objects.filter(
            user=self.other_user, 
            viewed=True
        ).values_list('object_id', flat=True)
        
        self.assertIn(self.document.contentID, user1_viewed)
        self.assertIn(self.video.contentID, user2_viewed)

    def test_update_existing_content_progress(self):
        """Test updating an existing content progress record"""
        # Create progress record but don't mark as viewed
        progress = ContentProgress.objects.create(
            user=self.user,
            content_type=self.document_ct,
            object_id=self.document.contentID,
            viewed=False
        )
        
        # Initial state
        self.assertFalse(progress.viewed)
        self.assertIsNone(progress.viewed_at)
        
        # Now mark as viewed
        progress.mark_as_viewed()
        
        # Refresh and check
        progress.refresh_from_db()
        self.assertTrue(progress.viewed)
        self.assertIsNotNone(progress.viewed_at)
        
    def test_str_representation(self):
        """Test the string representation of ContentProgress"""
        progress = ContentProgress.objects.create(
            user=self.user,
            content_type=self.document_ct,
            object_id=self.document.contentID
        )
        
        # Check the actual __str__ implementation of your model
        model_str = str(progress)
        
        # Just check that the user and content type are in the string
        self.assertIn(self.user.username, model_str)
        self.assertIn(str(self.document_ct), model_str)