from django.contrib import admin
from .models import ProgressTracker, User,Module,Task, RankingQuestion, AudioClip, EmbeddedVideo, Document

# Register your models here.
admin.site.register(ProgressTracker)
admin.site.register(User)
admin.site.register(Module)
admin.site.register(RankingQuestion)
admin.site.register(AudioClip)
admin.site.register(EmbeddedVideo)
admin.site.register(Document)
admin.site.register(Task)
# admin.site.register(QuestionAnswerForm)
# admin.site.register(MatchingQuestionQuiz)
