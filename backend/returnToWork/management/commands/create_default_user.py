from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from returnToWork.models import Tags
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
        default_password = "12345"

        # Create default admin user
        default_username = "@John"
        admin_user, admin_created = User.objects.get_or_create(
            username=default_username,
            defaults={
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "user_type": "admin",
            }
        )

        if admin_created:
            admin_user.set_password(default_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Default admin @John user created."))
        else:
            self.stdout.write("Default admin user already exists.")

        # Create or get tags from A to J
        tag_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
        tag_objects = {}

        for letter in tag_letters:
            tag, created = Tags.objects.get_or_create(tag=letter)
            tag_objects[letter] = tag
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created tag '{letter}'"))
            else:
                self.stdout.write(f"Tag '{letter}' already exists")

        # Create 10 service users
        users_created = 0

        for i in range(1, 11):
            username = f"@user{i}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "first_name": f"User{i}",
                    "last_name": f"Test",
                    "email": f"user{i}@example.com",
                    "user_type": "service user",
                }
            )

            if created:
                user.set_password(default_password)
                # Add a corresponding tag (A for user1, B for user2, etc.)
                tag_letter = tag_letters[i - 1] if i <= len(tag_letters) else tag_letters[0]
                user.tags.add(tag_objects[tag_letter])
                user.save()
                users_created += 1
                self.stdout.write(self.style.SUCCESS(
                    f"Created service user '{username}' with tag '{tag_letter}'"))
            else:
                self.stdout.write(f"Service user '{username}' already exists")

        self.stdout.write(self.style.SUCCESS(
            f"Completed: 1 admin user and {users_created} new service users created with letter tags"))
