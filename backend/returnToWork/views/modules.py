# Module-related views for listing, retrieving, and managing modules and tags

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Module, Tags, UserModuleInteraction
from ..serializers import (
    ModuleSerializer, TagSerializer, UserModuleInteractSerializer
)

class ModuleViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for modules.
    
    This viewset provides standard create, read, update, and delete
    operations for module resources.
    """
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

class TagViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for tags.
    
    This viewset provides standard create, read, update, and delete
    operations for tag resources.
    """
    queryset = Tags.objects.all()
    serializer_class = TagSerializer

class UserInteractionView(APIView):
    """
    Manage user interactions with modules (likes, pins).
    
    This view handles recording and retrieving user interactions
    with modules such as liking and pinning them.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        option = request.query_params.get("filter")

        allInteracts = UserModuleInteraction.objects.filter(user=user) if option == "user" else UserModuleInteraction.objects.all()

        if allInteracts:
             serializedInf = UserModuleInteractSerializer(allInteracts, many=True)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializedInf.data, status=status.HTTP_200_OK)

    def post(self, request, module_id):
        user = request.user
        data = request.data
        module = Module.objects.get(id=module_id)

        if module:
            try:
                interactObj, hasCreated = UserModuleInteraction.objects.get_or_create(user=user, module=module)

                if (data["hasLiked"]) and (((not hasCreated) and (not interactObj.hasLiked)) or (hasCreated)):
                    module.upvote()
                elif (not data["hasLiked"]) and (not hasCreated) and (interactObj.hasLiked):
                    module.downvote()

                interactObj.hasPinned = data["hasPinned"]
                interactObj.hasLiked = data["hasLiked"]
                interactObj.save()

                module.save()

            except:
                return Response({"message": "sent data formatted incorrectly!"}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({"message": "Module Not Found Mate"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Module interaction saved!"}, status=status.HTTP_200_OK)