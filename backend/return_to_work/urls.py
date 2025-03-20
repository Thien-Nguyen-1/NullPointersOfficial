"""
URL configuration for return_work project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import views from their new locations
from returnToWork.views.auth import (
    LogInView, LogOutView, SignUpView, PasswordResetView,
    RequestPasswordResetView, CheckUsernameView
)
from returnToWork.views.user import (
    UserProfileView, UserSettingsView, UserPasswordChangeView,
    UserDetail, ServiceUserListView, DeleteServiceUserView
)
from returnToWork.views.modules import (
    ModuleViewSet, TagViewSet, UserInteractionView
)
from returnToWork.views.progress import (
    ProgressTrackerView
)
from returnToWork.views.content import (
    InfoSheetViewSet, VideoViewSet, RankingQuestionViewSet,
    InlinePictureViewSet, AudioClipViewSet, DocumentViewSet,
    EmbeddedVideoViewSet, ContentPublishView, MarkContentViewedView,
    CompletedContentView
)
from returnToWork.views.quizzes import (
    TaskViewSet, QuestionnaireView, QuizDetailView, QuizResponseView,
    QuizDataView, QuizQuestionView, QuizQuestionViewSet, TaskPdfView
)
from returnToWork.views.admin import (
    AdminQuizResponsesView
)

router = DefaultRouter()
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'infosheets', InfoSheetViewSet, basename='infosheet')
router.register(r'videos', VideoViewSet, basename='video')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'ranking-question', RankingQuestionViewSet, basename='ranking-question')
router.register(r'inline-picture', InlinePictureViewSet, basename='inline-picture')
router.register(r'audio-clip', AudioClipViewSet, basename='audio-clip')
router.register(r'document', DocumentViewSet, basename='document')
router.register(r'embedded-video', EmbeddedVideoViewSet, basename='embedded-video')
router.register(r'quiz_question', QuizQuestionViewSet, basename='quizQuestion')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LogInView.as_view(), name='login'),
    path('api/logout/', LogOutView.as_view(), name='logout'),
    path('api/signup/', SignUpView.as_view(), name='signup'),
    path('api/profile/', UserProfileView.as_view(), name='profile'),
    path('api/user/', UserDetail.as_view(), name='user-detail'),
    path('', include(router.urls)),
    path('api/password-reset/<str:uidb64>/<str:token>/', PasswordResetView.as_view(), name='password-reset'),
    path('api/password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('api/', include(router.urls)),
    path('api/change-password/', PasswordResetView.as_view(), name='change-password'),
    path("api/questionnaire/", QuestionnaireView.as_view(), name="questionnaire"),
    path("service-users/", ServiceUserListView.as_view(), name="service-users-list"),
    path("service-users/<str:username>/", DeleteServiceUserView.as_view(), name="delete-service-user"),
    path('api/publish-module/', ContentPublishView.as_view(), name='publish-module'),
    path("api/worker/settings/", UserSettingsView.as_view(), name="user-settings"),
    path("api/worker/password-change/", UserPasswordChangeView.as_view(), name="user-password-change"),
    path("api/admin/settings/", UserSettingsView.as_view(), name="user-settings"),
    path("api/admin/password-change/", UserPasswordChangeView.as_view(), name="user-password-change"),
    path("api/check-username/", CheckUsernameView.as_view(), name="check-username"),
    path('api/download-completed-task/<uuid:task_id>/', TaskPdfView.as_view(), name='download-completed-task'),
    path('api/content-progress/mark-viewed/', MarkContentViewedView.as_view(), name='mark-content-viewed'),
    path('api/progress/<int:module_id>/completed-content/', CompletedContentView.as_view(), name='completed-content'),
    path('api/user-interaction/<int:module_id>/', UserInteractionView.as_view(), name='user-interaction'),
    path('api/user-interaction/', UserInteractionView.as_view(), name='user-interaction'),
    path('api/progress-tracker/', ProgressTrackerView.as_view(), name='progress-tracker'),
    # Quiz question endpoints
    path('api/quiz/questions/', QuizQuestionView.as_view(), name='quiz_questions'),
    path('api/quiz/questions/<int:question_id>/', QuizQuestionView.as_view(), name='quiz_question_detail'),
    # Quiz related URLs
    path('api/quiz/<uuid:task_id>/', QuizDetailView.as_view(), name='quiz_detail_api'),
    path('api/quiz/data/<uuid:task_id>/', QuizDataView.as_view(), name='quiz_data'),
    path('api/quiz/response/', QuizResponseView.as_view(), name='quiz_response'),
    path('api/admin/quiz/responses/<uuid:task_id>/', AdminQuizResponsesView.as_view(), name='admin_quiz_responses'),
]