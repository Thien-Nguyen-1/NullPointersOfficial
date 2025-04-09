from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from returnToWork.models import User, AdminVerification

class AdminUsersViewTests(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            username='superadmin',
            email='superadmin@example.com',
            password='pass1',
            user_type='superadmin'
        )
        self.admin_url = reverse('admin-users')  

    def authenticate(self, user):
        self.client = APIClient()
        self.client.force_authenticate(user=user)

    def test_superadmin_can_get_admin_users(self):
        admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='pass2',
            user_type='admin'
        )
        self.authenticate(self.superadmin)
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(user['username'] == 'admin1' for user in response.data))

    def test_non_superadmin_cannot_get_admin_users(self):
        admin_user = User.objects.create_user(
            username='nonsuper',
            email='admin@example.com',
            password='testpass',
            user_type='admin'
        )
        self.authenticate(admin_user)
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'],'Only superadmins can view admin users')

    def test_superadmin_can_create_admin_user_with_verification(self):
        self.authenticate(self.superadmin)
        response = self.client.post(self.admin_url, {
            'username': 'admin2',
            'email': 'admin2@example.com',
            'password': 'passs2',
            'require_verification': True
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='admin2').exists())
        self.assertTrue(AdminVerification.objects.filter(admin__username='admin2', is_verified=False).exists())

    def test_nonsuperadmin_cant_create_admin(self):
        admin_user1 = User.objects.create_user(
            username='nonsuper1',
            email='admin@example.com',
            password='testpass1',
            user_type='admin'
        )
        self.authenticate(admin_user1)
        response = self.client.post(self.admin_url, {
            'username': 'admin5',
            'email': 'admin5@example.com',
            'password': 'passs5',
            'require_verification': True
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'],'Only superadmins can create admin users')


    def test_superadmin_can_create_admin_user_without_verification(self):
        self.authenticate(self.superadmin)
        response = self.client.post(self.admin_url, {
            'username': 'admin3',
            'email': 'admin3@example.com',
            'password': 'testpass123',
            'require_verification': False
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertTrue(AdminVerification.objects.filter(admin__username='admin3', is_verified=True).exists())

    def test_duplicate_username_and_email_handling(self):
        User.objects.create_user(
            username='admin_dup',
            email='admin@duplicate.com',
            password='pass',
            user_type='admin'
        )
        self.authenticate(self.superadmin)

        response1 = self.client.post(self.admin_url, {
            'username': 'admin_dup',
            'email': 'newadmin@example.com',
            'password': 'pass'
        })
        self.assertEqual(response1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Username already exists', response1.data['error'])

        response2 = self.client.post(self.admin_url, {
            'username': 'unique_admin',
            'email': 'admin@duplicate.com',
            'password': 'pass'
        })
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Email already exists', response2.data['error'])

    def test_missing_fields_validation(self):
        self.authenticate(self.superadmin)
        response = self.client.post(self.admin_url, {
            'username': '',
            'email': '',
            'password': ''
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)





        
