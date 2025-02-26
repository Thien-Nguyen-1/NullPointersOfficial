from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from returnToWork.serializers import ContentSerializer,InfoSheetSerializer
from returnToWork.models import User,Content,InfoSheet,Module

User = get_user_model()


class InfoSheetSerializerTest(TestCase):
    @classmethod
    def setUpClassData(cls):
        cls.user = User.objects.create_user(username='john',password='testcase123')
        cls.module = Module.objects.create(title='stress',description='dealing with work stress',pinned=False,upvote=1)
