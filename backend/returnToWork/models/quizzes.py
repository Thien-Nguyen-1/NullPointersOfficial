# quizzes.py - Contains models for interactive quizzes and questionnaires
# This file handles all interactive assessment content in the platform

from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import JSONField

from returnToWork.models import Content

class Questionnaire(models.Model):
    """
    Decision Tree model for Yes/No questionnaires.
    
    This model implements a binary decision tree structure where each question
    can lead to two different follow-up questions based on Yes/No answers.
    It includes validation to prevent circular references in the tree.
    """
    # The question text
    question = models.CharField(max_length=50, blank=False)
    
    # Next question if user answers "yes" (can be null for end nodes)
    yes_next_q = models.ForeignKey(
        "self",
        on_delete = models.SET_NULL,
        null=True,
        blank=True,
        related_name="yes_previous_qs"
    )
    
    # Next question if user answers "no" (can be null for end nodes)
    no_next_q = models.ForeignKey(
        "self",
        on_delete = models.SET_NULL,
        null=True,
        blank=True,
        related_name="no_previous_qs"
    )

    def clean(self):
        """
        Validate the questionnaire structure to prevent circular references.
        Uses depth-first search to detect if a question references itself
        through its descendants.
        """
        def is_parent_question(other):
            """
            Helper function to test whether a given question is a parent 
            to the current question (using depth-first search).
            
            Returns True if 'other' is an ancestor of self, False otherwise.
            """
            # Returns False if other is null
            if not other:
                return False

            # Initialize search with the potential parent
            stack = [other]
            
            # Depth-first search through the question tree
            while stack:
                head = stack[-1]
                stack = stack[:-1]

                # If we find ourselves, we have a circular reference
                if head == self:
                    return True      
                      
                # Add children to the search stack
                left_child = head.yes_next_q
                right_child = head.no_next_q

                if left_child:
                    stack.append(left_child)
                if right_child:
                    stack.append(right_child)
    
            # No circular reference found
            return False

        def has_circular_references():
            """Check if either yes or no paths contain circular references."""
            return is_parent_question(self.yes_next_q) or is_parent_question(self.no_next_q)

        # Raise validation error if circular references are found
        if has_circular_references():
            raise ValidationError("You cannot reference an ancestor question in a descendant question")

    def __str__(self):
        """
        String representation showing the question and its Yes/No paths.
        Useful for debugging and in the admin interface.
        """
        return f"-- {self.question}\n\t|YES|: {self.yes_next_q.question if self.yes_next_q else None}\n\t|NO|: {self.no_next_q.question if self.yes_next_q else None}"

class Task(Content):
    """
    Interactive task/quiz model extending the base Content class.
    
    Tasks represent interactive elements like quizzes, flashcards, and
    question forms. They can have different quiz types and include
    one or more questions.
    """
    # The main text content of the task
    text_content = models.TextField()

    # Different types of interactive content
    QUIZ_TYPE_CHOICES = [
        ('flashcard', 'Flashcard Quiz'),             # Two-sided cards with question/answer
        ('statement_sequence', 'Statement Sequence Quiz'),  # Ordering statements correctly
        ('text_input', 'Text Input Quiz'),           # Free text responses
        ('question_input', 'Question Answer Form'),  # Structured Q&A
        ('pair_input', 'Matching Question Quiz')     # Matching items between columns
    ]

    # The type of quiz this task represents
    quiz_type = models.CharField(
        max_length=30,
        choices=QUIZ_TYPE_CHOICES,
        default='text_input',
    )

    def __str__(self):
        """String representation with title and quiz type."""
        return f"{self.title} ({self.get_quiz_type_display()})"

class QuizQuestion(models.Model):
    """
    Model for individual quiz questions within a Task.
    
    This allows Tasks to have multiple questions, each with its own
    text, order, and optional answer data. Questions can be ordered
    to create sequences within quizzes.
    """
    # The task this question belongs to
    task = models.ForeignKey('Task', on_delete=models.CASCADE, related_name='questions')
    
    # Question content
    question_text = models.TextField()
    
    # Position in the question sequence
    order = models.PositiveIntegerField(default=0)
    
    # Structured answer data (format depends on quiz type)
    answers = JSONField(blank=True, null=True)
    
    # For flashcard quiz type - text shown after user interaction
    hint_text = models.TextField(blank=True, null=True)

    class Meta:
        """Ensure questions are returned in the correct sequence."""
        ordering = ['order']

    def __str__(self):
        """String representation with truncated question text."""
        return f"{self.question_text[:30]}..."

class UserResponse(models.Model):
    """
    Model to store user responses to quiz questions.
    
    This tracks what users submitted for each question, when they
    submitted it, and links responses to both users and questions.
    """
    # The user who provided the response
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='quiz_responses')
    
    # The question being answered
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='responses')
    
    # The user's answer text
    response_text = models.TextField(blank=True)
    
    # When the response was submitted
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Order responses with newest first."""
        ordering = ['-submitted_at']

    def __str__(self):
        """String representation with user and question info."""
        return f"Response by {self.user.username} for {self.question}"