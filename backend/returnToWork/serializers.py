from rest_framework import serializers
from .models import ProgressTracker,Tags,User,Module,Content,InfoSheet,Video,Task, Questionnaire, RankingQuestion, InlinePicture, Document, EmbeddedVideo, AudioClip, UserModuleInteraction, QuizQuestion
from django.contrib.auth import authenticate, get_user_model
from django.core.files.base import ContentFile
import uuid
import base64

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
        fields = ['id', 'user', 'module', 'completed', 'pinned', 'hasLiked']


class QuestionnaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Questionnaire
        fields = ["id", "question", "yes_next_q", "no_next_q"]


class ContentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
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

class RankingQuestionSerializer(ContentSerializer):
    class Meta:
        model = RankingQuestion
        fields  = ContentSerializer.Meta.fields + ['tiers']

class InlinePictureSerializer(ContentSerializer):
    class Meta:
        model = InlinePicture
        fields  = ContentSerializer.Meta.fields + ['image_file']

class AudioClipSerializer(ContentSerializer):
    class Meta:
        model = AudioClip
        fields  = ContentSerializer.Meta.fields + ['audio_file']

class DocumentSerializer(ContentSerializer):
    class Meta:
        model = Document
        fields  = ContentSerializer.Meta.fields + ['documents']

class EmbeddedVideoSerializer(ContentSerializer):
    class Meta:
        model = EmbeddedVideo
        fields  = ContentSerializer.Meta.fields + ['video_url']

class ContentPublishSerializer(serializers.Serializer):
    """Serializer to handle module and content creation"""
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    elements = serializers.ListField()

    def create(self, validated_data):
        request = self.context.get('request')
        # Use the authenticated user if available; otherwise, assign default user
        if request.user.is_authenticated:
            user = request.user
        else:
            User = get_user_model()
            try:
                user = User.objects.get(username="default_user")
            except User.DoesNotExist:
                raise serializers.ValidationError("Default user is not set up.")

        # Create Module
        module = Module.objects.create(
            title=validated_data['title'],
            description=validated_data.get('description', ''),
            pinned=False,
            upvotes=0,
        )

        # Process each element in the payload
        for element in validated_data['elements']:
            content_type = element.get('type')

            if content_type == 'Ranking Question':
                RankingQuestion.objects.create(
                    moduleID=module,
                    author=user,
                    title=element.get('title', ''),
                    tiers=element.get('data', []),
                    is_published=True
                )

            elif content_type == 'Inline Picture':
                # Data expected in format "data:<mime>;base64,<encoded_data>"
                format, imgstr = element['data'].split(';base64,')
                ext = format.split('/')[-1]
                data = ContentFile(base64.b64decode(imgstr), name=f'{uuid.uuid4()}.{ext}')

                InlinePicture.objects.create(
                    moduleID=module,
                    author=user,
                    title=element.get('title', ''),
                    image_file=data,
                    is_published=True
                )

            elif content_type == 'Audio Clip':
                format, audiostr = element['data'].split(';base64,')
                ext = format.split('/')[-1]
                data = ContentFile(base64.b64decode(audiostr), name=f'{uuid.uuid4()}.{ext}')

                AudioClip.objects.create(
                    moduleID=module,
                    author=user,
                    title=element.get('title', 'Audio Clip'),
                    audio_file=data,
                    is_published=True
                )

            elif content_type == 'Attach PDF':
                Document.objects.create(
                    moduleID=module,
                    author=user,
                    title=element.get('title', ''),
                    documents=element.get('data', []),
                    is_published=True
                )

            elif content_type == 'Embedded Video':
                EmbeddedVideo.objects.create(
                    moduleID=module,
                    author=user,
                    title=element.get('title', ''),
                    video_url=element.get('data'),
                    is_published=True
                )

        return module

