# users.py - Contains user authentication and profile models
# This file handles all user-related functionality, extending Django's built-in auth system

import uuid
from django.core.validators import RegexValidator, EmailValidator
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model that extends Django's AbstractUser.
    
    This model handles user authentication and stores profile information for both
    admin users and service users. It includes custom fields for user types,
    custom username validation, and relationships to modules and tags.
    """

    pass