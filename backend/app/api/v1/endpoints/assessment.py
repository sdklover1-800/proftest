
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.schemas.assessment import (
    AnswerCreate,
    AssessmentSession,
    AssessmentSessionCreate,
    QuestionDTO,
    SessionSummary,
    UserResponse,
)
from app.services.assessment_service import assessment_service

router = APIRouter()


@router.get("/questions", response_model=list[QuestionDTO])
async def get_questions(db: AsyncSession = Depends(get_db)):
    """
    Returns list of questions.
    """
    return await assessment_service.get_all_questions(db)


@router.post("/start", response_model=AssessmentSession)
async def start_assessment(
    session_in: AssessmentSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Starts a new assessment session for the logged-in user.
    """
    return await assessment_service.create_session(
        db, session_in, user_id=current_user.id
    )


@router.post("/submit", response_model=UserResponse)
async def submit_answer(answer_in: AnswerCreate, db: AsyncSession = Depends(get_db)):
    """
    Saves a user answer.
    """
    return await assessment_service.save_answer(db, answer_in)


@router.get("/history", response_model=list[SessionSummary])
async def get_assessment_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Returns the current user's assessment history as summaries.
    Thin router implementation: delegates logic to the service layer.
    """
    return await assessment_service.get_user_history_summaries(db, current_user.id)
