# Import all view classes to make them available when importing from returnToWork.views

# Authentication views
from .auth import (
    LogInView, LogOutView, SignUpView, PasswordResetView, 
    RequestPasswordResetView, CheckUsernameView
)

# User profile and settings views
from .user import (
    UserProfileView, UserSettingsView, UserPasswordChangeView,
    UserDetail, ServiceUserListView, DeleteServiceUserView
)

# Module-related views
from .modules import (
    ModuleViewSet, TagViewSet, UserInteractionView
)

# Content-related views
from .content import (
    InfoSheetViewSet, VideoViewSet, RankingQuestionViewSet,
    InlinePictureViewSet, AudioClipViewSet, DocumentViewSet,
    EmbeddedVideoViewSet, ContentPublishView, MarkContentViewedView,
    CompletedContentView
)

# Quiz-related views
from .quizzes import (
    TaskViewSet, QuestionnaireView, QuizDetailView, QuizResponseView,
    QuizDataView, QuizQuestionView, QuizQuestionViewSet, TaskPdfView
)

# Progress tracking views
from .progress import (
    ProgressTrackerView
)

# Admin-specific views
from .admin import (
    AdminQuizResponsesView
)