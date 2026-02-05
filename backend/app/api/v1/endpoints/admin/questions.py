"""
Admin question management endpoints.
Protected by superuser authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.question import Question, ModuleEnum, QuestionTypeEnum
from app.models.user import User

router = APIRouter()



# --- Schemas ---
class QuestionCreate(BaseModel):
    """Schema for creating a new question."""
    code: str
    module: str  # Will be converted to ModuleEnum
    category: str  # Category code (e.g., 'R', 'I', 'A', 'S', 'E', 'C')
    type: str  # Will be converted to QuestionTypeEnum
    text_ru: str
    text_kz: str | None = None
    text_en: str | None = None
    is_reverse: bool = False
    options: dict | None = None


class QuestionUpdate(BaseModel):
    """Schema for updating an existing question."""
    code: str
    module: str
    category: str
    type: str
    text_ru: str
    text_kz: str | None = None
    text_en: str | None = None
    is_reverse: bool = False
    options: dict | None = None


class BulkDeleteRequest(BaseModel):
    ids: list[int]


# --- Endpoints ---
@router.get("/questions")
async def list_questions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Get paginated question list."""
    result = await db.execute(
        select(Question)
        .order_by(Question.code)
        .offset(skip)
        .limit(limit)
    )
    questions = [
        {
            "id": q.id,
            "code": q.code,
            "module": q.module.value if q.module else None,
            "category": q.category,
            "type": q.type.value if q.type else None,
            "text_ru": q.text_ru,
            "text_kz": q.text_kz,
            "text_en": q.text_en,
            "is_reverse": q.is_reverse,
        }
        for q in result.scalars().all()
    ]

    count_result = await db.execute(select(func.count(Question.id)))
    total = count_result.scalar() or 0

    return {"questions": questions, "total": total, "skip": skip, "limit": limit}


@router.post("/questions", status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Create a new question."""
    # Check if code already exists
    existing = await db.execute(
        select(Question).where(Question.code == question_data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Question with code '{question_data.code}' already exists",
        )

    # Create question
    question = Question(
        code=question_data.code,
        module=ModuleEnum(question_data.module),
        category=question_data.category,
        type=QuestionTypeEnum(question_data.type),
        text_ru=question_data.text_ru,
        text_kz=question_data.text_kz,
        text_en=question_data.text_en,
        is_reverse=question_data.is_reverse,
        options=question_data.options,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)

    return {
        "id": question.id,
        "code": question.code,
        "message": "Question created successfully",
    }


@router.put("/questions/{question_id}")
async def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Update an existing question."""
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Update fields
    question.code = question_data.code
    question.module = ModuleEnum(question_data.module)
    question.category = question_data.category
    question.type = QuestionTypeEnum(question_data.type)
    question.text_ru = question_data.text_ru
    question.text_kz = question_data.text_kz
    question.text_en = question_data.text_en
    question.is_reverse = question_data.is_reverse
    # Don't update options if passed as None, only if explicitly changed (or keep it simple and overwrite)
    # Here we assume client sends full object, so we overwrite.
    question.options = question_data.options

    await db.commit()
    await db.refresh(question)

    return {"id": question.id, "message": "Question updated successfully"}


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Delete a question."""
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    await db.execute(delete(Question).where(Question.id == question_id))
    await db.commit()

    return {"message": f"Question '{question.code}' deleted successfully"}


@router.post("/questions/bulk-delete")
async def bulk_delete_questions(
    payload: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Bulk delete questions by IDs."""
    if not payload.ids:
        return {"deleted": 0}

    result = await db.execute(delete(Question).where(Question.id.in_(payload.ids)))
    await db.commit()
    return {"deleted": result.rowcount or 0}
