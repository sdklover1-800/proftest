"""
Admin API package - aggregates all admin endpoints.
Following the 200-line rule, endpoints are split into:
- dashboard.py: Analytics overview
- users.py: User management
- questions.py: Question management
- sessions.py: Session monitoring
"""

from fastapi import APIRouter

from app.api.v1.endpoints.admin.dashboard import router as dashboard_router
from app.api.v1.endpoints.admin.users import router as users_router
from app.api.v1.endpoints.admin.questions import router as questions_router
from app.api.v1.endpoints.admin.sessions import router as sessions_router
from app.api.v1.endpoints.admin.analytics import router as analytics_router
from app.api.v1.endpoints.admin.config import router as config_router

# Aggregate all admin routers into one
router = APIRouter()
router.include_router(dashboard_router)
router.include_router(users_router)
router.include_router(questions_router)
router.include_router(sessions_router)
router.include_router(analytics_router)
router.include_router(config_router)
