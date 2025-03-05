from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import IntegrityError

class Command(BaseCommand):
    help = 'Creates a default user if it doesn\'t already exist.'

    def handle(self, *args, **options):
        User = get_user_model()
        default_username = 'default_user'
        default_password = 'your_secure_password_here'
        default_email = 'default@example.com'

        # Attempt to create the default user
        try:
            user, created = User.objects.get_or_create(
                username=default_username,
                defaults={
                    'first_name': 'Default',
                    'last_name': 'User',
                    'email': default_email,
                    'user_type': 'service user'  # Make sure this is a valid option in your USER_TYPE_CHOICES
                }
            )
            if created:
                user.set_password(default_password)
                user.save()
                self.stdout.write(self.style.SUCCESS('Default user created successfully.'))
            else:
                self.stdout.write(self.style.SUCCESS('Default user already exists.'))
        
        except IntegrityError as e:
            self.stdout.write(self.style.ERROR('Failed to create default user due to a database error: {}'.format(e)))

