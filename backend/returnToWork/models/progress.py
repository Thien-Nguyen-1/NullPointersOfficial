# progress.py - Contains models for tracking user progress and interaction
# This file handles all aspects of monitoring user engagement with content

from datetime import timezone
import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class ProgressTracker(models.Model):
    """
    Track overall module progress for a user.
    
    This model maintains high-level statistics about a user's progress
    through a module, including completion status, interaction flags,
    and percentage complete. It aggregates data from individual
    ContentProgress records.
    """
    # The user whose progress is being tracked
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    
    # The module being tracked
    module = models.ForeignKey('modules.Module', on_delete=models.CASCADE)
    
    # Module completion and interaction flags
    completed = models.BooleanField(default=False)  # Overall completion status
    pinned = models.BooleanField(default=False)     # Module is pinned by user
    hasLiked = models.BooleanField(default=False)   # Module is liked by user
    
    # Progress metrics
    contents_completed = models.PositiveIntegerField(default=0)  # Number of completed content items
    total_contents = models.PositiveIntegerField(default=0)      # Total content items in module
    progress_percentage = models.FloatField(default=0.0)         # Calculated percentage complete
    
    class Meta:
        """Ensure unique user-module pairs."""
        unique_together = ('user', 'module')
    
    def update_progress(self):
        """
        Recalculate progress for this module.
        
        This method counts all content items in the module, then checks how many
        have been viewed by the user. It updates the progress metrics and
        determines if the module is complete.
        """
        # Import content models here to avoid circular imports
        from .content import InfoSheet, Video
        from .quizzes import Task
        
        # Get ContentType for each content model
        content_models = [InfoSheet, Video, Task]
        content_types = [ContentType.objects.get_for_model(model) for model in content_models]
        
        # Count total contents in this module
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
        """String representation with user, module, and completion status."""
        return f"{self.user.username} - {self.module.title} - {'Completed' if self.completed else 'Incomplete'}"

class UserModuleInteraction(models.Model):
    """
    Track user interactions with modules.
    
    This model stores user preferences related to modules, such as
    whether they've pinned (bookmarked) or liked a module.
    """
    # The user interacting with the module
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    
    # The module being interacted with
    module = models.ForeignKey('modules.Module', on_delete=models.CASCADE)
    
    # Interaction flags
    hasPinned = models.BooleanField(default=False)  # User has pinned this module
    hasLiked = models.BooleanField(default=False)   # User has liked this module

    def __str__(self):
        """String representation with user, module, and interaction status."""
        return f"{self.user.username} - {self.module.title} - Pinned: {self.hasPinned} - Liked: {self.hasLiked}"

class ContentProgress(models.Model):
    """
    Track individual content completion status.
    
    This model uses Django's ContentType framework to track progress
    for any type of content, allowing for a unified way to record
    user interaction with videos, documents, quizzes, etc.
    """
    # The user whose progress is being tracked
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='content_viewed_progress')
    
    # ContentType framework for generic foreign key
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()  # Using UUID for Content subclasses
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Progress tracking
    viewed = models.BooleanField(default=False)           # Whether content has been viewed
    viewed_at = models.DateTimeField(null=True, blank=True)  # When it was viewed
    
    class Meta:
        """Ensure we track each content item only once per user."""
        unique_together = ('user', 'content_type', 'object_id')
    
    def mark_as_viewed(self):
        """
        Mark this content as viewed by the user.
        
        This also updates the timestamp and triggers an update
        of the overall module progress.
        """
        from django.utils import timezone  # Import here to avoid circular imports
        
        # Update this record
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
        """String representation with user, content type, and object ID."""
        return f"{self.user.username} - {self.content_type} - {self.object_id}"

class LearningTimeLog(models.Model):
    """
    Aggregate daily learning time data.
    
    This model tracks how much time users spend learning each day,
    broken down by module. It aggregates data from individual
    sessions into daily totals.
    """
    # The user whose time is being tracked
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='learning_time_logs')
    
    # The date of the learning activity
    date = models.DateField()
    
    # The module being learned
    module = models.ForeignKey('modules.Module', on_delete=models.CASCADE)
    
    # Total time spent learning (in seconds)
    time_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        """Ensure we track only one record per user/date/module combination."""
        unique_together = ('user', 'date', 'module')

    @property
    def time_minutes(self):
        """
        Property to get time in minutes.
        Provides easy access to time data in a more readable format.
        """
        return self.time_seconds // 60
    
    @classmethod
    def update_from_session(cls, user_content_progress):
        """
        Update daily learning time from a content view session.
        
        This class method creates or updates the daily time log based
        on time spent viewing content.
        """
        from django.utils import timezone  # Import here to avoid circular imports
        
        # Get today's date
        today = timezone.now().date()
        
        # Get the module from the content
        module = user_content_progress.content_object.moduleID
        
        # Get or create the learning time log for today
        learning_time, created = cls.objects.get_or_create(
            user=user_content_progress.user,
            date=today,
            module=module
        )
        
        # Add the session time to the daily total
        learning_time.time_seconds += user_content_progress.total_time_seconds
        learning_time.save()
        
        return learning_time

class PageViewSession(models.Model):
    """
    Track user sessions at the page/module level.
    
    This model records detailed information about individual user
    sessions, including start time, activity time, and total time.
    It uses active timing to avoid counting idle time.
    """
    # Unique session identifier
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Session user and module
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='page_sessions')
    module = models.ForeignKey('modules.Module', on_delete=models.CASCADE)
    
    # Session timing
    start_time = models.DateTimeField(auto_now_add=True)     # When session started
    last_activity = models.DateTimeField(auto_now_add=True)  # Last user activity
    total_time_seconds = models.PositiveIntegerField(default=0)  # Accumulated active time
    
    # Session status
    ended = models.BooleanField(default=False)  # Whether session has ended
    
    def update_activity(self):
        """
        Record user activity in this session.
        
        Updates the last activity timestamp and calculates time spent
        since the last activity. Only counts time if less than 5 minutes
        has passed (to avoid counting idle time).
        """
        from django.utils import timezone  # Import here to avoid circular imports
        
        now = timezone.now()
        if self.last_activity:
            # Only count time if less than 5 minutes since last activity
            time_diff = (now - self.last_activity).total_seconds()
            if time_diff < 300:  # 5 minutes in seconds
                self.total_time_seconds += int(time_diff)
        self.last_activity = now
        self.save()
    
    def end_session(self):
        """
        End the current session.
        
        Finalizes the session timing and updates the learning time log
        with the accumulated time.
        """
        from django.utils import timezone  # Import here to avoid circular imports
        
        # Update one last time
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
        """String representation with user and module info."""
        return f"{self.user.username} - {self.module.title} Session"