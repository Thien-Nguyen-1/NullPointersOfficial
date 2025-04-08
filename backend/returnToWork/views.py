# views.py - Main views file for backward compatibility
# This file imports all views from the modular structure

import json
import random
import os
import uuid
from io import BytesIO

from django.contrib import admin
from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.decorators import action

from rest_framework import generics, status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from reportlab.lib.pagesizes import letter
from django.core.cache import cache

from django.db.models import Q
from firebase_admin import messaging
import pusher

from reportlab.pdfgen import canvas

from .models import (
    Content, InfoSheet, Module, ProgressTracker,Questionnaire, QuizQuestion, 
    RankingQuestion, Tags, Task, User, UserModuleInteraction, UserResponse, 
    AudioClip, Document, EmbeddedVideo, InlinePicture, ContentProgress, Video,
    Conversation, Message, TermsAndConditions, AdminVerification, Image
)
from .serializers import (
    AudioClipSerializer, ContentPublishSerializer, DocumentSerializer,
    EmbeddedVideoSerializer, InfoSheetSerializer, InlinePictureSerializer,
    LogInSerializer, ModuleSerializer, PasswordResetSerializer, ProgressTrackerSerializer, 
    QuestionnaireSerializer, QuizQuestionSerializer, RankingQuestionSerializer, RequestPasswordResetSerializer, 
    SignUpSerializer, TagSerializer, TaskSerializer, UserModuleInteractSerializer,
    UserPasswordChangeSerializer, UserSerializer, UserSettingSerializer,
    VideoSerializer, MessageSerializer, ConversationSerializer, AdminVerificationSerializer, ImageSerializer
)

User = get_user_model()


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


# AUTH VIEWS START

class SignUpView(APIView):
    def post(self,request):
        serializer =SignUpSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"User registered successfully. Please verify your email to activate your account"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
