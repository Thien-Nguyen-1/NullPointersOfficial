from django.test import TestCase
from returnToWork.models import Questionnaire
from django.core.exceptions import ValidationError

class QuestionnaireTestCase(TestCase):


    def setup(self):
        self.yes_question = Questionnaire(question="Do you still want more support?")
        self.no_question = Questionnaire(question="Do you have anxiety?")
        
        
        self.initial_q = Questionnaire(
            question="Are you ready to return to work?", 
            yes_next_q=self.yes_question, 
            no_next_q=self.no_question
        )


    def test_valid_question_is_valid(self):
        try:
            self.initial_q.full_clean()
        except ValidationError:
            self.fail("Valid input threw a validation error")

    def test_too_long_question_invalid(self):
        self.initial_q = "x"*51
        with self.assertRaises(ValidationError):
            self.initial_q.full_clean()


    def test_circular_question_invalid(self):
        self.no_question.yes_next_q = self.initial_q
        with self.assertRaises(ValidationError):
            self.no_question.full_clean()


    