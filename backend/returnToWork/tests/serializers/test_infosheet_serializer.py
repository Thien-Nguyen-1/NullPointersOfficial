# from django.test import TestCase
# from django.core.files.uploadedfile import SimpleUploadedFile
# from django.contrib.auth import get_user_model
# from returnToWork.serializers import InfoSheetSerializer
# from returnToWork.models import InfoSheet, Module

# User = get_user_model()  

# class InfoSheetSerializerTest(TestCase):
#     @classmethod
#     def setUpTestData(cls):
#         cls.user = User.objects.create_user(username='john', password='testcase123')
#         cls.module = Module.objects.create(title='Stress', description='Dealing with work stress', upvotes=1)
#         cls.infosheet = InfoSheet.objects.create(
#             title="Stress Exercise",
#             moduleID=cls.module,
#             author=cls.user,
#             description="A brief description of how to manage stress.",
#             is_published=True,
#             infosheet_file=SimpleUploadedFile("testfile.txt", b"these are the file contents!"),
#             infosheet_content="Detailed stress-related content."
#         )

#     def test_serialize_data(self):
#         """ Test serialization of InfoSheet data """
#         serializer = InfoSheetSerializer(instance=self.infosheet)
#         data = serializer.data
#         self.assertEqual(data['title'], 'Stress Exercise')
#         self.assertEqual(data['author'], str(self.user))
#         self.assertEqual(data['moduleID'], self.module.pk)
#         self.assertEqual(data['description'], "A brief description of how to manage stress.")
#         self.assertIn('infosheet_file', data)
#         self.assertEqual(data['infosheet_content'], "Detailed stress-related content.")
#         self.assertTrue(data['is_published'])

#     def test_deserialize_data(self):
#         """ Test deserialization of JSON to InfoSheet data """
#         infosheet_data = {
#             'title': 'New InfoSheet',
#             'moduleID': self.module.pk,
#             'author': self.user.id,  
#             'description': 'New infosheet description.',
#             'infosheet_file': SimpleUploadedFile("new_testfile.txt", b"new file contents!"),
#             'infosheet_content': 'New detailed infosheet content.',
#             'is_published': False
#         }
#         serializer = InfoSheetSerializer(data=infosheet_data)
#         self.assertTrue(serializer.is_valid())
        
#     def test_create_infosheet(self):
#         """ Test creating an InfoSheet through serializer """
#         infosheet_data = {
#               'title': 'Another InfoSheet',
#               'moduleID': self.module.id,
#               'author': self.user.id,  
#               'description': 'Another infosheet description.',
#               'infosheet_file': SimpleUploadedFile("another_testfile.txt", b"more file contents!"),
#               'infosheet_content': 'More detailed infosheet content.',
#               'is_published': True
#               }
#         serializer = InfoSheetSerializer(data=infosheet_data)
#         if serializer.is_valid():
#              new_infosheet = serializer.save(author=self.user)
#              self.assertEqual(new_infosheet.title, 'Another InfoSheet')
#              self.assertEqual(new_infosheet.author, self.user)
#         else:
#             self.fail(f'Serializer errors: {serializer.errors}')




