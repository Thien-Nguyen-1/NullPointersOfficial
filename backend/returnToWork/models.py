from django.core.validators import RegexValidator , EmailValidator
from django.contrib.auth.models import AbstractUser,Group,Permission
from django.db import models
from django.contrib.auth.models import User
import uuid
from django.core.exceptions import ValidationError
from django.conf import settings

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
    

#task has a module id - but 

class ProgressTracker(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)
    hasLiked = models.BooleanField(default=False)
    
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

    class Meta:
        abstract = True  # No separate table for Content Model, only the subclasses will have database tables

    def __str__(self):
        return self.title

class RankingQuestion(Content):
    """Model for Ranking Question content type"""
    tiers = models.JSONField()

class InlinePicture(Content):
    """Model for Inline Picture content type"""
    image_file = models.ImageField(upload_to="inline_pictures/")

class AudioClip(Content):
    """Model for Audio Clip content type"""
    question_text = models.TextField(null=True, blank=True)
    audio_file = models.FileField(upload_to="audio_clips/")
    user_response = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Audio Clip : {self.question_test}"

class Document(Content):
    """Model for Attach PDF/Documents/Infosheet content type"""
    documents = models.JSONField()  # Stores document metadata as JSON
    # Each document will have: name, title, url, fileType

class EmbeddedVideo(Content):
    """Model for Embedded Video content type"""
    video_url = models.URLField()

# Extend Content class
class InfoSheet(Content):
    infosheet_file = models.FileField(upload_to="infosheets/")
    infosheet_content = models.TextField(blank=True, null=True)


class Video(Content):
    # videoID= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    video_file = models.FileField(upload_to="videos/")
    duration = models.PositiveBigIntegerField()
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
