from django.test import TestCase
from returnToWork.models import QuestionAnswerForm,Module,User,Content

class QuestionAnswerFormTest(TestCase):

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
        
        
        self.question_answer_form = QuestionAnswerForm.objects.create(
            title="Question and Answer Form",
            description="Create pairs",
            author=self.user,
            moduleID=self.module,
            is_published=True,
            question="What is your favorite color?",
            answer="Blue"
        )

    def test_question_answer_form_creation(self):
        self.assertEqual(self.question_answer_form.question, "What is your favorite color?")
        self.assertEqual(self.question_answer_form.answer, "Blue")
        self.assertTrue(self.question_answer_form.is_published)
        self.assertEqual(self.question_answer_form.author, self.user)
        self.assertEqual(self.question_answer_form.moduleID, self.module)

    def test_question_answer_form_string_representation(self):
        self.assertEqual(str(self.question_answer_form), "What is your favorite color?")