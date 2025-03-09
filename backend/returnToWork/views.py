import random
from django.shortcuts import render
from rest_framework import viewsets, status, generics
from .models import ProgressTracker,Tags,Module,InfoSheet,Video,QuestionAnswerForm,Task, Questionnaire, User, UserModuleInteraction,  QuizQuestion, UserResponse,MatchingQuestionQuiz
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordResetSerializer,TagSerializer,ModuleSerializer,QuestionAnswerFormSerializer,InfoSheetSerializer,VideoSerializer,TaskSerializer, QuestionnaireSerializer,MatchingQuestionQuizSerializer, UserModuleInteractSerializer, UserSettingSerializer, UserPasswordChangeSerializer
from django.contrib.auth import login, logout

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from returnToWork.models import User
from rest_framework.authentication import TokenAuthentication
from rest_framework import status
from django.shortcuts import get_object_or_404
import json

class ProgressTrackerView(APIView):


    def get(self, request):

        
        progressTrackerObjects = ProgressTracker.objects.all()
        serializer = ProgressTrackerSerializer(progressTrackerObjects,many = True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = ProgressTrackerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        print(request.data)
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

            print(UserSerializer(user).data)
            return Response({"message": "Login Successful", "token": token.key, "user": UserSerializer(user).data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LogOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        logout(request)
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    
class SignUpView(APIView):
    def post(self,request):
        serializer =SignUpSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request,user)
            return Response({"message":"User registered successfully","user":UserSerializer(user).data})
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
    def post(self,request):
        print("RECEIVED DATUM!!!!")
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
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
        # print("Received Data:", request.data)

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
               # 'pinned': tracker.module.pinned,
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

            print("USERRR ISSSS")
            print(user)

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
        print(data)
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
