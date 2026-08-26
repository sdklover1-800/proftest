from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.assessment import AssessmentStatusEnum
from app.models.question import ModuleEnum, QuestionTypeEnum


class QuestionOptionDTO(BaseModel):
    """Single option for choice-type questions."""

    text: str
    value: int


# Question DTO
class QuestionDTO(BaseModel):
    id: int
    code: str
    text_ru: str
    text_kz: str | None = None
    text_en: str | None = None
    type: QuestionTypeEnum
    module: ModuleEnum
    category: str | None = None
    options: list[QuestionOptionDTO] | None = None

    model_config = ConfigDict(from_attributes=True)


# Session Schemas
class AssessmentSessionBase(BaseModel):
    user_id: int | None = None  # Optional for MVP as requested
    status: AssessmentStatusEnum = AssessmentStatusEnum.started
    raw_scores: dict[str, Any] = {}


class AssessmentSessionCreate(AssessmentSessionBase):
    context_data: dict | None = None  # Pre-assessment context (sleep, mood, stress)


class AssessmentSession(AssessmentSessionBase):
    id: int
    start_time: datetime
    model_config = ConfigDict(from_attributes=True)


# Answer/Response Schemas
class AnswerCreate(BaseModel):
    session_id: int
    question_id: int
    value: int
    # Client-reported timing. Never negative; the value range allowed for
    # `value` depends on the question and is checked against it on save.
    reaction_time_ms: int | None = Field(default=None, ge=0)


class UserResponse(AnswerCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class SessionSummary(BaseModel):
    """
    Summary schema for assessment history list.
    Provides key information for displaying past sessions.
    """

    id: int
    date: datetime
    status: AssessmentStatusEnum
    top_result: str | None = None  # e.g., "Realistic - 25"

    model_config = ConfigDict(from_attributes=True)
