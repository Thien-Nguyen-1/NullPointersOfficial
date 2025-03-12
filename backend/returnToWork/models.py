from datetime import timezone
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser,Group,Permission
from django.db import models
from django.contrib.auth.models import User
import uuid
from django.core.exceptions import ValidationError
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey

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
        return f"-- {self.question}\n\t|YES|: {self.yes_next_q.question if self.yes_next_q else None}\n\t|NO|: {self.no_next_q.question if self.yes_next_q else None}"



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
        ('service user', 'Service user')
        
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
   
    
    # module = models.ForeignKey(Module, on_delete=models.CASCADE)
    # tags = models.ForeignKey(Tags, on_delete=models.CASCADE)

    module = models.ManyToManyField(Module)
    tags = models.ManyToManyField(Tags)

    class Meta:
        """Model options."""
        ordering = ['first_name', 'last_name']


    def full_name(self):
        """Return a string containing the user's full name."""

        return f'{self.first_name} {self.last_name}'
    

    def __str__(self):

        return f"{self.full_name()} - {self.username} - {self.user_id}"
    


class ProgressTracker(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)

    pinned = models.BooleanField(default=False)  
    hasLiked = models.BooleanField(default=False)

    items_completed = models.PositiveIntegerField(default=0)
    total_items = models.PositiveIntegerField(default=0)
    progress_percentage = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ('user', 'module')
    
    def update_progress(self):
        """Recalculate progress for this module"""
        # Count total items
        total_count = 0
        for model_name in ['InfoSheet', 'Video', 'Task', 'QuestionAnswerForm', 'MatchingQuestionQuiz']:
            model_class = self.get_content_class(model_name)
            if model_class:
                total_count += model_class.objects.filter(moduleID=self.module).count()
        
        self.total_items = total_count

        # Count viewed items
        viewed_count = 0
        for model_name in ['InfoSheet', 'Video', 'Task', 'QuestionAnswerForm', 'MatchingQuestionQuiz']:
            model_class = self.get_content_class(model_name)
            if model_class:
                # Get all IDs of this content type in this module
                item_ids = model_class.objects.filter(moduleID=self.module).values_list('contentID', flat=True)
                
                # Count viewed items
                if item_ids:
                    viewed = ContentProgress.objects.filter(
                        user=self.user,
                        content_type=model_name,
                        content_id__in=item_ids,
                        viewed=True
                    ).count()
                    viewed_count += viewed

        self.items_completed = viewed_count

        # Calculate percentage
        if self.total_items > 0:
            self.progress_percentage = (self.items_completed / self.total_items) * 100
        else:
            self.progress_percentage = 0

        # Mark as completed if all items are viewed
        if self.items_completed == self.total_items and self.total_items > 0:
            self.completed = True
        
        self.save()
    
    def get_content_class(self, class_name):
        """Get the actual model class based on class name string"""
        # This is a simplified approach - you'll need to import your models
        content_classes = {
            'InfoSheet': InfoSheet,
            'Video': Video,
            'Task': Task,
            'QuestionAnswerForm': QuestionAnswerForm,
            'MatchingQuestionQuiz': MatchingQuestionQuiz
        }
        return content_classes.get(class_name)

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
    # Primary Key
    # generate a unique identifier, cannot be manually changed, must be unique

    contentID= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=255)
    moduleID = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="%(class)s_contents")  # Link to Module (later)
    author= models.ForeignKey(User, on_delete=models.CASCADE, related_name="%(class)s_author_contents")
    description = models.TextField(blank=True, null=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    is_published= models.BooleanField(default=False)

    

    class Meta:
        abstract = True  # No separate table for Content Model, only the subclasses will have database tables

    def __str__(self):
        return self.title

# Extend Content class
class InfoSheet(Content):
    infosheet_file= models.FileField(upload_to="infosheets/")
    infosheet_content = models.TextField(blank=True, null=True)

class Video(Content):
    # videoID= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    video_file= models.FileField(upload_to="videos/")
    duration= models.PositiveBigIntegerField()
    thumbnail = models.ImageField(upload_to="thumbnails/", blank=True, null=True)

# This model defines the overall interactive quiz properties
class Task(Content):
    text_content = models.TextField()
    
    # Quiz type choices
    QUIZ_TYPE_CHOICES = [
        ('flashcard', 'Flashcard Quiz'),
        ('statement_sequence', 'Statement Sequence Quiz'),
        ('text_input', 'Text Input Quiz'),
        ('question_answer_form', 'Question Answer Form'),
        ('matching_questions', 'Matching Question Quiz')
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
    
    # For flashcard quiz type - optional text shown on the back of the card
    hint_text = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['order']
        
    def __str__(self):
        return f"{self.question_text[:30]}..."

#UserResponse captures only the user interaction data
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



class QuestionAnswerForm(Content):
    question = models.TextField()
    answer = models.TextField()

    def __str__(self):
        return self.question[:50]
    
class MatchingQuestionQuiz(Content):

    question = models.TextField()
    answer = models.TextField()

    def __str__(self):
        return self.question[:50]
    
 # Simplified ContentProgress for tracking viewed status only (no time tracking)
class ContentProgress(models.Model):
    """Track individual content completion status"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='content_progress')
    
    # This links to the specific content item (InfoSheet, Video, etc.)
    # Instead of ContentType, we'll handle the polymorphic relationship differently
    content_id = models.UUIDField()  # This will store the contentID from your Content subclasses
    content_type = models.CharField(max_length=50)  # Store the class name as a string
    
    # Progress tracking
    viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'content_type', 'content_id')
    
    def mark_as_viewed(self):
        self.viewed = True
        self.viewed_at = timezone.now()
        self.save()
        
        # Update the module progress after marking content as viewed
        self.update_module_progress()
    
    def update_module_progress(self):
        """Update the related module progress after content status changes"""
        # Find the content object and its module
        content_class = self.get_content_class()
        if content_class:
            try:
                content_obj = content_class.objects.get(contentID=self.content_id)
                module = content_obj.moduleID
                
                # Get or create progress tracker
                progress, created = ProgressTracker.objects.get_or_create(
                    user=self.user,
                    module=module
                )
                
                # Update the progress
                progress.update_progress()
            except Exception as e:
                print(f"Error updating module progress: {e}")
    
    def get_content_class(self):
        """Get the actual model class based on content_type string"""
        # This is a simplified approach - you'll need to import your models
        content_classes = {
            'InfoSheet': InfoSheet,
            'Video': Video,
            'Task': Task,
            'QuestionAnswerForm': QuestionAnswerForm,
            'MatchingQuestionQuiz': MatchingQuestionQuiz
        }
        return content_classes.get(self.content_type)
    
    def __str__(self):
        return f"{self.user.username} - {self.content_type} - {self.content_id}"


class LearningTimeLog(models.Model):
    " Aggregating dayily learning time data "
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='content_progress')
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
    module = models.ForeignKey('Module', on_delete=models.CASCADE)
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
