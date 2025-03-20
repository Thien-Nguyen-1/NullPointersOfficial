# Admin-specific views for management functions

from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Task, QuizQuestion, UserResponse

class AdminQuizResponsesView(APIView):
    """
    Admin view to see all user responses for a quiz task.
    
    This view provides administrators with a comprehensive report of
    all user responses to a specific quiz, including user details and
    response timestamps.
    """
    def get(self, request, task_id):
        """Admin view to see all responses for a task"""
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({"error": "You do not have permission to access this resource"},
                          status=status.HTTP_403_FORBIDDEN)

        task = get_object_or_404(Task, contentID=task_id)
        questions = task.questions.all().order_by('order')

        # Collect all responses for this task
        responses_data = []

        for question in questions:
            responses = UserResponse.objects.filter(
                question=question
            ).select_related('user')

            question_data = {
                'question_id': question.id,
                'question_text': question.question_text,
                'responses': [
                    {
                        'user_id': response.user.user_id,
                        'username': response.user.username,
                        'user_full_name': response.user.full_name(),
                        'response_text': response.response_text,
                        'submitted_at': response.submitted_at
                    } for response in responses
                ]
            }
            responses_data.append(question_data)

        return Response({
            'task_id': str(task.contentID),
            'task_title': task.title,
            'responses': responses_data
        }, status=status.HTTP_200_OK)