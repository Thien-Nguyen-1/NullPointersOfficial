import os
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from returnToWork.models import AudioClip, Module, User, AdminVerification
from returnToWork.serializers import AudioClipSerializer


class AudioClipSerializerTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="@testadmin", 
            email="admin@example.com",
            password="password123",
            first_name="Admin",
            last_name="User",
            user_type="admin",
            terms_accepted=True
        )
        
        self.admin_verification = AdminVerification.objects.create(
            admin=self.admin_user,
            is_verified=True
        )
        
        self.module = Module.objects.create(
            title="Test Module",
            description="Test Module Description",
        )
        
        self.audio_content = b'test audio content'
        self.audio_file = SimpleUploadedFile(
            "test_audio.mp3", 
            self.audio_content, 
            content_type="audio/mpeg"
        )
        
        self.audio_clip = AudioClip.objects.create(
            title="Test Audio",
            moduleID=self.module,  
            author=self.admin_user,  
            description="Test Description",
            audio_file=self.audio_file,
            is_published=True,
            duration=120,  
            filename="test_audio.mp3",
            file_size=1024 * 500,  
            file_type="audio/mpeg"
        )
        
        # create a second Module for the minimal audio clip
        self.module2 = Module.objects.create(
            title="Test Module 2",
            description="Test Module Description 2",
        )
        
        self.minimal_audio_clip = AudioClip.objects.create(
            title="Minimal Audio",
            moduleID=self.module2,  
            author=self.admin_user,  
            audio_file=None,  
            is_published=False,
            file_size=None
        )
    
    def tearDown(self):
        # Clean up created files
        if self.audio_clip.audio_file and hasattr(self.audio_clip.audio_file, 'path'):
            if os.path.isfile(self.audio_clip.audio_file.path):
                os.remove(self.audio_clip.audio_file.path)
    
    def test_serializer_contains_expected_fields(self):
        """Test that serializer contains all expected fields."""
        serializer = AudioClipSerializer(instance=self.audio_clip)
        expected_fields = [
            'contentID', 'title', 'moduleID', 'author', 'description',
            'created_at', 'updated_at', 'is_published', 'audio_file',
            'file_url', 'file_size_formatted', 'duration', 'filename',
            'file_size', 'file_type'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_get_file_url_with_file(self):
        """Test get_file_url method returns correct URL when file exists."""
        serializer = AudioClipSerializer(instance=self.audio_clip)
        self.assertEqual(serializer.data['file_url'], self.audio_clip.audio_file.url)
    
    def test_get_file_url_without_file(self):
        """Test get_file_url method returns None when no file exists."""
        serializer = AudioClipSerializer(instance=self.minimal_audio_clip)
        self.assertIsNone(serializer.data['file_url'])
    
    def test_get_file_size_formatted_with_size(self):
        """Test get_file_size_formatted returns formatted size."""
        serializer = AudioClipSerializer(instance=self.audio_clip)
        # Expected: 500.00 KB
        self.assertEqual(serializer.data['file_size_formatted'], "500.00 KB")
    
    def test_get_file_size_formatted_without_size(self):
        """Test get_file_size_formatted returns None when no size."""
        serializer = AudioClipSerializer(instance=self.minimal_audio_clip)
        self.assertIsNone(serializer.data['file_size_formatted'])
    
    def test_file_size_formatting_bytes(self):
        """Test file size formatting for bytes."""
        self.audio_clip.file_size = 500
        self.audio_clip.save()
        serializer = AudioClipSerializer(instance=self.audio_clip)
        self.assertEqual(serializer.data['file_size_formatted'], "500.00 B")
    
    def test_file_size_formatting_kb(self):
        """Test file size formatting for kilobytes."""
        self.audio_clip.file_size = 1500
        self.audio_clip.save()
        serializer = AudioClipSerializer(instance=self.audio_clip)
        self.assertEqual(serializer.data['file_size_formatted'], "1.46 KB")
    
    def test_file_size_formatting_mb(self):
        """Test file size formatting for megabytes."""
        self.audio_clip.file_size = 1500 * 1024
        self.audio_clip.save()
        serializer = AudioClipSerializer(instance=self.audio_clip)
        self.assertEqual(serializer.data['file_size_formatted'], "1.46 MB")
    
    def test_file_size_formatting_gb(self):
        """Test file size formatting for gigabytes."""
        self.audio_clip.file_size = 1500 * 1024 * 1024
        self.audio_clip.save()
        serializer = AudioClipSerializer(instance=self.audio_clip)
        self.assertEqual(serializer.data['file_size_formatted'], "1.46 GB")


class AudioClipAPITest(APITestCase):
    def setUp(self):
        # Create an admin user for author field
        self.admin_user = User.objects.create_user(
            username="@testadmin", 
            email="admin@example.com",
            password="password123",
            first_name="Admin",
            last_name="User",
            user_type="admin",
            terms_accepted=True
        )
        
        # Create admin verification
        self.admin_verification = AdminVerification.objects.create(
            admin=self.admin_user,
            is_verified=True
        )
        
        # Set up authentication for the admin user
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
        
        self.module = Module.objects.create(
            title="Test Module",
            description="Test Module Description",
        )
        
        self.audio_content = b'test audio content'
        self.audio_file = SimpleUploadedFile(
            "test_audio.mp3", 
            self.audio_content, 
            content_type="audio/mpeg"
        )
        
        self.audio_clip = AudioClip.objects.create(
            title="Test Audio",
            moduleID=self.module,
            author=self.admin_user,
            description="Test Description",
            audio_file=self.audio_file,
            is_published=True,
            duration=120,
            filename="test_audio.mp3",
            file_size=1024 * 500,
            file_type="audio/mpeg"
        )
        
        # assume having an API endpoint for AudioClips
        self.list_url = reverse('audioclip-list')
        self.detail_url = reverse('audioclip-detail', kwargs={'pk': self.audio_clip.contentID})
    
    def tearDown(self):
        # Clean up created files
        if self.audio_clip.audio_file and hasattr(self.audio_clip.audio_file, 'path'):
            if os.path.isfile(self.audio_clip.audio_file.path):
                os.remove(self.audio_clip.audio_file.path)
    
    def test_get_audio_clip_detail(self):
        """Test retrieving a single audio clip."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check serialized data
        self.assertEqual(response.data['title'], "Test Audio")
        self.assertEqual(response.data['file_size_formatted'], "500.00 KB")
        self.assertIsNotNone(response.data['file_url'])
    
    @patch('returnToWork.views.AudioClipViewSet.perform_create')
    def test_create_audio_clip(self, mock_perform_create):
        """Test creating a new audio clip."""
        new_audio = SimpleUploadedFile(
            "new_audio.mp3", 
            b'new audio content', 
            content_type="audio/mpeg"
        )
        
        # use moduleID that matches a real Module (using the ID)
        data = {
            'title': 'New Audio',
            'moduleID': self.module.id,  # the ID of an existing Module
            'description': 'New Description',
            'audio_file': new_audio,
            'is_published': True,
        }
        
        # Mock the perform_create method to set the author
        def side_effect(serializer):
            serializer.save(author=self.admin_user)
        mock_perform_create.side_effect = side_effect
        
        response = self.client.post(self.list_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_update_audio_clip(self):
        """Test updating an audio clip."""
        data = {
            'title': 'Updated Audio',
            'description': 'Updated Description',
        }
        
        response = self.client.patch(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.audio_clip.refresh_from_db()
        self.assertEqual(self.audio_clip.title, 'Updated Audio')
        self.assertEqual(self.audio_clip.description, 'Updated Description')