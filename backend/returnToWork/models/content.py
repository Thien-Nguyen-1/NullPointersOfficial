# content.py - Contains all content type models
# This file defines the various types of content that can be added to modules

import uuid
from django.db import models

class Content(models.Model):
    """
    Abstract base class for all content types in the system.
    
    Content is the base class for all learning materials in the platform.
    It defines common fields and behavior shared by all content types
    (videos, documents, quizzes, etc). As an abstract model, no database
    table is created for this class directly - only for its subclasses.
    """
    # Unique identifier for content
    contentID = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True, auto_created=True)
    
    # Basic content metadata
    title = models.CharField(max_length=255, null=True)
    moduleID = models.ForeignKey('modules.Module', on_delete=models.CASCADE, related_name="%(class)s_contents")
    author = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name="%(class)s_author_contents")
    description = models.TextField(blank=True, null=True)
    
    # Timestamps for tracking content lifecycle
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Publication status (draft vs published)
    is_published = models.BooleanField(default=False)

    class Meta:
        # No database table will be created for this model
        abstract = True

    def __str__(self):
        """String representation showing the content title."""
        return self.title

class RankingQuestion(Content):
    """
    Model for Ranking Question content type.
    
    Allows users to rank items across different tiers or categories.
    The tiers field stores the structure and items as JSON.
    """
    tiers = models.JSONField()  # Stores the ranking question structure

class InlinePicture(Content):
    """
    Model for Inline Picture content type.
    
    Represents image content that can be embedded within modules.
    """
    image_file = models.ImageField(upload_to="inline_pictures/")  # The actual image file

class AudioClip(Content):
    """
    Model for Audio Clip content type.
    
    Audio content that can include a question and allow for user responses.
    """
    question_text = models.TextField(null=True, blank=True)  # Optional question associated with audio
    audio_file = models.FileField(upload_to="audio_clips/")  # The audio file itself
    user_response = models.TextField(blank=True, null=True)  # Area for user to respond to audio

    def __str__(self):
        """Custom string representation for audio clips."""
        return f"Audio Clip : {self.question_text}"

class Document(Content):
    """
    Model for document content type.
    
    Represents attachable documents with metadata stored as JSON.
    Each document includes properties like name, title, URL, and file type.
    """
    documents = models.JSONField()  # Stores document metadata as JSON
    # Each document will have: name, title, url, fileType

class EmbeddedVideo(Content):
    """
    Model for Embedded Video content type.
    
    Represents videos hosted externally (e.g., YouTube, Vimeo).
    """
    video_url = models.URLField()  # URL to the external video

class InfoSheet(Content):
    """
    Model for InfoSheet content type.
    
    Represents PDF documents or text-based information sheets.
    """
    infosheet_file = models.FileField(upload_to="infosheets/")  # The actual file
    infosheet_content = models.TextField(blank=True, null=True)  # Optional text content summary

class Video(Content):
    """
    Model for Video content type.
    
    Represents videos uploaded directly to the platform.
    """
    video_file = models.FileField(upload_to="videos/")  # The video file
    duration = models.PositiveBigIntegerField()  # Video duration in seconds
    thumbnail = models.ImageField(upload_to="thumbnails/", blank=True, null=True)  # Video thumbnail