from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from returnToWork.models import Questionnaire
from returnToWork.serializers import QuestionnaireSerializer

class QuestionnaireView(APIView):
    """API to fetch questions dynamically based on answers"""
    # permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        """Fetch the first question or a specific question"""
        question_id = request.query_params.get("id")

        # checks if id was provided
        if question_id:
            try:
                # tries to fetch the relevant question...
                question = Questionnaire.objects.get(id=question_id)
                serializer = QuestionnaireSerializer(question)
                # and returns the data in JSON format
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Questionnaire.DoesNotExist:
                # ...returns error if it cant be found
                return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # fetches the first question, if id not provided
            first_question = Questionnaire.objects.get(question="Are you ready to return to work?")
            serializer = QuestionnaireSerializer(first_question)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """Get next question based on user's answer"""

        question_id = request.data.get("question_id")
        answer = request.data.get("answer")  # Expected: "yes" or "no"

        
        try:
            #  checks if id given is an aqual question
            question = Questionnaire.objects.get(id=question_id)
            
            if answer:
                next_question = question.yes_next_q if answer.lower() == "yes" else question.no_next_q
            else:
                return Response({"error": "Missing Answer"}, status=status.HTTP_400_BAD_REQUEST)
            
            
            if next_question:
                # checks if there is a follow up question to display
                serializer = QuestionnaireSerializer(next_question)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # if not, then flag that end of the questionnaire has been reached
                return Response({"message": "End of questionnaire"}, status=status.HTTP_200_OK)
        except Questionnaire.DoesNotExist:
            # returns error if not (realistically should never run)
            return Response({"error": "Invalid question"}, status=status.HTTP_400_BAD_REQUEST)
        

    def put(self, request):
        questions = request.data.get("questions")
        Questionnaire.objects.all().delete()
        
        if(questions):
            for qObj in reversed(questions):

        
                Questionnaire.objects.create(
                    id = qObj.get('id'),
                    question = qObj.get('question'),
                    yes_next_q= Questionnaire.objects.filter(id = qObj.get('yes_next_q')).first(),
                    no_next_q = Questionnaire.objects.filter(id = qObj.get('no_next_q')).first()
                    
                )

        print("The questions are successfully saved")
     

        return Response("", status=status.HTTP_200_OK)
