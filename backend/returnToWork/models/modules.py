# modules.py - Contains models for modules and tags
# This file handles the core organizational structure of the learning platform

from django.db import models
from django.core.exceptions import ValidationError

class Module(models.Model):
    """
    Module model representing a course or learning unit.
    
    Modules are the main organizational units of the platform,
    containing various types of content like videos, documents,
    and interactive elements. They can be tagged for categorization
    and users can interact with them (upvoting, pinning, etc).
    """
    # Basic module information
    title = models.CharField(max_length=255)
    description = models.TextField()
    id = models.AutoField(primary_key=True)  
    
    # Tags for categorization (many-to-many relationship)
    tags = models.ManyToManyField('Tags', related_name='modules_for_tag', blank=True)
    
    # Track popularity of modules
    upvotes = models.PositiveIntegerField(default=0) 

    def upvote(self):
        """Increment the upvote count for this module."""
        self.upvotes += 1
        self.save()

    def downvote(self):
        """Decrement the upvote count for this module."""
        self.upvotes -= 1
        self.save()

    def save(self, *args, **kwargs):
        """
        Override save to ensure consistent title formatting.
        This capitalizes each word in the title.
        """
        self.title = self.title.title()  
        super(Module, self).save(*args, **kwargs)

    def __str__(self):
        """String representation for admin interface and debugging."""
        return self.title

class Tags(models.Model):
    """
    Tags model for categorizing modules and filtering content.
    
    Tags are used to categorize courses and modules by topic area,
    making it easier for users to find relevant content and for
    administrators to organize the platform structure.
    """
    # The tag name (enforced to be unique)
    tag = models.CharField(max_length=50, unique=True, error_messages={ 'unique': "A tag with this name already exists." })
    
    # Modules with this tag (many-to-many relationship)
    modules = models.ManyToManyField('Module', related_name='tags_for_module', blank=True)

    def clean(self):
        """
        Validate tag data before saving.
        Ensures tags are normalized to lowercase and unique regardless of case.
        """
        # Normalize the tag to lowercase
        self.tag = self.tag.lower()
        
        # Check for duplicate tags in a case-insensitive manner
        if Tags.objects.filter(tag=self.tag).exclude(pk=self.pk).exists():
            raise ValidationError({"tag": "A tag with this name already exists."})
        super().clean()

    def save(self, *args, **kwargs):
        """
        Override save to enforce validation and normalization.
        Tags are stored in lowercase for consistent querying.
        """
        self.full_clean()  # Run validation before saving
        super().save(*args, **kwargs)

    def __str__(self):
        """
        String representation for display.
        Capitalized for better readability in UI.
        """
        return self.tag.capitalize()

    @classmethod
    def get_valid_tags(cls):
        """
        Helper method to get all valid tags in the system.
        Used for form validation and API endpoints.
        """
        return list(cls.objects.values_list('tag', flat=True))