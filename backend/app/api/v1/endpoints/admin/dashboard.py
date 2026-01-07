"""
Admin dashboard endpoint - analytics overview.
Protected by superuser authentication.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.models.question import Question
from app.models.user import User

router = APIRouter()


@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Get admin dashboard analytics.
    Requires superuser privileges.
    """
    # Total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    # Total sessions
    total_sessions_result = await db.execute(
        select(func.count(AssessmentSession.id))
    )
    total_sessions = total_sessions_result.scalar() or 0

    # Completed sessions
    completed_result = await db.execute(
        select(func.count(AssessmentSession.id)).where(
            AssessmentSession.status == AssessmentStatusEnum.completed
        )
    )
    completed_sessions = completed_result.scalar() or 0

    # Conversion rate
    conversion_rate = (
        round((completed_sessions / total_sessions * 100), 1)
        if total_sessions > 0
        else 0
    )

    # Total questions
    total_questions_result = await db.execute(select(func.count(Question.id)))
    total_questions = total_questions_result.scalar() or 0

    # Recent users (last 5)
    recent_users_result = await db.execute(
        select(User.id, User.email, User.age, User.created_at, User.is_superuser)
        .order_by(User.created_at.desc())
        .limit(5)
    )
    recent_users = [
        {
            "id": row.id,
            "email": row.email,
            "age": row.age,
            "is_superuser": row.is_superuser,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in recent_users_result.fetchall()
    ]

    # Recent sessions (last 10)
    recent_sessions_result = await db.execute(
        select(
            AssessmentSession.id,
            AssessmentSession.user_id,
            AssessmentSession.status,
            AssessmentSession.start_time,
            User.email,
        )
        .join(User, AssessmentSession.user_id == User.id, isouter=True)
        .order_by(AssessmentSession.start_time.desc())
        .limit(10)
    )
    recent_sessions = [
        {
            "id": row.id,
            "user_id": row.user_id,
            "user_email": row.email,
            "status": row.status.value if row.status else None,
            "start_time": row.start_time.isoformat() if row.start_time else None,
        }
        for row in recent_sessions_result.fetchall()
    ]

    return {
        "stats": {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "in_progress": total_sessions - completed_sessions,
            "conversion_rate": conversion_rate,
            "total_questions": total_questions,
        },
        "recent_users": recent_users,
        "recent_sessions": recent_sessions,
        "admin_user": current_user.email,
    }
