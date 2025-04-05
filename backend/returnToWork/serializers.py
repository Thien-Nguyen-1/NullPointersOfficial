from rest_framework import serializers
from django.core.files.base import ContentFile
import uuid
import base64
from .models import ProgressTracker,Tags,User,Module,Content,InfoSheet,Video,Task, Questionnaire,  RankingQuestion, InlinePicture, Document, EmbeddedVideo, AudioClip, UserModuleInteraction, QuizQuestion,UserResponse, Conversation, Message, AdminVerification, Image
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache  
from django.conf import settings
import uuid
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

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
    module = ModuleSerializer(many=True, required=False)  # setting Module to be optional so that superadmin can still create admin even without admin has any module
    is_verified = serializers.SerializerMethodField() # for ADMIN verification
   # tags = TagSerializer(many=True)

    class Meta:
        model = User
        fields = ['id', 'user_id', 'username', 'first_name', 'last_name', 'user_type', 'email', 'date_joined', 'module', 'tags',
                   'firebase_token', 'terms_accepted', 'is_verified']

    def get_is_verified(self, obj):
        """Get verification status from AdminVerification model"""
        # Only check verification for ADMIN users
        if obj.user_type != 'admin':
            return None
            
        try:
            verification = AdminVerification.objects.get(admin=obj)
            return verification.is_verified
        except AdminVerification.DoesNotExist:
            return False

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
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    user_type = serializers.CharField()
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
        verification_token = str(uuid.uuid4())
        cache.set(verification_token, validated_data, timeout=86400)
        verification_url = f"http://localhost:5173/verify-email/{verification_token}/"

        send_mail(
            subject= "Verify email",
            message = f"Dear {validated_data['username']}, Thank you for signing up! Please verify your email by clicking the following link: {verification_url}",
            from_email = "readiness.to.return.to.work@gmail.com",
            recipient_list=[validated_data['email']],
            fail_silently=False,
        )
        return validated_data

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
        fields = ['id', 'user', 'module', 'completed', 'pinned', 'hasLiked', 
                 'contents_completed', 'total_contents', 'progress_percentage']
        
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

class ImageSerializer(ContentSerializer):
    class Meta:
        model = Image
        fields = ContentSerializer.Meta.fields + [
            'file_url', 'filename', 'file_size', 'file_size_formatted',
            'file_type', 'width', 'height'
        ]
        read_only_fields = ContentSerializer.Meta.read_only_fields + ['file_size_formatted']

class InlinePictureSerializer(ContentSerializer):
    class Meta:
        model = InlinePicture
        fields  = ContentSerializer.Meta.fields + ['image_file']

class AudioClipSerializer(ContentSerializer):
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = AudioClip
        fields = [
            'contentID', 'title', 'moduleID', 'author', 'description', 
            'created_at', 'updated_at', 'is_published', 'audio_file', 
            'file_url', 'file_size_formatted', 'duration', 'filename',
            'file_size', 'file_type'
        ]
    
    def get_file_url(self, obj):
        return obj.audio_file.url if obj.audio_file else None
    
    def get_file_size_formatted(self, obj):
        """Return human-readable file size."""
        if not obj.file_size:
            return None
            
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024

class DocumentSerializer(ContentSerializer):
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    upload_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'contentID', 'title', 'filename', 'file_type', 'file_size', 
            'file_url', 'file_size_formatted', 'upload_date', 'description'
        ]
    
    def get_file_url(self, obj):
        return obj.file.url if obj.file else None
    
    def get_file_size_formatted(self, obj):
        """Return human-readable file size."""
        size = obj.file_size
        if size is None:
            return None
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024
    
    def get_upload_date(self, obj):
        return obj.created_at

class EmbeddedVideoSerializer(ContentSerializer):
    class Meta:
        model = EmbeddedVideo
        fields  = ContentSerializer.Meta.fields + ['video_url']
        read_only_fields = ContentSerializer.Meta.read_only_fields

        def validate_video_url(self, value):
            """Validate the video URL to ensure it's from a supported platform"""
            # List of supported video platforms
            supported_domains = [
                "youtube.com", "youtu.be",
                "vimeo.com",
                "dailymotion.com",
                "wistia.com",
                "loom.com"
            ]

            try:
                from urllib.parse import urlparse
                parsed_url = urlparse(value)
                domain = parsed_url.netloc

                # Check if the domain is from a supported platform
                if not any(supported in domain for supported in supported_domains):
                    raise serializers.ValidationError(
                        f"URL must be from a supported video platform. Supported platforms: {', '.join(supported_domains)}"
                    )

                return value
            except Exception as e:
                raise serializers.ValidationError(f"Invalid URL: {str(e)}")

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
    
    class UserResponseSerializer(serializers.ModelSerializer):
        class Meta:
            model = UserResponse
            fields = '__all__'

            
class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['id', 'user', 'admin', 'created_at', 'hasEngaged', 'updated_at','lastMessage']


class MessageSerializer(serializers.ModelSerializer):

    file = serializers.FileField(read_only=True) #obtain the url only

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'text_content', 'timestamp', 'file']

class AdminVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminVerification
        fields = ['is_verified']