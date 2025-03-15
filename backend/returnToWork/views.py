import random
from django.shortcuts import render
from rest_framework import viewsets, status, generics
from .models import ProgressTracker,Tags,Module,InfoSheet,Video,Content,Task, Questionnaire, User, UserModuleInteraction,  QuizQuestion, UserResponse
from .models import ProgressTracker,Tags,Module,InfoSheet,Video,QuestionAnswerForm,Task, Questionnaire, User, UserModuleInteraction,  QuizQuestion, UserResponse,MatchingQuestionQuiz, RankingQuestion, InlinePicture, AudioClip, Document, EmbeddedVideo, TermsAndConditions
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordResetSerializer,TagSerializer,ModuleSerializer,QuestionAnswerFormSerializer,InfoSheetSerializer,VideoSerializer,TaskSerializer, QuestionnaireSerializer,MatchingQuestionQuizSerializer, UserModuleInteractSerializer, UserSettingSerializer, UserPasswordChangeSerializer, RequestPasswordResetSerializer, RankingQuestionSerializer, ContentPublishSerializer, EmbeddedVideoSerializer, DocumentSerializer, AudioClipSerializer, InlinePictureSerializer
from .models import ProgressTracker,Tags,Module, Questionnaire
from django.contrib.auth import login, logout
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from returnToWork.models import User
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.authentication import TokenAuthentication
from rest_framework import status
from django.shortcuts import get_object_or_404
import json
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from rest_framework_simplejwt.tokens import RefreshToken

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
            # token, created = Token.objects.get_or_create(user=user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({"message": "Login Successful", 
                            "user": UserSerializer(user).data,
                            "token": str(refresh.access_token),  # For backward compatibility
                            "refreshToken": str(refresh)}) # refresh token to get new access
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LogOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        # user=request.user
        # Token.objects.filter(user=user).delete()
        # logout(request)

        # if hasattr(request.user, 'auth_token'):
        #     request.user.auth_token.delete()
        # return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        try: 
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            logout(request)
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
class SignUpView(APIView):
    def post(self,request):
        serializer =SignUpSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request,user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({"message":"User registered successfully","user":UserSerializer(user).data, 
                             "jwt": {
                                 "access": str(refresh.access_token),
                                 "refresh": str(refresh)
                             }})
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
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
                'progress_percentage': random.randint(0, 99) if not tracker.completed else 100
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

            mod_data = data['module']


            tags = []
            modules = []


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
        user.delete()
        return Response({"message":"User account deleted successfully"},status=status.HTTP_204_NO_CONTENT)

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

        allInteracts = UserModuleInteraction.objects.filter(user=user) if option == "user" else UserModuleInteraction.objects.all()

        if allInteracts:
             serializedInf = UserModuleInteractSerializer(allInteracts,many=True)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializedInf.data, status=status.HTTP_200_OK)



    def post(self, request, module_id):
        user = request.user
        data = request.data
        module = Module.objects.get(id = module_id)

        if module:

            try:
                interactObj, hasCreated = UserModuleInteraction.objects.get_or_create(user=user, module=module)


                if( (data["hasLiked"]) and (((not hasCreated)  and ( not interactObj.hasLiked)) or (hasCreated))):
                    module.upvote()
                elif( (not data["hasLiked"]) and (not hasCreated ) and (interactObj.hasLiked)):
                    module.downvote()


                interactObj.hasPinned = data["hasPinned"]
                interactObj.hasLiked = data["hasLiked"]
                interactObj.save()

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
                question.save()

                return Response({
                    'id': question.id,
                    'text': question.question_text,
                    'hint': question.hint_text,
                    'order': question.order
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
                    order=order
                )

                return Response({
                    'id': question.id,
                    'text': question.question_text,
                    'hint': question.hint_text,
                    'order': question.order
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
                    'order': q.order
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

    
class QuestionAnswerFormViewSet(viewsets.ModelViewSet):
    queryset = QuestionAnswerForm.objects.all()
    serializer_class = QuestionAnswerFormSerializer    

class MatchingQuestionQuizViewSet(viewsets.ModelViewSet):
    queryset = MatchingQuestionQuiz.objects.all()
    serializer_class = MatchingQuestionQuizSerializer


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
            try:
                response = UserResponse.objects.filter(user=user, question=question).first()
                answer_text = response.response_text

            except UserResponse.DoesNotExist:
                answer_text = "No response provided"

            pdf.drawString(100, y_position, f"Q: {question.question_text}")
            y_position -=20
            pdf.drawString(120, y_position, f"A: {answer_text}")
            y_position -=30

        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["content-Disposition"] = f'attachment; filename ="{task.title.replace(" ", "-")}_completed.pdf"'
        return response
    

# ===== FOR SUPERADMIN (BUT NEEDS TO BE MODIFIED) ==== #

# Add these views to your returnToWork/views.py file

class TermsAndConditionsView(APIView):
    """API view for managing Terms and Conditions"""
    # permission_classes = [IsAuthenticated]
    permission_classes = []
    
    def get(self, request):
        """Get the current terms and conditions"""
        try:
            # Get the latest terms and conditions
            terms = TermsAndConditions.objects.latest('updated_at')
            return Response({
                'content': terms.content,
                'last_updated': terms.updated_at
            })
        except TermsAndConditions.DoesNotExist:
            # Return default content if no terms exist yet
            return Response({
                'content': 'Default terms and conditions. Please check back later for updated terms.',
                'last_updated': None
            })
    
    def put(self, request):
        """Update the terms and conditions"""
        # For PUT requests, still require authentication and superadmin role
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can update terms and conditions'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content is required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Create new terms and conditions entry
        terms = TermsAndConditions.objects.create(
            content=content,
            created_by=request.user
        )
        
        return Response({
            'content': terms.content,
            'last_updated': terms.updated_at
        })

class AdminUsersView(APIView):
    """API view for managing admin users"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of admin users"""
        # Check if user is a superadmin
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can view admin users'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get all users with user_type='admin'
        admins = User.objects.filter(user_type='admin')
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new admin user"""
        # Check if user is a superadmin
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can create admin users'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Ensure user_type is set to 'admin'
        data = request.data.copy()
        data['user_type'] = 'admin'
        
        # Use the existing SignUpSerializer for validation
        serializer = SignUpSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminUserDetailView(APIView):
    """API view for managing individual admin users"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, user_id):
        """Delete an admin user"""
        # Check if user is a superadmin

        print(f"[DEBUG] Received delete request for user_id: {user_id}")
        print(f"[DEBUG] Type of user_id: {type(user_id)}")

        if request.user.user_type != 'superadmin':
            print(f"[DEBUG] Permission denied: User type is {request.user.user_type}")
            return Response({'error': 'Only superadmins can delete admin users'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        try:
            print(f"[DEBUG] Looking for admin user with id={user_id}")
            admin = User.objects.get(id=user_id, user_type='admin')
            print(f"[DEBUG] Found admin: {admin.username}")
            admin.delete()
            print(f"[DEBUG] Admin user deleted successfully")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            print(f"[DEBUG] Admin user not found with id={user_id}")
            return Response({'error': 'Admin user not found'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            print(f"[DEBUG] Error deleting admin user: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'An error occurred: {str(e)}'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class CheckSuperAdminView(APIView):
    """API view to check if the current user is a superadmin"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check if current user is a superadmin"""
        is_superadmin = request.user.user_type == 'superadmin'
        return Response({'isSuperAdmin': is_superadmin})
    


class AcceptTermsView(APIView):
    """API view for users to accept terms and conditions"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Mark the current user as having accepted the terms"""
        user = request.user
        
        user.terms_accepted = True
        user.save()
        
        return Response({
            'message': 'Terms and conditions accepted',
            'user': UserSerializer(user).data
        })