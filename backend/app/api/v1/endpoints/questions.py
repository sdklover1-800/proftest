
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.schemas.question import Question as QuestionSchema
from app.services.question_service import question_service

router = APIRouter()


@router.get("/questions", response_model=list[QuestionSchema])
async def read_questions(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(deps.get_current_user),
):
    """
    Retrieve the full question bank. Authenticated callers only: the bank is
    the product, not public data.
    """
    return await question_service.get_all(db)
