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
    Module, RankingQuestion, InlinePicture, AudioClip, 
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
        for model in [InlinePicture, AudioClip, Document]:
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
    
    # This tests just the validation of required fields
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