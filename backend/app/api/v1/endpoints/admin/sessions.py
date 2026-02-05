"""
Admin session monitoring endpoints.
Protected by superuser authentication.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.assessment import AssessmentSession, UserResponse
from app.models.user import User

router = APIRouter()


class BulkDeleteRequest(BaseModel):
    ids: list[int]


@router.get("/sessions")
async def list_sessions(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Get paginated session list with user emails."""
    result = await db.execute(
        select(
            AssessmentSession.id,
            AssessmentSession.user_id,
            AssessmentSession.status,
            AssessmentSession.start_time,
            AssessmentSession.raw_scores,
            User.email,
        )
        .join(User, AssessmentSession.user_id == User.id, isouter=True)
        .order_by(AssessmentSession.start_time.desc())
        .offset(skip)
        .limit(limit)
    )
    sessions = [
        {
            "id": row.id,
            "user_id": row.user_id,
            "user_email": row.email,
            "status": row.status.value if row.status else None,
            "start_time": row.start_time.isoformat() if row.start_time else None,
            "has_results": bool(row.raw_scores),
        }
        for row in result.fetchall()
    ]

    count_result = await db.execute(select(func.count(AssessmentSession.id)))
    total = count_result.scalar() or 0

    return {"sessions": sessions, "total": total, "skip": skip, "limit": limit}


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Delete a session and all its responses."""
    # Check session exists
    session_result = await db.execute(
        select(AssessmentSession).where(AssessmentSession.id == session_id)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Delete responses first, then session
    await db.execute(delete(UserResponse).where(UserResponse.session_id == session_id))
    await db.execute(delete(AssessmentSession).where(AssessmentSession.id == session_id))
    await db.commit()

    return {"message": f"Session #{session_id} deleted successfully"}


@router.post("/sessions/bulk-delete")
async def bulk_delete_sessions(
    payload: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Bulk delete sessions and their responses."""
    if not payload.ids:
        return {"deleted": 0}

    await db.execute(delete(UserResponse).where(UserResponse.session_id.in_(payload.ids)))
    result = await db.execute(delete(AssessmentSession).where(AssessmentSession.id.in_(payload.ids)))
    await db.commit()
    return {"deleted": result.rowcount or 0}
