# Progress tracking views for monitoring user progress through modules

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ProgressTracker
from ..serializers import ProgressTrackerSerializer

class ProgressTrackerView(APIView):
    """
    View and manage module progress tracking.
    
    This view handles creating, retrieving, updating, and deleting
    progress tracker records for monitoring user progress through modules.
    """
    def get(self, request):
        """Get all progress tracker objects"""
        progressTrackerObjects = ProgressTracker.objects.all()
        serializer = ProgressTrackerSerializer(progressTrackerObjects, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new progress tracker entry"""
        serializer = ProgressTrackerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        """Update an existing progress tracker entry"""
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
        """Delete a progress tracker entry"""
        try:
            progress_tracker = ProgressTracker.objects.get(pk=pk)  
        except ProgressTracker.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        progress_tracker.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)