from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from rest_framework import status
from django.contrib.contenttypes.models import ContentType
from returnToWork.models import (
    ProgressTracker, Module, ContentProgress, 
    Document, EmbeddedVideo, Task, Image, AudioClip, RankingQuestion
)
import json
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from rest_framework.request import Request
from rest_framework.parsers import JSONParser
from django.http import HttpRequest
from returnToWork.views import ProgressTrackerView  
from django.utils import timezone 

User = get_user_model()

class ProgressTrackerViewTest(APITestCase):
    def setUp(self):
        # Set the API URL for all tests
        self.api_url = "/api/progress-tracker/"
        
        # Create test client
        self.client = APIClient()
        
        # Create users
        self.admin_user = User.objects.create_user(
            username="@adminuser",
            email="admin@example.com",
            password="password123",
            first_name="Admin",
            last_name="User",
            user_type="admin"
        )
        
        self.service_user = User.objects.create_user(
            username="@serviceuser",
            email="service@example.com",
            password="password123",
            first_name="Service",
            last_name="User",
            user_type="service user"
        )
        
        # Create modules
        self.module1 = Module.objects.create(
            title="Module 1",
            description="Test Module 1"
        )
        
        self.module2 = Module.objects.create(
            title="Module 2",
            description="Test Module 2"
        )
        
        # Create progress trackers
        self.progress_tracker1 = ProgressTracker.objects.create(
            user=self.service_user,
            module=self.module1,
            completed=False,
            pinned=True,
            hasLiked=False,
            contents_completed=2,
            total_contents=5,
            progress_percentage=40.0
        )
        
        self.progress_tracker2 = ProgressTracker.objects.create(
            user=self.service_user,
            module=self.module2,
            completed=True,
            pinned=False,
            hasLiked=True,
            contents_completed=5,
            total_contents=5,
            progress_percentage=100.0
        )
        
        # Create some content for testing
        self.document = Document.objects.create(
            title="Test Document",
            moduleID=self.module1,
            author=self.admin_user,
            description="Test document description",
            is_published=True
        )
        
        self.video = EmbeddedVideo.objects.create(
            title="Test Video",
            moduleID=self.module1,
            author=self.admin_user,
            video_url="https://example.com/video",
            is_published=True
        )
        
        self.task = Task.objects.create(
            title="Test Task",
            moduleID=self.module1,
            author=self.admin_user,
            text_content="Test task content",
            quiz_type="text_input",
            is_published=True
        )
        
        self.image = Image.objects.create(
            title="Test Image",
            moduleID=self.module1,
            author=self.admin_user,
            file_url="https://example.com/image.jpg",
            filename="image.jpg",
            file_size=1024,
            file_type="jpg",
            width=800,
            height=600
        )
        
        self.audio = AudioClip.objects.create(
            title="Test Audio",
            moduleID=self.module1,
            author=self.admin_user,
            filename="audio.mp3",
            file_type="audio/mp3",
            file_size=2048
        )
    
    def _create_request_with_data(self, method, data):
        """
        Helper method to create a request with data for testing views directly
        """
        # Create a basic HttpRequest
        http_request = HttpRequest()
        http_request.method = method
        http_request.user = self.admin_user
        
        # Use the existing progress tracker's user and module if not provided
        if method == 'PUT':
            data.setdefault('user', self.progress_tracker1.user.id)
            data.setdefault('module', self.progress_tracker1.module.id)
        
        # Convert data to JSON
        json_data = json.dumps(data)
        http_request._body = json_data.encode('utf-8')
        
        # Transform to DRF Request
        request = Request(http_request)
        request.parsers = [JSONParser()]
        request.data  # This triggers parsing of the body
        
        return request

    # def test_put_valid_data(self):
    #     """Test updating a progress tracker with valid data by calling the view method directly"""
    #     # Prepare data with all required fields
    #     data = {
    #         "user": self.service_user.id,
    #         "module": self.module1.id,
    #         "pinned": False,
    #         "hasLiked": True
    #     }
        
    #     # Create request
    #     request = self._create_request_with_data('PUT', data)
        
    #     # Create an instance of the view
    #     view = ProgressTrackerView()
        
    #     # Call the view's put method directly with the request and pk
    #     response = view.put(request, pk=self.progress_tracker1.id)
        
    #     # Check response
    #     self.assertEqual(response.status_code, 200, f"Response data: {response.data}")
        
    #     # Refresh the instance and verify updates
    #     self.progress_tracker1.refresh_from_db()
    #     self.assertFalse(self.progress_tracker1.pinned)
    #     self.assertTrue(self.progress_tracker1.hasLiked)

    # def test_put_invalid_data(self):
    #     """Test updating a progress tracker with invalid data by calling the view method directly"""
    #     # Create invalid data
    #     data = {
    #         "user": self.service_user.id,
    #         "module": self.module1.id,
    #         "progress_percentage": 120.0  # Invalid value, should be between 0-100
    #     }
        
    #     # Create request
    #     request = self._create_request_with_data('PUT', data)
        
    #     # Create an instance of the view
    #     view = ProgressTrackerView()
        
    #     # Call the view's put method directly with the request and pk
    #     response = view.put(request, pk=self.progress_tracker1.id)
        
    #     # Check response
    #     self.assertEqual(response.status_code, 400, f"Unexpected response: {response.data}")
        
    #     # Verify specific validation errors
    #     self.assertIn('progress_percentage', str(response.data))
    #     self.assertIn('between 0 and 100', str(response.data))

    # def test_complete_module_via_progress(self):
    #     """Test that setting progress to 100% marks the module as completed"""
    #     # Prepare data to set progress to 100%
    #     data = {
    #         "user": self.service_user.id,
    #         "module": self.module1.id,
    #         "progress_percentage": 100.0
    #     }
        
    #     # Create request
    #     request = self._create_request_with_data('PUT', data)
        
    #     # Create an instance of the view
    #     view = ProgressTrackerView()
        
    #     # Call the view's put method directly with the request and pk
    #     response = view.put(request, pk=self.progress_tracker1.id)
        
    #     # Check response
    #     self.assertEqual(response.status_code, 200, f"Response data: {response.data}")
        
    #     # Refresh the instance and verify updates
    #     self.progress_tracker1.refresh_from_db()
    #     self.assertEqual(self.progress_tracker1.progress_percentage, 100.0)
    #     self.assertTrue(self.progress_tracker1.completed)
        
        
    def test_get_all_progress_trackers(self):
        """Test retrieving all progress trackers"""
        # Authenticate user
        self.client.force_authenticate(user=self.admin_user)
        
        # Send GET request
        response = self.client.get(self.api_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return both progress trackers
        self.assertEqual(len(response.data), 2)

    def test_get_progress_trackers_unauthenticated(self):
        """Test that unauthenticated users can still access the GET endpoint"""
        # No authentication
        response = self.client.get(self.api_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_progress_tracker(self):
        """Test creating a new progress tracker"""
        # Authenticate user
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a new user and module for this test
        new_user = User.objects.create_user(
            username="@newuser",
            email="new@example.com",
            password="password123",
            first_name="New",
            last_name="User",
            user_type="service user"
        )
        
        new_module = Module.objects.create(
            title="New Module",
            description="New Test Module"
        )
        
        # Data for the new progress tracker
        data = {
            "user": new_user.id,
            "module": new_module.id,
            "completed": False,
            "pinned": False,
            "hasLiked": False,
            "contents_completed": 0,
            "total_contents": 10,
            "progress_percentage": 0.0
        }
        
        # Send POST request
        response = self.client.post(self.api_url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify created object in database
        self.assertEqual(ProgressTracker.objects.count(), 3)  # 2 from setup + 1 new
        
        # Get the newly created tracker
        new_tracker = ProgressTracker.objects.get(user=new_user, module=new_module)
        self.assertEqual(new_tracker.completed, False)
        self.assertEqual(new_tracker.progress_percentage, 0.0)
    
    def test_create_progress_tracker_invalid_data(self):
        """Test creating a progress tracker with invalid data"""
        # Authenticate user
        self.client.force_authenticate(user=self.admin_user)
        
        # Send POST request with invalid data (missing required fields)
        invalid_data = {
            "completed": True,
            "pinned": True
        }
        
        response = self.client.post(self.api_url, invalid_data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ProgressTracker.objects.count(), 2)  # No new objects created
    
    def test_create_duplicate_progress_tracker(self):
        """Test creating a duplicate progress tracker (user-module combination must be unique)"""
        # Authenticate user
        self.client.force_authenticate(user=self.admin_user)
        
        # Try to create a progress tracker with the same user and module as an existing one
        duplicate_data = {
            "user": self.service_user.id,
            "module": self.module1.id,
            "completed": True,
            "pinned": True,
            "hasLiked": True,
            "contents_completed": 5,
            "total_contents": 5,
            "progress_percentage": 100.0
        }
        
        response = self.client.post(self.api_url, duplicate_data, format='json')
        
        # Check response - should fail because user-module combination must be unique
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ProgressTracker.objects.count(), 2)  # No new objects created
    
    def test_update_progress_method(self):
        """Test the update_progress method of the ProgressTracker model"""
        # Get all content types that could be included
        content_types = [
            ContentType.objects.get_for_model(Document),
            ContentType.objects.get_for_model(EmbeddedVideo),
            ContentType.objects.get_for_model(Task),
            ContentType.objects.get_for_model(Image),
            ContentType.objects.get_for_model(AudioClip),
            ContentType.objects.get_for_model(RankingQuestion)
        ]
        
        # Find all content objects for this module
        contents_by_type = {}
        for ct in content_types:
            model = ct.model_class()
            # Only get objects for module1 that aren't already viewed
            contents = model.objects.filter(moduleID=self.module1)
            contents_by_type[ct] = list(contents)
        
        # Mark all content as viewed
        for ct, contents in contents_by_type.items():
            for content in contents:
                ContentProgress.objects.get_or_create(
                    user=self.service_user,
                    content_type=ct,
                    object_id=content.contentID,
                    defaults={'viewed': True, 'viewed_at': timezone.now()}
                )
        
        # Update progress
        self.progress_tracker1.update_progress()
        self.progress_tracker1.refresh_from_db()
        
        # The number of completed items should equal the total number
        self.assertEqual(self.progress_tracker1.contents_completed, self.progress_tracker1.total_contents)
        
        # Progress should be 100% if all items are viewed
        self.assertEqual(self.progress_tracker1.progress_percentage, 100.0)
        
        # Should be marked as completed
        self.assertTrue(self.progress_tracker1.completed)
    
    def test_put_nonexistent_tracker(self):
        """Test attempting to update a non-existent progress tracker"""
        # Prepare data
        data = {
            "pinned": True
        }
        
        # Create request
        request = self._create_request_with_data('PUT', data)
        
        # Create an instance of the view
        view = ProgressTrackerView()
        
        # Use a non-existent ID
        non_existent_id = 9999
        
        # Call the view's put method directly with the request and pk
        response = view.put(request, pk=non_existent_id)
        
        # Check response
        self.assertEqual(response.status_code, 404)

    def test_delete_progress_tracker(self):
        """Test deleting a progress tracker"""
        # Call the view's delete method directly
        view = ProgressTrackerView()
        request = HttpRequest()
        request.user = self.admin_user
        
        # Call the delete method with the first progress tracker's ID
        response = view.delete(request, pk=self.progress_tracker1.id)
        
        # Check response
        self.assertEqual(response.status_code, 204)
        
        # Verify progress tracker has been deleted
        with self.assertRaises(ProgressTracker.DoesNotExist):
            ProgressTracker.objects.get(id=self.progress_tracker1.id)

    def test_delete_nonexistent_tracker(self):
        """Test attempting to delete a non-existent progress tracker"""
        # Call the view's delete method directly
        view = ProgressTrackerView()
        request = HttpRequest()
        request.user = self.admin_user
        
        # Use a non-existent ID
        non_existent_id = 9999
        
        # Call the delete method
        response = view.delete(request, pk=non_existent_id)
        
        # Check response
        self.assertEqual(response.status_code, 404)