# Generated by Django 5.1.5 on 2025-03-07 16:32

import django.contrib.auth.models
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Module',
            fields=[
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('upvotes', models.PositiveIntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('user_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('user_type', models.CharField(choices=[('admin', 'Admin'), ('service user', 'Service user')], max_length=30)),
                ('username', models.CharField(max_length=30, unique=True, validators=[django.core.validators.RegexValidator(message='Username must consist of @ followed by at least three alphanumericals', regex='^@\\w{3,}$')])),
                ('first_name', models.CharField(max_length=50)),
                ('last_name', models.CharField(max_length=50)),
                ('email', models.EmailField(max_length=254, unique=True, validators=[django.core.validators.EmailValidator(message='Enter a valid email address.')])),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
                ('module', models.ManyToManyField(to='returnToWork.module')),
            ],
            options={
                'ordering': ['first_name', 'last_name'],
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='InfoSheet',
            fields=[
                ('contentID', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(default=False)),
                ('infosheet_file', models.FileField(upload_to='infosheets/')),
                ('infosheet_content', models.TextField(blank=True, null=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_author_contents', to=settings.AUTH_USER_MODEL)),
                ('moduleID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_contents', to='returnToWork.module')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ProgressTracker',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('completed', models.BooleanField(default=False)),
                ('pinned', models.BooleanField(default=False)),
                ('hasLiked', models.BooleanField(default=False)),
                ('module', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='returnToWork.module')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Questionnaire',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question', models.CharField(max_length=50)),
                ('no_next_q', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='no_previous_qs', to='returnToWork.questionnaire')),
                ('yes_next_q', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='yes_previous_qs', to='returnToWork.questionnaire')),
            ],
        ),
        migrations.CreateModel(
            name='Tags',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tag', models.CharField(error_messages={'unique': 'A tag with this name already exists.'}, max_length=50, unique=True)),
                ('modules', models.ManyToManyField(blank=True, related_name='tags_for_module', to='returnToWork.module')),
            ],
        ),
        migrations.AddField(
            model_name='module',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='modules_for_tag', to='returnToWork.tags'),
        ),
        migrations.AddField(
            model_name='user',
            name='tags',
            field=models.ManyToManyField(to='returnToWork.tags'),
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('contentID', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(default=False)),
                ('text_content', models.TextField()),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_author_contents', to=settings.AUTH_USER_MODEL)),
                ('moduleID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_contents', to='returnToWork.module')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='UserModuleInteraction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('hasPinned', models.BooleanField(default=False)),
                ('hasLiked', models.BooleanField(default=False)),
                ('module', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='returnToWork.module')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Video',
            fields=[
                ('contentID', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(default=False)),
                ('video_file', models.FileField(upload_to='videos/')),
                ('duration', models.PositiveBigIntegerField()),
                ('thumbnail', models.ImageField(blank=True, null=True, upload_to='thumbnails/')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_author_contents', to=settings.AUTH_USER_MODEL)),
                ('moduleID', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_contents', to='returnToWork.module')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
