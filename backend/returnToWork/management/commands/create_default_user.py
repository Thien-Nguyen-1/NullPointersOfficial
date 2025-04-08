import random
import uuid
from django.core.management.base import BaseCommand
from returnToWork.models import User, Tags  # Adjust 'myapp' to your actual app name

TAGS_LIST = [
    "Depression",
    "Anxiety disorders",
    "Bipolar disorder",
    "Substance use disorders",
    "Schizophrenia",
    "Obsessive-compulsive disorder (OCD)",
    "Post-traumatic stress disorder (PTSD)",
    "Eating disorders",
    "Attention-deficit/hyperactivity disorder (ADHD)",
    "Generalized anxiety disorder (GAD)",
    "Panic disorder",
    "Social anxiety disorder",
    "Specific phobias",
    "Borderline personality disorder",
    "Dissociative disorders"
]

USER_COUNT = 10  # Change this to set the number of random users

class Command(BaseCommand):
    help = "Seed the database with sample users"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database...")

        # Ensure all tags exist in the database
        tag_objects = {}
        for tag in TAGS_LIST:
            tag_obj, created = Tags.objects.get_or_create(tag=tag)
            tag_objects[tag] = tag_obj

        predefined_users = [
            {"username": "@admin", "first_name": "Admin", "last_name": "User", "user_type": "admin"},
            {"username": "@service", "first_name": "Service", "last_name": "User", "user_type": "service user"},
        ]

        created_users = []

        for user_data in predefined_users:
            user, created = User.objects.get_or_create(username=user_data["username"], defaults={
                "user_id": uuid.uuid4(),
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"],
                "user_type": user_data["user_type"],
                "email": f"{user_data['username'].strip('@')}@example.com"
            })
            if created and user.user_type != "admin":
                user.tags.set(random.sample(list(tag_objects.values()), 2))  # Assign 2 random tags
                user.save()
            created_users.append(user)

        # Generate additional random users
        for i in range(USER_COUNT):
            user_type = "service user"
            user = User.objects.create(
                user_id=uuid.uuid4(),
                username=f"@user{i + 2}",
                first_name=f"First{i + 2}",
                last_name=f"Last{i + 2}",
                user_type=user_type
            )
            user.tags.set(random.sample(list(tag_objects.values()), 2))  # Assign 2 random tags
            user.save()
            created_users.append(user)

        self.stdout.write(self.style.SUCCESS("Database seeding complete!"))

        # Print details of created users
        self.stdout.write("\nCreated Users:")
        for user in created_users:
            tag_names = ", ".join(user.tags.values_list("tag", flat=True))
            self.stdout.write(
                f"- Username: {user.username}, Type: {user.user_type}, Tags: {tag_names if tag_names else 'None'}")
