from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.assessment import AssessmentStatusEnum
from app.models.question import ModuleEnum, QuestionTypeEnum


class QuestionOptionDTO(BaseModel):
    """
    Single option for choice-type questions, as shown to the person answering.

    Deliberately carries no weight: for cognitive and situational items the
    weight *is* the answer key, and a client that can read it can score itself.
    Answers come back as the position of the option chosen.
    """

    text: str


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
    # What the person picked: the rating itself for scale questions (1..5),
    # the zero-based position of the chosen option for choice questions.
    # Both are checked against the target question on save.
    value: int
    # Set when a timed question expired with nothing chosen. The server decides
    # what that is worth — for a no-go stimulus, holding back is the right answer.
    timed_out: bool = False
    # Client-reported timing. Never negative.
    reaction_time_ms: int | None = Field(default=None, ge=0)


class UserResponse(AnswerCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AnswerAck(BaseModel):
    """
    Confirmation that an answer was stored.

    Deliberately says nothing about what the answer scored: a client that
    learns the score can resubmit until the reply confirms a point, which hands
    over the answer key one question at a time.
    """

    id: int
    session_id: int
    question_id: int
    reaction_time_ms: int | None = None

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
