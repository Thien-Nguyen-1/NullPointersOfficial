from django.contrib import admin
from .models import ProgressTracker, User

# Register your models here.
admin.site.register(ProgressTracker)
admin.site.register(User)