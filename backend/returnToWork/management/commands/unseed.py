from django.core.management.base import BaseCommand
from returnToWork.models import User, Tags, Module, ProgressTracker, Task, AudioClip, Document, EmbeddedVideo, RankingQuestion

class Command(BaseCommand):
    help = "Remove all seeded data from the database"

    def handle(self, *args, **kwargs):
        self.stdout.write("Unseeding database...")

        # Delete all users
        User.objects.all().delete()

        # Delete all related content
        ProgressTracker.objects.all().delete()
        RankingQuestion.objects.all().delete()
        AudioClip.objects.all().delete()
        Document.objects.all().delete()
        EmbeddedVideo.objects.all().delete()

        # Delete modules and tags
        Module.objects.all().delete()
        Tags.objects.all().delete()


        self.stdout.write(self.style.SUCCESS("Database unseeding complete!"))
