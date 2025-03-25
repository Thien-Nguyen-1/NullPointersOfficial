from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Creates a default user if it doesn't exist."

    def handle(self, *args, **options):
        User = get_user_model()
        default_username = "@John"
        default_password = "12345"

        user, created = User.objects.get_or_create(
            username=default_username,
            defaults={
                "first_name": "John",
                "last_name": "Doe",
                "user_type": "admin",  # adjust if needed
            }
        )
        if created:
            user.set_password(default_password)
            user.save()
            self.stdout.write(self.style.SUCCESS("Default user created."))
        else:
            self.stdout.write("Default user already exists.")
