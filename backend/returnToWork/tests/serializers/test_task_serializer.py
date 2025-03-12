from django.test import TestCase
from django.contrib.auth import get_user_model
from returnToWork.serializers import TaskSerializer
from returnToWork.models import Task, Module

User = get_user_model()  

class TaskSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='john', password='testcase123')
        cls.module = Module.objects.create(title='Stress', description='Dealing with work stress', upvotes=1)
        cls.task = Task.objects.create(
            title="Manage Stress Task",
            moduleID=cls.module,
            author=cls.user,
            description="Tasks to help manage stress.",
            is_published=True,
            text_content="Complete the following exercises to help manage your stress."
        )

    # def test_serialize_data(self):
    #     """ Test serialization of Task data """
    #     serializer = TaskSerializer(instance=self.task)
    #     data = serializer.data
    #     self.assertEqual(data['title'], 'Manage Stress Task')
    #     self.assertEqual(data['author'], str(self.user))
    #     self.assertEqual(data['moduleID'], self.module.pk)
    #     self.assertTrue(data['is_published'])
    #     self.assertEqual(data['text_content'], "Complete the following exercises to help manage your stress.")

    def test_deserialize_data(self):
        """ Test deserialization of JSON to Task data """
        task_data = {
            'title': 'New Stress Task',
            'moduleID': self.module.pk,
            'author': self.user.id,
            'description': 'A new set of tasks to manage stress.',
            'is_published': True,
            'text_content': 'New task content here.'
        }
        serializer = TaskSerializer(data=task_data)
        if serializer.is_valid():
            new_task = serializer.save(author=self.user)  
            self.assertEqual(new_task.title, 'New Stress Task')
            self.assertEqual(new_task.text_content, 'New task content here.')
            self.assertEqual(new_task.author, self.user)
        else:
            self.fail(f'Serializer errors: {serializer.errors}')

    def test_update_task(self):
        """ Test updating an existing Task through serializer """
        update_data = {
            'text_content': 'Updated task content with new exercises.'
        }
        serializer = TaskSerializer(instance=self.task, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_task = serializer.save()
        self.assertEqual(updated_task.text_content, 'Updated task content with new exercises.')