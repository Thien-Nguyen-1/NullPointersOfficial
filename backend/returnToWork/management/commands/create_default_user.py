from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

class Command(BaseCommand):
    help = "Creates a default user if it doesn't exist with enhanced security and validation."

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            default='@John',
            help='Specify a custom username for the default user'
        )
        parser.add_argument(
            '--password',
            default='12345',
            help='Specify a custom password for the default user'
        )
        parser.add_argument(
            '--email',
            default='john.doe@example.com',
            help='Specify a custom email for the default user'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        password = options['password']
        email = options['email']

        # Validate email
        try:
            validate_email(email)
        except ValidationError:
            self.stdout.write(self.style.ERROR(f"Invalid email: {email}"))
            return

        # Check if user exists
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "first_name": "John",
                "last_name": "Doe",
                "email": email,
                "user_type": "admin",
            }
        )

        if created:
            # Set password securely
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Default user '{username}' created successfully."))
        else:
            self.stdout.write(self.style.WARNING(f"User '{username}' already exists."))