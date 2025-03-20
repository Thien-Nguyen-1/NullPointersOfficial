# Quiz-related views for managing quiz content, questions, and user responses

import json
from io import BytesIO

from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.pdfgen import canvas

from ..models import (
    Task, Questionnaire, QuizQuestion, UserResponse
)
from ..serializers import (
    TaskSerializer, QuestionnaireSerializer, QuizQuestionSerializer
)

class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Task content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of Task resources, which represent interactive quiz/task elements.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class QuestionnaireView(APIView):
    """
    API to fetch questions dynamically based on answers.
    
    This view supports a decision-tree style questionnaire where
    each question leads to different follow-up questions based
    on the user's response.
    """
    def get(self, request, *args, **kwargs):
        """Fetch the first question or a specific question"""
        question_id = request.query_params.get("id")

        # Checks if id was provided
        if question_id:
            try:
                # Tries to fetch the relevant question
                question = Questionnaire.objects.get(id=question_id)
                serializer = QuestionnaireSerializer(question)
                # Returns the data in JSON format
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Questionnaire.DoesNotExist:
                # Returns error if it can't be found
                return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Fetches the first question, if id not provided
            first_question = Questionnaire.objects.get(question="Are you ready to return to work?")
            serializer = QuestionnaireSerializer(first_question)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """Get next question based on user's answer"""
        question_id = request.data.get("question_id")
        answer = request.data.get("answer")  # Expected: "yes" or "no"
        
        try:
            # Checks if id given is an actual question
            question = Questionnaire.objects.get(id=question_id)
            
            if answer:
                next_question = question.yes_next_q if answer.lower() == "yes" else question.no_next_q
            else:
                return Response({"error": "Missing Answer"}, status=status.HTTP_400_BAD_REQUEST)
            
            if next_question:
                # Checks if there is a follow up question to display
                serializer = QuestionnaireSerializer(next_question)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # If not, then flag that end of the questionnaire has been reached
                return Response({"message": "End of questionnaire"}, status=status.HTTP_200_OK)
        except Questionnaire.DoesNotExist:
            # Returns error if not (realistically should never run)
            return Response({"error": "Invalid question"}, status=status.HTTP_400_BAD_REQUEST)

class QuizDetailView(APIView):
    """
    Fetch quiz details.
    
    This view retrieves detailed information about a quiz/task,
    including its questions and metadata.
    """
    def get(self, request, task_id):
        """Fetch quiz details"""
        task = get_object_or_404(Task, contentID=task_id)
        questions = task.questions.all().order_by('order')

        response_data = {
            'task': {
                'id': str(task.contentID),
                'title': task.title,
                'description': task.description,
                'quiz_type': task.quiz_type,
            },
            'questions': [
                {
                    'id': q.id,
                    'text': q.question_text,
                    'order': q.order,
                    'hint': q.hint_text,
                } for q in questions
            ]
        }

        return Response(response_data, status=status.HTTP_200_OK)

class QuizResponseView(APIView):
    """
    Save user responses to quiz questions.
    
    This view handles the submission of user answers to quiz questions,
    either creating new response records or updating existing ones.
    """
    def post(self, request):
        """Save user's response to a quiz question"""
        data = request.data
        question_id = data.get('question_id')
        response_text = data.get('response_text')

        if not question_id or response_text is None:
            return Response({'status': 'error', 'message': 'Missing required data'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            question = QuizQuestion.objects.get(id=question_id)

            # Check if a response already exists
            existing_response = UserResponse.objects.filter(
                user=request.user,
                question=question
            ).first()

            if existing_response:
                # Update existing response
                existing_response.response_text = response_text
                existing_response.save()
                response_id = existing_response.id
            else:
                # Create new response
                new_response = UserResponse.objects.create(
                    user=request.user,
                    question=question,
                    response_text=response_text
                )
                response_id = new_response.id

            return Response({
                'status': 'success',
                'response_id': response_id
            }, status=status.HTTP_200_OK)

        except QuizQuestion.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Question not found'
            }, status=status.HTTP_404_NOT_FOUND)

class QuizDataView(APIView):
    """
    Get quiz data with user's previous responses.
    
    This view retrieves quiz questions along with any previous
    responses the user has submitted for those questions.
    """
    def get(self, request, task_id):
        """Get quiz data with user's previous responses"""
        task = get_object_or_404(Task, contentID=task_id)
        questions = task.questions.all().order_by('order')

        # Get user's previous responses if any
        user_responses = {}
        for question in questions:
            response = UserResponse.objects.filter(
                user=request.user,
                question=question
            ).first()

            if response:
                user_responses[question.id] = response.response_text

        # Prepare data for JSON response
        quiz_data = {
            'task_id': str(task.contentID),
            'title': task.title,
            'description': task.description,
            'quiz_type': task.quiz_type,
            'questions': [
                {
                    'id': q.id,
                    'text': q.question_text,
                    'order': q.order,
                    'hint': q.hint_text,
                    'user_response': user_responses.get(q.id, '')
                } for q in questions
            ]
        }

        return Response(quiz_data, status=status.HTTP_200_OK)

