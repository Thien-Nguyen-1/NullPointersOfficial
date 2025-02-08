from django.db import models
from django.contrib.auth.models import User
import uuid

# Create your models here.

# Model for Content
# Parent class for ALL Content Types
class Content(models.Model):
    # Primary Key
    # generate a unique identifier, cannot be manually changed, must be unique
    contentID= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=255)
    content_type= models.CharField(
        max_length=50,
        choices=[
            ('infosheet', 'Infosheet'),
            ('video', 'Video'),
            ('task', 'Task'),
        ]
    )
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="contents")  # Link to Module
    author= models.ForeignKey(User, on_delete=models.CASCADE, related_name="author_content")
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    is_published= models.BooleanField(default=False)

    def __str__(self):
        return self.title

# Extend Content class

class InfoSheet(Content):
    infosheet_file= models.FileField(upload_to="infosheets/")

class Video(Content):
    # videoID= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    video_file= models.FileField(upload_to="videos/")
    duration= models.PositiveBigIntegerField()
    thumbnail = models.ImageField(upload_to="thumbnails/", blank=True, null=True)

class Task(Content):
    text_content= models.TextField()




