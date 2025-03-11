# from django.test import TestCase
# from django.contrib.auth import get_user_model
# from returnToWork.models import ProgressTracker, Module, Tags
# from returnToWork.serializers import ProgressTrackerSerializer


# User = get_user_model()  

# class ProgressTrackerSerializerTest(TestCase):
#     @classmethod
#     def setUpTestData(cls):
#         # user instance 
#         cls.user = User.objects.create_user(username='testuser', password='password123')
        
#         # C module without the tags 
#         cls.module = Module.objects.create(
#             title="Confidence",
#             description="Find out how to imrpove your confidence",
#             upvotes=0
#         )
        
        
#         tag_names = ['self-worth', 'self-esteem', 'Confidence']  
#         tags = [Tags.objects.get_or_create(tag=tag)[0] for tag in tag_names] 
#         cls.module.tags.set(tags)  # Associate tags with the module 

#         # Creating the ProgressTracker instance
#         cls.progress_tracker = ProgressTracker.objects.create(
#             user=cls.user,
#             module=cls.module,
#             completed=True
#         )

#     def test_serialize_data(self):
#         """ Test serialization of ProgressTracker data to JSON """
#         serializer = ProgressTrackerSerializer(instance=self.progress_tracker)
#         data = serializer.data
#         self.assertEqual(set(data.keys()),{'id', 'user', 'module', 'completed'})
#         self.assertEqual(data['user'], self.user.id)
#         self.assertEqual(data['module'], self.module.id)
#         self.assertTrue(data['completed'])
#         self.assertTrue(data['pinned'])
#         self.assertFalse(data['hasLiked'])

#     def test_deserialize_data(self):
#         """ Test deserialization of JSON to ProgressTracker data """
#         input_data = {
#             'user': self.user.id,
#             'module': self.module.id,
#             'completed': False,
            
            
#         }
#         serializer = ProgressTrackerSerializer(data=input_data)
#         self.assertTrue(serializer.is_valid())
#         new_progress_tracker = serializer.save()

#         self.assertEqual(new_progress_tracker.user, self.user)
#         self.assertEqual(new_progress_tracker.module, self.module)
#         self.assertFalse(new_progress_tracker.completed)

