from django.db import models
from django.contrib.auth.models import User
import uuid

# Create your models here.

# Model for Content
class Content(models.Model):
    # Primary Key
    # generate a unique identifier, cannot be manually changed, must be unique
    contentID= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    content_type= models.CharField(
        max_length=50,
        choices=[
            ('infosheet', 'Infosheet'),
            ('video', 'Video'),
            ('task', 'Task'),
        ]
    )
    moduleID= models.ForeignKey(User, on_delete=models.CASCADE)
    author= models.ForeignKey(User, on_delete=models.CASCADE, related_name="uploade_content")
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    is_published= models.BooleanField(default=False)

class InfoSheet(Content):
    infosheet_file= models.FileField(upload_to="infosheet/")

class Video(Content):
    video_file= models.FileField(upload_to="videos/")
    duration= models.PositiveBigIntegerField()

class Task(Content):
    text_content= models.TextField()
