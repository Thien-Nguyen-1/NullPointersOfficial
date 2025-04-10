import uuid
import os

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser

from returnToWork.models import (
    Module, Image, AudioClip, Document, EmbeddedVideo, Tags, Task, RankingQuestion
)
from returnToWork.serializers import (
    ImageSerializer, AudioClipSerializer, DocumentSerializer, 
    EmbeddedVideoSerializer, TagSerializer, ModuleSerializer, 
    TaskSerializer, RankingQuestionSerializer
)

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

        # Get the order_index from request data
        order_index = request.data.get('order_index', 0)
        try:
            order_index = int(order_index)
        except (ValueError, TypeError):
            order_index = 0

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
                height=height,  # Default height
                order_index=order_index # Save the order_index
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
                return AudioClip.objects.none()  # return empty queryset on error
        
        # If user is admin/superadmin, they can see all audio clips
        if self.request.user.is_staff or self.request.user.is_superuser or self.request.user.user_type in ['admin', 'superadmin']:
            return AudioClip.objects.all()
        
        # Regular users can only see published audio clips
        return AudioClip.objects.filter(is_published=True)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        
        files = request.FILES.getlist('files')

        module_id = request.data.get('module_id')

        # Get the order_index from request data
        order_index = request.data.get('order_index', 0)
        try:
            order_index = int(order_index)
        except (ValueError, TypeError):
            order_index = 0
        
        if not files:
            return Response({'error': 'No files to upload'}, status=status.HTTP_400_BAD_REQUEST)
        
        module = None
        if module_id:
            try:
                # convert module_id to integer since it's an AutoField
                module_id_int = int(module_id)

                module = Module.objects.get(id=module_id_int)
            except (Module.DoesNotExist, ValueError, TypeError) as e:
                return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)
        
        uploaded_audios = []
        
        for file in files:

            # check file type and size
            filename = file.name
            file_extension = os.path.splitext(filename)[1][1:].lower()
            
            allowed_extensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
            if file_extension not in allowed_extensions:
                continue  # skip unsupported files
            
            try:

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
                    is_published=True,  # set as published by default
                    order_index=order_index  # Save the order_index
                )
                
                # Try to get audio duration
                try:
                    import mutagen
                    audio_data = mutagen.File(file)
                    if audio_data and hasattr(audio_data.info, 'length'):
                        audio.duration = audio_data.info.length
                    else:
                        print("Could not extract duration from audio file")
                except Exception as e:
                    print(f"Error getting audio duration: {e}") 
                
          
                audio.save()
                uploaded_audios.append(audio)
            except Exception as e:
                print(f"Error saving audio {filename}: {str(e)}") 
                
        
        if not uploaded_audios:
            return Response({'error': 'No valid audio files were uploaded'}, status=status.HTTP_400_BAD_REQUEST)

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
        # Get the order_index from request data
        order_index = request.data.get('order_index', 0)
        try:
            order_index = int(order_index)
        except (ValueError, TypeError):
            order_index = 0
        
        if not files:
            return Response({'error': 'No files to upload'}, status=status.HTTP_400_BAD_REQUEST)
        
        module = None
        if module_id:
            try:
                # convert module_id to integer since it's an AutoField
                module_id_int = int(module_id)
                module = Module.objects.get(id=module_id)
            except Module.DoesNotExist:
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
                    is_published=True,  # set as published by default
                    order_index=order_index  # Save the order_index
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
        order_index = self.request.data.get('order_index', 0)
        try:
            order_index = int(order_index)
        except (ValueError, TypeError):
            order_index = 0

        # Save with both author and order_index
        serializer.save(
            author=self.request.user,
            order_index=order_index
        )

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

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tags.objects.all()
    serializer_class = TagSerializer

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class RankingQuestionViewSet(viewsets.ModelViewSet):
    queryset = RankingQuestion.objects.all()
    serializer_class = RankingQuestionSerializer
    def perform_create(self, serializer): # Automatically set the authenticated user as the author when a new ranking question is created
        serializer.save(author=self.request.user)
