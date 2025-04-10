from django.utils import timezone
from django.core.validators import RegexValidator , EmailValidator
from django.contrib.auth.models import AbstractUser,Group,Permission
from django.db import models
from django.contrib.auth.models import User
import uuid
import os
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models import JSONField
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Questionnaire(models.Model):
    """Decision Tree like model to hold all the Yes/No questions in the questionnaire"""

    question =  models.CharField(max_length=50, blank=False)
    

    # The following attributes are references to the next relevant questions based on the user's answers to the above question
    yes_next_q = models.ForeignKey(
        "self",
        on_delete = models.SET_NULL,
        null=True,
        blank=True,
        related_name="yes_previous_qs"
    )
    no_next_q = models.ForeignKey(
        "self",
        on_delete = models.SET_NULL,
        null=True,
        blank=True,
        related_name="no_previous_qs"
    )


    def clean(self):
        def is_parent_question(other):
            """Helper function to test whether a given question is a parent to the current question (DFS)"""
            
            # Returns False is other is null
            if not other:
                return False


            stack = [other]
            
            while stack:
                head = stack[-1]
                stack = stack[:-1]

                if head == self:
                    return True      
                      
                left_child = head.yes_next_q
                right_child = head.no_next_q

                if left_child:
                    stack.append(left_child)
                if right_child:
                    stack.append(right_child)
    
            return False

        def has_circular_references():
            return is_parent_question(self.yes_next_q) or is_parent_question(self.no_next_q)



        if has_circular_references():
            raise ValidationError("You cannot reference an ancestor question in a descendant question")

    def __str__(self):
        return f"-- {self.question}\n\t|YES|: {self.yes_next_q.question if self.yes_next_q else None}\n\t|NO|: {self.no_next_q.question if self.no_next_q else None}\n"



class Module(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    id = models.AutoField(primary_key=True)  
    tags = models.ManyToManyField('Tags', related_name='modules_for_tag', blank=True)
    upvotes = models.PositiveIntegerField(default=0) 

    def upvote(self):
        self.upvotes += 1
        self.save()

    def downvote(self):
        self.upvotes -= 1
        self.save()

    def save(self, *args, **kwargs):
        self.title = self.title.title()  
        super(Module, self).save(*args, **kwargs)

    def __str__(self):
        return self.title




class Tags(models.Model):
    """A class to create the model for tags, which are used to categorise courses and medical professional according to each issue"""
    tag = models.CharField(max_length=50, unique=True, error_messages={ 'unique': "A tag with this name already exists." })
    modules = models.ManyToManyField('Module', related_name='tags_for_module', blank=True)

    def clean(self):
        # Normalize the tag to lowercase.
        self.tag = self.tag.lower()
        # Check for duplicate tags in a case-insensitive manner.
        if Tags.objects.filter(tag=self.tag).exclude(pk=self.pk).exists():
            raise ValidationError({"tag": "A tag with this name already exists."})
        super().clean()

    def save(self, *args, **kwargs):
        """tag are normalised to lower case and stored"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        """ Capitalize the first letter for display purposes"""
        return self.tag.capitalize()

    @classmethod
    def get_valid_tags(cls):
        """ Helper method to get list of valid tags"""
        return list(cls.objects.values_list('tag', flat=True))


class User(AbstractUser):
    """Model used for user authentication, and team member related information."""

    user_id = models.UUIDField(default = uuid.uuid4, editable=False, unique=True)

    USER_TYPE_CHOICES = [
        ('admin', 'Admin'),
        ('service user', 'Service user'),
        ('superadmin', 'Super Admin')
        
    ]

    user_type = models.CharField(
        max_length=30,
        choices=USER_TYPE_CHOICES,
        blank=False,
        null=False,
    )

    username = models.CharField(
        max_length=30,
        unique=True,
        validators=[RegexValidator(
            regex=r'^@\w{3,}$',
            message='Username must consist of @ followed by at least three alphanumericals'
        )]
    )
    first_name = models.CharField(max_length=50, blank=False)
    last_name = models.CharField(max_length=50, blank=False)
   
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator(message="Enter a valid email address.")],
        blank=False,
        null=False
    )
    
    # module = models.ForeignKey(Module, on_delete=models.CASCADE)
    # tags = models.ForeignKey(Tags, on_delete=models.CASCADE)
    
    is_first_login = models.BooleanField(default =True)

    module = models.ManyToManyField(Module)
    tags = models.ManyToManyField(Tags)
    terms_accepted = models.BooleanField(default=False)

    firebase_token = models.TextField(
        default="",
        blank=False,
        null=False,
    )

    class Meta:
        """Model options."""
        ordering = ['first_name', 'last_name']

    def full_name(self):
        """Return a string containing the user's full name."""

        return f'{self.first_name} {self.last_name}'

    def __str__(self):
        return f"{self.full_name()} - {self.username} - {self.user_id}"

# adding this since the implementation now is ONLY superadmin is allowed to create admin (admin cant simply sign up using the signup page)
# so this separates verification data --> to avoid redundancy since service user and superadmin dont need this
class AdminVerification(models.Model):
    """Model to track admin verification status and token information separately from User model"""
    admin = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification')
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=255, null=True, blank=True)
    token_created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Verification for {self.admin.username}"
        
    def is_token_expired(self):
        """Check if token is expired (older than 48 hours)"""
        if not self.verification_token or not self.token_created_at:
            return True
        expiration = self.token_created_at + timezone.timedelta(hours=72)
        # verification link expires after 3 days 
        return timezone.now() > expiration


