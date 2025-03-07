from django.core.management.base import BaseCommand
from returnToWork.models import User, Tags, Module, ProgressTracker, InfoSheet, Video, Task

class Command(BaseCommand):
    help = "Remove all seeded data from the database"

    def handle(self, *args, **kwargs):
        self.stdout.write("Unseeding database...")

        # Delete all users except superusers (to avoid accidental removal of admin accounts)
        User.objects.filter(is_superuser=False).delete()

        # Delete all related content
        ProgressTracker.objects.all().delete()
        InfoSheet.objects.all().delete()
        Video.objects.all().delete()
        Task.objects.all().delete()

        # Delete modules and tags
        Module.objects.all().delete()
        Tags.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("Database unseeding complete!"))
