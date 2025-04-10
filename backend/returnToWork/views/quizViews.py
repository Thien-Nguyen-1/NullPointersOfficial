import uuid

from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, viewsets

from returnToWork.models import Task, QuizQuestion, UserResponse
from returnToWork.serializers import QuizQuestionSerializer

# API View to fetch quiz details and handle quiz responses
class QuizDetailView(APIView):
    # permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Save user's response to a quiz question"""
        data = request.data
        question_id = data.get('question_id')
        response_text = data.get('response_text')

        if not question_id or response_text is None:
            return Response({'status': 'error', 'message': 'Missing required data'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convert string question_id to int if needed
            if isinstance(question_id, str) and question_id.isdigit():
                question_id = int(question_id)

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

            # Content progress is only updated on MarkContentViewed
            return Response({
                'status': 'success',
                'response_id': response_id
            }, status=status.HTTP_200_OK)

        except QuizQuestion.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Question not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                    'status': 'error',
                    'message': f'Error saving response: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuizDataView(APIView):
    # permission_classes = [IsAuthenticated]

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

class AdminQuizResponsesView(APIView):
    # permission_classes = [IsAuthenticated]
    # im not sure if this is needed anymore... since its not in requirement anymore
    def get(self, request, task_id):
        """Admin view to see all responses for a task"""
        # Check if user is admin
        if (request.user.user_type != 'admin' and request.user.user_type != 'superadmin'):
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

class QuizQuestionView(APIView):
    """API endpoint for creating and managing quiz questions"""

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
                answers = request.data.get('answers',[])

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
                question.answers
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
            # Handle creating a new question (existing code)
            task_id = request.data.get('task_id')
            question_text = request.data.get('question_text')
            hint_text = request.data.get('hint_text', '')
            order = request.data.get('order', 0)
            answers = request.data.get('answers',[])


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
                    'answers':question.answers
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
                'answers':question.answers,
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
            # handle temporary IDs starting with "new-"
            if task_id.startswith('new-'):
                # return empty array for temporary IDs
                return Response([])
            
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
    queryset = QuizQuestion.objects.all()
    serializer_class= QuizQuestionSerializer

# views.py
class QuizUserResponsesView(APIView):
    """API view to get a user's saved responses for a quiz"""

    #used by QuizApiUtils.submitQuizAnwers
    # saved answers to UserResponse model
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        try:
            # Convert task_id from string to UUID
            task_uuid = uuid.UUID(task_id)
            
            # Get the task
            task = Task.objects.get(contentID=task_uuid)
            
            # Get questions for this task
            questions = QuizQuestion.objects.filter(task=task)
            
            # Get user responses for these questions
            responses = UserResponse.objects.filter(
                user=request.user,
                question__in=questions
            )
            
            # Format the answers in the expected structure
            formatted_answers = {}
            for response in responses:
                formatted_answers[str(response.question.id)] = response.response_text
            
            return Response({
                'task_id': str(task_id),
                'answers': formatted_answers
            })
        except (Task.DoesNotExist, ValueError):
            return Response(
                {'error': 'Quiz not found or invalid ID format'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error fetching quiz responses: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
