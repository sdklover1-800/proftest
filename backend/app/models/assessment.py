import enum

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AssessmentStatusEnum(str, enum.Enum):
    started = "started"
    completed = "completed"


class AssessmentSession(Base):
    """
    Represents a single test-taking session.
    Contains raw scores and links to user responses.
    """
    __tablename__ = "assessment_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )
    status: Mapped[AssessmentStatusEnum] = mapped_column(
        Enum(AssessmentStatusEnum), default=AssessmentStatusEnum.started
    )
    start_time: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    context_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    raw_scores: Mapped[dict] = mapped_column(JSON, default={})

    # Relationships with lazy="raise" to prevent async DetachedInstanceError
    # Use selectinload() explicitly when eager loading is needed
    user = relationship("User", back_populates="sessions", lazy="raise")
    responses = relationship("UserResponse", back_populates="session", lazy="raise")


class UserResponse(Base):
    """Individual answer to a question within a session."""
    __tablename__ = "user_responses"
    __table_args__ = (
        # Scoring counts every row, so a question may be answered only once
        # per session. Re-answering updates the existing row.
        UniqueConstraint(
            "session_id", "question_id", name="uq_user_responses_session_question"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("assessment_sessions.id", ondelete="CASCADE"),
        index=True,
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("questions.id"), index=True
    )
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    reaction_time_ms: Mapped[int] = mapped_column(Integer, nullable=True)

    # Relationships with lazy="raise" for async safety
    session = relationship("AssessmentSession", back_populates="responses", lazy="raise")
    question = relationship("Question", lazy="raise")
