    # from rest_framework.test import APITestCase
    # from returnToWork.models import EmbeddedVideo, User, Module
    # from returnToWork.serializers import EmbeddedVideoSerializer
    # from rest_framework import serializers

    # class EmbeddedVideoSerializerTests(APITestCase):
    #     def setUp(self):
    #         self.author = User.objects.create_user(
    #             username='@tester', email='tester@example.com', password='pass', user_type='service user'
    #         )
    #         self.module = Module.objects.create(title='Test Module', description='Test')

    #     def get_valid_data(self, url):
    #         return {
    #             'title': 'Sample Video',
    #             'video_url': url,
    #             'order_index': 1,
    #             'moduleID': self.module.id,
    #             'author': self.author.id,
    #         }

    #     def test_valid_youtube_url(self):
    #         data = self.get_valid_data("https://www.youtube.com/watch?v=test")
    #         serializer = EmbeddedVideoSerializer(data=data)
    #         self.assertTrue(serializer.is_valid(), serializer.errors)

    #     def test_valid_vimeo_url(self):
    #         data = self.get_valid_data("https://vimeo.com/123456")
    #         serializer = EmbeddedVideoSerializer(data=data)
    #         self.assertTrue(serializer.is_valid(), serializer.errors)

    #     def test_invalid_video_url(self):
    #         data = self.get_valid_data("https://unsupportedplatform.com/video")
    #         serializer = EmbeddedVideoSerializer(data=data)
    #         self.assertFalse(serializer.is_valid())
    #         self.assertIn('video_url', serializer.errors)
    #         self.assertIn('Supported platforms', serializer.errors['video_url'][0])

    #     def test_invalid_url_format(self):
    #         data = self.get_valid_data("not-a-valid-url")
    #         serializer = EmbeddedVideoSerializer(data=data)
    #         self.assertFalse(serializer.is_valid())
    #         self.assertIn('video_url', serializer.errors)
    #         self.assertIn('Invalid URL', serializer.errors['video_url'][0])
