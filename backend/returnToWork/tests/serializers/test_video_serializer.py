from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from returnToWork.serializers import VideoSerializer
from returnToWork.models import Video, Module

User = get_user_model()  

class VideoSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='john', password='testcase123')
        cls.module = Module.objects.create(title='Stress', description='Dealing with work stress', pinned=False, upvotes=1)
        cls.video = Video.objects.create(
            title="How to Manage Stress",
            moduleID=cls.module,
            author=cls.user,
            description="A detailed guide on managing stress.",
            is_published=True,
            video_file=SimpleUploadedFile("stress_video.mp4", b"file_content", content_type="video/mp4"),
            duration=3600,  
            thumbnail=SimpleUploadedFile("stress_thumb.jpg", b"thumb_content", content_type="image/jpeg")
        )

    def test_serialize_data(self):
        """ Test serialization of Video data """
        serializer = VideoSerializer(instance=self.video)
        data = serializer.data
        self.assertEqual(data['title'], 'How to Manage Stress')
        self.assertEqual(data['author'], str(self.user))
        self.assertEqual(data['moduleID'], self.module.pk)
        self.assertTrue(data['is_published'])
        self.assertIn('video_file', data)
        self.assertIn('duration', data)
        self.assertEqual(data['duration'], 3600)
        self.assertIn('thumbnail', data)

    def test_deserialize_data(self):
        """ Test deserialization of JSON to Video data """
        video_data = {
            'title': 'New Stress Techniques',
            'moduleID': self.module.id,
            'author': self.user.id, 
            'description': 'Techniques to manage stress effectively.',
            'is_published': True,
            'video_file': SimpleUploadedFile("new_video.mp4", b"new_file_content", content_type="video/mp4"),
            'duration': 3000,
            }
        serializer = VideoSerializer(data=video_data)
        if not serializer.is_valid():
            print(serializer.errors)  
            self.assertTrue(serializer.is_valid())
            new_video = serializer.save()
            self.assertEqual(new_video.title, 'New Stress Techniques')


    def test_video_file_upload(self):
        """ Test the upload process for video files """
        video_data = {
            'title': 'Upload Test Video',
            'moduleID': self.module.id,
            'description': 'Test the upload capabilities for a video file.',
            'is_published': True,
            'video_file': SimpleUploadedFile("test_upload.mp4", b"upload_file_content", content_type="video/mp4"),
            'duration': 1200,
            }
        serializer = VideoSerializer(data=video_data)
        if serializer.is_valid():
            uploaded_video = serializer.save(author=self.user)  
            self.assertEqual(uploaded_video.title, 'Upload Test Video')
            self.assertTrue(uploaded_video.video_file.name.endswith('mp4'))
            self.assertEqual(uploaded_video.duration, 1200)
        else:
            self.fail('Serializer failed to validate: {}'.format(serializer.errors))
