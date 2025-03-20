# Authentication related views including login, logout, signup, and password reset

from django.contrib.auth import get_user_model, login, logout
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import (
    LogInSerializer, SignUpSerializer, UserSerializer,
    PasswordResetSerializer, RequestPasswordResetSerializer
)

User = get_user_model()

class LogInView(APIView):
    """
    Handle user login and return authentication token.
    
    This view authenticates a user with username and password,
    creates or retrieves an authentication token, and returns
    the token along with basic user information.
    """
    def post(self, request):
        serializer = LogInSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)

            return Response({
                "message": "Login Successful", 
                "token": token.key, 
                "user": UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogOutView(APIView):
    """
    Handle user logout and delete authentication token.
    
    This view requires authentication and logs out the user by
    deleting their authentication token and ending their session.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        Token.objects.filter(user=user).delete()
        logout(request)
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)

class SignUpView(APIView):
    """
    Handle new user registration.
    
    This view creates a new user account based on the provided
    data and logs in the user if successful.
    """
    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)
            return Response({
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    """
    Handle password reset confirmation.
    
    This view processes a password reset request with a valid
    reset token and updates the user's password.
    """
    permission_classes = []
    
    def post(self, request, uidb64, token):
        request.data["uidb64"] = uidb64
        request.data["token"] = token
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RequestPasswordResetView(APIView):
    """
    Handle requests to initiate a password reset.
    
    This view triggers the password reset process by sending
    a reset link to the user's email address.
    """
    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset link sent successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckUsernameView(APIView):
    """
    Check if a username is already taken.
    
    This view helps with real-time validation during user registration
    by checking if a requested username already exists.
    """
    def get(self, request):
        username = request.query_params.get('username', None)
        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = User.objects.filter(username=username).exists()
        return Response({"exists": exists}, status=status.HTTP_200_OK)