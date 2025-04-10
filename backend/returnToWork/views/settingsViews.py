import uuid
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from reportlab.pdfgen import canvas

from returnToWork.models import (
    ContentProgress, Task, QuizQuestion, UserResponse
)

from returnToWork.serializers import (
    UserSettingSerializer, UserPasswordChangeSerializer
)

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
        user_email = user.email
        username = user.username

        user.delete()

        if not User.objects.filter(username = username).exists():
            send_mail(
                subject= "Account deletion",
                message = f"Dear {username}, Your account has been successfully deleted.",
                from_email = "readiness.to.return.to.work@gmail.com",
                recipient_list=[user_email],
                fail_silently=False,
                )
            return Response({"message":"User account deleted successfully"},status=status.HTTP_204_NO_CONTENT)

        return Response({"error":"User account not deleted"},status=status.HTTP_400_BAD_REQUEST)

class UserPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UserPasswordChangeSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password uUpdated successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompletedInteractiveContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # module = get_object_or_404(Module, pk=module_id)

        content_type = ContentType.objects.get_for_model(Task)

        # module_task_ids = Task.objects.filter(moduleID=module).values_list('contentID', flat=True)

        viewed_tasks = ContentProgress.objects.filter(
            user=request.user,
            content_type=content_type,
            # object_id__in=module_task_ids,
            viewed=True
        )

        results = []
        for item in viewed_tasks:
            try:
                task = item.content_object
                results.append({
                    "content_id": str(item.object_id),
                    "title": task.title,
                    "viewed_at": item.viewed_at,
                    "quiz_type": task.get_quiz_type_display(),
                    "module_title": task.moduleID.title if task.moduleID else None
                })
            except:
                continue

        return Response(results)

class TaskPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        user = request.user
        # get task details
        try:
            task = Task.objects.get(contentID = task_id)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        # get related questions 
        questions = QuizQuestion.objects.filter(task = task)
        
        if not questions.exists():
            return Response({"error": "No questions found for this task"}, status=status.HTTP_400_BAD_REQUEST)

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer)
        pdf.drawString(100,800,f"Task:{task.title}")

        y_position = 780
        for question in questions:
            response = UserResponse.objects.filter(user=user, question=question).first()
            answer_text = response.response_text if response else "No response provided"
            pdf.drawString(100, y_position, f"Question: {question.question_text}")
            y_position -=20
            pdf.drawString(120, y_position, f"Answer: {answer_text}")
            y_position -=30

        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{task.title.replace(" ", "-")}_completed.pdf"'

        return response

