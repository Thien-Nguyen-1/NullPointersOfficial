"""
Unseed script for the Return to Work application as a Django management command
This script removes all data created by the seed script:
- Deletes all users (service users, admins, superadmin)
- Deletes all tags
- Deletes all modules and their content
- Deletes all progress trackers and related data
"""


from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from returnToWork.models import (
    Tags, Module, ProgressTracker, AdminVerification, Task, TermsAndConditions,
    RankingQuestion, Document, EmbeddedVideo, QuizQuestion, AudioClip
)
from django.db import transaction

# Get the User model
User = get_user_model()

class Command(BaseCommand):
    help = 'Removes all seeded data from the Return to Work application database'

    @transaction.atomic
    def handle(self, *args, **options):
        """Remove all seeded data from the database"""
        self.stdout.write("Unseeding database...")

        # Delete ProgressTrackers first to avoid foreign key issues
        progress_count = ProgressTracker.objects.all().count()
        ProgressTracker.objects.all().delete()
        self.stdout.write(f"Deleted {progress_count} progress trackers")

        # Delete content items
        quiz_count = QuizQuestion.objects.all().count()
        QuizQuestion.objects.all().delete()
        self.stdout.write(f"Deleted {quiz_count} quiz questions")

        task_count = Task.objects.all().count()
        Task.objects.all().delete()
        self.stdout.write(f"Deleted {task_count} tasks")

        ranking_count = RankingQuestion.objects.all().count()
        RankingQuestion.objects.all().delete()
        self.stdout.write(f"Deleted {ranking_count} ranking questions")

        doc_count = Document.objects.all().count()
        Document.objects.all().delete()
        self.stdout.write(f"Deleted {doc_count} documents")

        video_count = EmbeddedVideo.objects.all().count()
        EmbeddedVideo.objects.all().delete()
        self.stdout.write(f"Deleted {video_count} embedded videos")

        audio_count = AudioClip.objects.all().count()
        AudioClip.objects.all().delete()
        self.stdout.write(f"Deleted {audio_count} audio clips")

        # Delete modules
        module_count = Module.objects.all().count()
        Module.objects.all().delete()
        self.stdout.write(f"Deleted {module_count} modules")

        # Delete tags
        tag_count = Tags.objects.all().count()
        Tags.objects.all().delete()
        self.stdout.write(f"Deleted {tag_count} tags")

        # Delete admin verifications
        verification_count = AdminVerification.objects.all().count()
        AdminVerification.objects.all().delete()
        self.stdout.write(f"Deleted {verification_count} admin verifications")

        # Delete terms and conditions
        terms_count = TermsAndConditions.objects.all().count()
        TermsAndConditions.objects.all().delete()
        self.stdout.write(f"Deleted {terms_count} terms and conditions")

        # Delete all users
        user_count = User.objects.all().count()
        User.objects.all().delete()
        self.stdout.write(f"Deleted {user_count} users")

        self.stdout.write(self.style.SUCCESS("Database unseeding completed successfully!"))