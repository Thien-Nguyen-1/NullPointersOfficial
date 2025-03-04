import random
from django.shortcuts import render
from rest_framework import viewsets, status, generics
from .models import ProgressTracker,Tags,Module,InfoSheet,Video,Content,Task, Questionnaire
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordResetSerializer,TagSerializer,ModuleSerializer,ContentSerializer,InfoSheetSerializer,VideoSerializer,TaskSerializer, QuestionnaireSerializer
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from returnToWork.models import User

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
                'pinned': tracker.module.pinned,
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


