import os
import uuid
import base64
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory
from unittest.mock import patch, MagicMock
import unittest

from returnToWork.models import (
    Module, RankingQuestion, Image, AudioClip, 
    Document, EmbeddedVideo
)
from returnToWork.serializers import ContentPublishSerializer


class ContentPublishSerializerTest(TestCase):
    def setUp(self):
        User = get_user_model()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username="@testadmin", 
            email="admin@example.com",
            password="password123",
            first_name="Admin",
            last_name="User",
            user_type="admin",
            terms_accepted=True
        )
        
        # Create default user (for unauthenticated requests)
        self.default_user = User.objects.create_user(
            username="default_user", 
            email="default@example.com",
            password="default123",
            first_name="Default",
            last_name="User",
            user_type="admin",
            terms_accepted=True
        )
        
        # Create test image content
        image_path = os.path.join(os.path.dirname(__file__), 'test_files', 'test_image.png')
        if not os.path.exists(os.path.dirname(image_path)):
            os.makedirs(os.path.dirname(image_path))
        
        # If no image exists, create a simple test image
        if not os.path.exists(image_path):
            # Create a simple 1x1 black PNG
            with open(image_path, 'wb') as f:
                f.write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='))
        
        # Read the image for base64 encoding
        with open(image_path, 'rb') as image_file:
            self.test_image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Create test audio content (mock audio file)
        self.test_audio_base64 = base64.b64encode(b'test audio content').decode('utf-8')
        
        # Set up request factory
        self.factory = APIRequestFactory()
    
    def tearDown(self):
        # Clean up created files
        for model in [Image, AudioClip, Document]:
            for obj in model.objects.all():
                for field_name in ['image_file', 'audio_file', 'file']:
                    if hasattr(obj, field_name):
                        field = getattr(obj, field_name)
                        if field and hasattr(field, 'path') and os.path.isfile(field.path):
                            os.remove(field.path)
    
    # Mocking the actual create method to avoid Module creation issues
    @patch('returnToWork.serializers.Module.objects.create')
    def test_create_module_with_authenticated_user(self, mock_create):
        """Test creating a module with authenticated user."""
        # Set up mock
        mock_module = MagicMock()
        mock_module.id = 1
        mock_create.return_value = mock_module
        
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Create serializer data
        data = {
            'title': 'Test Module',
            'description': 'Test Description',
            'elements': []
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Save the serializer
        module = serializer.save()
        
        # Verify the mock was called with correct arguments
        mock_create.assert_called_once()
        args, kwargs = mock_create.call_args
        self.assertEqual(kwargs['title'], 'Test Module')
        self.assertEqual(kwargs['description'], 'Test Description')
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)
    
    # Mocking the actual create method to avoid Module creation issues
    @patch('returnToWork.serializers.Module.objects.create')
    def test_create_module_with_unauthenticated_user(self, mock_create):
        """Test creating a module with unauthenticated user (should use default user)."""
        # Set up mock
        mock_module = MagicMock()
        mock_module.id = 1
        mock_create.return_value = mock_module
        
        # Create a request with unauthenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        # Create serializer data
        data = {
            'title': 'Test Module Unauthenticated',
            'description': 'Test Description',
            'elements': []
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Save the serializer
        module = serializer.save()
        
        # Verify the mock was called with correct arguments
        mock_create.assert_called_once()
        args, kwargs = mock_create.call_args
        self.assertEqual(kwargs['title'], 'Test Module Unauthenticated')
        self.assertEqual(kwargs['description'], 'Test Description')
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)
    
    # Mocking all necessary methods to test ranking question creation
    @patch('returnToWork.serializers.RankingQuestion.objects.create')
    @patch('returnToWork.serializers.Module.objects.create')
    def test_create_module_with_ranking_question(self, mock_module_create, mock_ranking_create):
        """Test creating a module with a ranking question."""
        # Set up mocks
        mock_module = MagicMock()
        mock_module.id = 1
        mock_module_create.return_value = mock_module
        
        mock_ranking = MagicMock()
        mock_ranking_create.return_value = mock_ranking
        
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Create serializer data
        data = {
            'title': 'Ranking Module',
            'description': 'Module with Ranking Question',
            'elements': [
                {
                    'type': 'Ranking Question',
                    'title': 'Test Ranking Question',
                    'data': {
                        'tiers': [
                            {'name': 'Tier 1', 'items': ['Item 1', 'Item 2']},
                            {'name': 'Tier 2', 'items': ['Item 3', 'Item 4']}
                        ]
                    }
                }
            ]
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Save the serializer
        module = serializer.save()
        
        # Verify the mocks were called with correct arguments
        mock_module_create.assert_called_once()
        args, kwargs = mock_module_create.call_args
        self.assertEqual(kwargs['title'], 'Ranking Module')
        self.assertEqual(kwargs['description'], 'Module with Ranking Question')
        
        mock_ranking_create.assert_called_once()
        args, kwargs = mock_ranking_create.call_args
        self.assertEqual(kwargs['moduleID'], mock_module)
        self.assertEqual(kwargs['author'], self.admin_user)
        self.assertEqual(kwargs['title'], 'Test Ranking Question')
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)
    
    # Test for Image content type (replacing InlinePicture)
    @patch('returnToWork.serializers.Image.objects.create')
    @patch('returnToWork.serializers.Module.objects.create')
    @patch('returnToWork.serializers.ContentFile')
    @patch('returnToWork.serializers.base64.b64decode')
    def test_create_module_with_image(self, mock_b64decode, mock_content_file, mock_module_create, mock_image_create):
        """Test creating a module with an image."""
        # Set up mocks
        mock_module = MagicMock()
        mock_module.id = 1
        mock_module_create.return_value = mock_module
        
        mock_image = MagicMock()
        mock_image_create.return_value = mock_image
        
        mock_b64decode.return_value = b'decoded_image_data'
        mock_content_file.return_value = 'content_file_object'
        
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Create serializer data with image
        data = {
            'title': 'Image Module',
            'description': 'Module with Image',
            'elements': [
                {
                    'type': 'Inline Picture',
                    'title': 'Test Image',
                    'data': f'data:image/png;base64,{self.test_image_base64}'
                }
            ]
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Patch uuid.uuid4 to return a predictable value
        with patch('uuid.uuid4', return_value=uuid.UUID('12345678-1234-5678-1234-567812345678')):
            # Save the serializer
            module = serializer.save()
        
        # Verify module was created with correct arguments
        mock_module_create.assert_called_once()
        
        # Verify image creation was called
        mock_image_create.assert_called_once()
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)
    
    # Testing the validation of required fields
    def test_validation_required_fields(self):
        """Test validation of required fields."""
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Missing title
        data_missing_title = {
            'description': 'Test Description',
            'elements': []
        }
        
        serializer = ContentPublishSerializer(data=data_missing_title, context={'request': request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)
        
        # Missing elements
        data_missing_elements = {
            'title': 'Test Module',
            'description': 'Test Description'
        }
        
        serializer = ContentPublishSerializer(data=data_missing_elements, context={'request': request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('elements', serializer.errors)
    
    # Testing the default user exception handling
    @patch('returnToWork.serializers.get_user_model')
    @patch('returnToWork.serializers.Module.objects.create')
    def test_default_user_not_exists(self, mock_module_create, mock_get_user_model):
        """Test error when default user doesn't exist."""
        # Set up mocks
        mock_module = MagicMock()
        mock_module_create.return_value = mock_module
        
        # Mock User.objects.get to raise DoesNotExist
        mock_user_model = MagicMock()
        mock_user_model.DoesNotExist = get_user_model().DoesNotExist
        mock_user_model.objects.get.side_effect = mock_user_model.DoesNotExist
        mock_get_user_model.return_value = mock_user_model
        
        # Create a request with unauthenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = MagicMock()
        request.user.is_authenticated = False
        
        # Create serializer data
        data = {
            'title': 'Test Module',
            'description': 'Test Description',
            'elements': []
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Save the serializer - should raise ValidationError
        with self.assertRaises(Exception) as context:
            serializer.save()
            
    # Test creating embedded video content
    @patch('returnToWork.serializers.EmbeddedVideo.objects.create')
    @patch('returnToWork.serializers.Module.objects.create')
    def test_create_module_with_embedded_video(self, mock_module_create, mock_video_create):
        """Test creating a module with an embedded video."""
        # Set up mocks
        mock_module = MagicMock()
        mock_module.id = 1
        mock_module_create.return_value = mock_module
        
        mock_video = MagicMock()
        mock_video_create.return_value = mock_video
        
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Create serializer data with embedded video
        data = {
            'title': 'Video Module',
            'description': 'Module with Embedded Video',
            'elements': [
                {
                    'type': 'Embedded Video',
                    'title': 'Test Embedded Video',
                    'data': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                }
            ]
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Save the serializer
        module = serializer.save()
        
        # Verify the mocks were called with correct arguments
        mock_module_create.assert_called_once()
        mock_video_create.assert_called_once()
        args, kwargs = mock_video_create.call_args
        self.assertEqual(kwargs['moduleID'], mock_module)
        self.assertEqual(kwargs['author'], self.admin_user)
        self.assertEqual(kwargs['title'], 'Test Embedded Video')
        self.assertEqual(kwargs['video_url'], 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)
        
    # Test creating audio clip content
    @patch('returnToWork.serializers.AudioClip.objects.create')
    @patch('returnToWork.serializers.Module.objects.create')
    @patch('returnToWork.serializers.ContentFile')
    @patch('returnToWork.serializers.base64.b64decode')
    def test_create_module_with_audio_clip(self, mock_b64decode, mock_content_file, mock_module_create, mock_audio_create):
        """Test creating a module with an audio clip."""
        # Set up mocks
        mock_module = MagicMock()
        mock_module.id = 1
        mock_module_create.return_value = mock_module
        
        mock_audio = MagicMock()
        mock_audio_create.return_value = mock_audio
        
        mock_b64decode.return_value = b'decoded_audio_data'
        mock_content_file.return_value = 'content_file_object'
        
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Create serializer data with audio clip
        data = {
            'title': 'Audio Module',
            'description': 'Module with Audio Clip',
            'elements': [
                {
                    'type': 'Audio Clip',
                    'title': 'Test Audio',
                    'data': f'data:audio/mp3;base64,{self.test_audio_base64}'
                }
            ]
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Patch uuid.uuid4 to return a predictable value
        with patch('uuid.uuid4', return_value=uuid.UUID('12345678-1234-5678-1234-567812345678')):
            # Save the serializer
            module = serializer.save()
        
        # Verify module was created with correct arguments
        mock_module_create.assert_called_once()
        
        # Verify audio creation was called
        mock_audio_create.assert_called_once()
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)
        
    # Test creating document content
    @patch('returnToWork.serializers.Document.objects.create')
    @patch('returnToWork.serializers.Module.objects.create')
    def test_create_module_with_document(self, mock_module_create, mock_document_create):
        """Test creating a module with a document."""
        # Set up mocks
        mock_module = MagicMock()
        mock_module.id = 1
        mock_module_create.return_value = mock_module
        
        mock_document = MagicMock()
        mock_document_create.return_value = mock_document
        
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Create serializer data with document
        data = {
            'title': 'Document Module',
            'description': 'Module with Document',
            'elements': [
                {
                    'type': 'Attach PDF',
                    'title': 'Test Document',
                    'data': [
                        {
                            'name': 'test.pdf',
                            'title': 'Test PDF',
                            'url': 'http://example.com/test.pdf',
                            'fileType': 'application/pdf'
                        }
                    ]
                }
            ]
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Save the serializer
        module = serializer.save()
        
        # Verify the mocks were called with correct arguments
        mock_module_create.assert_called_once()
        mock_document_create.assert_called_once()
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)
        
    # Test handling multiple elements
    @patch('returnToWork.serializers.EmbeddedVideo.objects.create')
    @patch('returnToWork.serializers.RankingQuestion.objects.create')
    @patch('returnToWork.serializers.Module.objects.create')
    def test_create_module_with_multiple_elements(self, mock_module_create, mock_ranking_create, mock_video_create):
        """Test creating a module with multiple content elements."""
        # Set up mocks
        mock_module = MagicMock()
        mock_module.id = 1
        mock_module_create.return_value = mock_module
        
        mock_ranking = MagicMock()
        mock_ranking_create.return_value = mock_ranking
        
        mock_video = MagicMock()
        mock_video_create.return_value = mock_video
        
        # Create a request with authenticated user
        request = self.factory.post('/api/content-publish/')
        request.user = self.admin_user
        
        # Create serializer data with multiple elements
        data = {
            'title': 'Multi-Element Module',
            'description': 'Module with multiple content elements',
            'elements': [
                {
                    'type': 'Ranking Question',
                    'title': 'Test Ranking',
                    'data': {
                        'tiers': [
                            {'name': 'Tier 1', 'items': ['Item 1', 'Item 2']}
                        ]
                    }
                },
                {
                    'type': 'Embedded Video',
                    'title': 'Test Video',
                    'data': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                }
            ]
        }
        
        # Initialize serializer with context
        serializer = ContentPublishSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Save the serializer
        module = serializer.save()
        
        # Verify the mocks were called
        mock_module_create.assert_called_once()
        mock_ranking_create.assert_called_once()
        mock_video_create.assert_called_once()
        
        # Check the module is our mock object
        self.assertEqual(module, mock_module)