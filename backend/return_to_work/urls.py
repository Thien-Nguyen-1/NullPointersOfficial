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
from returnToWork.views import ProgressTrackerView,TagViewSet,ModuleViewSet, AdminSettingsView

router = DefaultRouter()
router.register(r'modules', ModuleViewSet,basename='module')
router.register(r'tags', TagViewSet,basename='tag')

# from returnToWork.views import LogInView, LogOutView, SignUpView,UserProfileView,ChangePasswordView
# router.register(r'progress_tracker', ProgressTrackerViewSet)
from returnToWork.views import LogInView, LogOutView, SignUpView,UserProfileView,PasswordResetView, QuestionnaireView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LogInView.as_view(), name= 'login'),
    path('api/logout/', LogOutView.as_view(), name= 'logout'),
    path('api/signup/', SignUpView.as_view(), name= 'signup'),
    path('api/profile/', UserProfileView.as_view(), name= 'profile'),
    path('api/progress-tracker/', ProgressTrackerView.as_view(), name='progress-tracker'),
    path('', include(router.urls)),
    path('api/change-password/', PasswordResetView.as_view(), name= 'change-password'),
    path("api/questionnaire/", QuestionnaireView.as_view(), name= "questionnaire"),
    path("api/admin/settings", AdminSettingsView.as_view(), name= "admin-settings"),
]
