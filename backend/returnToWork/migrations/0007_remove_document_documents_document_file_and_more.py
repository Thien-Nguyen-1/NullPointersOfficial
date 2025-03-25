# Generated by Django 5.1.5 on 2025-03-24 19:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('returnToWork', '0006_user_terms_accepted_alter_user_user_type_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='document',
            name='documents',
        ),
        migrations.AddField(
            model_name='document',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='documents/'),
        ),
        migrations.AddField(
            model_name='document',
            name='file_size',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='file_type',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='filename',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='upload_date',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
