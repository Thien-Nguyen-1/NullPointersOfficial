# This file makes all models available when importing from returnToWork.models
# It allows access to models through a clean API like: from returnToWork.models import User

from .users import User
from .modules import Module, Tags
from .content import (
    Content,
    InfoSheet,
    Video,
    Document,
    EmbeddedVideo,
    InlinePicture,
    AudioClip,
    RankingQuestion
)
from .quizzes import (
    Questionnaire,
    Task,
    QuizQuestion,
    UserResponse
)
from .progress import (
    ProgressTracker,
    UserModuleInteraction,
    ContentProgress,
    LearningTimeLog,
    PageViewSession
)