from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

import pusher

from returnToWork.models import Conversation, Message, User
from returnToWork.serializers import ConversationSerializer, MessageSerializer

class UserSupportView(APIView):

    permission_classes = [IsAuthenticated]
    MAX_LIMIT = 5

    def get(self, request):
        user_ = request.user
        data = request.data

        

       
          
        info_chats = Conversation.objects.filter(user = user_) if user_.user_type == "service user" else Conversation.objects.filter(Q(hasEngaged = False) | Q(admin=user_))
        info_chats = info_chats.order_by('-updated_at')

        if not info_chats:
            return Response([], status=status.HTTP_200_OK)
        
        serialized_info = ConversationSerializer(info_chats, many=True)
        
        
        updated_data = [ {**chat, "user_username": User.objects.get(id=chat.get('user')).username}  for chat in serialized_info.data]
        

        return Response(updated_data, status=status.HTTP_200_OK)

       
    
        

    def post(self, request):
        user_ = request.user
        data = request.data

        currentNo = Conversation.objects.filter(user = user_).count()

        if( (user_.user_type == "service user") and ( currentNo < self.MAX_LIMIT )):
            Conversation.objects.create(user=user_)


        elif((user_.user_type == "admin" and user_.user_type == "superadmin" ) and data):
            
             try:
                conversation_ = Conversation.objects.get(id=data.get("conversation_id"))
             except Conversation.DoesNotExist:
                 return Response({"message": "Conversation NOT found"}, status=status.HTTP_404_NOT_FOUND)
                
            

         
             if not conversation_.hasEngaged:

                    conversation_.hasEngaged = True
                    conversation_.admin = user_

                    conversation_.save()
                    
             else:
                    return Response({"message": "Conversation already occupied"}, status=status.HTTP_400_BAD_REQUEST)


            

    
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

    
        
    def get(self, request, room_id):
        user_ = request.user
        data = request.data

        try:
            conv_Obj = Conversation.objects.get(id = room_id)
        except Conversation.DoesNotExist:
            return Response({"message":"Unable to find conversation"}, status=status.HTTP_404_NOT_FOUND)


      
            
        all_Messages = Message.objects.filter(conversation=conv_Obj)
        
        serialized_messages = MessageSerializer(all_Messages, many=True)
        
        return Response(serialized_messages.data, status=status.HTTP_200_OK)

        
     

            


    def post(self,request, room_id, *args, **kwargs):
        user_ = request.user
        data = request.data

        try:
            conv_Obj = Conversation.objects.get(id = room_id)
        except Conversation.DoesNotExist:
            return Response({"message": "Conversation NOT found"}, status=status.HTTP_404_NOT_FOUND)


            
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

        
        pusher_client = pusher.Pusher(
            app_id='1963499',
            key='d32d75089ef19c7a1669',
            secret='6523d0f19e5a5a6db9b3',
            cluster='eu',
            ssl=True
        )

        messageObj = {
            "message": message_content,
            "sender": user_.id,
            "chatID": room_id,
            "sender_username": user_.username,

        }

        pusher_client.trigger(f"chat-room-{room_id}", "new-message", messageObj)
            
            

        return Response({"message": "Converation found"}, status=status.HTTP_200_OK)


        


    
