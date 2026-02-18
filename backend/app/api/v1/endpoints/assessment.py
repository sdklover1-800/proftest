import random

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.test_config_limits import DEFAULT_LIMIT_BY_MODULE, MIN_LIMIT_BY_MODULE
from app.db.session import get_db
from app.models.config import TestConfig
from app.models.question import ModuleEnum
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

DEFAULT_MODULE_LIMITS: dict[str, int] = dict(DEFAULT_LIMIT_BY_MODULE)


def _resolve_module_limit(
    module_name: str,
    config_value: int | None,
    override_limit: int | None,
) -> int:
    """
    Resolve final module budget:
    - request override (if provided) wins,
    - then active config value,
    - then module default.
    """
    floor_limit = MIN_LIMIT_BY_MODULE.get(
        module_name,
        DEFAULT_MODULE_LIMITS.get(module_name, 0),
    )
    if override_limit is not None:
        return max(override_limit, floor_limit)
    if config_value is not None:
        return max(config_value, floor_limit)
    return max(DEFAULT_MODULE_LIMITS.get(module_name, 0), floor_limit)


def _select_balanced_questions(
    module_groups: dict[str, list[QuestionDTO]],
    limit: int,
) -> list[QuestionDTO]:
    """
    Select a total of `limit` questions from module categories in balanced rounds.
    This avoids overfilling one category and keeps category coverage stable.
    """
    if limit <= 0 or not module_groups:
        return []

    categories = list(module_groups.keys())
    random.shuffle(categories)

    shuffled_groups: dict[str, list[QuestionDTO]] = {}
    group_offsets: dict[str, int] = {}
    for category in categories:
        items = list(module_groups[category])
        random.shuffle(items)
        shuffled_groups[category] = items
        group_offsets[category] = 0

    selected: list[QuestionDTO] = []
    while len(selected) < limit:
        progressed = False
        for category in categories:
            offset = group_offsets[category]
            pool = shuffled_groups[category]
            if offset >= len(pool):
                continue

            selected.append(pool[offset])
            group_offsets[category] = offset + 1
            progressed = True

            if len(selected) >= limit:
                break

        if not progressed:
            break

    random.shuffle(selected)
    return selected

@router.get("/questions", response_model=list[QuestionDTO])
async def get_questions(
    db: AsyncSession = Depends(get_db),
    modules: str | None = Query(default=None, description="Comma-separated module list"),
    start_module: str | None = Query(default=None, description="Module to start from"),
    per_module: int | None = Query(
        default=None,
        ge=1,
        le=200,
        description="Override total question budget per module",
    ),
    per_category: int | None = Query(
        default=None,
        ge=1,
        le=200,
        description="Deprecated alias of per_module",
    ),
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

    # 5) Select module totals with balanced category coverage
    selected_questions: list[QuestionDTO] = []
    override_limit = per_module if per_module is not None else per_category

    limit_by_module = {
        "RIASEC": _resolve_module_limit("RIASEC", config.riasec_limit, override_limit),
        "BIG5": _resolve_module_limit("BIG5", config.big5_limit, override_limit),
        "COGNITIVE": _resolve_module_limit("COGNITIVE", config.cognitive_limit, override_limit),
        "SJT": _resolve_module_limit("SJT", config.sjt_limit, override_limit),
    }

    def take_module(module_name: str) -> None:
        limit = limit_by_module.get(module_name, 0)
        if limit <= 0:
            return
        module_groups = grouped.get(module_name, {})
        if not module_groups:
            return
        module_selected = _select_balanced_questions(module_groups, limit)
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
