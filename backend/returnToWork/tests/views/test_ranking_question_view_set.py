from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from returnToWork.models import (Module, RankingQuestion, InlinePicture, AudioClip, Document, EmbeddedVideo, User, Tags)
from returnToWork.serializers import (RankingQuestionSerializer, InlinePictureSerializer, AudioClipSerializer,DocumentSerializer, EmbeddedVideoSerializer)
import json
from django.core.files.uploadedfile import SimpleUploadedFile


class RankingQuestionViewSetTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(username="@user1", first_name="John", last_name="Doe", user_type="service user")
        self.client.force_authenticate(user=self.user)
        self.module = Module.objects.create(title="Test Module", description="Test description")

        self.ranking_question = RankingQuestion.objects.create(
            title='Test Ranking Question',
            moduleID=self.module,
            author=self.user,
            tiers=['Tier 1', 'Tier 2', 'Tier 3']
        )

        self.list_url = reverse('ranking-question-list')
        self.detail_url = reverse('ranking-question-detail', kwargs={'pk': self.ranking_question.contentID})

    def test_get_all_ranking_questions(self):
        """Test retrieving all ranking questions"""
        response = self.client.get(self.list_url)

        # Get data from DB and serialize
        ranking_questions = RankingQuestion.objects.all()
        serializer = RankingQuestionSerializer(ranking_questions, many=True)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_create_ranking_question(self):
        """Test creating a new ranking question"""
        data = {
            'title': 'New Ranking Question',
            "author": self.user.id,
            'moduleID': self.module.id,
            'description': 'New description',
            'tiers': ['New Tier 1', 'New Tier 2']
        }

        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RankingQuestion.objects.count(), 2)

        # Check the last object created matches our data
        new_question = RankingQuestion.objects.latest('created_at')
        self.assertEqual(new_question.title, 'New Ranking Question')
        self.assertEqual(new_question.tiers, ['New Tier 1', 'New Tier 2'])

    def test_get_single_ranking_question(self):
        """Test retrieving a single ranking question"""
        response = self.client.get(self.detail_url)

        serializer = RankingQuestionSerializer(self.ranking_question)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_update_ranking_question(self):
        """Test updating a ranking question"""
        data = {
            'title': 'Updated Ranking Question',
            'moduleID': self.module.id,
            'tiers': ['Updated Tier 1', 'Updated Tier 2', 'Updated Tier 3']
        }

        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh the question from the database
        self.ranking_question.refresh_from_db()
        self.assertEqual(self.ranking_question.title, 'Updated Ranking Question')
        self.assertEqual(self.ranking_question.tiers, ['Updated Tier 1', 'Updated Tier 2', 'Updated Tier 3'])

    def test_delete_ranking_question(self):
        """Test deleting a ranking question"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(RankingQuestion.objects.count(), 0)