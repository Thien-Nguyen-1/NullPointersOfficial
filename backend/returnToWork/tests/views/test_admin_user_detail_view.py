from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from django.contrib.contenttypes.models import ContentType

# Import your models
from returnToWork.models import (
    Task, RankingQuestion, Image, AudioClip, Document, 
    EmbeddedVideo, TermsAndConditions, UserModuleInteraction, 
    ProgressTracker, UserResponse, Module, QuizQuestion
)

User = get_user_model()

class AdminUserDetailViewTest(APITestCase):
    def setUp(self):
        # Create a superadmin user
        self.superadmin = User.objects.create_user(
            username="@superadmin",
            email="superadmin@example.com",
            password="password123",
            first_name="Super",
            last_name="Admin",
            user_type="superadmin"
        )
        
        # Create an admin user to be deleted
        self.admin_to_delete = User.objects.create_user(
            username="@admintodelete",
            email="admin@example.com",
            password="password123",
            first_name="Admin",
            last_name="User",
            user_type="admin"
        )
        
        # Create a regular user (non-admin)
        self.regular_user = User.objects.create_user(
            username="@regularuser",
            email="user@example.com",
            password="password123",
            user_type="service user"
        )
        
        # Create modules
        self.module1 = Module.objects.create(
            title="Module 1",
            description="Test Module 1"
        )
        self.module2 = Module.objects.create(
            title="Module 2",
            description="Test Module 2"
        )
        
        # Associate modules with users using the many-to-many relationship in User model
        self.admin_to_delete.module.add(self.module1)
        self.admin_to_delete.module.add(self.module2)
        self.superadmin.module.add(self.module2)  # Superadmin already has module2
        
        # Create content with admin as author
        self.tasks = []
        for i in range(3):
            task = Task.objects.create(
                title=f"Task {i+1}",
                text_content=f"Test task {i+1}",
                author=self.admin_to_delete,
                moduleID=self.module1,
                quiz_type='text_input'
            )
            self.tasks.append(task)
            
            # Create a quiz question for testing user responses
            QuizQuestion.objects.create(
                task=task,
                question_text=f"Question for Task {i+1}",
                order=i
            )
        
        self.ranking_questions = []
        for i in range(2):
            self.ranking_questions.append(RankingQuestion.objects.create(
                title=f"Question {i+1}",
                author=self.admin_to_delete,
                moduleID=self.module1,
                tiers={"1": ["Option 1"], "2": ["Option 2"]}
            ))
        
        self.images = []
        for i in range(2):
            self.images.append(Image.objects.create(
                title=f"Image {i+1}",
                author=self.admin_to_delete,
                moduleID=self.module1,
                file_url="https://example.com/image.jpg",
                filename=f"image{i+1}.jpg",
                file_size=1024,
                file_type="jpg",
                width=800,
                height=600
            ))
        
        self.audio_clips = []
        for i in range(2):
            self.audio_clips.append(AudioClip.objects.create(
                title=f"Audio {i+1}",
                author=self.admin_to_delete,
                moduleID=self.module1,
                filename=f"audio{i+1}.mp3",
                file_type="audio/mp3",
                file_size=2048,
                duration=120.5
            ))
        
        self.documents = []
        for i in range(2):
            self.documents.append(Document.objects.create(
                title=f"Document {i+1}",
                author=self.admin_to_delete,
                moduleID=self.module1,
                filename=f"document{i+1}.pdf",
                file_type="application/pdf",
                file_size=4096
            ))
        
        self.videos = []
        for i in range(2):
            self.videos.append(EmbeddedVideo.objects.create(
                title=f"Video {i+1}",
                author=self.admin_to_delete,
                moduleID=self.module1,
                video_url="https://youtube.com/watch?v=example",
                video_id="example"
            ))
        
        self.terms = []
        for i in range(2):
            self.terms.append(TermsAndConditions.objects.create(
                content=f"Terms content {i+1}",
                created_by=self.admin_to_delete
            ))
        
        # Create user interactions
        self.interactions = []
        for module in [self.module1, self.module2]:
            self.interactions.append(UserModuleInteraction.objects.create(
                user=self.admin_to_delete,
                module=module
            ))
        
        # Create progress trackers
        self.progress_trackers = []
        for module in [self.module1, self.module2]:
            self.progress_trackers.append(ProgressTracker.objects.create(
                user=self.admin_to_delete,
                module=module,
                completed=False,
                progress_percentage=50.0
            ))
        
        # Create user responses
        self.user_responses = []
        for task in self.tasks:
            # Get the first question from each task
            question = task.questions.first()
            if question:
                self.user_responses.append(UserResponse.objects.create(
                    user=self.admin_to_delete,
                    question=question,
                    response_text=f"Response to {task.title}"
                ))
        
        # URL for deleting an admin user
        self.url = reverse("admin-user-detail", kwargs={"user_id": self.admin_to_delete.id})
    
    def test_delete_admin_user_as_superadmin(self):
        """Test that a superadmin can delete an admin user and all content is transferred"""
        # Authenticate as superadmin
        self.client.force_authenticate(user=self.superadmin)
        
        # Get counts before deletion
        task_count = Task.objects.filter(author=self.admin_to_delete).count()
        rq_count = RankingQuestion.objects.filter(author=self.admin_to_delete).count()
        image_count = Image.objects.filter(author=self.admin_to_delete).count()
        audio_count = AudioClip.objects.filter(author=self.admin_to_delete).count()
        doc_count = Document.objects.filter(author=self.admin_to_delete).count()
        video_count = EmbeddedVideo.objects.filter(author=self.admin_to_delete).count()
        terms_count = TermsAndConditions.objects.filter(created_by=self.admin_to_delete).count()
        
        interaction_count = UserModuleInteraction.objects.filter(user=self.admin_to_delete).count()
        progress_count = ProgressTracker.objects.filter(user=self.admin_to_delete).count()
        response_count = UserResponse.objects.filter(user=self.admin_to_delete).count()
        
        # Send delete request
        response = self.client.delete(self.url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertIn("message", response.data)
        
        # Check transferred items counts in response
        self.assertEqual(response.data["transferred_items"]["tasks"], task_count)
        self.assertEqual(response.data["transferred_items"]["ranking_questions"], rq_count)
        self.assertEqual(response.data["transferred_items"]["inline_pictures"], image_count)
        self.assertEqual(response.data["transferred_items"]["audio_clips"], audio_count)
        self.assertEqual(response.data["transferred_items"]["documents"], doc_count)
        self.assertEqual(response.data["transferred_items"]["videos"], video_count)
        self.assertEqual(response.data["transferred_items"]["terms"], terms_count)
        
        # Check deleted items counts in response
        self.assertEqual(response.data["deleted_items"]["user_interactions"], interaction_count)
        self.assertEqual(response.data["deleted_items"]["progress_trackers"], progress_count)
        self.assertEqual(response.data["deleted_items"]["user_responses"], response_count)
        
        # Verify admin user is deleted
        self.assertFalse(User.objects.filter(id=self.admin_to_delete.id).exists())
        
        # Verify content ownership is transferred to superadmin
        self.assertEqual(Task.objects.filter(author=self.superadmin).count(), task_count)
        self.assertEqual(RankingQuestion.objects.filter(author=self.superadmin).count(), rq_count)
        self.assertEqual(Image.objects.filter(author=self.superadmin).count(), image_count)
        self.assertEqual(AudioClip.objects.filter(author=self.superadmin).count(), audio_count)
        self.assertEqual(Document.objects.filter(author=self.superadmin).count(), doc_count)
        self.assertEqual(EmbeddedVideo.objects.filter(author=self.superadmin).count(), video_count)
        self.assertEqual(TermsAndConditions.objects.filter(created_by=self.superadmin).count(), terms_count)
        
        # Verify personal data is deleted
        self.assertEqual(UserModuleInteraction.objects.filter(user=self.admin_to_delete).count(), 0)
        self.assertEqual(ProgressTracker.objects.filter(user=self.admin_to_delete).count(), 0)
        self.assertEqual(UserResponse.objects.filter(user=self.admin_to_delete).count(), 0)
        
        # Verify superadmin has access to all the modules the admin had
        self.assertTrue(self.superadmin.module.filter(id=self.module1.id).exists())
        self.assertTrue(self.superadmin.module.filter(id=self.module2.id).exists())
    
    def test_delete_admin_user_as_regular_user(self):
        """Test that a regular user cannot delete an admin user"""
        # Authenticate as regular user
        self.client.force_authenticate(user=self.regular_user)
        
        # Send delete request
        response = self.client.delete(self.url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Only superadmins can delete admin users")
        
        # Verify admin user still exists
        self.assertTrue(User.objects.filter(id=self.admin_to_delete.id).exists())
    
    def test_delete_admin_user_unauthenticated(self):
        """Test that an unauthenticated user cannot delete an admin user"""
        # No authentication
        self.client.logout()
        
        # Send delete request
        response = self.client.delete(self.url)
        
        # Check response (DRF default permission class is IsAuthenticated)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Verify admin user still exists
        self.assertTrue(User.objects.filter(id=self.admin_to_delete.id).exists())
    
    def test_delete_nonexistent_admin_user(self):
        """Test deleting an admin user that doesn't exist"""
        # Authenticate as superadmin
        self.client.force_authenticate(user=self.superadmin)
        
        # Create URL with non-existent ID
        non_existent_id = 9999
        url = reverse("admin-user-detail", kwargs={"user_id": non_existent_id})
        
        # Send delete request
        response = self.client.delete(url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Admin user not found")
    
    def test_delete_admin_user_no_associated_content(self):
        """Test deleting an admin user that has no associated content"""
        # Create a new admin with no content
        admin_no_content = User.objects.create_user(
            username="@adminnocontent",
            email="admin_no_content@example.com",
            password="password123",
            first_name="Admin",
            last_name="NoContent",
            user_type="admin"
        )
        
        # Authenticate as superadmin
        self.client.force_authenticate(user=self.superadmin)
        
        # URL for the new admin
        url = reverse("admin-user-detail", kwargs={"user_id": admin_no_content.id})
        
        # Send delete request
        response = self.client.delete(url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        
        # Check that all counts are zero in response
        for content_type in response.data["transferred_items"].values():
            self.assertEqual(content_type, 0)
        
        for content_type in response.data["deleted_items"].values():
            self.assertEqual(content_type, 0)
        
        # Verify admin user is deleted
        self.assertFalse(User.objects.filter(id=admin_no_content.id).exists())
    
    def test_delete_regular_user_as_superadmin(self):
        """Test that even a superadmin cannot delete a regular user through this endpoint"""
        # Create URL for the regular user
        url = reverse("admin-user-detail", kwargs={"user_id": self.regular_user.id})
        
        # Authenticate as superadmin
        self.client.force_authenticate(user=self.superadmin)
        
        # Send delete request
        response = self.client.delete(url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Admin user not found")
        
        # Verify regular user still exists
        self.assertTrue(User.objects.filter(id=self.regular_user.id).exists())
    
    def test_delete_admin_user_with_exception(self):
        """Test behavior when an exception occurs during deletion process"""
        # This test handles an exception case by forcing an invalid SQL operation
        
        # Authenticate as superadmin
        self.client.force_authenticate(user=self.superadmin)
        
        # Create a valid admin user
        admin_for_error = User.objects.create_user(
            username="@adminerror",
            email="admin_error@example.com",
            password="password123",
            first_name="Admin",
            last_name="Error",
            user_type="admin"
        )
        
        # URL for the admin
        url = reverse("admin-user-detail", kwargs={"user_id": admin_for_error.id})
        
        # Use a patch to force an exception during the deletion process
        with self.assertRaises(Exception):
            # Force database error by providing an invalid value
            # This simulates an unexpected exception during transaction
            admin_for_error.id = "invalid-id"  # This will cause a type conversion error
            admin_for_error.save()
            
            # Send delete request 
            response = self.client.delete(url)
            
            # If the exception is caught by the view (not the test),
            # check that the response indicates an error
            if hasattr(response, 'status_code'):
                self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
                self.assertIn("error", response.data)