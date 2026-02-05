
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db.session import get_db
from app.models.config import TestConfig
from app.models.user import User
from app.models.question import ModuleEnum
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


import random

DEFAULT_PER_CATEGORY_LIMIT = 10

@router.get("/questions", response_model=list[QuestionDTO])
async def get_questions(
    db: AsyncSession = Depends(get_db),
    modules: str | None = Query(default=None, description="Comma-separated module list"),
    start_module: str | None = Query(default=None, description="Module to start from"),
    per_category: int | None = Query(default=None, ge=1, le=200, description="Per-category limit"),
):
    """
    Returns list of questions in random order based on active test configuration.
    """
    # 1) Fetch active config (or create default)
    config_result = await db.execute(
        select(TestConfig).where(TestConfig.is_active == True).order_by(TestConfig.id.desc())
    )
    config = config_result.scalars().first()
    if not config:
        config = TestConfig()
        db.add(config)
        await db.commit()
        await db.refresh(config)

    # 2) Fetch all questions
    questions = await assessment_service.get_all_questions(db)

    # 3) Group by module/category
    grouped: dict[str, dict[str, list[QuestionDTO]]] = {}
    for question in questions:
        module = question.module.value if question.module else "UNKNOWN"
        category = question.category or "general"
        grouped.setdefault(module, {}).setdefault(category, []).append(question)

    # 4) Resolve requested modules and order
    default_order = [module.value for module in ModuleEnum]
    allowed_modules = set(default_order)

    requested_modules: list[str] = []
    if modules:
        for raw in modules.split(","):
            cleaned = raw.strip().upper()
            if cleaned in allowed_modules and cleaned not in requested_modules:
                requested_modules.append(cleaned)
    if not requested_modules:
        requested_modules = default_order

    if start_module:
        start_cleaned = start_module.strip().upper()
        if start_cleaned in requested_modules:
            start_idx = requested_modules.index(start_cleaned)
            requested_modules = requested_modules[start_idx:] + requested_modules[:start_idx]

    # 5) Shuffle and slice per category (keep module blocks in order)
    selected_questions: list[QuestionDTO] = []
    def resolve_limit(config_value: int | None) -> int:
        if per_category is not None:
            return per_category
        if not config_value:
            return DEFAULT_PER_CATEGORY_LIMIT
        return max(config_value, DEFAULT_PER_CATEGORY_LIMIT)

    limit_by_module = {
        "RIASEC": resolve_limit(config.riasec_limit),
        "BIG5": resolve_limit(config.big5_limit),
        "COGNITIVE": resolve_limit(config.cognitive_limit),
        "SJT": resolve_limit(config.sjt_limit),
    }

    def take_module(module_name: str) -> None:
        limit = limit_by_module.get(module_name, 0)
        if limit <= 0:
            return
        module_groups = grouped.get(module_name, {})
        if not module_groups:
            return
        module_selected = []
        for items in module_groups.values():
            items_list = list(items)
            random.shuffle(items_list)
            module_selected.extend(items_list[:limit])
        random.shuffle(module_selected)
        selected_questions.extend(module_selected)

    for module_name in requested_modules:
        take_module(module_name)

    return selected_questions


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
