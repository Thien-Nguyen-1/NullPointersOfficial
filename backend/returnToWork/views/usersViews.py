from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from returnToWork.models import User, Tags, Module, ProgressTracker
from returnToWork.serializers import UserSerializer

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

class UserDetail(APIView):
    

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

    def put(self,request):

        # Works but Need To Use Seralizer - TO DO

        print("Received request to update the user details")

        try:
            user = request.user
            user_serializer = UserSerializer(user)

            data = request.data

            user_in = User.objects.filter(user_id = data['user_id']).first()
            user_in.username = user.username
            user_in.first_name = user.first_name
            user_in.last_name = user.last_name
            user_in.user_type = user.user_type
            user_in.is_first_login = data['is_first_login']

            print(data['is_first_login'])

            tag_data = data['tags']
            fire_token = data.get('firebase_token')
            mod_data = data['module']


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
