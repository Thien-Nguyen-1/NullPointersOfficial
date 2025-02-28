import random
from django.shortcuts import render
from rest_framework import viewsets, status
from .models import ProgressTracker,Tags,Module
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordChangeSerializer,TagSerializer,ModuleSerializer
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token

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
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.isValid():
            serializer.update(request.user, serializer.validated_data)
            return Response({"message":"Password changed successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class TagViewSet(viewsets.ModelViewSet):
    
    queryset = Tags.objects.all()
    serializer_class = TagSerializer

class ModuleViewSet(viewsets.ModelViewSet):
    
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

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





