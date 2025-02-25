from django.contrib import admin
from .models import ProgressTracker, User,Module,Task

# Register your models here.
admin.site.register(ProgressTracker)
admin.site.register(User)
admin.site.register(Module)
admin.site.register(Task)