#task has a module id - but 

class ProgressTracker(models.Model):
    """Track overall module progress"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)
    hasLiked = models.BooleanField(default=False)
    contents_completed = models.PositiveIntegerField(default=0)
    total_contents = models.PositiveIntegerField(default=0)
    progress_percentage = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ('user', 'module')
    
    def update_progress(self):
        """Recalculate progress for this module"""
        # Get ContentType for each model
        content_models = [Document, EmbeddedVideo, Task, Document, Image,AudioClip, RankingQuestion]
        content_types = [ContentType.objects.get_for_model(model) for model in content_models]
        
        # Count total contents
        total_count = 0
        for model in content_models:
            total_count += model.objects.filter(moduleID=self.module).count()
        
        self.total_contents = total_count

        # Count viewed contents
        viewed_count = 0
        for model, content_type in zip(content_models, content_types):
            # Get all IDs of this content type in this module
            content_ids = model.objects.filter(moduleID=self.module).values_list('contentID', flat=True)
            
            # Count viewed contents
            if content_ids:
                viewed = ContentProgress.objects.filter(
                    user=self.user,
                    content_type=content_type,
                    object_id__in=content_ids,
                    viewed=True
                ).count()
                viewed_count += viewed

        self.contents_completed = viewed_count

        # Calculate percentage
        if self.total_contents > 0:
            self.progress_percentage = (self.contents_completed / self.total_contents) * 100
        else:
            self.progress_percentage = 0

        # Mark as completed if all items are viewed
        if self.contents_completed == self.total_contents and self.total_contents > 0:
            self.completed = True
        
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.module.title} - {'Completed' if self.completed else 'Incomplete'}"

class UserModuleInteraction(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)

    hasPinned = models.BooleanField(default=False)
    hasLiked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.module.title} - Pinned: {self.hasPinned} - Liked: {self.hasLiked}"

# Model for Content
# Parent class for ALL Content Types
class Content(models.Model):
    contentID= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True, auto_created=True)
    title = models.CharField(max_length=255, null=True)
    moduleID = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="%(class)s_contents")  # Link to Module (later)
    author= models.ForeignKey(User, on_delete=models.CASCADE, related_name="%(class)s_author_contents")
    description = models.TextField(blank=True, null=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    is_published= models.BooleanField(default=False)
    order_index = models.IntegerField(default=0)  # to store order

    class Meta:
        abstract = True  # No separate table for Content Model, only the subclasses will have database tables

    def __str__(self):
        return self.title

class RankingQuestion(Content):
    """Model for Ranking Question content type"""
    tiers = models.JSONField()

class Image(Content):
    file_url = models.CharField(max_length=255)
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    file_size_formatted = models.CharField(max_length=20, null=True, blank=True)
    file_type = models.CharField(max_length=10)
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-updated_at']  # Using updated_at from Content model

    def save(self, *args, **kwargs):
        # Format file size for display (e.g., "2.5 MB")
        if self.file_size:
            size = self.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024 or unit == 'GB':
                    if unit == 'B':
                        self.file_size_formatted = f"{size} {unit}"
                    else:
                        self.file_size_formatted = f"{size:.2f} {unit}"
                    break
                size /= 1024
        super().save(*args, **kwargs)

def audio_file_path(instance, filename):
    """Generate file path for new audio file"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads/audios/', filename)

