from django.test import TestCase
from returnToWork.models import Questionnaire, User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

class QuestionnaireViewTestCase(TestCase):
    fixtures = ['returnToWork/tests/fixtures/default_user.json']

    def setUp(self):
        self.client = APIClient()

        self.yes_question = Questionnaire.objects.create(question="Do you still want more support?")
        self.no_question = Questionnaire.objects.create(question="Do you have anxiety?")
        
        
        self.initial_q = Questionnaire.objects.create(
            question="Are you ready to return to work?", 
            yes_next_q=self.yes_question, 
            no_next_q=self.no_question
        )
    
        self.user = User.objects.get(username='@johndoe')
        self.client.login(username=self.user.username, password="Password123")

        self.url = reverse("questionnaire")

    def test_url(self):
        """Test that the url is correct"""
        self.assertEqual(self.url, "/api/questionnaire/")


    def test_get_initial_question(self):
        """Test that the first question is returned successfully"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["question"], "Are you ready to return to work?")
        self.assertEqual(response.data["id"], self.initial_q.id)

    def test_fetch_relevent_question_if_id_provided(self):
        response = self.client.get(self.url,{"id": self.initial_q.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["question"], self.initial_q.question)
        self.assertEqual(response.data["id"], self.initial_q.id)
    
    def test_fetch_non_existent_questionaire(self):
        response = self.client.get(self.url,{"id": "11"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_post_yes_response(self):
        """Test that the post request when selecting 'yes' is successful"""
        response = self.client.post(self.url, {"question_id": self.initial_q.id, "answer": "yes"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["question"], "Do you still want more support?")

    def test_post_no_response(self):
        """Test that the post request when selecting 'no' is successful"""
        response = self.client.post(self.url, {"question_id": self.initial_q.id, "answer": "no"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["question"], "Do you have anxiety?")
    
    def test_post_invalid_question_id(self):
        """Test that an invalid question ID returns 400 Bad Request"""
        response = self.client.post(self.url, {"question_id": 9999, "answer": "yes"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_post_missing_question_id(self):
        """Test that missing question_id returns 400 Bad Request"""
        response = self.client.post(self.url, {"answer": "yes"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
    
    def test_post_missing_answer(self):
        """Test that missing answer returns 400 Bad Request"""
        response = self.client.post(self.url, {"question_id": self.initial_q.id}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
    
    def test_post_end_of_questionnaire(self):
        """Test that an endpoint with no next question returns 'End of questionnaire'"""
        last_question = Questionnaire.objects.create(question="Final question?", yes_next_q=None, no_next_q=None)
        
        response = self.client.post(self.url, {"question_id": last_question.id, "answer": "yes"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "End of questionnaire")

    def test_put_delete_questions(self):
        self.assertTrue(Questionnaire.objects.exists())
        response = self.client.put(self.url, data={"questions" : []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Questionnaire.objects.exists())

    def test_put_craete_questionnaire(self):
        data = {
            "questions": [
                {"id" : 2, "question":"Was the food nice?", "yes_next_q": None, "no_next_q":None},
                {"id":3, "question":"Do you want more?", "yes_next_q":None, "no_next_q":None},
                {"id":1, "question":"Do you eat today?", "yes_next_q":2, "no_next_q":3}
            ]
        }
        response = self.client.put(self.url, data=data,format = "json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)



    
