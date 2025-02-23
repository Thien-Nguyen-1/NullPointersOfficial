from django.shortcuts import render
from rest_framework import viewsets, status
from .models import ProgressTracker
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordResetSerializer
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class ProgressTrackerViewSet(viewsets.ModelViewSet):
    queryset = ProgressTracker.objects.all()
    serializer_class = ProgressTrackerSerializer

class LogInView(APIView):
    def post(self, request):
        serializer = LogInSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            login(request,user)
            return Response({"message": "Login Successful", "user": UserSerializer(user).data})
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
    
class PasswordResetView(APIView):
    permission_classes = []
    def post(self,request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message":"Password reset successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)