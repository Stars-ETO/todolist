# routers/__init__.py
from .auth import router as auth_router
from .users import router as users_router
from .tasks import router as tasks_router
from .reminders import router as reminders_router
from .statistics import router as statistics_router
from .settings import router as settings_router
from .comments import router as comments_router