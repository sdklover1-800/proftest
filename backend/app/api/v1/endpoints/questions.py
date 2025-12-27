from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.question_service import question_service
from app.schemas.question import Question as QuestionSchema

router = APIRouter()

@router.get("/questions", response_model=List[QuestionSchema])
async def read_questions(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all questions.
    """
    return await question_service.get_all(db)
