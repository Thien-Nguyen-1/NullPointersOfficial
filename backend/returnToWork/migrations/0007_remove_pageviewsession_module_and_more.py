# Generated by Django 5.1.5 on 2025-04-09 14:22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('returnToWork', '0006_remove_inlinepicture_author_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pageviewsession',
            name='module',
        ),
        migrations.RemoveField(
            model_name='pageviewsession',
            name='user',
        ),
        migrations.DeleteModel(
            name='LearningTimeLog',
        ),
        migrations.DeleteModel(
            name='PageViewSession',
        ),
    ]
