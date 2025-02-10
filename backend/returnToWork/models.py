

# Create your models here.
class ProgressTracker(models.Model):
    User = models.ForeignKey(User, on_delete=models.CASCADE)
    Module = models.ForeignKey(Module, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)

def __str__(self):
    return f"{self.user.username} - {self.module.title} - {'Completed' if self.completed else 'Incomplete'}"

from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser,Group,Permission
from django.db import models


class User(AbstractUser):
    """Model used for user authentication, and team member related information."""

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
    email = models.EmailField(unique=True, blank=False)

    # groups = models.ManyToManyField(
    #     Group,
    #     related_name='custom_user_groups',
    #     blank=True,
    # )

    # user_permissions = models.ManyToManyField(
    #     Permission,
    #     related_name='custom_user_permissions',
    #     blank=True,
    # )


    class Meta:
        """Model options."""

        ordering = ['first_name', 'last_name']

    def full_name(self):
        """Return a string containing the user's full name."""

        return f'{self.first_name} {self.last_name}'

    
