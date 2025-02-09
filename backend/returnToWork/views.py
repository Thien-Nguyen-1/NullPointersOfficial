from django.shortcuts import render
from rest_framework import viewsets
from .models import ProgressTracker
from .serializers import ProgressTrackerSerializer

class ProgressTrackerViewSet(viewsets.ModelViewSet):
    queryset = ProgressTracker.objects.all()
    serializer_class = ProgressTrackerSerializer

