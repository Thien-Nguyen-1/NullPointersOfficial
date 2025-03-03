from django.shortcuts import render
from rest_framework import viewsets, status
from .models import ProgressTracker,Tags,Module, Questionnaire,AdminSettings
from .serializers import ProgressTrackerSerializer, LogInSerializer,SignUpSerializer,UserSerializer,PasswordResetSerializer,TagSerializer,ModuleSerializer, QuestionnaireSerializer, AdminSettingSerializer, AdminPasswordChangeSerializer
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication

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
            return Response({"message": "Login Successful", "user": UserSerializer(user).data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LogOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self,request):
        logout(request)
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

# class AdminSettingsView(APIView):
#     # authentication_classes = [SessionAuthentication]
#     # permission_classes = [IsAuthenticated]

#     def get(self,request):
#         try:
#             settings = AdminSettings.objects.get (user = request.user)
#             serializer = AdminSettingSerializer (settings)
#             return Response(serializer.data)
#         except AdminSettings.DoesNotExist:
#             return Response({"error":"Settings not foun"},status=status.HTTP_404_NOT_FOUND)
    
#     def put(self,request):
#         try:
#             settings = AdminSettings.objects.get (user = request.user)
#             serializer = AdminSettingSerializer (settings, data = request.data, partial =True)
#             if serializer.is_valid():
#                 serializer.save()
#                 return Response(serializer.data)
#             return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
#         except AdminSettings.DoesNotExist:
#             return Response({"error":"Settings not found"},status=status.HTTP_404_NOT_FOUND)
        
#     def delete(self,request):
#         try:
#             settings = AdminSettings.objects.get (user = request.user)
#             settings.delete()
#             return Response(status=status.HTTP_204_NO_CONTENT)
#         except AdminSettings.DoesNotExist:
#             return Response({"error":"Settings not found"},status=status.HTTP_404_NOT_FOUND)
        

# class UserDetailsView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self,request):
#         user = request.user
#         return Response({
#             "id": user.id,
#             "first_name":user.first_name,
#             "last_name": user.last_name
#         })
    
# class ProfileSettingsView(APIView):
#     permission_classes = [IsAuthenticated]

class AdminSettingsView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            settings = AdminSettings.objects.get (user = request.user)
            serializer = AdminSettingSerializer (settings)
            return Response(serializer.data)
        except AdminSettings.DoesNotExist:
            return Response({"error":"Admin Settings not found"},status=status.HTTP_404_NOT_FOUND)
        
    def put(self,request):
        try:
            # settings = AdminSettings.objects.get (user = request.user)
            settings = AdminSettings.objects.first()
            serializer = AdminSettingSerializer (settings, data = request.data, partial =True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except AdminSettings.DoesNotExist:
            return Response({"error":"Admin Settings not found"},status=status.HTTP_404_NOT_FOUND)
        
    def delete(self,request):
        try:
            settings = AdminSettings.objects.get (user = request.user)
            settings.delete_account()
            return Response({"message": "Admin account deleted successfully"})
        except AdminSettings.DoesNotExist:
            return Response({"error":"Admin Settings not found"},status=status.HTTP_404_NOT_FOUND)
        
        

class AdminPasswordChangeView(APIView):
    # permission_classes = [IsAuthenticated]

    def put(self,request):
        serializer = AdminPasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(request.user)
            return Response({"message": "Password updated successfully"})
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
        