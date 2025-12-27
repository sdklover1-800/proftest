from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.assessment_service import assessment_service
from app.schemas.assessment import QuestionDTO, AssessmentSession, AssessmentSessionCreate, AnswerCreate, UserResponse

router = APIRouter()

@router.get("/questions", response_model=List[QuestionDTO])
async def get_questions(db: AsyncSession = Depends(get_db)):
    """
    Returns list of questions.
    """
    return await assessment_service.get_all_questions(db)

@router.post("/start", response_model=AssessmentSession)
async def start_assessment(session_in: AssessmentSessionCreate, db: AsyncSession = Depends(get_db)):
    """
    Starts a new assessment session.
    """
    return await assessment_service.create_session(db, session_in)

@router.post("/submit", response_model=UserResponse)
async def submit_answer(answer_in: AnswerCreate, db: AsyncSession = Depends(get_db)):
    """
    Saves a user answer.
    """
    return await assessment_service.save_answer(db, answer_in)
