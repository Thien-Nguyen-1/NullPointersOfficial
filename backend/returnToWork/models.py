from django.db import models

# Create your models here.
class ProgressTracker(models.Model):
    User = models.ForeignKey(User, on_delete=models.CASCADE)
    Module = models.ForeignKey(Module, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)



def __str__(self):
    return f"{self.user.username} - {self.module.title} - {'Completed' if self.completed else 'Incomplete'}"
