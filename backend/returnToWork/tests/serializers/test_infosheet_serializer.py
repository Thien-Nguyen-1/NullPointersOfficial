from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from returnToWork.serializers import ContentSerializer,InfoSheetSerializer
from returnToWork.models import User,Content,InfoSheet