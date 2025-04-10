from django.db.models import Q
from django.core.mail import send_mail

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from returnToWork.models import User
from returnToWork.serializers import UserSerializer, AdminUserSerializer

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

class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        # Return superadmins and verified admins only
        return User.objects.filter(
            Q(user_type='superadmin') |
            Q(user_type='admin', verification__is_verified=True)
        )

class DeleteServiceUserView(generics.DestroyAPIView):
    """API view to delete a user by username"""
    permission_classes = [AllowAny]

    def delete(self, request, username):
        try:
            user = User.objects.get(username=username)
            user_email = user.email
            send_mail(
            subject= "Account deletion",
            message = f"Dear {username}, Your account has been deleted by the admin",
            from_email = "readiness.to.return.to.work@gmail.com",
            recipient_list=[user_email],
            fail_silently=False,
            )
            user.delete()
            return Response({"message": f"User with username \"{username}\" has been deleted."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
