from django.test import TestCase
from returnToWork.models import QuestionAnswerForm, User, Module
from returnToWork.serializers import QuestionAnswerFormSerializer

class QuestionAnswerFormSerializerTest(TestCase):
    def setUp(self):
        self.module = Module.objects.create(
            title="Handling work anxiety",
            description="This is a test module.",
            upvotes=9
        )
        self.user = User.objects.create_user(
            username='@jackdoe',
            first_name='Jack',
            last_name='Doe',
            email='jackdoe@example.org',
            password='SecurePass123',
            user_type='user',
        )
        self.question_answer_form = QuestionAnswerForm.objects.create(
            title="Question and Answer Form",
            description="create pairs",
            author=self.user,
            is_published=True,
            moduleID=self.module  # Assign the created module here
        )

    def test_serialize_model(self):
        serializer = QuestionAnswerFormSerializer(instance=self.question_answer_form)
        self.assertEqual(serializer.data['title'], 'Question and Answer Form')  # Update field check
        self.assertEqual(serializer.data['description'], 'create pairs')

    def test_deserialize_data(self):
        data = {
            'title': 'New Question',
            'description': 'Example description',
            'question': 'how are you?',
            'answer': 'ok',
            'author': self.user.id,
            'moduleID': self.module.id,  # Ensure moduleID is included if required
            'is_published': False
        }
        serializer = QuestionAnswerFormSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        new_question = serializer.save()

        self.assertEqual(new_question.title, 'New Question')
        self.assertEqual(new_question.description, 'Example description')
