
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser,Group,Permission
from django.db import models
import uuid


class User(AbstractUser):
    """Model used for user authentication, and team member related information."""

    user_id = models.UUIDField(default = uuid.uuid4, editable=False, unique=True)

    USER_TYPE_CHOICES = [
        ('admin', 'Admin'),
        ('service user', 'Service User'),
        ('mental health professional', 'Mental Health Professional')
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
   
    
    Module = models.ForeignKey(Module, on_delete=models.CASCADE)
    Tags = models.ForeignKey(Tags, on_delete=models.CASCADE)

    class Meta:
        """Model options."""

        ordering = ['first_name', 'last_name']

    def full_name(self):
        """Return a string containing the user's full name."""

        return f'{self.first_name} {self.last_name}'

    def __str__(self):
        return f"{self.full_name()} - {self.username} - {self.user_id}"
    



class ProgressTracker(models.Model):
    User = models.ForeignKey(User, on_delete=models.CASCADE)
    Module = models.ForeignKey(Module, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)

def __str__(self):
    return f"{self.user.username} - {self.module.title} - {'Completed' if self.completed else 'Incomplete'}"