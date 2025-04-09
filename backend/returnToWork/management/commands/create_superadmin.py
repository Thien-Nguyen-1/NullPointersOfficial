from django.core.management.base import BaseCommand
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from getpass import getpass
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superadmin user'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='@superadmin', help='Superadmin username')
        parser.add_argument('--email', type=str, help='Superadmin email address')
        parser.add_argument('--first_name', type=str, default='Super', help='Superadmin first name')
        parser.add_argument('--last_name', type=str, default='Admin', help='Superadmin last name')
        parser.add_argument('--noinput', action='store_true', help='Skip all prompts and use default values')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        first_name = options['first_name']
        last_name = options['last_name']
        noinput = options['noinput']
        
        # Interactive mode if not using --noinput
        if not noinput:
            self.stdout.write("Creating a superadmin user...")
            
            if not username.startswith('@'):
                self.stdout.write(self.style.WARNING('Username must start with @'))
                username = '@' + username
            
            while not email:
                email = input("Email address: ")
            
            first_name = input(f"First name [{first_name}]: ") or first_name
            last_name = input(f"Last name [{last_name}]: ") or last_name
            
            # Password with confirmation
            password = None
            while not password:
                password = getpass("Password: ")
                password_confirm = getpass("Confirm password: ")
                
                if password != password_confirm:
                    self.stdout.write(self.style.ERROR("Passwords don't match. Please try again."))
                    password = None
                    continue
                
                try:
                    validate_password(password)
                except ValidationError as e:
                    self.stdout.write(self.style.ERROR('\n'.join(e.messages)))
                    password = None
        else:
            # Non-interactive mode - generate a secure password
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        # Check if superadmin already exists
        existing_superadmin = User.objects.filter(user_type='superadmin')
        if existing_superadmin.exists():
            self.stdout.write(self.style.WARNING('A superadmin user already exists.'))
            if not noinput:
                confirm = input("Do you want to replace the existing superadmin? (y/n): ")
                if confirm.lower() != 'y':
                    self.stdout.write(self.style.SUCCESS('Operation cancelled.'))
                    return
                else:
                    existing_superadmin.delete()
        
        # Check if username exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR(f'Username {username} already exists.'))
            return
        
        # Create the superadmin user with comprehensive attributes
        try:
            # Use create_superuser instead of create_user for more robust creation
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                user_type='superadmin',
                first_name=first_name,
                last_name=last_name,
                # Additional attributes to ensure full JWT compatibility
                is_active=True,
                is_staff=True,
                is_superuser=True,
                terms_accepted=True,
                user_id=uuid.uuid4(),  
                is_first_login=False  # assume superadmin doesnt need first login flow
            )
            
            # Explicitly save to trigger any model-level validations
            user.save()
            
            # Create AdminVerification record if needed
            from returnToWork.models import AdminVerification
            AdminVerification.objects.create(
                admin=user,
                is_verified=True,
                verification_token=str(uuid.uuid4())
            )
            
            if noinput:
                self.stdout.write(self.style.SUCCESS(f'Successfully created superadmin user: {username}'))
                self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
                self.stdout.write(self.style.WARNING('Please change this password after first login!'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Successfully created superadmin user: {username}'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating superadmin: {str(e)}'))
            import traceback
            traceback.print_exc()