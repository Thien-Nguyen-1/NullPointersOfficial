from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
import uuid


from returnToWork.models import (
User, AdminVerification
)
from returnToWork.serializers import (
    LogInSerializer,PasswordResetSerializer, RequestPasswordResetSerializer, 
    SignUpSerializer,
    UserPasswordChangeSerializer, UserSerializer
)

User = get_user_model()

class SignUpView(APIView):
    def post(self,request):
        serializer =SignUpSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"User registered successfully. Please verify your email to activate your account"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
class LogInView(APIView):
    def post(self, request):
        serializer = LogInSerializer(data = request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]

        if user.user_type == 'admin':
            try:
                verification = AdminVerification.objects.get(admin=user)
                if not verification.is_verified:
                    return Response({
                        'error': 'Please verify your email before logging in. Check your inbox for a verification link.',
                        'verification_required': True
                    }, status=status.HTTP_403_FORBIDDEN)
            except AdminVerification.DoesNotExist:
                verification_token = str(uuid.uuid4())
                AdminVerification.objects.create(
                    admin=user,
                    is_verified=False,
                    verification_token=verification_token
                )

                verification_url = f"http://localhost:5173/verify-admin-email/{verification_token}/"
                send_mail(
                    subject="Verify your admin account",
                    message=f"Dear {user.first_name},\n\nPlease verify your email by clicking the following link: {verification_url}\n\nThis link will expire in 3 days.",
                    from_email="readiness.to.return.to.work@gmail.com",
                    recipient_list=[user.email],
                    fail_silently=False,
                )

                return Response({
                    'error': 'Please verify your email before logging in. A verification link has been sent to your email.',
                    'verification_required': True
                }, status=status.HTTP_403_FORBIDDEN)

        login(request,user) 

        is_first_login = False 
        if user.is_first_login:
            is_first_login = True
          
            user.save()
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        user_data["is_first_login"] = is_first_login
        return Response({
            "message": "Login Successful", 
            "user": user_data,
            "token": str(refresh.access_token), 
            "refreshToken": str(refresh)}) 
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class RequestPasswordResetView(APIView):
    def post(self,request):
        serialzer = RequestPasswordResetSerializer(data = request.data)
        if serialzer.is_valid():
            serialzer.save()
            return Response({"message":"Password reset link sent successfully"}, status=status.HTTP_200_OK)
        return Response(serialzer.errors, status= status.HTTP_400_BAD_REQUEST)
    
class LogOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        try: 
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            logout(request)
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CheckUsernameView(APIView):
    def get(self,request):
        username = request.query_params.get('username',None)
        if not username:
            return Response({"error":"Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = User.objects.filter(username=username).exists()
        return Response ({"exists":exists}, status=status.HTTP_200_OK)

class CheckEmailView(APIView):
    def get(self,request):
        email = request.query_params.get('email',None)
        if not email:
            return Response({"error":"Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = User.objects.filter(email=email).exists()
        return Response ({"exists":exists}, status=status.HTTP_200_OK)

