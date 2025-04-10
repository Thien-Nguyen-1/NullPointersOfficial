import uuid

from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from returnToWork.models import (
    Module, Task, Document, EmbeddedVideo, AudioClip, Image,
    RankingQuestion, ContentProgress, ProgressTracker, User
)
from returnToWork.serializers import (
    ContentPublishSerializer, ProgressTrackerSerializer
)

class MarkContentViewedView(APIView):
    """
    API view to mark content as viewed/completed.
    (FOR PROGRESS TRACKING)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only service users to mark content as viewed
        if request.user.user_type != 'service user':
            return Response({
                "success": False,
                "message": "Only service users can track progress"
            }, status=status.HTTP_403_FORBIDDEN)
        
        content_id = request.data.get('content_id')
        content_type_name = request.data.get('content_type')
        
        if not content_id or not content_type_name:
            return Response(
                {"error": "content_id and content_type are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Map content_type_name to model
        content_type_map = {
            'video': EmbeddedVideo,
            'quiz': Task,  # Assuming quizzes are stored in Task model
            #'document' : Document, (im confused here)
            'infosheet' : Document,
            'image' : Image,
            'audio' : AudioClip,
            'ranking' : RankingQuestion

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
        progress_tracker, _ = ProgressTracker.objects.get_or_create(
            user=request.user,
            module=module
        )
        progress_tracker.update_progress()
        
        # Return success response
        return Response({
            "success": True,
            "message": f"Content {content_id} marked as viewed",
            "module_progress": {
                "completed": progress_tracker.completed,
                "contents_completed": progress_tracker.contents_completed,
                "total_contents": progress_tracker.total_contents,
                "progress_percentage": progress_tracker.progress_percentage
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
        content_models = [Document, EmbeddedVideo, Task, AudioClip, Image, RankingQuestion]
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
        
        # Use partial=True to allow partial updates
        serializer = ProgressTrackerSerializer(progress_tracker, data=request.data, partial=True)
        
        # Add more explicit error handling
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Save the updated instance
        updated_tracker = serializer.save()
        
        return Response(ProgressTrackerSerializer(updated_tracker).data)

    def delete(self, request, pk):
        try:
            progress_tracker = ProgressTracker.objects.get(pk=pk)  
        except ProgressTracker.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        progress_tracker.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
