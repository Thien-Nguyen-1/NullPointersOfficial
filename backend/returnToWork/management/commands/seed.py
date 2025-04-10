"""
Seed script for the Return to Work application
This script creates:
- 50 service users with randomized data
- 15 verified admins
- 5 unverified admins
- 1 superadmin
- 20 mental health related tags
- 5 modules (anxiety, depression, stress, work-life balance, burnout)
- Variety of content for each module (quizzes, videos, documents)
- Random enrollments for users
"""

import os
import random
from django.core.management.base import BaseCommand
from django.core.files import File
from faker import Faker
from django.contrib.auth import get_user_model
from returnToWork.models import AudioClip, Document, Image, Module, Tags, RankingQuestion, FlowChart, FlowChartQuestion
from django.db import transaction

# Path to seed media directory
SEED_MEDIA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'seed_media')
AUDIO_PATH = os.path.join(SEED_MEDIA_DIR, 'audio', 'dummy_audio.mp3')
IMAGE_PATH = os.path.join(SEED_MEDIA_DIR, 'image', 'dummy_image.jpg')
DOCUMENT_PATH = os.path.join(SEED_MEDIA_DIR, 'document', 'dummy_document.pdf')

# Import Faker for generating realistic test data
try:
    from faker import Faker
    fake = Faker('en_GB')  # Using UK locale
except ImportError:
    print("Faker is required for this script. Install it with: pip install faker")
    sys.exit(1)

# Import models
from django.contrib.auth import get_user_model
from returnToWork.models import (
    Tags, Module, ProgressTracker, AdminVerification, Task, TermsAndConditions,
    RankingQuestion, Document, EmbeddedVideo, QuizQuestion, AudioClip, Image
)
from django.db import transaction

# Get the User model
User = get_user_model()

# Default password for all users
DEFAULT_PASSWORD = "Password123"

# Create mental health tags
def create_tags():
    """Create mental health related tags"""

    tag_names = [
        "anxiety", "depression", "stress", "burnout", "trauma",
        "work-life balance", "mindfulness", "rehabilitation", "mental health",
        "resilience", "coping strategies", "recovery", "self-care", "therapy",
        "workplace accommodation", "return to work", "wellbeing", "support",
        "professional development", "stress management"
    ]

    tags = []
    for tag_name in tag_names:
        tag = Tags.objects.create(tag=tag_name)
        tags.append(tag)
    return tags


# Create users (service users, admins, superadmin)
def create_users():
    """Create various types of users"""

    service_users = []
    admins = []
    verified_admins = []
    unverified_admins = []
    superadmin = None

    # Create service users
    for i in range(50):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}@{fake.domain_name()}"
        username = f"@{first_name.lower()}{random.randint(100, 999)}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=DEFAULT_PASSWORD,
            first_name=first_name,
            last_name=last_name,
            user_type="service user",
            is_first_login=False,
            terms_accepted=True
        )
        service_users.append(user)


    # Create verified admins
    for i in range(15):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = f"admin.{first_name.lower()}{i + 1}@returntowork.org"
        username = f"@admin{first_name.lower()}{i + 1}"

        admin = User.objects.create_user(
            username=username,
            email=email,
            password=DEFAULT_PASSWORD,
            first_name=first_name,
            last_name=last_name,
            user_type="admin",
            is_first_login=False,
            terms_accepted=True
        )
        admins.append(admin)
        verified_admins.append(admin)

        # Create verification record
        AdminVerification.objects.create(
            admin=admin,
            is_verified=True,
            verification_token=str(uuid.uuid4())
        )

    # Create unverified admins
    for i in range(5):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = f"pending.{first_name.lower()}{i + 1}@returntowork.org"
        username = f"@pending{first_name.lower()}{i + 1}"

        admin = User.objects.create_user(
            username=username,
            email=email,
            password=DEFAULT_PASSWORD,
            first_name=first_name,
            last_name=last_name,
            user_type="admin",
            is_first_login=True,
            terms_accepted=True
        )
        admins.append(admin)
        unverified_admins.append(admin)

        # Create verification record
        AdminVerification.objects.create(
            admin=admin,
            is_verified=False,
            verification_token=str(uuid.uuid4())
        )

    # Create 1 superadmin
    superadmin = User.objects.create_user(
        username="@superadmin",
        email="superadmin@returntowork.org",
        password=DEFAULT_PASSWORD,
        first_name="Super",
        last_name="Admin",
        user_type="superadmin",
        is_first_login=False,
        terms_accepted=True
    )

    # Create specific service user (@service)
    specific_service_user = User.objects.create_user(
        username="@service",
        email="service@returntowork.org",
        password=DEFAULT_PASSWORD,
        first_name="Service",
        last_name="User",
        user_type="service user",
        is_first_login=False,
        terms_accepted=True
    )
    service_users.append(specific_service_user)

    # Create specific admin (@admin)
    specific_admin = User.objects.create_user(
        username="@admin",
        email="admin@returntowork.org",
        password=DEFAULT_PASSWORD,
        first_name="Admin",
        last_name="User",
        user_type="admin",
        is_first_login=False,
        terms_accepted=True
    )
    admins.append(specific_admin)  # Add to admins list
    verified_admins.append(specific_admin)  # Consider it verified
    AdminVerification.objects.create(
        admin=specific_admin,
        is_verified=True,
        verification_token=str(uuid.uuid4())
    )


    return {
        'service_users': service_users,
        'admins': admins,
        'verified_admins': verified_admins,
        'unverified_admins': unverified_admins,
        'superadmin': superadmin
    }


