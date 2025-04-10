from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from returnToWork.models import User, Module, Document

class DocumentViewSetTests(APITestCase):
    def setUp(self):
        self.module = Module.objects.create(title="Module", description="Module desc")
        self.admin_user = User.objects.create_user(
            username='@admin', 
            email='admin@example.com', 
            password='testpass',
            user_type='admin', 
            is_staff=True
        )

        self.author_user = User.objects.create_user(
            username='@author', 
            email='author@example.com', 
            password='testpass',
            user_type='service user'
        )

        self.other_user = User.objects.create_user(
            username='@other', 
            email='other@example.com', 
            password='testpass',
            user_type='service user'
        )

        self.document = Document.objects.create(
            moduleID=self.module,
            title="Test Doc",
            file=SimpleUploadedFile("test.pdf", b"%PDF-1.4", content_type="application/pdf"),
            filename="test.pdf",
            file_type="pdf",
            file_size=2048,
            author=self.author_user,
            is_published=True,
            order_index=0
        )

    def test_upload_valid_document(self):
        self.client.force_authenticate(user=self.author_user)
        url = '/api/documents/upload/'
        file = SimpleUploadedFile("upload.pdf", b"%PDF-1.4", content_type="application/pdf")
        data = {'files': [file],'module_id': self.module.id,'order_index': '1'}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['filename'], 'upload.pdf')

    def test_upload_invalid_file_type(self):
        self.client.force_authenticate(user=self.author_user)
        url = '/api/documents/upload/'
        file = SimpleUploadedFile("not_valid.exe", b"binarydata", content_type="application/octet-stream")
        data = {'files': [file], 'module_id': self.module.id}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_upload_no_module_id(self):
        self.client.force_authenticate(user=self.author_user)
        url = '/api/documents/upload/'
        file = SimpleUploadedFile("upload.pdf", b"%PDF-1.4", content_type="application/pdf")
        response = self.client.post(url, {'files': [file]}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'No valid documents were uploaded')

    # def test_upload_module_not_found(self):
    #     self.client.force_authenticate(user=self.author_user)
    #     url = '/api/documents/upload/'
    #     file = SimpleUploadedFile("upload.pdf", b"%PDF-1.4", content_type="application/pdf")

    #     data = {'files': [file], 'module_id': 9999}
    #     response = self.client.post(url, data, format='multipart')
    #     self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    #     self.assertIn('error', response.data)

    def test_upload_no_files(self):
        self.client.force_authenticate(user=self.author_user)
        url = '/api/documents/upload/'
        response = self.client.post(url, {'module_id': self.module.id}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'No files to upload')

    def test_upload_invalid_order_index(self):
        self.client.force_authenticate(user=self.author_user)
        url = '/api/documents/upload/'
        file = SimpleUploadedFile("upload.pdf", b"%PDF-1.4", content_type="application/pdf")
        data = {'files': [file],'module_id': self.module.id,'order_index': 'notanumber'}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data[0]['order_index'], 0)

    def test_admin_can_delete_document(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f'/api/documents/{self.document.pk}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_author_can_delete_own_document(self):
        self.client.force_authenticate(user=self.author_user)
        url = f'/api/documents/{self.document.pk}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_other_user_cannot_delete_document(self):
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/documents/{self.document.pk}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Permission denied')

    def test_list_documents_for_module(self):
        self.client.force_authenticate(user=self.author_user)
        url = f'/modules/{self.module.id}/documents/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Doc')
