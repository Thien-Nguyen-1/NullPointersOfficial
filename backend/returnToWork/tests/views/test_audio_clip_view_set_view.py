from rest_framework.test import APITestCase
from django.urls import reverse
from returnToWork.models import User, Module, AudioClip
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

class AudioClipViewSetTests(APITestCase):
    def setUp(self):
        self.module = Module.objects.create(
            title="Test Module", 
            description="Description")

        self.service_user = User.objects.create_user(
            username='@user', 
            email='user@example.com', 
            password='testpass', 
            user_type='service user'
        )
        self.admin_user = User.objects.create_user(
            username='@admin', 
            email='admin@example.com', 
            password='testpass',
            user_type='admin', 
            is_staff=True
        )

        self.published_clip = AudioClip.objects.create(
            moduleID=self.module, 
            title='Published Clip', 
            is_published=True,
            author = self.admin_user
        )

        self.unpublished_clip = AudioClip.objects.create(
            moduleID=self.module, 
            title='Unpublished Clip', 
            is_published=False,
            author = self.admin_user
        )

    def test_module_id_valid_filters_results(self):
        self.client.force_authenticate(user=self.service_user)
        url = f'/api/modules/{self.module.id}/audios/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Published Clip')

    def test_module_id_invalid_returns_empty(self):
        self.client.force_authenticate(user=self.service_user)
        url = reverse('audioclip-list') + '?module_id=notanumber'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)  

    def test_admin_user_sees_all(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('audioclip-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        titles = [clip['title'] for clip in response.data]
        self.assertIn('Published Clip', titles)
        self.assertIn('Unpublished Clip', titles)
        self.assertEqual(len(response.data), 2)

    def test_regular_user_sees_only_published(self):
        self.client.force_authenticate(user=self.service_user)
        url = reverse('audioclip-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Published Clip')

    def test_upload_valid_audio(self):
        self.client.force_authenticate(user=self.service_user)
        url = '/api/audios/upload/'
        dummy_audio = SimpleUploadedFile("test.mp3", b"audio content", content_type="audio/mpeg")
        data = {"files": [dummy_audio],"module_id": str(self.module.id),"order_index": "2"}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_upload_invalid_file_type(self):
        self.client.force_authenticate(user=self.service_user)
        url = '/api/audios/upload/'
        dummy_file = SimpleUploadedFile("invalid.txt", b"text", content_type="text/plain")
        data = {"files": [dummy_file],"module_id": str(self.module.id)}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_upload_missing_module_id(self):
        self.client.force_authenticate(user=self.service_user)
        url = '/api/audios/upload/'
        dummy_audio = SimpleUploadedFile("test.mp3", b"audio content", content_type="audio/mpeg")
        data = {"files": [dummy_audio],}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'No valid audio files were uploaded')

    def test_upload_module_not_found(self):
        self.client.force_authenticate(user=self.service_user)
        url = '/api/audios/upload/'
        dummy_audio = SimpleUploadedFile("test.mp3", b"audio content", content_type="audio/mpeg")
        data = {"files": [dummy_audio],"module_id": "9999" }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Module not found')

    def test_upload_no_files(self):
        self.client.force_authenticate(user=self.service_user)
        url = '/api/audios/upload/'
        data = {"module_id": str(self.module.id)}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No files to upload')

    def test_upload_bad_order_index_defaults_to_zero(self):
        self.client.force_authenticate(user=self.service_user)
        url = '/api/audios/upload/'
        dummy_audio = SimpleUploadedFile("test.mp3", b"audio content", content_type="audio/mpeg")
        data = {"files": [dummy_audio],"module_id": str(self.module.id),"order_index": "not-a-number"}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data[0]['order_index'], 0)

    def test_admin_can_delete_audio_clip(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('audioclip-detail', args=[str(self.published_clip.contentID)])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(AudioClip.objects.filter(contentID=self.published_clip.contentID).exists())

    def test_author_can_delete_own_audio_clip(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('audioclip-detail', args=[str(self.unpublished_clip.contentID)])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(AudioClip.objects.filter(contentID=self.unpublished_clip.contentID).exists())

    def test_non_author_regular_user_cannot_delete(self):
        self.client.force_authenticate(user=self.service_user)
        url = reverse('audioclip-detail', args=[str(self.published_clip.contentID)])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 403)
        self.assertTrue(AudioClip.objects.filter(contentID=self.published_clip.contentID).exists())

