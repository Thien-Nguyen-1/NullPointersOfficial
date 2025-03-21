from django.contrib import admin
from .models import ProgressTracker, User,Module,Task,InfoSheet,Video, InlinePicture, RankingQuestion, AudioClip, EmbeddedVideo, Document

# Register your models here.
admin.site.register(ProgressTracker)
admin.site.register(User)
admin.site.register(Module)
admin.site.register(RankingQuestion)
admin.site.register(InlinePicture)
admin.site.register(AudioClip)
admin.site.register(EmbeddedVideo)
admin.site.register(Document)
admin.site.register(Task)
admin.site.register(InfoSheet)
admin.site.register(Video)
# admin.site.register(QuestionAnswerForm)
# admin.site.register(MatchingQuestionQuiz)