class QuizQuestionView(APIView):
    """
    Create, retrieve, update, and delete quiz questions.
    
    This view provides flexible operations for managing quiz questions,
    allowing them to be associated with specific tasks.
    """
    def post(self, request, question_id=None):
        """Create a new quiz question or update an existing one if question_id is provided"""
        # If question_id is provided, update existing question
        if question_id:
            try:
                question = QuizQuestion.objects.get(id=question_id)

                # Update fields
                task_id = request.data.get('task_id')
                question_text = request.data.get('question_text')
                hint_text = request.data.get('hint_text', '')
                order = request.data.get('order', 0)
                answers = request.data.get('answers', [])

                if not task_id or not question_text:
                    return Response(
                        {'error': 'Task ID and question text are required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Update the task reference if it changed
                try:
                    task = Task.objects.get(contentID=task_id)
                    question.task = task
                except Task.DoesNotExist:
                    return Response(
                        {'error': 'Task not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Update other fields
                question.question_text = question_text
                question.hint_text = hint_text
                question.order = order
                question.answers = answers
                question.save()

                return Response({
                    'id': question.id,
                    'text': question.question_text,
                    'hint': question.hint_text,
                    'order': question.order,
                    'answers': question.answers
                }, status=status.HTTP_200_OK)

            except QuizQuestion.DoesNotExist:
                return Response(
                    {'error': 'Question not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Handle creating a new question
            task_id = request.data.get('task_id')
            question_text = request.data.get('question_text')
            hint_text = request.data.get('hint_text', '')
            order = request.data.get('order', 0)
            answers = request.data.get('answers', [])

            if not task_id or not question_text:
                return Response(
                    {'error': 'Task ID and question text are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                task = Task.objects.get(contentID=task_id)

                # Create the new question
                question = QuizQuestion.objects.create(
                    task=task,
                    question_text=question_text,
                    hint_text=hint_text,
                    order=order,
                    answers=answers
                )

                return Response({
                    'id': question.id,
                    'text': question.question_text,
                    'hint': question.hint_text,
                    'order': question.order,
                    'answers': question.answers
                }, status=status.HTTP_201_CREATED)

            except Task.DoesNotExist:
                return Response(
                    {'error': 'Task not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

    def get(self, request, question_id=None):
        """Get a specific question or list all questions for a task"""
        if question_id:
            # Get specific question
            question = get_object_or_404(QuizQuestion, id=question_id)
            return Response({
                'id': question.id,
                'text': question.question_text,
                'hint': question.hint_text,
                'order': question.order,
                'answers': question.answers,
                'task_id': str(question.task.contentID)
            })
        else:
            # List questions for a task
            task_id = request.query_params.get('task_id')
            if not task_id:
                return Response(
                    {'error': 'task_id parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            task = get_object_or_404(Task, contentID=task_id)
            questions = QuizQuestion.objects.filter(task=task).order_by('order')

            return Response([
                {
                    'id': q.id,
                    'text': q.question_text,
                    'hint': q.hint_text,
                    'order': q.order,
                    'answers': q.answers
                } for q in questions
            ])

    def delete(self, request, question_id):
        """Delete a specific quiz question"""
        try:
            question = QuizQuestion.objects.get(id=question_id)
            question.delete()
            return Response({"status": "success", "message": "Question deleted"}, status=status.HTTP_204_NO_CONTENT)
        except QuizQuestion.DoesNotExist:
            return Response(
                {'error': 'Question not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class QuizQuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for quiz questions.
    
    This viewset provides standard CRUD operations for quiz questions
    using Django REST Framework's ModelViewSet capabilities.
    """
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSerializer

class TaskPdfView(APIView):
    """
    Generate a PDF of a task with user responses.
    
    This view creates a downloadable PDF document containing a task's
    questions and the user's responses to those questions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        user = request.user
        # Get task details
        try:
            task = Task.objects.get(contentID=task_id)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get related questions 
        questions = QuizQuestion.objects.filter(task=task)
        
        if not questions.exists():
            return Response({"error": "No questions found for this task"}, status=status.HTTP_400_BAD_REQUEST)

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer)
        pdf.drawString(100, 800, f"Task: {task.title}")

        y_position = 780
        # Get related response and create the pdf
        for question in questions:
            try:
                response = UserResponse.objects.filter(user=user, question=question).first()
                answer_text = response.response_text if response else "No response provided"
            except:
                answer_text = "No response provided"

            pdf.drawString(100, y_position, f"Q: {question.question_text}")
            y_position -= 20
            pdf.drawString(120, y_position, f"A: {answer_text}")
            y_position -= 30

        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{task.title.replace(" ", "-")}_completed.pdf"'
        return response