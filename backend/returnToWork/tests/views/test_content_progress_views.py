from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone 
import uuid

from returnToWork.models import (
    Module, Document, EmbeddedVideo, Task, 
    ContentProgress, ProgressTracker
)

User = get_user_model()

class MarkContentViewedViewTests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='@testuser', 
            email='test@example.com', 
            password='password123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create author user
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
        
        # Create test content objects with required author field
        self.infosheet = Document.objects.create(
            title="Test Document",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            infosheet_content="Test content"
        )
        self.infosheet_id = str(self.infosheet.contentID)
        
        self.video = EmbeddedVideo.objects.create(
            title="Test Video",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            video_file="test.mp4",
            duration=60
        )
        self.video_id = str(self.video.contentID)
        
        self.quiz = Task.objects.create(
            title="Test Quiz",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            text_content="Test quiz content",
            quiz_type="text_input"
        )
        self.quiz_id = str(self.quiz.contentID)

    def test_mark_content_viewed(self):
        """Test marking content as viewed through the API"""
        url = reverse('mark-content-viewed')  # Update with your actual URL name
        
        # Test infosheet
        data = {
            'content_id': self.infosheet_id,
            'content_type': 'infosheet'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['module_progress']['contents_completed'], 1)
        self.assertEqual(response.data['module_progress']['total_contents'], 3)
        self.assertAlmostEqual(
            float(response.data['module_progress']['progress_percentage']), 
            33.33, 
            delta=0.01
        )
        
        # Test video
        data = {
            'content_id': self.video_id,
            'content_type': 'video'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['module_progress']['contents_completed'], 2)
        self.assertAlmostEqual(
            float(response.data['module_progress']['progress_percentage']), 
            66.67, 
            delta=0.01
        )
        
        # Test quiz
        data = {
            'content_id': self.quiz_id,
            'content_type': 'quiz'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['module_progress']['contents_completed'], 3)
        self.assertAlmostEqual(
            float(response.data['module_progress']['progress_percentage']), 
            100.0, 
            delta=0.01
        )

    def test_invalid_content_type(self):
        """Test API validation for invalid content type"""
        url = reverse('mark-content-viewed')  # Update with your actual URL name
        
        data = {
            'content_id': self.infosheet_id,
            'content_type': 'invalid_type'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_invalid_uuid(self):
        """Test API validation for invalid UUID"""
        url = reverse('mark-content-viewed')  # Update with your actual URL name
        
        data = {
            'content_id': 'not-a-uuid',
            'content_type': 'infosheet'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class CompletedContentViewTests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='@testuser', 
            email='test@example.com', 
            password='password123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create author user
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
        
        # Create test content objects with required author field
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
        
        # Mark infosheet as viewed
        ContentProgress.objects.create(
            user=self.user,
            content_type=ContentType.objects.get_for_model(Document),
            object_id=self.infosheet.contentID,
            viewed=True,
            viewed_at=timezone.now()
        )

    def test_get_completed_content(self):
        """Test retrieving completed content"""
        url = reverse('completed-content', args=[self.module.id])  # Update with your actual URL name
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return a list with just the infosheet ID
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]), str(self.infosheet.contentID))