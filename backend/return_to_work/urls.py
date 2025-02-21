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
from returnToWork.views import ProgressTrackerViewSet

router = DefaultRouter()
router.register(r'progress_tracker', ProgressTrackerViewSet)
from returnToWork.views import LogInView, LogOutView, SignUpView,UserProfileView,ChangePasswordView, QuestionnaireView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', LogInView.as_view(), name= 'login'),
    path('logout/', LogOutView.as_view(), name= 'logout'),
    path('signup/', SignUpView.as_view(), name= 'signup'),
    path('profile/', UserProfileView.as_view(), name= 'profile'),
    path('chnage-password/', ChangePasswordView.as_view(), name= 'change-password'),
    path("api/questionnaire/", QuestionnaireView.as_view(), name= "questionnaire"),
]
