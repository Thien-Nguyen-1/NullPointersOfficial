import json
import random
import uuid
from io import BytesIO

from django.contrib import admin
from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import generics, status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib.pagesizes import letter
from django.core.cache import cache

from django.db.models import Q
from firebase_admin import messaging


from reportlab.pdfgen import canvas

from .models import (
    Content, InfoSheet, Module, ProgressTracker,Questionnaire, QuizQuestion, 
    RankingQuestion, Tags, Task, User, UserModuleInteraction, UserResponse, 
    AudioClip, Document, EmbeddedVideo, InlinePicture, ContentProgress, Video,
    Conversation, Message
)
from .serializers import (
    AudioClipSerializer, ContentPublishSerializer, DocumentSerializer,
    EmbeddedVideoSerializer, InfoSheetSerializer, InlinePictureSerializer,
    LogInSerializer, ModuleSerializer, PasswordResetSerializer, ProgressTrackerSerializer, 
    QuestionnaireSerializer, QuizQuestionSerializer, RankingQuestionSerializer, RequestPasswordResetSerializer, 
    SignUpSerializer, TagSerializer, TaskSerializer, UserModuleInteractSerializer,
    UserPasswordChangeSerializer, UserSerializer, UserSettingSerializer,
    VideoSerializer, MessageSerializer, ConversationSerializer
)

User = get_user_model()