class LogInView(APIView):
    def post(self, request):
        print(f"[DEBUG] Login attempt with data: {request.data}")
        serializer = LogInSerializer(data = request.data)

        if not serializer.is_valid():
            print(f"[DEBUG] Login serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        print(f"[DEBUG] User authenticated: {user.username}, user_type: {user.user_type}")

        if user.user_type == 'admin':
            try:
                verification = AdminVerification.objects.get(admin=user)
                print(f"[DEBUG] Admin verification found: is_verified={verification.is_verified}")
                if not verification.is_verified:
                    print(f"[DEBUG] Admin not verified, preventing login")
                    return Response({
                        'error': 'Please verify your email before logging in. Check your inbox for a verification link.',
                        'verification_required': True
                    }, status=status.HTTP_403_FORBIDDEN)
            except AdminVerification.DoesNotExist:
                print(f"[DEBUG] No verification record found for admin")
                # If no verification record exists, create one requiring verification
                verification_token = str(uuid.uuid4())
                AdminVerification.objects.create(
                    admin=user,
                    is_verified=False,
                    verification_token=verification_token
                )

                # Send verification email
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

        login(request,user) # If verification passed or not required, proceed with login
        # token, created = Token.objects.get_or_create(user=user)
        print(f"[DEBUG] Login successful, generating tokens")

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({"message": "Login Successful",
                        "user": UserSerializer(user).data,
                        "token": str(refresh.access_token),  # For backward compatibility
                        "refreshToken": str(refresh)}) # refresh token to get new access

        if serializer.is_valid():
            user = serializer.validated_data["user"]
            login(request,user)
            is_first_login = False 
            if user.is_first_login:
                is_first_login = True
                user.is_first_login = False 
                user.save()
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            user_data["is_first_login"] = is_first_login
            return Response({"message": "Login Successful", 
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


 #AUTH VIEWS END
    
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
        

    def put(self, request):
        questions = request.data.get("questions")
        Questionnaire.objects.all().delete()
        
        if(questions):
            for qObj in reversed(questions):

        
                Questionnaire.objects.create(
                    id = qObj.get('id'),
                    question = qObj.get('question'),
                    yes_next_q= Questionnaire.objects.filter(id = qObj.get('yes_next_q')).first(),
                    no_next_q = Questionnaire.objects.filter(id = qObj.get('no_next_q')).first()
                    
                )

        print("The questions are successfully saved")
     

        return Response("", status=status.HTTP_200_OK)

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


class ImageViewSet(viewsets.ModelViewSet):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        queryset = Image.objects.all()

        # Filter by module_id if provided in query params
        module_id = self.request.query_params.get('module_id', None)
        if module_id:
            queryset = queryset.filter(moduleID=module_id)

        # Filter by content_id if provided in query params
        content_id = self.request.query_params.get('content_id', None)
        if content_id:
            queryset = queryset.filter(contentID=content_id)

        return queryset

    @action(detail=False, methods=['post'])
    def upload(self, request):
        files = request.FILES.getlist('files')
        module_id = request.data.get('module_id')
        component_id = request.data.get('component_id', None)

        if not module_id:
            return Response({"detail": "Module ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(id=module_id)
        except Module.DoesNotExist:
            return Response({"detail": "Module not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get current user for author field
        current_user = request.user

        uploaded_images = []

        for i, file in enumerate(files):
            # Get custom dimensions if provided, otherwise use defaults
            width = int(request.data.get(f'width_{i}', 600))
            height = int(request.data.get(f'height_{i}', 400))

            # Create unique filename
            filename = str(uuid.uuid4()) + os.path.splitext(file.name)[1]

            # Save file to media storage
            file_path = default_storage.save(f'module_images/{filename}', ContentFile(file.read()))

            # Create image object with Content fields
            image = Image.objects.create(
                moduleID=module,  # Changed from module to moduleID
                title=file.name,  # Use filename as title
                author=current_user,  # Required by Content model
                description="Uploaded image",  # Default description
                is_published=True,  # Default to published
                file_url=default_storage.url(file_path),
                filename=file.name,
                file_size=file.size,
                file_type=os.path.splitext(file.name)[1][1:],  # Remove the dot from extension
                width=width,  # Default width
                height=height  # Default height
            )

            # If a component ID was provided, link it to the image as a description field
            # since contentID is now the primary key
            if component_id:
                image.description = f"Associated with component {component_id}"

            serializer = ImageSerializer(image)
            uploaded_images.append(serializer.data)

        return Response(uploaded_images, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_dimensions(self, request, pk=None):
        image = self.get_object()
        width = request.data.get('width')
        height = request.data.get('height')

        if not width or not height:
            return Response({"detail": "Width and height are required"}, status=status.HTTP_400_BAD_REQUEST)

        image.width = width
        image.height = height
        image.save()

        serializer = ImageSerializer(image)
        return Response(serializer.data)

class AudioClipViewSet(viewsets.ModelViewSet):
    queryset = AudioClip.objects.all()
    serializer_class = AudioClipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by module ID if provided in query params
        module_id = self.request.query_params.get('module_id')
        if module_id:
            try:
                # convert string to integer since Module.id is an AutoField
                module_id_int = int(module_id)
                return AudioClip.objects.filter(moduleID=module_id_int)
            except (ValueError, TypeError) as e:
                # Log the error for debugging
                print(f"Error filtering audio clips by module_id {module_id}: {str(e)}")
                return AudioClip.objects.none()  # return empty queryset on error
        
        # If user is admin/superadmin, they can see all audio clips
        if self.request.user.is_staff or self.request.user.is_superuser or self.request.user.user_type in ['admin', 'superadmin']:
            return AudioClip.objects.all()
        
        # Regular users can only see published audio clips
        return AudioClip.objects.filter(is_published=True)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        print("===== AUDIO UPLOAD REQUEST STARTED =====")
        print(f"Files in request: {request.FILES}")
        print(f"Request data: {request.data}")
        
        files = request.FILES.getlist('files')
        print(f"Number of files: {len(files)}")

        module_id = request.data.get('module_id')
        print(f"Module ID: {module_id}")
        
        if not files:
            print("No files found in request")
            return Response({'error': 'No files to upload'}, status=status.HTTP_400_BAD_REQUEST)
        
        module = None
        if module_id:
            try:
                # convert module_id to integer since it's an AutoField
                module_id_int = int(module_id)
                print(f"Converted module_id to int: {module_id_int}")

                module = Module.objects.get(id=module_id_int)
                print(f"Found module: {module.title}")
            except (Module.DoesNotExist, ValueError, TypeError) as e:
                print(f"Error getting module {module_id}: {str(e)}")
                return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)
        
        uploaded_audios = []
        
        for file in files:
            print(f"Processing file: {file.name}, size: {file.size} bytes")

            # check file type and size
            filename = file.name
            file_extension = os.path.splitext(filename)[1][1:].lower()
            
            allowed_extensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
            if file_extension not in allowed_extensions:
                print(f"File extension {file_extension} not allowed, skipping")
                continue  # skip unsupported files
            
            try:
                print(f"Creating AudioClip object for {filename}")

                # create audio clip object
                audio = AudioClip(
                    moduleID=module,
                    audio_file=file,
                    filename=filename,
                    file_type=file_extension,
                    file_size=file.size,
                    author=request.user,
                    title=filename,  # set title to filename by default
                    description=f"Uploaded audio: {filename}",
                    is_published=True  # set as published by default
                )
                
                # Try to get audio duration
                try:
                    import mutagen
                    print("Using mutagen to get audio duration")
                    audio_data = mutagen.File(file)
                    if audio_data and hasattr(audio_data.info, 'length'):
                        audio.duration = audio_data.info.length
                        print(f"Duration: {audio.duration} seconds")
                    else:
                        print("Could not extract duration from audio file")
                except Exception as e:
                    print(f"Error getting audio duration: {e}")
                
                print("Saving audio to database")
                audio.save()
                print(f"Audio saved successfully with content ID: {audio.contentID}")
                uploaded_audios.append(audio)
            except Exception as e:
                print(f"Error saving audio {filename}: {str(e)}")
        
        if not uploaded_audios:
            print("No valid audio files were uploaded")
            return Response({'error': 'No valid audio files were uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        print(f"Successfully uploaded {len(uploaded_audios)} audio files")
        serializer = AudioClipSerializer(uploaded_audios, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        audio = self.get_object()
        
        # Only allow admins or the audio author to delete
        if request.user.user_type in ['admin', 'superadmin'] or audio.author == request.user:
            return super().destroy(request, *args, **kwargs)
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by module ID if provided in query params
        module_id = self.request.query_params.get('module_id')
        if module_id:
            try:
                # convert string to integer since Module.id is an AutoField
                module_id_int = int(module_id)
                return Document.objects.filter(moduleID=module_id_int)
            except (ValueError, TypeError) as e:
                # Log the error for debugging
                print(f"Error filtering documents by module_id {module_id}: {str(e)}")
                return Document.objects.none()  # return empty queryset on error
        
        # If user is admin/superadmin, they can see all documents
        if self.request.user.is_staff or self.request.user.is_superuser or self.request.user.user_type in ['admin', 'superadmin']:
            return Document.objects.all()
        
        # Regular users can only see published documents
        return Document.objects.filter(is_published=True)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        files = request.FILES.getlist('files')
        module_id = request.data.get('module_id')
        
        if not files:
            return Response({'error': 'No files to upload'}, status=status.HTTP_400_BAD_REQUEST)
        
        module = None
        if module_id:
            try:
                # convert module_id to integer since it's an AutoField
                module_id_int = int(module_id)
                module = Module.objects.get(id=module_id)
            except Module.DoesNotExist:
                print(f"Error getting module {module_id}: {str(e)}")
                return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)
        
        uploaded_documents = []
        
        for file in files:
            # check file type and size
            filename = file.name
            file_extension = os.path.splitext(filename)[1][1:].lower()
            
            allowed_extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
            if file_extension not in allowed_extensions:
                continue  # skip unsupported files
            
            try:
                # create document object
                document = Document(
                    moduleID=module,
                    file=file,
                    filename=filename,
                    file_type=file_extension,
                    file_size=file.size,
                    author=request.user,
                    title=filename,  # set title to filename by default
                    description=f"Uploaded document: {filename}",
                    is_published=True  # set as published by default
                )
                document.save()
                uploaded_documents.append(document)
            except Exception as e:
                print(f"Error saving document {filename}: {str(e)}")
        
        if not uploaded_documents:
            return Response({'error': 'No valid documents were uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DocumentSerializer(uploaded_documents, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        
        # Only allow admins or the document author to delete
        if request.user.user_type in ['admin', 'superadmin'] or document.author == request.user:
            return super().destroy(request, *args, **kwargs)
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class EmbeddedVideoViewSet(viewsets.ModelViewSet):
    queryset = EmbeddedVideo.objects.all()
    serializer_class = EmbeddedVideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on request parameters"""
        queryset = EmbeddedVideo.objects.all()

        # Filter by module_id if provided
        module_id = self.request.query_params.get('module_id')
        if module_id:
            queryset = queryset.filter(moduleID=module_id)

        # Filter by component_id if provided (for specific content ID)
        component_id = self.request.query_params.get('component_id')
        if component_id:
            queryset = queryset.filter(contentID=component_id)

        # Filter by author if requested
        author_only = self.request.query_params.get('author_only')
        if author_only and author_only.lower() == 'true':
            queryset = queryset.filter(author=self.request.user)

        return queryset

    def perform_create(self, serializer):
        """Set the author when creating a new embedded video"""
        serializer.save(author=self.request.user)

    def update(self, request, *args, **kwargs):
        """Handle updates to embedded videos"""
        instance = self.get_object()

        if (instance.author != request.user and 
            not request.user.is_staff and
            request.user.user_type not in ['admin', 'superadmin']):
            return Response(
                {"detail": "You do not have permission to edit this video."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Handle deletion of embedded videos"""
        instance = self.get_object()

        if (instance.author != request.user and 
            not request.user.is_staff and 
            request.user.user_type not in ['admin', 'superadmin']):
            return Response(
                {"detail": "You do not have permission to delete this video."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def module_videos(self, request):
        """Get all videos for a specific module"""
        module_id = request.query_params.get('module_id')
        if not module_id:
            return Response(
                {"detail": "module_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        videos = EmbeddedVideo.objects.filter(moduleID=module_id)
        serializer = self.get_serializer(videos, many=True)
        return Response(serializer.data)


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


#SETTINGS VIEW START

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
        for question in questions:
            response = UserResponse.objects.filter(user=user, question=question).first()
            answer_text = response.response_text if response else "No response provided"
            pdf.drawString(100, y_position, f"Question: {question.question_text}")
            y_position -=20
            pdf.drawString(120, y_position, f"Answer: {answer_text}")
            y_position -=30

        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{task.title.replace(" ", "-")}_completed.pdf"'

        return response



#SETTINGS VIEW END





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


    

# ===== FOR SUPERADMIN (BUT NEEDS TO BE MODIFIED) ==== #
class TermsAndConditionsView(APIView):
    """API view for managing Terms and Conditions"""
    # permission_classes = [IsAuthenticated]
    
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
                'content': '',
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
        # serializer = SignUpSerializer(data=data)
        # if serializer.is_valid():
        #     user = serializer.save()
        #     return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check if email verification is required:
        require_verification = data.get('require_verification', True)
        try:
            #convert string value to boolean
            if isinstance(require_verification, str):
                require_verification = require_verification.lower() == 'true'
        except:
            require_verification == True

        try: 
            # Extract required fields
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')

            # validate required fields:
            if not all([username, email, password]):
                return Response({'error': 'Username, email and password are required'},
                                status=status.HTTP_400_BAD_REQUEST)
            
            # check if user already exists
            if User.objects.filter(username=username).exists(): # usrname checking
                return Response({'error': 'Username already exists'}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(email=email).exists(): # email checking
                return Response({'error': 'Email already exists'}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
            # Create user with create_user to properly hash password
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                user_type='admin',
                terms_accepted=True  # Default for admin users
            )
            
            if require_verification:
                # Create verification entry
                verification_token = str(uuid.uuid4())
                AdminVerification.objects.create(
                    admin=user,
                    is_verified=False,
                    verification_token=verification_token
                )
                
                # === VERIFICATION EMAIL FOR ADMIN IS OPTIONAL SINCE SUPERADMIN CREATES THEM === #
                # Send verification email
                verification_url = f"http://localhost:5173/verify-admin-email/{verification_token}/"
                print(f"Sending admin verification email to: {email}")
                print(f"Verification URL: {verification_url}")
                
                send_mail(
                    subject="Verify your admin account",
                    message=f"Dear {user.first_name},\n\nYou've been added as an admin by a superadmin. Please verify your email by clicking the following link: {verification_url}\n\nThis link will expire in 3 days.",
                    from_email="readiness.to.return.to.work@gmail.com",
                    recipient_list=[email],
                    fail_silently=False,
                )

                print("Email sent successfully")
            else:
                # If verification not required, create verified admin
                AdminVerification.objects.create(
                    admin=user,
                    is_verified=True
                )
            
            # Return the created user with JWT tokens for immediate login if not requiring verification
            if not require_verification:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                # Just return the user data without tokens
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AdminEmailVerificationView(APIView):
    """API view for admin email verification"""
    permission_classes = []  # no authentication required for verification
    
    def get(self, request, token):
        """Verify admin email using token"""
        print(f"[DEBUG] Admin verification requested with token: {token}")
        try:
            # find verification record with this token
            verification = AdminVerification.objects.get(verification_token=token)
            admin_user = verification.admin
            print(f"[DEBUG] Found verification record for admin: {admin_user.username}, is_verified: {verification.is_verified}")

            # If already verified, return a success message
            if verification.is_verified:
                print(f"[DEBUG] Admin already verified: {admin_user.username}")
                return Response({
                    'message': 'Email already verified. You can now log in as an admin.',
                    'redirect_url': '/login'
                })
            
            # check if token is expired
            if verification.is_token_expired():
                print(f"[DEBUG] Token expired")
                return Response({
                    'error': 'Verification token has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ensure the user is actually an admin
            if verification.admin.user_type != 'admin':
                print(f"[DEBUG] User is not admin: {admin_user.user_type}")
                return Response({
                    'error': 'This verification link is only valid for admin users.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark as verified and clear token
            verification.is_verified = True
            verification.save()
            print(f"[DEBUG] Admin verified successfully: {admin_user.username}")
            
            # Generate JWT tokens for immediate login
            refresh = RefreshToken.for_user(verification.admin)
            
            # Redirect to login or a success page
            return Response({
                'message': 'Email verified successfully. You can now log in as an admin.',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'redirect_url': '/login'
            })
        except AdminVerification.DoesNotExist:
            print(f"[DEBUG] Invalid or expired verification token: {token}")
            return Response({
                'error': 'Invalid or expired verification token'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendAdminVerificationView(APIView):
    """API view to resend admin verification emails"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        """Resend verification email to admin"""
        # Check if user is a superadmin
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can resend verification emails'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get the admin user
            admin = User.objects.get(id=user_id, user_type='admin')
            
            # Get or create verification record
            verification, created = AdminVerification.objects.get_or_create(
                admin=admin,
                defaults={'is_verified': False}
            )
            
            # Check if already verified
            if verification.is_verified:
                return Response({'error': 'User is already verified'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new verification token
            verification.verification_token = str(uuid.uuid4())
            verification.token_created_at = timezone.now()
            verification.save()
            
            # Send verification email
            verification_url = f"http://localhost:5173/verify-admin-email/{verification.verification_token}/"
            
            send_mail(
                subject="Verify your admin account - Reminder",
                message=f"Dear {admin.first_name},\n\nThis is a reminder to verify your admin account. Please click the following link to verify your email: {verification_url}\n\nThis link will expire in 3 days.",
                from_email="readiness.to.return.to.work@gmail.com",
                recipient_list=[admin.email],
                fail_silently=False,
            )
            
            return Response({
                'message': f'Verification email resent to {admin.email}',
                'email': admin.email
            })
            
        except User.DoesNotExist:
            return Response({'error': 'Admin user not found'}, 
                           status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            admin_to_delete = User.objects.get(id=user_id, user_type='admin')
            print(f"[DEBUG] Found admin: {admin_to_delete.username}")

            # Identify the superadmin (current user) 
            superadmin = request.user

            # find all content authored by this admin
            # check all content types that have author relationship
            from django.db import transaction
        
            # Use a transaction to ensure all operations are atomic
            with transaction.atomic():
                # 1. Check if the ADMIN user is associated with any modules
                # if using a many-to-many relationship
                module_count = 0
                if hasattr(admin_to_delete, 'module'):
                    module_count = admin_to_delete.module.count()
                    print(f"[DEBUG] Admin has {module_count} modules in many-to-many relationship")
                    # for many-to-many relationships, just need to ensure the superadmin
                    # also has these modules associated, not necessarily transfer ownership
                    if module_count > 0:
                        # add the modules to the superadmin's list if not already there
                        for module in admin_to_delete.module.all():
                            if not superadmin.module.filter(id=module.id).exists():
                                superadmin.module.add(module)
                        print(f"[DEBUG] Ensured all modules are associated with superadmin")
                
                # 2. Transfer authorship for each content type
                # for each content type that has an author field, update it
                
                # trasfer ownership of Task content
                tasks = Task.objects.filter(author=admin_to_delete)
                task_count = tasks.count()
                if task_count > 0:
                    print(f"[DEBUG] Transferring {task_count} Task items from {admin_to_delete.username} to {superadmin.username}")
                    tasks.update(author=superadmin)
                
                # Transfer ownership of RankingQuestion content
                ranking_questions = RankingQuestion.objects.filter(author=admin_to_delete)
                rq_count = ranking_questions.count()
                if rq_count > 0:
                    print(f"[DEBUG] Transferring {rq_count} RankingQuestion items")
                    ranking_questions.update(author=superadmin)
                
                # Transfer ownership of InlinePicture content
                inline_pictures = InlinePicture.objects.filter(author=admin_to_delete)
                ip_count = inline_pictures.count()
                if ip_count > 0:
                    print(f"[DEBUG] Transferring {ip_count} InlinePicture items")
                    inline_pictures.update(author=superadmin)
                
                # Transfer ownership of AudioClip content
                audio_clips = AudioClip.objects.filter(author=admin_to_delete)
                ac_count = audio_clips.count()
                if ac_count > 0:
                    print(f"[DEBUG] Transferring {ac_count} AudioClip items")
                    audio_clips.update(author=superadmin)
                
                # Transfer ownership of Document content
                documents = Document.objects.filter(author=admin_to_delete)
                doc_count = documents.count()
                if doc_count > 0:
                    print(f"[DEBUG] Transferring {doc_count} Document items")
                    documents.update(author=superadmin)
                
                # Transfer ownership of EmbeddedVideo content
                videos = EmbeddedVideo.objects.filter(author=admin_to_delete)
                video_count = videos.count()
                if video_count > 0:
                    print(f"[DEBUG] Transferring {video_count} EmbeddedVideo items")
                    videos.update(author=superadmin)
                
                # Transfer ownership of InfoSheet content
                infosheets = InfoSheet.objects.filter(author=admin_to_delete)
                infosheet_count = infosheets.count()
                if infosheet_count > 0:
                    print(f"[DEBUG] Transferring {infosheet_count} InfoSheet items")
                    infosheets.update(author=superadmin)
                
                # Transfer ownership of Video content
                video_content = Video.objects.filter(author=admin_to_delete)
                video_content_count = video_content.count()
                if video_content_count > 0:
                    print(f"[DEBUG] Transferring {video_content_count} Video items")
                    video_content.update(author=superadmin)
                
                # Update any terms and conditions created by this admin_to_delete
                terms = TermsAndConditions.objects.filter(created_by=admin_to_delete)
                terms_count = terms.count()
                if terms_count > 0:
                    print(f"[DEBUG] Transferring {terms_count} TermsAndConditions items")
                    terms.update(created_by=superadmin)
                
                # 3. Check for UserModuleInteraction and ProgressTracker 
                user_interactions = UserModuleInteraction.objects.filter(user=admin_to_delete)
                ui_count = user_interactions.count()
                if ui_count > 0:
                    print(f"[DEBUG] Deleting {ui_count} UserModuleInteraction items")
                    # For user interactions, it's probably better to delete them
                    # since these are personal interactions not ownership
                    user_interactions.delete()
                
                progress_trackers = ProgressTracker.objects.filter(user=admin_to_delete)
                pt_count = progress_trackers.count()
                if pt_count > 0:
                    print(f"[DEBUG] Deleting {pt_count} ProgressTracker items")
                    # For progress trackers, also better to delete
                    progress_trackers.delete()
                
                # 4. Check for UserResponse records
                user_responses = UserResponse.objects.filter(user=admin_to_delete)
                ur_count = user_responses.count()
                if ur_count > 0:
                    print(f"[DEBUG] Deleting {ur_count} UserResponse items")
                    user_responses.delete()
                
                # Store admin_to_delete name for the response message
                admin_name = f"{admin_to_delete.first_name} {admin_to_delete.last_name}"
                admin_username = admin_to_delete.username
                
                # Finally, delete the admin_to_delete user after transferring all content
                admin_to_delete.delete()
                print(f"[DEBUG] Admin user deleted successfully after content transfer")
                
                # Return a 200 OK with detailed information instead of 204 No Content
                # This allows the frontend to display more informative feedback
                return Response({
                    'status': 'success', 
                    'message': f'Admin user {admin_name} ({admin_username}) deleted successfully. All content transferred to your account.',
                    'transferred_items': {
                        'modules': module_count,
                        'tasks': task_count,
                        'ranking_questions': rq_count,
                        'inline_pictures': ip_count,
                        'audio_clips': ac_count,
                        'documents': doc_count,
                        'videos': video_count + video_content_count,
                        'infosheets': infosheet_count,
                        'terms': terms_count
                    },
                    'deleted_items': {
                        'user_interactions': ui_count,
                        'progress_trackers': pt_count,
                        'user_responses': ur_count
                    }
                }, status=status.HTTP_200_OK)
                
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

# class UserResponseViewSet(viewsets.ModelViewSet):
#     queryset = UserResponse.objects.all()
#     serializer_class = UserResponseSerializer

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

class UserSupportView(APIView):

    permission_classes = [IsAuthenticated]
    MAX_LIMIT = 5

    def get(self, request):
        user_ = request.user
        data = request.data

        

       
          
        info_chats = Conversation.objects.filter(user = user_) if user_.user_type == "service user" else Conversation.objects.filter(Q(hasEngaged = False) | Q(admin=user_))
        info_chats = info_chats.order_by('-updated_at')

        if not info_chats:
            return Response([], status=status.HTTP_200_OK)
        
        serialized_info = ConversationSerializer(info_chats, many=True)
        
        
        updated_data = [ {**chat, "user_username": User.objects.get(id=chat.get('user')).username}  for chat in serialized_info.data]
        

        return Response(updated_data, status=status.HTTP_200_OK)

       
    
        

    def post(self, request):
        user_ = request.user
        data = request.data

        currentNo = Conversation.objects.filter(user = user_).count()

        if( (user_.user_type == "service user") and ( currentNo < self.MAX_LIMIT )):
            Conversation.objects.create(user=user_)


        elif((user_.user_type == "admin") and data):
            
             try:
                conversation_ = Conversation.objects.get(id=data.get("conversation_id"))
             except Conversation.DoesNotExist:
                 return Response({"message": "Conversation NOT found"}, status=status.HTTP_404_NOT_FOUND)
                
            

         
             if not conversation_.hasEngaged:

                    conversation_.hasEngaged = True
                    conversation_.admin = user_

                    conversation_.save()
                    
             else:
                    return Response({"message": "Conversation already occupied"}, status=status.HTTP_400_BAD_REQUEST)


            

    
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

    
        
    def get(self, request, room_id):
        user_ = request.user
        data = request.data

        try:
            conv_Obj = Conversation.objects.get(id = room_id)
        except Conversation.DoesNotExist:
            return Response({"message":"Unable to find conversation"}, status=status.HTTP_404_NOT_FOUND)


      
            
        all_Messages = Message.objects.filter(conversation=conv_Obj)
        
        serialized_messages = MessageSerializer(all_Messages, many=True)
        
        return Response(serialized_messages.data, status=status.HTTP_200_OK)

        
     

            


    def post(self,request, room_id, *args, **kwargs):
        user_ = request.user
        data = request.data

        try:
            conv_Obj = Conversation.objects.get(id = room_id)
        except Conversation.DoesNotExist:
            return Response({"message": "Conversation NOT found"}, status=status.HTTP_404_NOT_FOUND)


            
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

        
        pusher_client = pusher.Pusher(
            app_id='1963499',
            key='d32d75089ef19c7a1669',
            secret='6523d0f19e5a5a6db9b3',
            cluster='eu',
            ssl=True
        )

        messageObj = {
            "message": message_content,
            "sender": user_.id,
            "chatID": room_id,
            "sender_username": user_.username,

        }

        pusher_client.trigger(f"chat-room-{room_id}", "new-message", messageObj)
            
            

        return Response({"message": "Converation found"}, status=status.HTTP_200_OK)


        


    


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
    

