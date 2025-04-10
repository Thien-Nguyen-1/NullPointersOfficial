"""
URL configuration for return_work project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from returnToWork.views import (
    CompletedContentView, MarkContentViewedView, ProgressTrackerView,
    TagViewSet, ModuleViewSet, TaskViewSet,
    UserInteractionView, LogInView, LogOutView, SignUpView, UserProfileView,
    PasswordResetView, QuestionnaireView, UserDetail, ServiceUserListView,
    DeleteServiceUserView, UserSettingsView, UserPasswordChangeView,
    CheckUsernameView,CheckEmailView, RequestPasswordResetView, ContentPublishView,
    RankingQuestionViewSet, AudioClipViewSet,
    DocumentViewSet, EmbeddedVideoViewSet,  UserSupportView, UserChatView, QuizDataView, QuizDetailView,
    QuizResponseView, AdminQuizResponsesView, QuizQuestionView,
    TaskPdfView, QuizQuestionViewSet, VerifyEmailView, 
    TermsAndConditionsView, AdminUsersView, AdminUserDetailView, CheckSuperAdminView, AcceptTermsView,
    DocumentViewSet, AdminEmailVerificationView, ResendAdminVerificationView
)
from returnToWork.views import ProgressTrackerView,TagViewSet,ModuleViewSet, TaskViewSet, UserInteractionView, LogInView, LogOutView, SignUpView,UserProfileView,PasswordResetView, QuestionnaireView, UserDetail, ServiceUserListView, DeleteServiceUserView,UserSettingsView, UserPasswordChangeView, CheckUsernameView, RequestPasswordResetView, ContentPublishView,RankingQuestionViewSet, AudioClipViewSet, DocumentViewSet, EmbeddedVideoViewSet,  UserSupportView, UserChatView, ImageViewSet
from returnToWork.views import  QuizDataView,QuizDetailView,QuizResponseView, AdminQuizResponsesView, QuizQuestionView,TaskPdfView,QuizQuestionViewSet, VerifyEmailView, CompletedInteractiveContentView, QuizUserResponsesView

#for media url access
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

router = DefaultRouter()
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'ranking-question', RankingQuestionViewSet, basename='ranking-question')
# router.register(r'inline-picture', InlinePictureViewSet, basename='inline-picture')
router.register(r'audios', AudioClipViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'embedded-videos',EmbeddedVideoViewSet, basename='embedded-videos')
router.register(r'quiz_question', QuizQuestionViewSet,basename='quizQuestion')
# router.register(r'user_response', UserResponseViewSet,basename='userResponse')



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
    path("api/check-email/", CheckEmailView.as_view(), name="check-email"),
    path('api/download-completed-task/<uuid:task_id>/', TaskPdfView.as_view(), name='download-completed-task'),
    path('api/accept-terms/', AcceptTermsView.as_view(), name='accept-terms'),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # SuperAdmin API endpoints
    path('api/terms-and-conditions/', TermsAndConditionsView.as_view(), name='terms-and-conditions'),
    path('api/admin-users/', AdminUsersView.as_view(), name='admin-users'),
    path('api/admin-users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('api/check-superadmin/', CheckSuperAdminView.as_view(), name='check-superadmin'),
    path('api/verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-sign-up'),
    path('api/verify-admin-email/<str:token>/', AdminEmailVerificationView.as_view(), name='verify_admin_email'),
    path('api/admin-users/<int:user_id>/resend-verification/', ResendAdminVerificationView.as_view(), name='resend_admin_verification'),
    path('api/content-progress/mark-viewed/', MarkContentViewedView.as_view(), name='mark-content-viewed'),
    path('api/progress/<int:module_id>/completed-content/', CompletedContentView.as_view(), name='completed-content'),
    path('api/verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-sign-up'),
    path('api/completed-interactive-content/', CompletedInteractiveContentView.as_view(), name = 'completed-interactive-content'),


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
    path('api/quiz/<str:task_id>/user-responses/', QuizUserResponsesView.as_view(), name='quiz-user-responses'),

    # Content Media Type
    path('modules/<int:module_id>/documents/', DocumentViewSet.as_view({'get': 'list'}), {'module_id': 'module_id'}),
    # Audio API Endpoints
    path('api/audios/upload/', AudioClipViewSet.as_view({'post': 'upload'})),
    path('api/audios/<uuid:pk>/', AudioClipViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
    path('api/modules/<int:module_id>/audios/', 
         AudioClipViewSet.as_view({'get': 'list'})),
    #Image API Endpoints
    path('api/images/', ImageViewSet.as_view({'get': 'list', 'post': 'create'}), name='image-list'),
    path('api/images/upload/', ImageViewSet.as_view({'post': 'upload'}), name='image-upload'),
    path('api/images/<uuid:pk>/', ImageViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='image-detail'),
    path('api/images/<uuid:pk>/dimensions/', ImageViewSet.as_view({'patch': 'update_dimensions'}), name='image-dimensions'),
    path('api/modules/<int:module_id>/images/', ImageViewSet.as_view({'get': 'list'}), name='module-images'),
    #Video API Endpoints
    path('api/modules/<int:module_id>/embedded-videos/', EmbeddedVideoViewSet.as_view({'get': 'list'}), name='module-embedded-videos'),
    #Support API Endpoints
    path('api/user-interaction/', UserInteractionView.as_view(), name='user-interaction'),
    path('api/support/chat-details/', UserSupportView.as_view(), name='user-support-view'),
    path('api/support/chat-room/<int:room_id>/', UserChatView.as_view(), name='user-chat-view'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 
