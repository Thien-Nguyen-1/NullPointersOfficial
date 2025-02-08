from rest_framework import serializers
from .models import ProgressTracker

class ProgressTracker(serializers.ModelSerializer):
    class Meta:
        model = ProgressTracker
        fields = ['id', 'user', 'module', 'completed']