class ProgressTrackerView(APIView):

    def get(self, request):

        
        progressTrackerObjects = ProgressTracker.objects.all() #(filter user request and commpleted = true)
        serializer = ProgressTrackerSerializer(progressTrackerObjects,many = True)
        return Response(serializer.data)
    
    # Creates progress tracker entries
    def post(self, request):
        serializer = ProgressTrackerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            progress_tracker = ProgressTracker.objects.get(pk=pk)
        except ProgressTracker.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProgressTrackerSerializer(progress_tracker, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            progress_tracker = ProgressTracker.objects.get(pk=pk)  
        except ProgressTracker.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        progress_tracker.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogInView(APIView):
    def post(self, request):
        serializer = LogInSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            login(request,user)
            token, created = Token.objects.get_or_create(user=user)

            return Response({"message": "Login Successful", "token": token.key, "user": UserSerializer(user).data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LogOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        user=request.user
        Token.objects.filter(user=user).delete()
        logout(request)

        # if hasattr(request.user, 'auth_token'):
        #     request.user.auth_token.delete()
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    
class SignUpView(APIView):
    def post(self,request):
        serializer =SignUpSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            # login(request,user)
            return Response({"message":"User registered successfully. Please verify your email to activate your account"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
class VerifyEmailView(APIView):
    def get(self,request,token):
        user_data = cache.get(token)
        if not user_data:
            return Response({"error": "Invalid or expired verification token"}, status = status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=user_data.get("email")).exists():
            return Response({"message": "This email is already verified. You can log in"}, status=status.HTTP_200_OK)
        user = User.objects.create_user(**user_data)
        cache.delete(token)
        return Response({"message":"Email verified successfully"}, status=status.HTTP_200_OK)
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    def put(self,request):
        serializer = UserSerializer(request.user, data = request.data, partial =True )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PasswordResetView(APIView):
    permission_classes = []
    def post(self,request,uidb64,token):
        request.data["uidb64"] = uidb64
        request.data["token"] = token
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"Password reset successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tags.objects.all()
    serializer_class = TagSerializer

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

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

class InfoSheetViewSet(viewsets.ModelViewSet):
    queryset = InfoSheet.objects.all()
    serializer_class = InfoSheetSerializer


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer   

 
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class RankingQuestionViewSet(viewsets.ModelViewSet):
    queryset = RankingQuestion.objects.all()
    serializer_class = RankingQuestionSerializer
    def perform_create(self, serializer): # Automatically set the authenticated user as the author when a new ranking question is created
        serializer.save(author=self.request.user)

class InlinePictureViewSet(viewsets.ModelViewSet):
    queryset = InlinePicture.objects.all()
    serializer_class = InlinePictureSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class AudioClipViewSet(viewsets.ModelViewSet):
    queryset = AudioClip.objects.all()
    serializer_class = AudioClipSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class EmbeddedVideoViewSet(viewsets.ModelViewSet):
    queryset = EmbeddedVideo.objects.all()
    serializer_class = EmbeddedVideoSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class UserDetail(APIView):
    permission_classes = [IsAuthenticated]  

    def get(self, request):
        # Get user details
        user_serializer = UserSerializer(request.user)
        
        # Fetch progress tracker information
        progress_trackers = ProgressTracker.objects.filter(user=request.user)
        
        # Count completed and in-progress modules
        completed_modules = progress_trackers.filter(completed=True).count()
        total_modules = progress_trackers.count()
        in_progress_modules = total_modules - completed_modules

        # Prepare module details with random progress
        module_details = []
        for tracker in progress_trackers:
            module_details.append({
                'id': tracker.module.id,
                'title': tracker.module.title,
                'completed': tracker.completed,
                'pinned': tracker.pinned,
                'progress_percentage': tracker.progress_percentage
            })

        # Combine user data with progress information
        response_data = user_serializer.data
        response_data.update({
            'completed_modules': completed_modules,
            'in_progress_modules': in_progress_modules,
            'total_modules': total_modules,
            'modules': module_details
        })

        return Response(response_data)

    def put(self,request):

        # Works but Need To Use Seralizer - TO DO

        try:
            user = request.user
            user_serializer = UserSerializer(user)

            data = request.data

            user_in = User.objects.filter(user_id = data['user_id']).first()
            user_in.username = user.username
            user_in.first_name = user.first_name
            user_in.last_name = user.last_name
            user_in.user_type = user.user_type

            tag_data = data['tags']
            fire_token = data.get('firebase_token')
            mod_data = data['module']


            tags = []
            modules = []

            if(fire_token):
                user_in.firebase_token = fire_token
            


            for tag_obj in tag_data:

                    if tag_obj['id']:
                        tag_instance = Tags.objects.filter(tag=tag_obj['tag']).first()
                        if tag_instance:
                            tags.append(tag_instance)
                        else:
                            return Response({"detail": f"Tag ID not found."}, status=status.HTTP_404_NOT_FOUND)
                    else:
                        return Response({"detail": "Tag ID is missing."}, status=status.HTTP_400_BAD_REQUEST)


            for module in mod_data:
                if module['id']:
                    mod_instance = Module.objects.filter(id=module['id']).first()
                    if mod_instance:


                        modules.append(mod_instance)
                    else:
                        return Response({"detail": f"Module ID not found."}, status=status.HTTP_404_NOT_FOUND)
                else:
                    return Response({"detail": "Module ID is missing."}, status=status.HTTP_400_BAD_REQUEST)


            user_in.tags.set(tags)
            user_in.module.set(modules)
            user_in.save()

        except:

            return Response({"detail": "Unable to locate user"}, status=status.HTTP_400_BAD_REQUEST)



        return Response({"message": "Login Successful", "user": UserSerializer(user).data})

class ServiceUserListView(generics.ListAPIView):
    """API view to get all service users"""
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(user_type="service user")
        # Get 'username' from query parameters
        username = self.request.query_params.get("username", None)
        if username:
            queryset = queryset.filter(username__icontains=username)
        return queryset.prefetch_related("tags")  # Prefetch tags for efficiency

class DeleteServiceUserView(generics.DestroyAPIView):
    """API view to delete a user by username"""
    permission_classes = [AllowAny]

    def delete(self, request, username):
        try:
            user = User.objects.get(username=username)
            user_email = user.email
            send_mail(
            subject= "Account deletion",
            message = f"Dear {username}, Your account has been deleted by the admin",
            from_email = "readiness.to.return.to.work@gmail.com",
            recipient_list=[user_email],
            fail_silently=False,
            )
            user.delete()
            return Response({"message": f"User with username \"{username}\" has been deleted."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class ContentPublishView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # If the user is not authenticated, assign the default user
        user = request.user if request.user.is_authenticated else User.objects.get(username="default_user")
        serializer = ContentPublishSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            module = serializer.save()
            return Response({
                'message': 'Module published successfully',
                'module_id': module.id
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user = request.user
        serializer = UserSettingSerializer(user)
        return Response(serializer.data)

    def put(self,request):
        user = request.user
        serializer = UserSettingSerializer(user,data = request.data, partial =True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def delete(self,request):
        user = request.user
        user_email = user.email
        username = user.username

        user.delete()

        if not User.objects.filter(username = username).exists():
            send_mail(
                subject= "Account deletion",
                message = f"Dear {username}, Your account has been successfully deleted.",
                from_email = "readiness.to.return.to.work@gmail.com",
                recipient_list=[user_email],
                fail_silently=False,
                )
            return Response({"message":"User account deleted successfully"},status=status.HTTP_204_NO_CONTENT)

        return Response({"error":"User account not deleted"},status=status.HTTP_400_BAD_REQUEST)

class UserPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UserPasswordChangeSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password uUpdated successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





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
    # permission_classes = [IsAuthenticated]

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
class CheckUsernameView(APIView):
    def get(self,request):
        username = request.query_params.get('username',None)
        if not username:
            return Response({"error":"Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = User.objects.filter(username=username).exists()
        return Response ({"exists":exists}, status=status.HTTP_200_OK)



class RequestPasswordResetView(APIView):
    def post(self,request):
        serialzer = RequestPasswordResetSerializer(data = request.data)
        if serialzer.is_valid():
            serialzer.save()
            return Response({"message":"Password reset link sent successfully"}, status=status.HTTP_200_OK)
        return Response(serialzer.errors, status= status.HTTP_400_BAD_REQUEST)

class UserInteractionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        option = request.query_params.get("filter")

        allInteracts = ProgressTracker.objects.filter(user=user) if option == "user" else ProgressTracker.objects.all()

        if allInteracts:
             serializedInf = ProgressTrackerSerializer(allInteracts,many=True)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializedInf.data, status=status.HTTP_200_OK)



    def post(self, request, module_id):
        user = request.user
        data = request.data
        module = Module.objects.get(id = module_id)

        if module:

            try:
                tracker, created = ProgressTracker.objects.get_or_create(
                                user=user, 
                                module=module,
                                defaults={
                                    'hasLiked': False,
                                    'pinned': False
                                }
                            )
                # Handle upvote/downvote logic
                if( (data["hasLiked"]) and (((not created)  and ( not tracker.hasLiked)) or (created))):
                    module.upvote()
                elif( (not data["hasLiked"]) and (not created ) and (tracker.hasLiked)):
                    module.downvote()


                tracker.pinned = data["pinned"]
                tracker.hasLiked = data["hasLiked"]
                tracker.save()

                module.save()

            except:
                return Response({"message": "sent data formatted incorrectly!"}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({"message": "Module Not Found Mate"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Module interaction saved!", }, status=status.HTTP_200_OK)
class AdminQuizResponsesView(APIView):
    # permission_classes = [IsAuthenticated]

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

class TaskPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        user = request.user
        # get task details
        try:
            task = Task.objects.get(contentID = task_id)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        # get related questions 
        questions = QuizQuestion.objects.filter(task = task)
        
        if not questions.exists():
            return Response({"error": "No questions found for this task"}, status=status.HTTP_400_BAD_REQUEST)

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer)
        pdf.drawString(100,800,f"Task:{task.title}")

        y_position = 780
        # get related response and create the pdf
        for question in questions:
            # try:
            response = UserResponse.objects.filter(user=user, question=question).first()
            answer_text = response.response_text if response else "No response provided"

            # except UserResponse.DoesNotExist:
            #     answer_text = "No response provided"

            pdf.drawString(100, y_position, f"Question: {question.question_text}")
            y_position -=20
            pdf.drawString(120, y_position, f"Answer: {answer_text}")
            y_position -=30

        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{task.title.replace(" ", "-")}_completed.pdf"'

        return response

# class UserResponseViewSet(viewsets.ModelViewSet):
#     queryset = UserResponse.objects.all()
#     serializer_class = UserResponseSerializer

        
    










class UserSupportView(APIView):

    permission_classes = [IsAuthenticated]
    MAX_LIMIT = 5

    def get(self, request):
        user_ = request.user
        data = request.data

        

        try:
          
            info_chats = Conversation.objects.filter(user = user_) if user_.user_type == "service user" else Conversation.objects.filter(Q(hasEngaged = False) | Q(admin=user_))
            info_chats = info_chats.order_by('-updated_at')
            
            serialized_info = ConversationSerializer(info_chats, many=True)
            
            
            updated_data = [ {**chat, "user_username": User.objects.get(id=chat.get('user')).username}  for chat in serialized_info.data]
            

            return Response(updated_data, status=status.HTTP_200_OK)

        except:
            return Response({"message": "Unable to source user conversation"}, status=status.HTTP_404_NOT_FOUND)
    
        

    def post(self, request):
        user_ = request.user
        data = request.data

        currentNo = Conversation.objects.filter(user = user_).count()

        if( (user_.user_type == "service user") and ( currentNo < self.MAX_LIMIT )):
            Conversation.objects.create(user=user_)


        elif((user_.user_type == "admin") and data):
         
            conversation_ = Conversation.objects.get(id=data.get("conversation_id"))

            if conversation_:
                if not conversation_.hasEngaged:

                    conversation_.hasEngaged = True
                    conversation_.admin = user_

                    conversation_.save()
                    
                else:
                    return Response({"message": "Conversation already occupied"}, status=status.HTTP_400_BAD_REQUEST)


            else:
                return Response({"message": "Conversation NOT found"}, status=status.HTTP_404_NOT_FOUND)

    
        else:
            return Response({"message": "Maximum Support Room Limit (5) Reached"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        return Response({"message": "success"}, status=status.HTTP_200_OK)
    

    def delete(self, request):
        user_ = request.user
        data = request.data


        try:
             conversation_ = Conversation.objects.get(id = data.get("conversation_id"))

             if conversation_:
                conversation_.delete()

                return Response({"message" : "Conversation Deleted!"}, status=status.HTTP_200_OK)
        except:
            return Response({"message" : "Conversation Not Found!"}, status=status.HTTP_400_BAD_REQUEST)

       
        









class UserChatView(APIView):

    permission_classes = [IsAuthenticated]

    def getFcmToken(self, usr_type, conv_Obj):
      
        if usr_type == "service user": # user -> admin
           
            if getattr(conv_Obj.admin, "firebase_token", False):
                return conv_Obj.admin.firebase_token
               
        elif usr_type == "admin":  # admin -> user
            if getattr(conv_Obj.user, "firebase_token", False):
                return conv_Obj.user.firebase_token

        
        return None

        
    def get(self, request, room_id):
        user_ = request.user
        data = request.data
       
        conv_Obj = Conversation.objects.get(id = room_id)

        if conv_Obj:
            
            all_Messages = Message.objects.filter(conversation=conv_Obj)
            

            serialized_messages = MessageSerializer(all_Messages, many=True)
           
            return Response(serialized_messages.data, status=status.HTTP_200_OK)

        
        else:
            return Response({"message":"Unable to find conversation"}, status=status.HTTP_404_NOT_FOUND)

            


    def post(self,request, room_id, *args, **kwargs):
        user_ = request.user
        data = request.data

        conv_Obj = Conversation.objects.get(id = room_id)
        
    
  
        if conv_Obj:
            
            token = self.getFcmToken(user_.user_type, conv_Obj)

            admin = conv_Obj.admin

            message_content = data["message"]
            uploaded_file = data.get("file", None)

            
                #Create a new message object
            Message.objects.create(
                conversation=conv_Obj,
                sender=user_,
                text_content = message_content,
                file = uploaded_file
            )

            conv_Obj.save() 

            if token:

                message = messaging.Message(
                     notification=messaging.Notification(
                         title= user_.username ,
                         body = message_content,
                        
                     ),
                     token=token
                 )
                
                try:
                    response = messaging.send(message)
                   
                except:
                    pass

                
 
            else:
                return Response({"message": "token unlocated"}, status=status.HTTP_200_OK)



            return Response({"message": "Converation found"}, status=status.HTTP_200_OK)


        else:
            return Response({"message": "Conversation NOT found"}, status=status.HTTP_200_OK)


    


class MarkContentViewedView(APIView):
    """
    API view to mark content as viewed/completed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content_id = request.data.get('content_id')
        content_type_name = request.data.get('content_type')
        
        if not content_id or not content_type_name:
            return Response(
                {"error": "content_id and content_type are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Map content_type_name to model
        content_type_map = {
            'infosheet': InfoSheet,
            'video': Video,
            'quiz': Task,  # Assuming quizzes are stored in Task model
        }
        
        if content_type_name not in content_type_map:
            return Response(
                {"error": f"Invalid content_type: {content_type_name}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        model = content_type_map[content_type_name]
        content_type = ContentType.objects.get_for_model(model)
        
        # Try to convert string ID to UUID
        try:
            # If content_id is already a UUID string, this will work
            content_id_uuid = uuid.UUID(content_id)
        except ValueError:
            # If it's not a valid UUID string (like "infosheet-1")
            return Response(
                {"error": f"Content ID must be a valid UUID, got: {content_id}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the content object using the UUID
        try:
            content_object = model.objects.get(contentID=content_id_uuid)
        except model.DoesNotExist:
            return Response(
                {"error": f"Content not found with ID: {content_id}"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or update progress
        progress, created = ContentProgress.objects.get_or_create(
            user=request.user,
            content_type=content_type,
            object_id=content_id,
            defaults={'viewed': True, 'viewed_at': timezone.now()}
        )
        
        if not created and not progress.viewed:
            progress.mark_as_viewed()
        
        # Update module progress tracker
        module = content_object.moduleID
        module_progress, _ = ProgressTracker.objects.get_or_create(
            user=request.user,
            module=module
        )
        module_progress.update_progress()
        
        # Return success response
        return Response({
            "success": True,
            "message": f"Content {content_id} marked as viewed",
            "module_progress": {
                "completed": module_progress.completed,
                "contents_completed": module_progress.contents_completed,
                "total_contents": module_progress.total_contents,
                "progress_percentage": module_progress.progress_percentage
            }
        })


class CompletedContentView(APIView):
    """
    API view to get all completed content IDs for a module.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, module_id):
        module = get_object_or_404(Module, pk=module_id)
        
        # Get content types for all content models
        content_models = [InfoSheet, Video, Task]
        content_types = [ContentType.objects.get_for_model(model) for model in content_models]
        
        # Get content IDs for this module
        module_content_ids = []
        for model in content_models:
            module_content_ids.extend(
                model.objects.filter(moduleID=module).values_list('contentID', flat=True)
            )
        
        # Get viewed content
        viewed_content = ContentProgress.objects.filter(
            user=request.user,
            content_type__in=content_types,
            object_id__in=module_content_ids,
            viewed=True
        ).values_list('object_id', flat=True)
        
        return Response(list(viewed_content))
    

class CompletedInteractiveContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # module = get_object_or_404(Module, pk=module_id)

        content_type = ContentType.objects.get_for_model(Task)

        # module_task_ids = Task.objects.filter(moduleID=module).values_list('contentID', flat=True)

        viewed_tasks = ContentProgress.objects.filter(
            user=request.user,
            content_type=content_type,
            # object_id__in=module_task_ids,
            viewed=True
        )

        results = []
        for item in viewed_tasks:
            try:
                task = item.content_object
                results.append({
                    "content_id": str(item.object_id),
                    "title": task.title,
                    "viewed_at": item.viewed_at,
                    "quiz_type": task.get_quiz_type_display(),
                    "module_title": task.moduleID.title if task.moduleID else None
                })
            except:
                continue

        return Response(results)
