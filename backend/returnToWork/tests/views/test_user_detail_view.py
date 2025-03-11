# from django.test import TestCase
# from django.urls import reverse
# from rest_framework.test import APITestCase, APIClient
# from rest_framework import status
# from returnToWork.models import User, Module, ProgressTracker
# import uuid
# from unittest.mock import patch

# class UserDetailViewTests(APITestCase):
#     def setUp(self):
#         """Set up test dependencies"""
#         # Create test users
#         self.user = User.objects.create_user(
#             username='@testuser',
#             email='test@example.com',
#             password='testpassword123',
#             first_name='Test',
#             last_name='User',
#             user_type='service user'
#         )
        
#         self.admin_user = User.objects.create_user(
#             username='@adminuser',
#             email='admin@example.com',
#             password='adminpassword123',
#             first_name='Admin',
#             last_name='User',
#             user_type='admin'
#         )
        
        # Create test modules
        self.module1 = Module.objects.create(
            title='Module 1',
            description='First test module',
        )
        
        self.module2 = Module.objects.create(
            title='Module 2',
            description='Second test module',
        )
        
        self.module3 = Module.objects.create(
            title='Module 3',
            description='Third test module',
        )
        
        # Create progress trackers
        self.tracker1 = ProgressTracker.objects.create(
            user=self.user,
            module=self.module1,
            completed=True,
            pinned=True
        )
        
        self.tracker2 = ProgressTracker.objects.create(
            user=self.user,
            module=self.module2,
            completed=False,
            pinned=False
        )
        
        self.tracker3 = ProgressTracker.objects.create(
            user=self.user,
            module=self.module3,
            completed=False,
            pinned=True
        )
        
#         # Set up the client
#         self.client = APIClient()
    
#     def test_user_detail_authenticated(self):
#         """Test that an authenticated user can access their details"""
#         self.client.force_authenticate(user=self.user)
        
#         url = reverse('user-detail')
#         response = self.client.get(url)
        
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
        
#         # Check basic user info is returned
#         self.assertEqual(response.data['username'], self.user.username)
#         self.assertEqual(response.data['first_name'], self.user.first_name)
#         self.assertEqual(response.data['last_name'], self.user.last_name)
        
#         # Check progress info is returned
#         self.assertEqual(response.data['completed_modules'], 1)
#         self.assertEqual(response.data['in_progress_modules'], 2)
#         self.assertEqual(response.data['total_modules'], 3)
#         self.assertEqual(len(response.data['modules']), 3)
    
#     def test_user_detail_unauthenticated(self):
#         """Test that an unauthenticated user cannot access user details"""
#         url = reverse('user-detail')
#         response = self.client.get(url)
        
#         # Since the view requires authentication, we expect 401 Unauthorized
#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
#     @patch('random.randint')
#     def test_module_details_format(self, mock_randint):
#         """Test the format of module details with mocked random progress"""
#         # Mock random.randint to return a fixed value for testing
#         mock_randint.return_value = 42
        
#         self.client.force_authenticate(user=self.user)
        
#         url = reverse('user-detail')
#         response = self.client.get(url)
        
#         # Check format of modules data
#         modules = response.data['modules']
#         self.assertEqual(len(modules), 3)
        
#         # Check first module (completed)
#         module1_data = next(m for m in modules if m['id'] == self.module1.id)
#         self.assertEqual(module1_data['title'], self.module1.title)
#         self.assertTrue(module1_data['completed'])
#         self.assertTrue(module1_data['pinned'])
#         self.assertEqual(module1_data['progress_percentage'], 100)  # Completed modules always show 100%
        
#         # Check second module (in progress)
#         module2_data = next(m for m in modules if m['id'] == self.module2.id)
#         self.assertEqual(module2_data['title'], self.module2.title)
#         self.assertFalse(module2_data['completed'])
#         self.assertFalse(module2_data['pinned'])
#         self.assertEqual(module2_data['progress_percentage'], 42)  # Should match mocked random value
    
#     def test_no_progress_trackers(self):
#         """Test behavior when user has no progress trackers"""
#         # Create new user with no progress
#         new_user = User.objects.create_user(
#             username='@newuser',
#             email='new@example.com',
#             password='newpassword123',
#             first_name='New',
#             last_name='User',
#             user_type='service user'
#         )
        
#         self.client.force_authenticate(user=new_user)
        
#         url = reverse('user-detail')
#         response = self.client.get(url)
        
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data['completed_modules'], 0)
#         self.assertEqual(response.data['in_progress_modules'], 0)
#         self.assertEqual(response.data['total_modules'], 0)
#         self.assertEqual(len(response.data['modules']), 0)
    
#     def test_admin_accessing_own_details(self):
#         """Test that admin users can access their own details"""
#         # Create a progress tracker for the admin
#         admin_tracker = ProgressTracker.objects.create(
#             user=self.admin_user,
#             module=self.module1,
#             completed=True
#         )
        
#         self.client.force_authenticate(user=self.admin_user)
        
#         url = reverse('user-detail')
#         response = self.client.get(url)
        
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data['username'], self.admin_user.username)
#         self.assertEqual(response.data['completed_modules'], 1)
#         self.assertEqual(response.data['total_modules'], 1)
    
#     def test_all_modules_completed(self):
#         """Test case where all modules are completed"""
#         # Update all progress trackers to completed
#         ProgressTracker.objects.filter(user=self.user).update(completed=True)
        
#         self.client.force_authenticate(user=self.user)
        
#         url = reverse('user-detail')
#         response = self.client.get(url)
        
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data['completed_modules'], 3)
#         self.assertEqual(response.data['in_progress_modules'], 0)
#         self.assertEqual(response.data['total_modules'], 3)
        
#         # Verify all modules show 100% progress
#         for module in response.data['modules']:
#             self.assertEqual(module['progress_percentage'], 100)
    
#     def test_response_data_structure(self):
#         """Test the complete structure of the response data"""
#         self.client.force_authenticate(user=self.user)
        
#         url = reverse('user-detail')
#         response = self.client.get(url)
        
#         # Check all expected fields are present
#         expected_user_fields = ['user_id', 'username', 'first_name', 'last_name', 'user_type']
#         for field in expected_user_fields:
#             self.assertIn(field, response.data)
        
#         # Check module-related fields
#         self.assertIn('completed_modules', response.data)
#         self.assertIn('in_progress_modules', response.data)
#         self.assertIn('total_modules', response.data)
#         self.assertIn('modules', response.data)
        
#         # Check module detail fields
#         for module in response.data['modules']:
#             self.assertIn('id', module)
#             self.assertIn('title', module)
#             self.assertIn('completed', module)
#             self.assertIn('pinned', module)
#             self.assertIn('progress_percentage', module)