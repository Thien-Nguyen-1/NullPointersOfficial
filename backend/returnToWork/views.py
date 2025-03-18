import random
from django.shortcuts import render
from rest_framework import viewsets, status, generics
from .models import ProgressTracker,Tags,Module,InfoSheet,Video,Content,Task, Questionnaire, User, UserModuleInteraction, Conversation, Message
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordResetSerializer,TagSerializer,ModuleSerializer,ContentSerializer,InfoSheetSerializer,VideoSerializer,TaskSerializer, QuestionnaireSerializer, UserModuleInteractSerializer, MessageSerializer
from .models import ProgressTracker,Tags,Module, Questionnaire
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordResetSerializer,TagSerializer,ModuleSerializer, QuestionnaireSerializer, UserSettingSerializer, UserPasswordChangeSerializer, ConversationSerializer
from django.contrib.auth import login, logout

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from returnToWork.models import User
from rest_framework.authentication import TokenAuthentication

from django.db.models import Q
from firebase_admin import messaging



class ProgressTrackerView(APIView):


    def get(self, request):

        
        progressTrackerObjects = ProgressTracker.objects.all()
        serializer = ProgressTrackerSerializer(progressTrackerObjects,many = True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = ProgressTrackerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        print(request.data)
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
        try:
            progress_tracker = ProgressTracker.objects.get(pk=pk)
        except ProgressTracker.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        progress_tracker.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogInView(APIView):
    def post(self, request):
        serializer = LogInSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]

            

            login(request,user)
            token, created = Token.objects.get_or_create(user=user)

            print(UserSerializer(user).data)
            return Response({"message": "Login Successful", "token": token.key, "user": UserSerializer(user).data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LogOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        logout(request)
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    
class SignUpView(APIView):
    def post(self,request):
        serializer =SignUpSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request,user)
            return Response({"message":"User registered successfully","user":UserSerializer(user).data})
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    def put(self,request):
        serializer = UserSerializer(request.user, data = request.data, partial =True )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PasswordResetView(APIView):
    permission_classes = []
    def post(self,request):
        print("RECEIVED DATUM!!!!")
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message":"Password reset successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class TagViewSet(viewsets.ModelViewSet):
    
    queryset = Tags.objects.all()
    serializer_class = TagSerializer


class ModuleViewSet(viewsets.ModelViewSet):
    

    queryset = Module.objects.all()
    serializer_class = ModuleSerializer



class QuestionnaireView(APIView):
    """API to fetch questions dynamically based on answers"""
    
    
    # permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        """Fetch the first question or a specific question"""
        question_id = request.query_params.get("id")

        # checks if id was provided
        if question_id:
            try:
                # tries to fetch the relevant question...
                question = Questionnaire.objects.get(id=question_id)
                serializer = QuestionnaireSerializer(question)
                # and returns the data in JSON format
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Questionnaire.DoesNotExist:
                # ...returns error if it cant be found
                return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # fetches the first question, if id not provided
            first_question = Questionnaire.objects.get(question="Are you ready to return to work?")
            serializer = QuestionnaireSerializer(first_question)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """Get next question based on user's answer"""
        # print("Received Data:", request.data)

        question_id = request.data.get("question_id")
        answer = request.data.get("answer")  # Expected: "yes" or "no"

        
        try:
            #  checks if id given is an aqual question
            question = Questionnaire.objects.get(id=question_id)
            
            if answer:
                next_question = question.yes_next_q if answer.lower() == "yes" else question.no_next_q
            else:
                return Response({"error": "Missing Answer"}, status=status.HTTP_400_BAD_REQUEST)
            
            
            if next_question:
                # checks if there is a follow up question to display
                serializer = QuestionnaireSerializer(next_question)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # if not, then flag that end of the questionnaire has been reached
                return Response({"message": "End of questionnaire"}, status=status.HTTP_200_OK)
        except Questionnaire.DoesNotExist:
            # returns error if not (realistically should never run)
            return Response({"error": "Invalid question"}, status=status.HTTP_400_BAD_REQUEST)

class InfoSheetViewSet(viewsets.ModelViewSet):
    queryset = InfoSheet.objects.all()
    serializer_class = InfoSheetSerializer


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer   

 
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer  

class UserDetail(APIView):
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

        # Prepare module details with random progress
        module_details = []
        for tracker in progress_trackers:
            module_details.append({
                'id': tracker.module.id,
                'title': tracker.module.title,
                'completed': tracker.completed,
               # 'pinned': tracker.module.pinned,
                'progress_percentage': random.randint(0, 99) if not tracker.completed else 100
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
    
    def put(self,request):

        # Works but Need To Use Seralizer - TO DO
       
        try:
            user = request.user

            print("USERRR ISSSS")
            print(user)

            user_serializer = UserSerializer(user)

            data = request.data
        
            user_in = User.objects.filter(user_id = data['user_id']).first()
            user_in.username = user.username
            user_in.first_name = user.first_name
            user_in.last_name = user.last_name
            user_in.user_type = user.user_type
            
            tag_data = data.get('tags')
            
            mod_data = data.get('module')
            
            fire_token = data.get('firebase_token')
            

            tags = []
            modules = []

            if(fire_token):
                user_in.firebase_token = fire_token
            


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
    
class ServiceUserListView(generics.ListAPIView):
    """API view to get all service users"""
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(user_type="service user")
        # Get 'username' from query parameters
        username = self.request.query_params.get("username", None)
        if username:
            queryset = queryset.filter(username__icontains=username)
        return queryset.prefetch_related("tags")  # Prefetch tags for efficiency

class DeleteServiceUserView(generics.DestroyAPIView):
    """API view to delete a user by username"""
    permission_classes = [AllowAny]

    def delete(self, request, username):
        try:
            user = User.objects.get(username=username)
            user.delete()
            return Response({"message": f"User with username \"{username}\" has been deleted."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user = request.user
        serializer = UserSettingSerializer(user)
        return Response(serializer.data)
        
    def put(self,request):
        user = request.user
        serializer = UserSettingSerializer(user,data = request.data, partial =True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self,request):
        user = request.user
        user.delete()
        return Response({"message":"User account deleted successfully"},status=status.HTTP_204_NO_CONTENT)
    
class UserPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UserPasswordChangeSerializer(data=request.data, context={"request": request})
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password uUpdated successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    























class UserInteractionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
      
        option = request.query_params.get("filter")

        allInteracts = UserModuleInteraction.objects.filter(user=user) if option == "user" else UserModuleInteraction.objects.all()

        if allInteracts:
             serializedInf = UserModuleInteractSerializer(allInteracts,many=True)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializedInf.data, status=status.HTTP_200_OK)
       


    def post(self, request, module_id):
        user = request.user
        data = request.data
        print(data)
        module = Module.objects.get(id = module_id)
        
        if module:
            
            try:
                interactObj, hasCreated = UserModuleInteraction.objects.get_or_create(user=user, module=module)
                

                if( (data["hasLiked"]) and (((not hasCreated)  and ( not interactObj.hasLiked)) or (hasCreated))):
                    module.upvote()
                elif( (not data["hasLiked"]) and (not hasCreated ) and (interactObj.hasLiked)):
                    module.downvote()
                    

                interactObj.hasPinned = data["hasPinned"]
                interactObj.hasLiked = data["hasLiked"]
                interactObj.save()

                module.save()

            except:
                return Response({"message": "sent data formatted incorrectly!"}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({"message": "Module Not Found Mate"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"message": "Module interaction saved!", }, status=status.HTTP_200_OK)
    










class UserSupportView(APIView):

    permission_classes = [IsAuthenticated]
    MAX_LIMIT = 5

    def get(self, request):
        user_ = request.user
        data = request.data

        

        try:
          
            info_chats = Conversation.objects.filter(user = user_) if user_.user_type == "service user" else Conversation.objects.filter(Q(hasEngaged = False) | Q(admin=user_))
            info_chats = info_chats.order_by('-updated_at')
            
            serialized_info = ConversationSerializer(info_chats, many=True)
            
            
            updated_data = [ {**chat, "user_username": User.objects.get(id=chat.get('user')).username}  for chat in serialized_info.data]
            

            return Response(updated_data, status=status.HTTP_200_OK)

        except:
            return Response({"message": "Unable to source user conversation"}, status=status.HTTP_404_NOT_FOUND)
    
        

    def post(self, request):
        user_ = request.user
        data = request.data

        currentNo = Conversation.objects.filter(user = user_).count()

        if( (user_.user_type == "service user") and ( currentNo < self.MAX_LIMIT )):
            Conversation.objects.create(user=user_)


        elif((user_.user_type == "admin") and data):
         
            conversation_ = Conversation.objects.get(id=data.get("conversation_id"))

            if conversation_:
                if not conversation_.hasEngaged:

                    conversation_.hasEngaged = True
                    conversation_.admin = user_

                    conversation_.save()
                    
                else:
                    return Response({"message": "Conversation already occupied"}, status=status.HTTP_400_BAD_REQUEST)


            else:
                return Response({"message": "Conversation NOT found"}, status=status.HTTP_404_NOT_FOUND)

    
        else:
            return Response({"message": "Maximum Support Room Limit (5) Reached"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        return Response({"message": "success"}, status=status.HTTP_200_OK)
    

    def delete(self, request):
        user_ = request.user
        data = request.data


        try:
             conversation_ = Conversation.objects.get(id = data.get("conversation_id"))

             if conversation_:
                conversation_.delete()

                return Response({"message" : "Conversation Deleted!"}, status=status.HTTP_200_OK)
        except:
            return Response({"message" : "Conversation Not Found!"}, status=status.HTTP_400_BAD_REQUEST)

       
        









class UserChatView(APIView):

    permission_classes = [IsAuthenticated]

    def getFcmToken(self, usr_type, conv_Obj):
      
        if usr_type == "service user": # user -> admin
           
            if getattr(conv_Obj.admin, "firebase_token", False):
                return conv_Obj.admin.firebase_token
               
        elif usr_type == "admin":  # admin -> user
            if getattr(conv_Obj.user, "firebase_token", False):
                return conv_Obj.user.firebase_token

        
        return None

        
    def get(self, request, room_id):
        user_ = request.user
        data = request.data
       
        conv_Obj = Conversation.objects.get(id = room_id)

        if conv_Obj:
            
            all_Messages = Message.objects.filter(conversation=conv_Obj)
            

            serialized_messages = MessageSerializer(all_Messages, many=True)
           
            return Response(serialized_messages.data, status=status.HTTP_200_OK)

        
        else:
            return Response({"message":"Unable to find conversation"}, status=status.HTTP_404_NOT_FOUND)

            


    def post(self,request, room_id, *args, **kwargs):
        user_ = request.user
        data = request.data

        conv_Obj = Conversation.objects.get(id = room_id)
        
  
        if conv_Obj:
            
            token = self.getFcmToken(user_.user_type, conv_Obj)

            admin = conv_Obj.admin

            message_content = data["message"]
            uploaded_file = data.get("file", None)

            
                #Create a new message object
            Message.objects.create(
                conversation=conv_Obj,
                sender=user_,
                text_content = message_content,
                file = uploaded_file
            )

            conv_Obj.save() 

            if token:

                message = messaging.Message(
                     notification=messaging.Notification(
                         title="Test title",
                         body = message_content,
                        
                     ),
                     token=token
                 )
                
                try:
                    response = messaging.send(message)
                   
                except:
                    pass

                
 
            else:
                return Response({"message": "token unlocated"}, status=status.HTTP_200_OK)



            return Response({"message": "Converation found"}, status=status.HTTP_200_OK)


        else:
            return Response({"message": "Conversation NOT found"}, status=status.HTTP_200_OK)


    

