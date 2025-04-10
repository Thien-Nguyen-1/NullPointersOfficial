from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from returnToWork.models import User, Module, EmbeddedVideo
from rest_framework.authtoken.models import Token
import uuid
class EmbeddedVideoViewSetTests(APITestCase):
    def setUp(self):
        self.module = Module.objects.create(title="Test Module", description="Desc")
        self.author = User.objects.create_user(
            username='@author', 
            email='author@example.com', 
            password='pass',
            user_type='service user'
        )
        self.other_user = User.objects.create_user(
            username='@other', 
            email='other@example.com', 
            password='pass',
            user_type='service user'
        )
        self.admin = User.objects.create_user(
            username='@admin', 
            email='admin@example.com', 
            password='pass',
            user_type='admin', 
            is_staff=True
        )

        self.video = EmbeddedVideo.objects.create(
            moduleID=self.module,
            title="Video 1",
            video_url="https://youtube.com/embed/test",
            author=self.author,
            order_index=1
        )

    def test_filter_by_module_id(self):
        self.client.force_authenticate(user=self.author)
        url = f'/api/embedded-videos/?module_id={self.module.id}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

    def test_filter_by_component_id(self):
        self.client.force_authenticate(user=self.author)
        valid_uuid = uuid.uuid4()
        self.video.contentID = valid_uuid
        self.video.save()
        url = f'/api/embedded-videos/?component_id={valid_uuid}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

    def test_filter_by_author_only(self):
        self.client.force_authenticate(user=self.author)
        url = f'/api/embedded-videos/?author_only=true'

        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

        self.client.force_authenticate(user=self.other_user)
        res = self.client.get(url)
        self.assertEqual(len(res.data), 0)

    def test_perform_create_sets_author_and_order(self):
        self.client.force_authenticate(user=self.author)
        url = f'/api/embedded-videos/'
        data = {
            "title": "New Video",
            "video_url": "https://youtube.com/embed/new",
            "moduleID": self.module.id,
            "order_index": "5"
        }
        res = self.client.post(url, data)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['order_index'], 5)
        self.assertEqual(res.data['author']['id'], self.author.id)

    def test_update_permission_denied_for_non_owner(self):
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/embedded-videos/{self.video.pk}/'
        res = self.client.patch(url, {"title": "Updated"})
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.data['detail'], "You do not have permission to edit this video.")

    def test_update_allowed_for_author(self):
        self.client.force_authenticate(user=self.author)
        url = f'/api/embedded-videos/{self.video.pk}/'
        res = self.client.patch(url, {"title": "Updated"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['title'], "Updated")

    def test_update_allowed_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = f'/api/embedded-videos/{self.video.pk}/'
        res = self.client.patch(url, {"title": "Admin Update"})
        self.assertEqual(res.status_code, 200)

    def test_destroy_denied_for_other_user(self):
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/embedded-videos/{self.video.pk}/'
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 403)

    def test_destroy_allowed_for_author_or_admin(self):
        self.client.force_authenticate(user=self.author)
        url = f'/api/embedded-videos/{self.video.pk}/'
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 204)

    def test_module_videos_action_success(self):
        self.client.force_authenticate(user=self.author)
        url = f'/api/embedded-videos/module_videos/?module_id={self.module.id}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

    def test_module_videos_missing_module_id(self):
        self.client.force_authenticate(user=self.author)
        url = '/api/embedded-videos/module_videos/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data['detail'], 'module_id parameter is required')
