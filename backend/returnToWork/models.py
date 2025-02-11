from django.db import models

class Module(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    id = models.AutoField(primary_key=True)  
    #tags = models.ManyToManyField('Tag', blank=True, related_name='modules')
    pinned = models.BooleanField(default=False)  
    upvotes = models.PositiveIntegerField(default=0) 

    def upvote(self):
        self.upvotes += 1
        self.save()

    def downvote(self):
        self.upvotes -= 1
        self.save()

    def save(self, *args, **kwargs):
        self.title = self.title.title()  
        super(Module, self).save(*args, **kwargs)

    def __str__(self):
        return self.title

