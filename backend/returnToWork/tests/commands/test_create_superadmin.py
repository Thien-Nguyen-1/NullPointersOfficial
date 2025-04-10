import io
import uuid
from unittest import mock
from django.core.management import call_command
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from returnToWork.models import AdminVerification
from returnToWork.management.commands.create_superadmin import Command

User = get_user_model()

class CreateSuperadminCommandTest(TestCase):
    """Test cases for create_superadmin management command."""

    def test_command_directly(self):
        """Test direct Command instantiation and execution to help with coverage."""
        # Create an instance of the command
        cmd = Command()
        
        # Set up a StringIO to capture output
        out = io.StringIO()
        cmd.stdout = out
        
        # Call the handle method directly with non-interactive mode
        cmd.handle(
            username='@direct_test',
            email='direct@example.com',
            first_name='Direct',
            last_name='Test',
            noinput=True
        )
        
        # Verify user was created
        user = User.objects.get(username='@direct_test')
        self.assertEqual(user.email, 'direct@example.com')

    def setUp(self):
        """Set up test environment."""
        # Clear any existing users before each test
        User.objects.all().delete()
        AdminVerification.objects.all().delete()

    def test_create_superadmin_noinput(self):
        """Test creating superadmin in non-interactive mode."""
        # Capture stdout to check for output messages
        out = io.StringIO()
        
        call_command(
            'create_superadmin',
            '--username=@superadmin',
            '--email=admin@example.com',
            '--first_name=Super',
            '--last_name=Admin',
            '--noinput',
            stdout=out
        )
        
        # Verify user was created with correct attributes
        user = User.objects.get(username='@superadmin')
        self.assertEqual(user.email, 'admin@example.com')
        self.assertEqual(user.first_name, 'Super')
        self.assertEqual(user.last_name, 'Admin')
        self.assertEqual(user.user_type, 'superadmin')
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.terms_accepted)
        self.assertFalse(user.is_first_login)
        
        # Verify AdminVerification was created
        verification = AdminVerification.objects.get(admin=user)
        self.assertTrue(verification.is_verified)
        
        # Verify output messages
        output = out.getvalue()
        self.assertIn('Successfully created superadmin user', output)
        self.assertIn('Password:', output)
        self.assertIn('Please change this password after first login!', output)

    @mock.patch('returnToWork.management.commands.create_superadmin.getpass')
    @mock.patch('returnToWork.management.commands.create_superadmin.input')
    def test_create_superadmin_interactive(self, mock_input, mock_getpass):
        """Test creating superadmin in interactive mode."""
        # Set up the mock responses
        mock_input.side_effect = ['admin@example.com', 'Test', 'User']
        mock_getpass.side_effect = ['secure_password', 'secure_password']
        
        out = io.StringIO()
        call_command('create_superadmin', stdout=out)
        
        # Verify user was created
        user = User.objects.get(username='@superadmin')
        self.assertEqual(user.email, 'admin@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        
        # Verify output messages
        output = out.getvalue()
        self.assertIn('Successfully created superadmin user', output)
    
    @mock.patch('returnToWork.management.commands.create_superadmin.getpass')
    @mock.patch('returnToWork.management.commands.create_superadmin.input')
    def test_username_correction(self, mock_input, mock_getpass):
        """Test username correction if it doesn't start with @."""
        # Set up the mock responses
        mock_input.side_effect = ['admin@example.com', 'Test', 'User']
        mock_getpass.side_effect = ['secure_password', 'secure_password']
        
        out = io.StringIO()
        call_command('create_superadmin', '--username=superadmin', stdout=out)
        
        # Verify username was corrected
        user = User.objects.get(username='@superadmin')
        self.assertTrue(user.username.startswith('@'))
        self.assertIn('Username must start with @', out.getvalue())
    
    @mock.patch('returnToWork.management.commands.create_superadmin.getpass')
    @mock.patch('returnToWork.management.commands.create_superadmin.input')
    def test_password_mismatch(self, mock_input, mock_getpass):
        """Test password mismatch handling."""
        # Set up the mock responses
        mock_input.side_effect = ['admin@example.com', 'Test', 'User']
        mock_getpass.side_effect = ['password1', 'password2', 'secure_password', 'secure_password']
        
        out = io.StringIO()
        call_command('create_superadmin', stdout=out)
        
        # Verify error message was shown
        output = out.getvalue()
        self.assertIn("Passwords don't match", output)
        
        # Verify user was still created after successful retry
        user = User.objects.get(username='@superadmin')
        self.assertEqual(user.email, 'admin@example.com')
    
    @mock.patch('returnToWork.management.commands.create_superadmin.validate_password')
    @mock.patch('returnToWork.management.commands.create_superadmin.getpass')
    @mock.patch('returnToWork.management.commands.create_superadmin.input')
    def test_password_validation_error(self, mock_input, mock_getpass, mock_validate):
        """Test password validation error handling."""
        # Set up mock validation to fail first, then succeed
        mock_validate.side_effect = [ValidationError(["Password too short"]), None]
        
        # Set up the mock responses
        mock_input.side_effect = ['admin@example.com', 'Test', 'User']
        mock_getpass.side_effect = ['short', 'short', 'secure_password', 'secure_password']
        
        out = io.StringIO()
        call_command('create_superadmin', stdout=out)
        
        # Verify error message was shown
        output = out.getvalue()
        self.assertIn("Password too short", output)
        
        # Verify user was still created after successful retry
        user = User.objects.get(username='@superadmin')
        self.assertEqual(user.email, 'admin@example.com')
    
    @mock.patch('returnToWork.management.commands.create_superadmin.getpass')
    @mock.patch('returnToWork.management.commands.create_superadmin.input')
    def test_existing_superadmin_replace(self, mock_input, mock_getpass):
        """Test replacing existing superadmin."""
        # Create an initial superadmin
        user = User.objects.create_user(
            username='@existing_admin',
            email='existing@example.com',
            password='password',
            user_type='superadmin',
            is_superuser=True,
            is_staff=True
        )
        AdminVerification.objects.create(admin=user, is_verified=True)
        
        # Set up the mock responses - note the 'y' for confirmation
        mock_input.side_effect = ['admin@example.com', 'Test', 'User', 'y']
        mock_getpass.side_effect = ['secure_password', 'secure_password']
        
        out = io.StringIO()
        call_command('create_superadmin', stdout=out)
        
        # Verify output contains warning
        output = out.getvalue()
        self.assertIn('A superadmin user already exists', output)
        
        # Verify old superadmin is replaced
        self.assertFalse(User.objects.filter(username='@existing_admin').exists())
        new_admin = User.objects.get(username='@superadmin')
        self.assertEqual(new_admin.email, 'admin@example.com')
    
    def test_existing_superadmin_warning(self):
        """Test the command warns about existing superadmin."""
        # Create an initial superadmin
        first_user = User.objects.create_user(
            username='@first_admin',
            email='first@example.com',
            password='password',
            user_type='superadmin',
            is_staff=True,
            is_superuser=True
        )
        AdminVerification.objects.create(admin=first_user, is_verified=True)
        
        # In non-interactive mode, check that a warning is shown
        out = io.StringIO()
        call_command(
            'create_superadmin',
            '--username=@second_admin',
            '--email=second@example.com',
            '--noinput',
            stdout=out
        )
        
        # Verify warning was logged
        output = out.getvalue()
        self.assertIn('A superadmin user already exists', output)
        
        # In non-interactive mode, the command is expected to proceed with replacement
        # Check if we now have the second admin
        self.assertTrue(User.objects.filter(username='@second_admin').exists())
    
    def test_username_exists(self):
        """Test handling of existing username."""
        # Create a user with the same username
        User.objects.create_user(
            username='@superadmin',
            email='existing@example.com',
            password='password'
        )
        
        out = io.StringIO()
        call_command(
            'create_superadmin',
            '--email=new@example.com',
            '--noinput',
            stdout=out
        )
        
        # Verify error message
        output = out.getvalue()
        self.assertIn('Username @superadmin already exists', output)
        self.assertEqual(User.objects.count(), 1)  # No new user created
    
    def test_error_handling(self):
        """Test general error handling during creation."""
        # Mock an exception during user creation
        with mock.patch('django.contrib.auth.models.UserManager.create_superuser',
                       side_effect=Exception('Test error')):
            
            out = io.StringIO()
            call_command(
                'create_superadmin',
                '--email=test@example.com',
                '--noinput',
                stdout=out
            )
            
            # Verify error message
            output = out.getvalue()
            self.assertIn('Error creating superadmin: Test error', output)
            self.assertEqual(User.objects.count(), 0)  # No user created

    def test_uuid_generation(self):
        """Test UUID generation for user."""
        with mock.patch('uuid.uuid4', return_value=uuid.UUID('12345678-1234-5678-1234-567812345678')):
            out = io.StringIO()
            call_command(
                'create_superadmin',
                '--email=test@example.com',
                '--noinput',
                stdout=out
            )
            
            user = User.objects.get(username='@superadmin')
            self.assertEqual(str(user.user_id), '12345678-1234-5678-1234-567812345678')