class AudioClip(Content):
    """Model for Audio Clip content type"""
    audio_file = models.FileField(upload_to=audio_file_path)
    filename = models.CharField(max_length=255, null=True, blank=True)
    file_type = models.CharField(max_length=50, null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)  # size in bytes
    duration = models.FloatField(null=True, blank=True)  # in seconds
    
    def __str__(self):
        return self.title or self.filename or "Audio Clip"
    
    @property
    def file_url(self):
        return self.audio_file.url if self.audio_file else None
    
    @property
    def file_size_formatted(self):
        """Return human-readable file size."""
        size = self.file_size
        if not size:
            return None
            
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024
    
    def delete(self, *args, **kwargs):
        # Delete the file from storage when model instance is deleted
        if self.audio_file:
            if os.path.isfile(self.audio_file.path):
                os.remove(self.audio_file.path)
        super().delete(*args, **kwargs)

class Document(Content):
    """Model for Attach PDF/Documents/Infosheet content type"""
    # documents = models.JSONField()  # Stores document metadata as JSON
    # Each document will have: name, title, url, fileType
    file = models.FileField(upload_to="documents/", null=True, blank=True)
    filename = models.CharField(max_length=255, null=True, blank=True)
    file_type = models.CharField(max_length=50, null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)  # size in bytes
    upload_date = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return self.filename or ""
    
    @property
    def file_url(self):
        return self.file.url if self.file else None
    
    @property
    def file_size_formatted(self):
        """Return human-readable file size."""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024
    
    def delete(self, *args, **kwargs):
        # Delete the file from storage when model instance is deleted
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

class EmbeddedVideo(Content):
    """Model for Embedded Video content type"""
    video_url = models.URLField()
    video_id = models.CharField(max_length=100, blank=True, null=True)   # extracted ID from URL

    class Meta:
        ordering = ['-created_at']  # Order by most recent first
        verbose_name = "Embedded Video"
        verbose_name_plural = "Embedded Videos"

    def extract_video_id(self):
        """Extracts video ID from URL - can be implemented for specific platforms"""


# This model defines the overall interactive quiz properties
class Task(Content):
    text_content = models.TextField()

    # Quiz type choices
    QUIZ_TYPE_CHOICES = [
        ('flashcard', 'Flashcard Quiz'),
        ('statement_sequence', 'Statement Sequence Quiz'),
        ('text_input', 'Text Input Quiz'),
        ('question_input', 'Question Answer Form'),
        ('pair_input', 'Matching Question Quiz'),
        ('ranking_quiz', 'Ranking Quiz')
    ]

    quiz_type = models.CharField(
        max_length=30,
        choices=QUIZ_TYPE_CHOICES,
        default='text_input',
    )

    def __str__(self):
        return f"{self.title} ({self.get_quiz_type_display()})"


