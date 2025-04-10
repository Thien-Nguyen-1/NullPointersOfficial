from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from returnToWork.models import User, Module, Image
import uuid
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

class ImageViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='@johndoe',
            email='john@example.com',
            password='password',
            user_type='service user'
        )

        self.module = Module.objects.create(
            title='Test Module',
            description='Test Description'
        )

        self.image = Image.objects.create(
            moduleID=self.module,
            title='Test Image',
            author=self.user,
            description='Test description',
            is_published=True,
            file_url='http://localhost/media/module_images/test.jpg',
            filename='test.jpg',
            file_size=2048,
            file_type='jpg',
            width=300,
            height=200,
            order_index=0
        )

        self.client.force_authenticate(user=self.user)

    def test_get_queryset_filter_by_module_id(self):
        url = reverse('image-list') 
        response = self.client.get(url, {'module_id': self.module.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_queryset_filter_by_content_id(self):
        self.image.contentID = str(uuid.uuid4())
        self.image.save()
        url = reverse('image-list')
        response = self.client.get(url, {'content_id': str(uuid.uuid4())})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_upload_invalid_order_index(self):
        url = reverse('image-upload')
        ex_file = SimpleUploadedFile('error.jpg', b'some content', content_type='image/jpeg')
        data = {
            'files': [ex_file],
            'module_id': str(self.module.id),
            'order_index': 'not-a-number', 
            'width_0': 500,
            'height_0': 300
            }

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
       
    def test_upload_missing_module_id(self):
        url = reverse('image-upload')
        ex_file = SimpleUploadedFile('test_missing_module.jpg', b'data', content_type='image/jpeg')
        data = {'files': [ex_file],}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Module ID is required')

    def test_upload_module_not_exist(self):
        url = reverse('image-upload')
        example_file = SimpleUploadedFile('test_module_not_found.jpg', b'data', content_type='image/jpeg')
        data = {'files': [example_file],'module_id': 9999 }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Module not found')
 
    def test_upload_image(self):
        url = reverse('image-upload')
        dummy_file = SimpleUploadedFile('test_upload.jpg', b'test image content', content_type='image/jpeg')
        data = {
            'files': [dummy_file],
            'module_id': str(self.module.id), 
            'component_id': 'component-xyz',
            'order_index': 5,
            'width_0': 800,
            'height_0': 600
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['filename'], 'test_upload.jpg')
        self.assertEqual(response.data[0]['width'], 800)
        self.assertEqual(response.data[0]['height'], 600)
        self.assertTrue(Image.objects.filter(filename='test_upload.jpg').exists())

    def test_update_image_with_height(self):
        url = reverse('image-dimensions', kwargs={'pk': self.image.pk})
        size = {'width': 1024,'height': 768}
        response = self.client.patch(url, data=size, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_image_width_heignt_missing_fields(self):
        url = reverse('image-dimensions', kwargs={'pk': self.image.pk})
        response = self.client.patch(url, data={'width': 800}, format='multipart') 
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'Width and height are required')

    
    