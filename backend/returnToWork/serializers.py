from rest_framework import serializers
from .models import ProgressTracker,Tags,User,Module, Questionnaire, AdminSettings
from django.contrib.auth import authenticate, get_user_model


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'first_name', 'last_name','user_type']

class LogInSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self,data):
        user = authenticate(username =data["username"], password = data["password"])
        if not user:
            raise serializers.ValidationError("Invalid username or password")
        return {"user": user}

class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'username', 'first_name', 'last_name','user_type','password','confirm_password']
        read_only_fields = ["user_id"]

    def validate(self,data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Password do not match")
        return data
    
    def create(self,validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(**validated_data)
        return user

class PasswordResetSerializer(serializers.Serializer):
    username = serializers.CharField(write_only = True)
    new_password = serializers.CharField(write_only = True)
    confirm_new_password= serializers.CharField(write_only = True)

    def validate(self,data):
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError("New passwords do not match")
        return data
    
    def save(self):
        username = self.validated_data["username"]
        try:
            user = User.objects.get(username = username)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
    

class ProgressTrackerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressTracker
        fields = ['id', 'user', 'module', 'completed']


class QuestionnaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Questionnaire
        fields = ["id", "question", "yes_next_q", "no_next_q"]
  
class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id','title','description','tags','pinned','upvotes']


class TagSerializer(serializers.ModelSerializer):

    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Tags        
        fields = ['id','tag','modules']

class AdminSettingSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source = "user.user_id",read_only = True)
    class Meta:
        model = AdminSettings
        fields = ['user_id','first_name','last_name','username']

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.username = validated_data.get("username", instance.username)

        instance.save()
        return instance
    
class AdminPasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only = True, required = True)
    new_password = serializers.CharField(write_only = True, required = True)
    confirm_new_password= serializers.CharField(write_only = True, required = True)

    def validate(self,data):
        user = self.instance

        if not user.check_password(data["old_password"]):
            raise serializers.ValidationError({"old_password": "Incorrect old password"})
        
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError({"new_password" : "New passwords do not match"})
        
        return data
    
    def save(self, user):

        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
    

