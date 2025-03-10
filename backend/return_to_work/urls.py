"""
URL configuration for return_work project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from rest_framework.routers import DefaultRouter
from returnToWork.views import ProgressTrackerView,TagViewSet,ModuleViewSet,InfoSheetViewSet,VideoViewSet,TaskViewSet, UserInteractionView, LogInView, LogOutView, SignUpView,UserProfileView,PasswordResetView, QuestionnaireView, UserDetail, ServiceUserListView, DeleteServiceUserView,UserSettingsView, UserPasswordChangeView, UserSupportView, UserChatView

router = DefaultRouter()
router.register(r'modules', ModuleViewSet,basename='module')
router.register(r'tags', TagViewSet,basename='tag')
router.register(r'infosheets', InfoSheetViewSet, basename='infosheet')
router.register(r'videos', VideoViewSet, basename='video')
router.register(r'tasks', TaskViewSet, basename='task')



urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LogInView.as_view(), name= 'login'),
    path('api/logout/', LogOutView.as_view(), name= 'logout'),
    path('api/signup/', SignUpView.as_view(), name= 'signup'),
    path('api/profile/', UserProfileView.as_view(), name= 'profile'),
    path('api/user/', UserDetail.as_view(), name='user-detail'),
    path('', include(router.urls)),
    path('api/change-password/', PasswordResetView.as_view(), name= 'change-password'),
    path("api/questionnaire/", QuestionnaireView.as_view(), name= "questionnaire"),
    path("service-users/", ServiceUserListView.as_view(), name="service-users-list"),
    path("service-users/<str:username>/", DeleteServiceUserView.as_view(), name="delete-service-user"),
    path("api/worker/settings/", UserSettingsView.as_view(), name= "user-settings"),
    path("api/worker/password-change/", UserPasswordChangeView.as_view(), name= "user-password-change"),
    path("api/admin/settings/", UserSettingsView.as_view(), name= "user-settings"),
    path("api/admin/password-change/", UserPasswordChangeView.as_view(), name= "user-password-change"),
   













    path('api/user-interaction/<int:module_id>/', UserInteractionView.as_view(), name='user-interaction'),
    path('api/user-interaction/', UserInteractionView.as_view(), name='user-interaction'),
    path('api/support/chat-details/', UserSupportView.as_view(), name='user-support-view'),
    path('api/support/chat-room/<int:room_id>/', UserChatView.as_view(), name='user-chat-view'),
]
