"""
Admin user management endpoints.
Protected by superuser authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.assessment import AssessmentSession, UserResponse
from app.models.user import User

router = APIRouter()


@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Get paginated user list with session counts."""
    result = await db.execute(
        select(User.id, User.email, User.age, User.created_at, User.is_superuser)
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    users = [
        {
            "id": row.id,
            "email": row.email,
            "age": row.age,
            "is_superuser": row.is_superuser,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in result.fetchall()
    ]

    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar() or 0

    return {"users": users, "total": total, "skip": skip, "limit": limit}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Delete a user and all their sessions/responses."""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )

    # Check user exists
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete related data first (responses -> sessions -> user)
    await db.execute(
        delete(UserResponse).where(
            UserResponse.session_id.in_(
                select(AssessmentSession.id).where(AssessmentSession.user_id == user_id)
            )
        )
    )
    await db.execute(delete(AssessmentSession).where(AssessmentSession.user_id == user_id))
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()

    return {"message": f"User {user.email} deleted successfully"}