# Create modules with content
def create_modules(users, tags):
    """Create modules with various content types"""

    # Get our admin for authorship
    author = users['verified_admins'][0]
    superadmin = users['superadmin']

    # Create Terms and Conditions
    terms_content = """
    <h1>Terms and Conditions</h1>

    <p>Welcome to the Return to Work platform. This platform is designed to help individuals manage their mental health and well-being as they prepare to return to work.</p>

    <h2>1. User Agreement</h2>
    <p>By accessing this platform, you agree to be bound by these Terms and Conditions, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>

    <h2>2. Privacy</h2>
    <p>Your privacy is important to us. All personal information collected will be used solely for the purpose of providing you with appropriate support and resources.</p>

    <h2>3. Medical Disclaimer</h2>
    <p>The content provided on this platform is for informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.</p>
    """

    TermsAndConditions.objects.create(
        content=terms_content,
        created_by=superadmin
    )

    # Define our modules
    modules_data = [
        {
            'title': 'Managing Workplace Anxiety',
            'description': 'Learn strategies to recognize and manage anxiety in the workplace. This module provides practical techniques for reducing anxiety symptoms and building confidence in professional settings.',
            'tags': ['anxiety', 'stress', 'mental health', 'workplace accommodation', 'coping strategies'],
            'content': [
                {
                    'type': 'video',
                    'title': 'Understanding Workplace Anxiety',
                    'url': 'https://www.youtube.com/watch?v=G0XUimJbz44&pp=ygUfdW5kZXJzdGFuZGluZyB3b3JrcGxhY2UgYW54aWV0edIHCQl-CQGHKiGM7w%3D%3D',
                    'description': 'An overview of workplace anxiety, its causes, and effects.'
                },
                {
                    'type': 'ranking',
                    'title': 'Anxiety Triggers Ranking',
                    'description': 'Identify which situations cause you the most anxiety.',
                    'tiers': [
                        'Public speaking/presentations',
                        'Conflict with colleagues',
                        'Performance reviews',
                        'Meeting deadlines',
                        'Social interactions at work'
                    ]
                },
                {
                    'type': 'flashcard',
                    'title': 'Anxiety Management Techniques',
                    'questions': [
                        {
                            'question': 'What is the 5-4-3-2-1 technique?',
                            'hint': 'A grounding exercise where you identify 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.'
                        },
                        {
                            'question': 'What is the importance of breathing exercises for anxiety?',
                            'hint': 'Deep breathing activates the parasympathetic nervous system, which helps calm the body\'s stress response.'
                        },
                        {
                            'question': 'How can you implement a worry time?',
                            'hint': 'Setting aside a specific time each day to address worries, rather than letting them intrude throughout the day.'
                        }
                    ]
                },
                {
                    'type': 'fill_blanks',
                    'title': 'Understanding Anxiety Response',
                    'questions': [
                        {
                            'question': 'The fight or flight response is triggered by the ____ nervous system, releasing hormones like ____ and ____.',
                            'hint': 'Think about the autonomic nervous system and stress hormones',
                            'answers': ['sympathetic', 'adrenaline', 'cortisol']
                        },
                        {
                            'question': 'Cognitive behavioral therapy helps identify negative ____ patterns and replace them with more ____ ones.',
                            'hint': 'Think about thought processes',
                            'answers': ['thought', 'positive']
                        }
                    ]
                }
            ]
        },
        {
            'title': 'Depression and Workplace Re-integration',
            'description': 'Strategies for returning to work while managing depression. This module offers guidance on professional accommodations, communication with employers, and self-care practices.',
            'tags': ['depression', 'mental health', 'return to work', 'recovery', 'workplace accommodation'],
            'content': [
                {
                    'type': 'video',
                    'title': 'Depression in the Workplace',
                    'url': 'https://www.youtube.com/watch?v=hsNtKD4bP4s&pp=ygUbZGVwcmVzc2lvbiBpbiB0aGUgd29ya3BsYWNl',
                    'description': 'Understanding depression and its impact on work performance.'
                },
                {
                    'type': 'matching',
                    'title': 'Matching Depression Symptoms with Management Strategies',
                    'questions': [
                        {
                            'text': 'Lack of motivation',
                            'answers': ['Break tasks into smaller steps', 'Set achievable daily goals',
                                        'Reward system for accomplishments', 'Morning routine with physical activity']
                        },
                        {
                            'text': 'Difficulty concentrating',
                            'answers': ['Pomodoro technique', 'Mindfulness breaks', 'Environmental modifications',
                                        'Audio cues for task transition']
                        },
                        {
                            'text': 'Low energy',
                            'answers': ['Strategic scheduling of tasks', 'Energy conservation techniques',
                                        'Strategic caffeine use', 'Consistent sleep schedule']
                        },
                        {
                            'text': 'Negative thinking',
                            'answers': ['Thought records', 'Positive affirmations', 'Cognitive restructuring',
                                        'Gratitude practice']
                        }
                    ]
                },
                {
                    'type': 'qa_form',
                    'title': 'Workplace Accommodation Planning',
                    'questions': [
                        {
                            'text': 'What specific job tasks are most challenging for you when experiencing depression symptoms?'
                        },
                        {
                            'text': 'What accommodations might help you perform these tasks more effectively?'
                        },
                        {
                            'text': 'How comfortable do you feel discussing potential accommodations with your supervisor?'
                        },
                        {
                            'text': 'What boundaries would you like to set regarding disclosure of your condition at work?'
                        }
                    ]
                }
            ]
        },
        {
            'title': 'Stress Management Techniques',
            'description': 'Evidence-based approaches to managing workplace stress. Learn practical skills for reducing stress, setting boundaries, and building resilience in high-pressure environments.',
            'tags': ['stress', 'stress management', 'resilience', 'self-care', 'coping strategies'],
            'content': [
                {
                    'type': 'ranking',
                    'title': 'Personal Stress Triggers',
                    'description': 'Rank these common workplace stressors based on their impact on you.',
                    'tiers': [
                        'Heavy workload or unrealistic deadlines',
                        'Difficult relationships with colleagues or supervisors',
                        'Lack of clarity in role or expectations',
                        'Poor communication within the team or organization',
                        'Limited resources or support',
                        'Work-life balance challenges'
                    ]
                },
                {
                    'type': 'document',
                    'title': 'Progressive Muscle Relaxation Guide',
                    'description': 'A step-by-step guide to performing progressive muscle relaxation techniques.',
                    'filename': 'progressive_muscle_relaxation.pdf'
                },
                {
                    'type': 'flowchart',
                    'title': 'Stress Response Management',
                    'questions': [
                        {
                            'question_text': 'Identify signs of stress in your body',
                            'hint_text': 'Physical symptoms might include tension, rapid heartbeat, or shallow breathing'
                        },
                        {
                            'question_text': 'Pause and take three deep breaths',
                            'hint_text': 'Breathe in for 4 counts, hold for 2, exhale for 6'
                        },
                        {
                            'question_text': 'Assess the situation objectively',
                            'hint_text': 'What specific aspects are within your control?'
                        },
                        {
                            'question_text': 'Choose an appropriate coping strategy',
                            'hint_text': 'Consider time constraints and available resources'
                        },
                        {
                            'question_text': 'Implement your chosen strategy',
                            'hint_text': 'Apply the technique fully, giving it your complete attention'
                        },
                        {
                            'question_text': 'Evaluate effectiveness and adjust as needed',
                            'hint_text': 'Did it reduce your stress? What could work better next time?'
                        }
                    ]
                },
                {
                    'type': 'audio',
                    'title': 'Guided Meditation for Workplace Stress',
                    'description': 'A 10-minute guided meditation focusing on breathing and mindfulness.',
                    'filename': 'workplace_meditation.mp3'
                }
            ]
        },
        {
            'title': 'Work-Life Balance Strategies',
            'description': 'Develop a sustainable approach to balancing professional responsibilities with personal wellbeing. This module helps create healthy boundaries and prioritization skills.',
            'tags': ['work-life balance', 'wellbeing', 'self-care', 'stress management', 'resilience'],
            'content': [
                {
                    'type': 'video',
                    'title': 'The Importance of Work-Life Balance',
                    'url': 'https://www.youtube.com/watch?v=MPR3o6Hnf2g',
                    'description': 'Understanding why balance matters and how it impacts your health.'
                },
                {
                    'type': 'qa_form',
                    'title': 'Current Balance Assessment',
                    'questions': [
                        {
                            'text': 'How many hours per week do you typically work?'
                        },
                        {
                            'text': 'How often do you check work emails or messages outside of work hours?'
                        },
                        {
                            'text': 'What activities or relationships have been neglected due to work demands?'
                        },
                        {
                            'text': 'What boundaries would you like to establish between work and personal life?'
                        }
                    ]
                },
                {
                    'type': 'fill_blanks',
                    'title': 'Setting Healthy Boundaries',
                    'questions': [
                        {
                            'question': 'When setting boundaries at work, it\'s important to be ____, ____, and ____ in your communication.',
                            'hint': 'Think about effective communication qualities',
                            'answers': ['clear', 'consistent', 'firm']
                        },
                        {
                            'question': 'The ____ technique can help manage time by focusing intensely for 25 minutes, then taking a 5-minute ____.',
                            'hint': 'A popular time management technique named after a kitchen timer',
                            'answers': ['Pomodoro', 'break']
                        }
                    ]
                },
                {
                    'type': 'ranking',
                    'title': 'Priority Assessment',
                    'description': 'Rank these life aspects in order of their importance to you.',
                    'tiers': [
                        'Career advancement',
                        'Family relationships',
                        'Physical health',
                        'Mental wellbeing',
                        'Social connections',
                        'Hobbies and interests',
                        'Financial security'
                    ]
                }
            ]
        },
        {
            'title': 'Understanding and Preventing Burnout',
            'description': 'Recognize the signs of burnout and develop strategies to prevent it. This module focuses on sustainable work practices and recovery from professional exhaustion.',
            'tags': ['burnout', 'stress', 'self-care', 'recovery', 'resilience'],
            'content': [
                {
                    'type': 'video',
                    'title': 'Signs and Stages of Burnout',
                    'url': 'https://www.youtube.com/watch?v=gRPBkCW0R5E',
                    'description': 'How to identify burnout and understand its progression.'
                },
                {
                    'type': 'matching',
                    'title': 'Burnout Symptoms and Interventions',
                    'questions': [
                        {
                            'text': 'Emotional exhaustion',
                            'answers': ['Emotional regulation techniques', 'Regular recovery periods',
                                        'Compassion cultivation', 'Professional counseling']
                        },
                        {
                            'text': 'Cynicism/Depersonalization',
                            'answers': ['Values reconnection', 'Purpose identification exercises',
                                        'Professional community building', 'Meaning-making practices']
                        },
                        {
                            'text': 'Reduced efficacy',
                            'answers': ['Skill development', 'Feedback seeking', 'Achievable goal setting',
                                        'Strength identification']
                        },
                        {
                            'text': 'Physical symptoms',
                            'answers': ['Sleep hygiene', 'Nutrition planning', 'Physical activity routines',
                                        'Relaxation techniques']
                        }
                    ]
                },
                {
                    'type': 'flowchart',
                    'title': 'Burnout Recovery Process',
                    'questions': [
                        {
                            'question_text': 'Recognize and acknowledge signs of burnout',
                            'hint_text': 'Be honest with yourself about your current state'
                        },
                        {
                            'question_text': 'Assess contributing factors',
                            'hint_text': 'Work environment, personal expectations, and available resources'
                        },
                        {
                            'question_text': 'Implement immediate relief strategies',
                            'hint_text': 'Time off, delegation, or reprioritization'
                        },
                        {
                            'question_text': 'Establish long-term prevention plan',
                            'hint_text': 'Sustainable workload, boundaries, and self-care practices'
                        },
                        {
                            'question_text': 'Reintegrate with modified approach',
                            'hint_text': 'Return with new boundaries and practices'
                        },
                        {
                            'question_text': 'Regular monitoring and adjustment',
                            'hint_text': 'Continuous awareness and preventive action'
                        }
                    ]
                },
                {
                    'type': 'document',
                    'title': 'Personal Burnout Prevention Plan Template',
                    'description': 'A customizable template for creating your burnout prevention strategy.',
                    'filename': 'burnout_prevention_plan.pdf'
                }
            ]
        }
    ]

    # Create the modules and related content
    created_modules = []

    for module_data in modules_data:
        # Create the module
        module = Module.objects.create(
            title=module_data['title'],
            description=module_data['description'],
            upvotes=random.randint(5, 50)
        )

        # Add tags
        for tag_name in module_data['tags']:
            tag = Tags.objects.filter(tag=tag_name).first()
            if tag:
                module.tags.add(tag)

        # Process content
        for idx, content_item in enumerate(module_data['content']):
            content_type = content_item['type']

            if content_type == 'video':
                # Create embedded video
                video = EmbeddedVideo.objects.create(
                    title=content_item['title'],
                    moduleID=module,
                    author=author,
                    description=content_item['description'],
                    is_published=True,
                    video_url=content_item['url'],
                    order_index=idx
                )

            elif content_type == 'ranking':
                # Create ranking quiz
                ranking = RankingQuestion.objects.create(
                    title=content_item['title'],
                    moduleID=module,
                    author=author,
                    description=content_item['description'],
                    is_published=True,
                    tiers=content_item['tiers'],
                    order_index=idx
                )

            elif content_type in ['flashcard', 'fill_blanks', 'flowchart', 'qa_form', 'matching']:
                # Map content types to quiz types
                quiz_type_map = {
                    'flashcard': 'flashcard',
                    'fill_blanks': 'text_input',
                    'flowchart': 'statement_sequence',
                    'qa_form': 'question_input',
                    'matching': 'pair_input'
                }

                # Create task (quiz container)
                task = Task.objects.create(
                    title=content_item['title'],
                    moduleID=module,
                    author=author,
                    description=content_item.get('description', ''),
                    is_published=True,
                    text_content=content_item.get('description', ''),
                    quiz_type=quiz_type_map[content_type],
                    order_index=idx
                )

                # Create questions based on quiz type
                if content_type == 'flashcard':
                    for q_idx, q_data in enumerate(content_item['questions']):
                        QuizQuestion.objects.create(
                            task=task,
                            question_text=q_data['question'],
                            hint_text=q_data['hint'],
                            order=q_idx
                        )

                elif content_type == 'fill_blanks':
                    for q_idx, q_data in enumerate(content_item['questions']):
                        # Replace blank spaces with standardized format
                        question_text = q_data['question']
                        for answer in q_data['answers']:
                            question_text = question_text.replace('____', '____', 1)

                        QuizQuestion.objects.create(
                            task=task,
                            question_text=question_text,
                            hint_text=q_data.get('hint', ''),
                            order=q_idx
                        )

                elif content_type == 'flowchart':
                    for q_idx, q_data in enumerate(content_item['questions']):
                        QuizQuestion.objects.create(
                            task=task,
                            question_text=q_data['question_text'],
                            hint_text=q_data.get('hint_text', ''),
                            order=q_idx
                        )

                elif content_type == 'qa_form':
                    for q_idx, q_data in enumerate(content_item['questions']):
                        QuizQuestion.objects.create(
                            task=task,
                            question_text=q_data['text'],
                            order=q_idx
                        )

                elif content_type == 'matching':
                    for q_idx, q_data in enumerate(content_item['questions']):
                        QuizQuestion.objects.create(
                            task=task,
                            question_text=q_data['text'],
                            answers=q_data['answers'],
                            order=q_idx
                        )

            elif content_type == 'document':
                # Create document placeholder
                document = Document.objects.create(
                    title=content_item['title'],
                    moduleID=module,
                    author=author,
                    description=content_item['description'],
                    is_published=True,
                    filename=content_item['filename'],
                    file_type='pdf',
                    file_size=os.path.getsize(DOCUMENT_PATH),
                    order_index=idx
                )
                with open(DOCUMENT_PATH, 'rb') as f:
                    document.file.save(content_item['filename'], File(f), save=True)

            elif content_type == 'audio':
                # Create audio placeholder
                audio = AudioClip.objects.create(
                    title=content_item['title'],
                    moduleID=module,
                    author=author,
                    description=content_item['description'],
                    is_published=True,
                    filename=content_item['filename'],
                    file_type='mp3',
                    file_size=os.path.getsize(AUDIO_PATH),
                    duration=600,
                    order_index=idx
                )
                with open(AUDIO_PATH, 'rb') as f:
                    audio.file.save(content_item['filename'], File(f), save=True)

            elif content_type == 'image':
                image = Image.objects.create(
                    title=content_item['title'],
                    moduleID=module,
                    author=author,
                    description=content_item['description'],
                    is_published=True,
                    filename=content_item['filename'],
                    file_type='jpg',
                    file_size=os.path.getsize(IMAGE_PATH),
                    order_index=idx
                )
                with open(IMAGE_PATH, 'rb') as f:
                    image.file.save(content_item['filename'], File(f), save=True)

        created_modules.append(module)

    return created_modules