# QuizQuestion stores the individual questions
class QuizQuestion(models.Model):
    """
    Model to store individual quiz questions tied to a Task.
    This allows for multiple questions per quiz/task.
    """
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    order = models.PositiveIntegerField(default=0)  # For ordering questions in sequence
    answers = JSONField(blank=True, null=True)
    # For flashcard quiz type - optional text shown on the back of the card
    hint_text = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.question_text[:30]}..."


# UserResponse captures only the user interaction data
class UserResponse(models.Model):
    """
    Model to store user responses to quiz questions.
    No correct/incorrect validation - just storing what the user submitted.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_responses')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='responses')
    response_text = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Response by {self.user.username} for {self.question}"


class Conversation(models.Model): #one-to-many relationship with Messages
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="user_conversation")
    admin = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="admin_conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    hasEngaged = models.BooleanField(default=False)
    lastMessage = models.TextField(default="")

    def __str__(self):
        return f"Conversation created for: {self.user} and {self.admin}"


class Message(models.Model):    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    text_content = models.TextField()
    timestamp =  models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to="message-files/", null=True)

    def __str__(self):
        return f"Text sent: {self.text_content}"
            



    
 # Simplified ContentProgress for tracking viewed status only (no time tracking)
class ContentProgress(models.Model):
    """Track individual content completion status"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='content_viewed_progress')
    
    # Using Django's ContentType framework
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()  # Using UUID for Content subclasses
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Progress tracking
    viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'content_type', 'object_id')
    
    def mark_as_viewed(self):
        self.viewed = True
        self.viewed_at = timezone.now()
        self.save()
        
        # Update the module progress after marking content as viewed
        module = self.content_object.moduleID
        progress, created = ProgressTracker.objects.get_or_create(
            user=self.user,
            module=module
        )
        progress.update_progress()
    
    def __str__(self):
        return f"{self.user.username} - {self.content_type} - {self.object_id}"


class LearningTimeLog(models.Model):
    " Aggregating dayily learning time data "
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_time_logs')
    date = models.DateField()
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    time_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'date', 'module')

    @property
    def time_minutes(self):
        return self.time_seconds // 60
    
    @classmethod
    def update_from_session(cls, user_content_progress):
        """Update daily learning time from a content view session"""
        today = timezone.now().date()
        module = user_content_progress.content_object.moduleID
        
        learning_time, created = cls.objects.get_or_create(
            user=user_content_progress.user,
            date=today,
            module=module
        )
        
        learning_time.time_seconds += user_content_progress.total_time_seconds
        learning_time.save()
        
        return learning_time


# New model for page-level session tracking
class PageViewSession(models.Model):
    """Track user sessions at the page/module level"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='page_sessions')
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now_add=True)
    total_time_seconds = models.PositiveIntegerField(default=0)
    ended = models.BooleanField(default=False)
    
    def update_activity(self):
        now = timezone.now()
        if self.last_activity:
            # Only count time if less than 5 minutes since last activity
            time_diff = (now - self.last_activity).total_seconds()
            if time_diff < 300:  # 5 minutes in seconds
                self.total_time_seconds += int(time_diff)
        self.last_activity = now
        self.save()
    
    def end_session(self):
        self.update_activity()
        self.ended = True
        self.save()
        
        # Update learning time log
        today = timezone.now().date()
        learning_time, created = LearningTimeLog.objects.get_or_create(
            user=self.user,
            date=today,
            module=self.module
        )
        learning_time.time_seconds += self.total_time_seconds
        learning_time.save()
    
    def __str__(self):
        return f"{self.user.username} - {self.module.title} Session"
    
class TermsAndConditions(models.Model):
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_terms')
    
    class Meta:
        verbose_name = 'Terms and Conditions'
        verbose_name_plural = 'Terms and Conditions'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Terms and Conditions (Updated: {self.updated_at.strftime('%Y-%m-%d')})"
