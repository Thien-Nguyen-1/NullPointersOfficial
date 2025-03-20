# User-related views including profiles, settings, and account management

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ProgressTracker, Module, Tags
from ..serializers import (
    UserSerializer, UserSettingSerializer, 
    UserPasswordChangeSerializer
)

User = get_user_model()

class UserProfileView(APIView):
    """
    View and update the authenticated user's profile.
    
    This view provides access to the user's profile information
    and allows them to update their profile details.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetail(APIView):
    """
    Retrieve detailed user information including module progress.
    
    This view provides comprehensive information about the user,
    including their profile data and progress across all modules.
    """
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

        # Prepare module details with progress information
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

    def put(self, request):
        try:
            user = request.user
            user_serializer = UserSerializer(user)

            data = request.data

            user_in = User.objects.filter(user_id=data['user_id']).first()
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

class UserSettingsView(APIView):
    """
    Manage user account settings.
    
    This view allows users to view, update, or delete their account settings
    including preferences and personal information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSettingSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = UserSettingSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"message": "User account deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class UserPasswordChangeView(APIView):
    """
    Change user password while authenticated.
    
    This view lets authenticated users change their password
    by providing their current password and a new password.
    """
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UserPasswordChangeSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password updated successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ServiceUserListView(generics.ListAPIView):
    """
    List all service users, optionally filtered by username.
    
    This view returns all users with the 'service user' type,
    with an optional filter to search by username.
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(user_type="service user")
        # Get 'username' from query parameters
        username = self.request.query_params.get("username", None)
        if username:
            queryset = queryset.filter(username__icontains=username)
        return queryset.prefetch_related("tags")  # Prefetch tags for efficiency

class DeleteServiceUserView(generics.DestroyAPIView):
    """
    Delete a service user by username.
    
    This view allows removing a user account identified by username.
    """
    permission_classes = [AllowAny]

    def delete(self, request, username):
        try:
            user = User.objects.get(username=username)
            user.delete()
            return Response({"message": f"User with username \"{username}\" has been deleted."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)