# Create enrollments (progress trackers)
def create_enrollments(users, modules):
    """Create random module enrollments for users"""
    enrollments = []
    service_users = users['service_users']

    # Each user enrolls in 1-3 random modules
    for user in service_users:
        num_enrollments = random.randint(1, 3)
        selected_modules = random.sample(modules, num_enrollments)

        for module in selected_modules:
            # Determine completion status and progress
            completed = random.random() < 0.3  # 30% chance of completion
            if completed:
                progress_percentage = 100.0
                total_contents = len(module.task_contents.all()) + len(module.rankingquestion_contents.all()) + len(
                    module.embeddedvideo_contents.all()) + len(module.document_contents.all()) + len(
                    module.audioclip_contents.all())
                contents_completed = total_contents
            else:
                progress_percentage = random.uniform(10.0, 90.0)
                total_contents = len(module.task_contents.all()) + len(module.rankingquestion_contents.all()) + len(
                    module.embeddedvideo_contents.all()) + len(module.document_contents.all()) + len(
                    module.audioclip_contents.all())
                contents_completed = int(total_contents * (progress_percentage / 100.0))

            # Random pinned and liked status
            pinned = random.random() < 0.2  # 20% chance of being pinned
            has_liked = random.random() < 0.4  # 40% chance of being liked

            # Create progress tracker
            tracker = ProgressTracker.objects.create(
                user=user,
                module=module,
                completed=completed,
                pinned=pinned,
                hasLiked=has_liked,
                contents_completed=contents_completed,
                total_contents=total_contents,
                progress_percentage=progress_percentage
            )

            enrollments.append(tracker)

            # If user liked the module, increment upvotes
            if has_liked:
                module.upvotes += 1
                module.save()
    return enrollments

class Command(BaseCommand):
    help = 'Seed the Return to Work application database with fake data'

    @transaction.atomic
    def handle(self, *args, **options):
        print("Seeding started...")

        # Create tags
        tags = create_tags()

        # Create users
        users = create_users()

        # Create modules with content
        modules = create_modules(users, tags)

        # Create enrollments
        enrollments = create_enrollments(users, modules)

        print(f"Created {len(tags)} tags")
        print(f"Created {len(users['service_users'])} service users")
        print(f"Created {len(users['admins'])} admin users")
        print(f"Created 1 superadmin")
        print(f"Created {len(modules)} modules with content")
        print(f"Created {len(enrollments)} user enrollments")
        print("Log in as @service, @admin or @superadmin with default password: Password123")
        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
