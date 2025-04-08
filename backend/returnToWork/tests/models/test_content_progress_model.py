from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid

from returnToWork.models import (
    ContentProgress, ProgressTracker, 
    Module, Document, EmbeddedVideo, Task
)

User = get_user_model()

class ContentProgressTests(TestCase):
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(
            username='@testuser', 
            email='test@example.com', 
            password='password123'
        )
        
        # Create author user (for content items)
        self.author = User.objects.create_user(
            username='@authoruser', 
            email='author@example.com', 
            password='password123'
        )
        
        # Create test module
        self.module = Module.objects.create(
            title="Test Module",
            description="Test module description"
        )
        
        # Create test content objects 
        self.infosheet = Document.objects.create(
            title="Test InfoSheet",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author, 
            infosheet_content="Test content"  
        )
        
        self.video = EmbeddedVideo.objects.create(
            title="Test Video",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,  
            video_file="test.mp4", 
            duration=60  
        )
        
        self.task = Task.objects.create(
            title="Test Quiz",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,  
            text_content="Test quiz content",  
            quiz_type="text_input" 
        )
        
        # Get content types
        self.infosheet_ct = ContentType.objects.get_for_model(Document)
        self.video_ct = ContentType.objects.get_for_model(EmbeddedVideo)
        self.task_ct = ContentType.objects.get_for_model(Task)

    def test_mark_as_viewed(self):
        """Test the mark_as_viewed method updates fields correctly"""
        progress = ContentProgress.objects.create(
            user=self.user,
            content_type=self.infosheet_ct,
            object_id=self.infosheet.contentID
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
        
        # Check module progress was created and updated
        module_progress = ProgressTracker.objects.get(user=self.user, module=self.module)
        self.assertEqual(module_progress.contents_completed, 1)
        self.assertEqual(module_progress.total_contents, 3)  # We created 3 content items
        self.assertAlmostEqual(module_progress.progress_percentage, 33.33, delta=0.01)  # 1/3 completed

    def test_multiple_content_completion(self):
        """Test that completing multiple content items updates progress correctly"""
        # Mark infosheet as viewed
        progress1 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.infosheet_ct,
            object_id=self.infosheet.contentID
        )
        progress1.mark_as_viewed()
        
        # Check progress
        module_progress = ProgressTracker.objects.get(user=self.user, module=self.module)
        self.assertEqual(module_progress.contents_completed, 1)
        self.assertAlmostEqual(module_progress.progress_percentage, 33.33, delta=0.01)
        
        # Mark video as viewed
        progress2 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.video_ct,
            object_id=self.video.contentID
        )
        progress2.mark_as_viewed()
        
        # Refresh progress tracker
        module_progress.refresh_from_db()
        self.assertEqual(module_progress.contents_completed, 2)
        self.assertAlmostEqual(module_progress.progress_percentage, 66.67, delta=0.01)
        
        # Mark task as viewed
        progress3 = ContentProgress.objects.create(
            user=self.user,
            content_type=self.task_ct,
            object_id=self.task.contentID
        )
        progress3.mark_as_viewed()
        
        # Refresh progress tracker
        module_progress.refresh_from_db()
        self.assertEqual(module_progress.contents_completed, 3)
        self.assertAlmostEqual(module_progress.progress_percentage, 100.00, delta=0.01)