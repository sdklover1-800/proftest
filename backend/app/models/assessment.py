import enum

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AssessmentStatusEnum(str, enum.Enum):
    started = "started"
    completed = "completed"


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    status: Mapped[AssessmentStatusEnum] = mapped_column(
        Enum(AssessmentStatusEnum), default=AssessmentStatusEnum.started
    )
    start_time: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    raw_scores: Mapped[dict] = mapped_column(JSON, default={})

    user = relationship("User")
    responses = relationship("UserResponse", back_populates="session")


class UserResponse(Base):
    __tablename__ = "user_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_sessions.id")
    )
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id"))
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    reaction_time_ms: Mapped[int] = mapped_column(Integer, nullable=True)

    session = relationship("AssessmentSession", back_populates="responses")
    question = relationship("Question")
