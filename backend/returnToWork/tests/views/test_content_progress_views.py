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
            password='password123',
            first_name='Test',
            last_name='User',
            user_type='service user'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create author user
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
        
        # Create test content objects with required author field
        self.document = Document.objects.create(
            title="Test Document",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            description="Test document description",
            filename="test.pdf",
            file_type="pdf"
        )
        self.document_id = str(self.document.contentID)
        
        self.video = EmbeddedVideo.objects.create(
            title="Test Video",
            contentID=uuid.uuid4(),
            moduleID=self.module,
            author=self.author,
            description="Test video description",
            video_url="https://www.youtube.com/watch?v=test"
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
        
        # Test document
        data = {
            'content_id': self.document_id,
            'content_type': 'infosheet'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Get the actual number of completed contents from the response
        completed_count_1 = response.data['module_progress']['contents_completed']
        # Verify it's at least 1 (it might be more if there are other contents)
        self.assertGreaterEqual(completed_count_1, 1)
        
        # Test video
        data = {
            'content_id': self.video_id,
            'content_type': 'video'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get the new completed count
        completed_count_2 = response.data['module_progress']['contents_completed']
        # Verify it's one more than before
        self.assertEqual(completed_count_2, completed_count_1 + 1)
        
        # Test quiz
        data = {
            'content_id': self.quiz_id,
            'content_type': 'quiz'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get the final completed count
        completed_count_3 = response.data['module_progress']['contents_completed']
        # Verify it's one more than before
        self.assertEqual(completed_count_3, completed_count_2 + 1)
        
        # Verify it's equal to the total contents
        self.assertEqual(
            completed_count_3,
            response.data['module_progress']['total_contents']
        )
        
        # Verify the progress is 100%
        self.assertAlmostEqual(
            float(response.data['module_progress']['progress_percentage']), 
            100.0, 
            delta=0.01
        )

    def test_invalid_content_type(self):
        """Test API validation for invalid content type"""
        url = reverse('mark-content-viewed')
        
        data = {
            'content_id': self.document_id,
            'content_type': 'invalid_type'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_invalid_uuid(self):
        """Test API validation for invalid UUID"""
        url = reverse('mark-content-viewed')
        
        data = {
            'content_id': 'not-a-uuid',
            'content_type': 'infosheet'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_missing_parameters(self):
        """Test that API properly handles missing parameters"""
        url = reverse('mark-content-viewed')
        
        # Missing content_id
        data = {
            'content_type': 'infosheet'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Missing content_type
        data = {
            'content_id': self.document_id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_nonexistent_content(self):
        """Test handling of non-existent content ID"""
        url = reverse('mark-content-viewed')
        
        # Generate a random UUID that doesn't exist in our DB
        nonexistent_id = str(uuid.uuid4())
        
        data = {
            'content_id': nonexistent_id,
            'content_type': 'infosheet'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_mark_already_viewed_content(self):
        """Test marking content as viewed when it's already marked"""
        url = reverse('mark-content-viewed')
        
        # Mark content as viewed first time
        data = {
            'content_id': self.document_id,
            'content_type': 'infosheet'
        }
        first_response = self.client.post(url, data, format='json')
        first_count = first_response.data['module_progress']['contents_completed']
        
        # Mark same content again
        second_response = self.client.post(url, data, format='json')
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        
        # Content count should not increase on duplicate marking
        second_count = second_response.data['module_progress']['contents_completed']
        self.assertEqual(second_count, first_count)

class CompletedContentViewTests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='@testuser', 
            email='test@example.com', 
            password='password123',
            first_name='Test',
            last_name='User',
            user_type='service user'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create author user
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
        
        # Create test content objects with required author field
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
        
        # Mark document as viewed
        ContentProgress.objects.create(
            user=self.user,
            content_type=ContentType.objects.get_for_model(Document),
            object_id=self.document.contentID,
            viewed=True,
            viewed_at=timezone.now()
        )

    def test_get_completed_content(self):
        """Test retrieving completed content"""
        url = reverse('completed-content', args=[self.module.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return a list with just the document ID
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]), str(self.document.contentID))
        
    def test_get_completed_content_empty(self):
        """Test retrieving completed content for a module with no completions"""
        # Create a new module with no completions
        empty_module = Module.objects.create(
            title="Empty Module",
            description="Module with no completed content"
        )
        
        url = reverse('completed-content', args=[empty_module.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Should be an empty list
        
    def test_get_completed_content_nonexistent_module(self):
        """Test retrieving completed content for a non-existent module"""
        # Use a module ID that doesn't exist
        nonexistent_id = 9999
        
        url = reverse('completed-content', args=[nonexistent_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_get_completed_content_another_user(self):
        """Test that a user can only see their own completed content"""
        # Create another user
        other_user = User.objects.create_user(
            username='@otheruser', 
            email='other@example.com', 
            password='password123',
            first_name='Other',
            last_name='User',
            user_type='service user'
        )
        
        # Mark video as viewed by other user
        ContentProgress.objects.create(
            user=other_user,
            content_type=ContentType.objects.get_for_model(EmbeddedVideo),
            object_id=self.video.contentID,
            viewed=True,
            viewed_at=timezone.now()
        )
        
        # Original user should still only see their own completions
        url = reverse('completed-content', args=[self.module.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Still just one item
        
        # Now authenticate as the other user
        self.client.force_authenticate(user=other_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # One item for other user
        self.assertEqual(str(response.data[0]), str(self.video.contentID))  # But it's the video, not the document