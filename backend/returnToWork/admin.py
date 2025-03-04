from django.contrib import admin
from .models import ProgressTracker, User,Module,Task,QuestionAnswerForm,InfoSheet,Video

# Register your models here.
admin.site.register(ProgressTracker)
admin.site.register(User)
admin.site.register(Module)
admin.site.register(Task)
admin.site.register(InfoSheet)
admin.site.register(Video)
admin.site.register(QuestionAnswerForm)
