import random
import uuid
import secrets
from django.core.management.base import BaseCommand
from django.utils import timezone
from returnToWork.models import User, Tags, Module, AdminVerification

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

# Create some sample modules
MODULES_LIST = [
    "Return to Work Assessment",
    "Mental Health Support",
    "Workplace Accommodation",
    "Vocational Rehabilitation",
    "Stress Management"
]

USER_COUNT = 10  # Number of random service users
ADMIN_COUNT = 10  # Number of admin users to create
DEFAULT_PASSWORD = "password123"  # Simple default password for all users


class Command(BaseCommand):
    help = "Seed the database with sample users and admin verification records"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database...")

        # Ensure all tags exist in the database
        tag_objects = {}
        for tag in TAGS_LIST:
            tag_obj, created = Tags.objects.get_or_create(tag=tag)
            tag_objects[tag] = tag_obj

        # Ensure all modules exist in the database
        module_objects = {}
        for module_name in MODULES_LIST:
            module_obj, created = Module.objects.get_or_create(title=module_name)  # Changed 'name' to 'title'
            module_objects[module_name] = module_obj

        # Create superadmin user first
        superadmin_username = "@superadmin"
        superadmin_email = "superadmin@example.com"

        # Check if superadmin already exists
        try:
            superadmin = User.objects.get(username=superadmin_username)
            self.stdout.write(self.style.WARNING(f"Superadmin user '{superadmin_username}' already exists."))
        except User.DoesNotExist:
            # Create superadmin if it doesn't exist
            try:
                User.objects.get(email=superadmin_email)
                # If email exists, generate a new unique one
                superadmin_email = f"{uuid.uuid4().hex[:8]}_{superadmin_email}"
            except User.DoesNotExist:
                # Email is unique, we can proceed
                pass

            superadmin = User.objects.create(
                user_id=uuid.uuid4(),
                username=superadmin_username,
                email=superadmin_email,
                first_name="Super",
                last_name="Admin",
                user_type="superadmin",
                is_staff=True,
                is_superuser=True,
                terms_accepted=True
            )
            superadmin.set_password(DEFAULT_PASSWORD)
            superadmin.save()

            # Assign all modules to superadmin
            superadmin.module.set(module_objects.values())
            superadmin.save()

            self.stdout.write(self.style.SUCCESS(f"Created superadmin user: {superadmin_username}"))

        created_users = [superadmin]
        admin_users = []

        # Create 10 admin users
        for i in range(ADMIN_COUNT):
            username = f"@admin{i + 1}"
            email = f"admin{i + 1}@example.com"

            # Skip if username already exists
            if User.objects.filter(username=username).exists():
                admin_user = User.objects.get(username=username)
                self.stdout.write(self.style.WARNING(f"Admin user '{username}' already exists."))
                admin_users.append(admin_user)
                continue

            # Check if email already exists
            while User.objects.filter(email=email).exists():
                # Generate a unique email if it already exists
                email = f"admin{i + 1}_{uuid.uuid4().hex[:8]}@example.com"

            admin_user = User.objects.create(
                user_id=uuid.uuid4(),
                username=username,
                email=email,
                first_name=f"Admin{i + 1}",
                last_name="User",
                user_type="admin",
                is_staff=True,
                is_superuser=False,
                terms_accepted=True
            )
            # Set password for the user
            admin_user.set_password(DEFAULT_PASSWORD)
            admin_user.save()

            # Assign random modules (1-3) to each admin
            admin_user.module.set(random.sample(list(module_objects.values()),
                                                k=random.randint(1, min(3, len(module_objects)))))
            admin_user.save()

            self.stdout.write(self.style.SUCCESS(f"Created admin user: {username}"))
            admin_users.append(admin_user)
            created_users.append(admin_user)

        # Create verification records for the first 5 admin users
        self.stdout.write("\nCreating verification records for 5 admin users...")

        for i, admin in enumerate(admin_users[:5]):
            # Check if verification record already exists
            try:
                verification = AdminVerification.objects.get(admin=admin)
                self.stdout.write(self.style.WARNING(f"Verification record for '{admin.username}' already exists."))
            except AdminVerification.DoesNotExist:
                # Create a new verification record with a verification token
                verification_token = secrets.token_urlsafe(32)
                verification = AdminVerification.objects.create(
                    admin=admin,
                    is_verified=True,
                    verification_token=verification_token,
                    token_created_at=timezone.now()
                )
                self.stdout.write(self.style.SUCCESS(f"Created verification record for admin: {admin.username}"))

        # Create a service user
        service_username = "@service"
        service_email = "service@example.com"

        try:
            service_user = User.objects.get(username=service_username)
            self.stdout.write(self.style.WARNING(f"Service user '{service_username}' already exists."))
        except User.DoesNotExist:
            # Check if email already exists
            try:
                User.objects.get(email=service_email)
                # If email exists, generate a new unique one
                service_email = f"{uuid.uuid4().hex[:8]}_{service_email}"
            except User.DoesNotExist:
                # Email is unique, we can proceed
                pass

            service_user = User.objects.create(
                user_id=uuid.uuid4(),
                username=service_username,
                email=service_email,
                first_name="Service",
                last_name="User",
                user_type="service user",
                is_staff=False,
                is_superuser=False,
                terms_accepted=True
            )
            service_user.set_password(DEFAULT_PASSWORD)
            service_user.save()

            # Assign random tags and modules to service user
            service_user.tags.set(random.sample(list(tag_objects.values()), k=min(2, len(tag_objects))))
            service_user.module.set(random.sample(list(module_objects.values()),
                                                  k=random.randint(1, min(2, len(module_objects)))))
            service_user.save()

            self.stdout.write(self.style.SUCCESS(f"Created service user: {service_username}"))
            created_users.append(service_user)

        # Generate additional random service users
        for i in range(USER_COUNT):
            username = f"@user{i + 1}"
            email = f"user{i + 1}@example.com"

            # Skip if username already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f"User '{username}' already exists, skipping."))
                continue

            # Check if email already exists
            while User.objects.filter(email=email).exists():
                # Generate a unique email if it already exists
                email = f"user{i + 1}_{uuid.uuid4().hex[:8]}@example.com"

            user = User.objects.create(
                user_id=uuid.uuid4(),
                username=username,
                email=email,
                first_name=f"First{i + 1}",
                last_name=f"Last{i + 1}",
                user_type="service user",
                is_staff=False,
                is_superuser=False,
                terms_accepted=True
            )
            # Set password for the user
            user.set_password(DEFAULT_PASSWORD)
            user.save()

            # Assign random tags and modules to user
            user.tags.set(random.sample(list(tag_objects.values()), k=min(2, len(tag_objects))))
            user.module.set(random.sample(list(module_objects.values()),
                                          k=random.randint(1, min(2, len(module_objects)))))
            user.save()

            self.stdout.write(self.style.SUCCESS(f"Created service user: {username}"))
            created_users.append(user)

        self.stdout.write(self.style.SUCCESS("Database seeding complete!"))

        # Print details of created users
        self.stdout.write("\nCreated Users:")
        for user in created_users:
            tag_names = ", ".join([tag.tag for tag in user.tags.all()]) if user.tags.exists() else "None"
            module_names = ", ".join([module.title for module in
                                      user.module.all()]) if user.module.exists() else "None"  # Changed to 'title'

            # Check if user has verification (only for admins)
            verification_status = "N/A"
            if user.user_type == "admin":
                try:
                    verification = AdminVerification.objects.get(admin=user)
                    verification_status = "Verified" if verification.is_verified else "Not Verified"
                except AdminVerification.DoesNotExist:
                    verification_status = "No Verification Record"

            self.stdout.write(
                f"- Username: {user.username}, Email: {user.email}, Password: {DEFAULT_PASSWORD}, "
                f"Type: {user.user_type}, SuperUser: {user.is_superuser}, Staff: {user.is_staff}, "
                f"Verification: {verification_status}, Modules: {module_names}, Tags: {tag_names}"
            )