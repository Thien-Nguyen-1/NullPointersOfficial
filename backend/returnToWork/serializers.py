from rest_framework import serializers
from .models import ProgressTracker,Tags,User,Module,Content,InfoSheet,Video,Task, Questionnaire, UserModuleInteraction, QuizQuestion,QuestionAnswerForm,MatchingQuestionQuiz,UserResponse
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator


User = get_user_model()

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id','title','description','tags','upvotes']

class TagSerializer(serializers.ModelSerializer):

    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Tags        
        fields = ['id','tag','modules']


class UserSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField( #Ensures tags are serialized as a list of tag names rather than ID
        many=True,
        read_only=True,
        slug_field="tag"
    )

   # tags = serializers.PrimaryKeyRelatedField(queryset=Tags.objects.all(), many=True) #serializers.StringRelatedField(many=True) #without this, only the primary key of the many-to-many field is returned
    module = ModuleSerializer(many=True)
   # tags = TagSerializer(many=True)

    class Meta:
        model = User
        fields = ['id', 'user_id', 'username', 'first_name', 'last_name', 'user_type', 'module', 'tags']

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
        fields = ['user_id', 'username', 'first_name', 'last_name','user_type','password','confirm_password','email']
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
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)
    uidb64 = serializers.CharField()
    token = serializers.CharField()

    def validate(self, data):

        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError("New passwords do not match")

        try:
            uid = urlsafe_base64_decode(data.get("uidb64")).decode()
            user = User.objects.get(pk=uid)

            if not default_token_generator.check_token(user, data.get("token")):
                raise serializers.ValidationError({"token": "Invalid or expired token."})

        except (User.DoesNotExist, ValueError):
            raise serializers.ValidationError({"user": "Invalid user or token"})

        return data

    def save(self):
        uid = urlsafe_base64_decode(self.validated_data["uidb64"]).decode()
        user = User.objects.get(pk=uid)

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
  

class ContentSerializer(serializers.ModelSerializer):
    
    author = serializers.StringRelatedField() 
    moduleID = serializers.PrimaryKeyRelatedField(queryset=Module.objects.all())

    class Meta:
        model = Content
        fields = ['contentID', 'title', 'moduleID', 'author', 'description', 'created_at', 'updated_at', 'is_published']
        read_only_fields = ['contentID', 'created_at', 'updated_at']

class InfoSheetSerializer(ContentSerializer):

    class Meta(ContentSerializer.Meta):
        model = InfoSheet
        fields = ContentSerializer.Meta.fields + ['infosheet_file', 'infosheet_content']        

class VideoSerializer(ContentSerializer):

    class Meta(ContentSerializer.Meta):
        model = Video
        fields = ContentSerializer.Meta.fields + ['video_file', 'duration', 'thumbnail']

class TaskSerializer(ContentSerializer):
    
    # Override the author field to allow writing to it
    author = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    
    class Meta:
        model = Task
        fields = ContentSerializer.Meta.fields + ['text_content', 'quiz_type']

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = '__all__'

class UserModuleInteractSerializer(serializers.ModelSerializer):

    class Meta:
        model=UserModuleInteraction
        fields = ['id', 'user', 'module', 'hasPinned', 'hasLiked']
    
class UserSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id','first_name','last_name','username','user_type']
    
class UserPasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only = True, required = True)
    new_password = serializers.CharField(write_only = True, required = True)
    confirm_new_password= serializers.CharField(write_only = True, required = True)

    def validate(self,data):
        user = self.context.get("request").user

        if not user.check_password(data["old_password"]):
            raise serializers.ValidationError({"old_password": "Incorrect old password"})
        
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError({"new_password" : "New passwords do not match"})
        
        return data
    
    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
    
class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self,value):
        try: 
            user = User.objects.get(email = value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with that email")
        return value
    
    def save(self):
            email = self.validated_data["email"]
            user = User.objects.get(email =email)

            #encode users pk to send id in resetlink securly, and generate a password reset token
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_url = f"http://localhost:5173/password-reset/{uidb64}/{token}/"


            send_mail(
                subject= "Password reset",
                message = f"Click the link to reset your password: {reset_url}",
                from_email = "readiness.to.return.to.work@gmail.com",
                recipient_list=[email],
                fail_silently=False,
            )
        
            return user

class QuestionAnswerFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionAnswerForm
        fields = '__all__'

class MatchingQuestionQuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchingQuestionQuiz
        fields = '__all__'

