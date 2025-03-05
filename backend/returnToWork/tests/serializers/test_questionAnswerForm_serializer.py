from django.test import TestCase
from returnToWork.models import QuestionAnswerForm, User,Module,Content
from returnToWork.serializers import QuestionAnswerFormSerializer
from rest_framework.exceptions import ValidationError

class QuestionAnswerFormSerializerTest(TestCase):
     def setUp(self):
         self.module = Module.objects.create(
        title="Handling work anxiety",
        description="This is a test module.",
        pinned=True,
        upvotes=9
    )
         self.user = User.objects.create_user(
        username = '@jackdoe',
        first_name = 'Jack',
        last_name = 'Doe',
        email = 'jackdoe@example.org',
        password = 'SecurePass123',
        user_type ='user',
    )
         self.content = QuestionAnswerForm.objects.create(
        title = "Question and Answer Form",
        description = "create pairs",
        author=self.user,
        is_published=True,
        moduleID=self.module  # Assign the created module here
    )
     def test_serialize_model(self):
        serializer = QuestionAnswerFormSerializer(instance=self.question_answer_form)
        self.assertEqual(serializer.data['question'], 'What is the capital of France?')
        self.assertEqual(serializer.data['answer'], 'Paris')

     def test_deserialize_data(self):
        data = {
            'question': 'What is the colour of grass?',
            'answer': 'Green',
            'author': self.user.id,
            'is_published': False
        }
        serializer = QuestionAnswerFormSerializer(data=data)

        self.assertTrue(serializer.is_valid())

        new_question = serializer.save()

        self.assertEqual(new_question.question, 'What is the colour of grass?')
        self.assertEqual(new_question.answer, 'Green')
