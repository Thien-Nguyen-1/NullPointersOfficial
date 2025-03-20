# Content-related views for managing various content types

import uuid
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    ContentProgress, InfoSheet, Video, Task, RankingQuestion,
    InlinePicture, AudioClip, Document, EmbeddedVideo, Module, ProgressTracker
)
from ..serializers import (
    ContentPublishSerializer, InfoSheetSerializer, VideoSerializer,
    RankingQuestionSerializer, InlinePictureSerializer, AudioClipSerializer,
    DocumentSerializer, EmbeddedVideoSerializer
)

User = get_user_model()

class InfoSheetViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for InfoSheet content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of InfoSheet resources.
    """
    queryset = InfoSheet.objects.all()
    serializer_class = InfoSheetSerializer

class VideoViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Video content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of Video resources.
    """
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

class RankingQuestionViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for RankingQuestion content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of RankingQuestion resources, automatically setting the author
    to the authenticated user.
    """
    queryset = RankingQuestion.objects.all()
    serializer_class = RankingQuestionSerializer
    
    def perform_create(self, serializer):
        # Automatically set the authenticated user as the author
        serializer.save(author=self.request.user)

class InlinePictureViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for InlinePicture content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of InlinePicture resources, automatically setting the author
    to the authenticated user.
    """
    queryset = InlinePicture.objects.all()
    serializer_class = InlinePictureSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class AudioClipViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for AudioClip content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of AudioClip resources, automatically setting the author
    to the authenticated user.
    """
    queryset = AudioClip.objects.all()
    serializer_class = AudioClipSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class DocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Document content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of Document resources, automatically setting the author
    to the authenticated user.
    """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class EmbeddedVideoViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for EmbeddedVideo content.
    
    This viewset handles the creation, retrieval, update, and deletion
    of EmbeddedVideo resources, automatically setting the author
    to the authenticated user.
    """
    queryset = EmbeddedVideo.objects.all()
    serializer_class = EmbeddedVideoSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ContentPublishView(APIView):
    """
    Publish a module with its content.
    
    This view handles the creation and publishing of modules with
    their associated content items.
    """
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

class MarkContentViewedView(APIView):
    """
    Mark content as viewed by the user.
    
    This view records that a user has viewed a specific content item
    and updates their progress accordingly.
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
    Get all completed content IDs for a module.
    
    This view returns a list of content IDs that the user
    has marked as viewed within a specific module.
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