from __future__ import annotations

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AssessmentRunSnapshot(Base):
    """
    Reproducibility snapshot for a completed assessment run.
    Keeps stable input hash + versions used for generation.
    """

    __tablename__ = "assessment_run_snapshots"

    run_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("assessment_sessions.id"),
        primary_key=True,
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    versions_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    run = relationship("AssessmentSession", lazy="raise")
    user = relationship("User", lazy="raise")


class EvidenceItem(Base):
    """
    Normalized evidence item used by Why?/Explain UI.
    """

    __tablename__ = "evidence_items"

    evidence_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    run_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("assessment_sessions.id"),
        nullable=True,
        index=True,
    )
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    locator_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    snippet: Mapped[str] = mapped_column(Text, nullable=False, default="")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    tags_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    run = relationship("AssessmentSession", lazy="raise")
    user = relationship("User", lazy="raise")


class Plan(Base):
    """
    Stored weekly plan payload linked to a user and assessment run.
    """

    __tablename__ = "plans"

    plan_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    run_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("assessment_sessions.id"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    selected_rec_ids_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    evidence_refs_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    versions_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    task_statuses = relationship("PlanTaskStatus", back_populates="plan", lazy="raise")
    user = relationship("User", lazy="raise")
    run = relationship("AssessmentSession", lazy="raise")


class PlanTaskStatus(Base):
    """
    Persistent status override for a task in plan payload.
    """

    __tablename__ = "plan_task_status"
    __table_args__ = (
        UniqueConstraint("plan_id", "task_id", name="uq_plan_task_status_plan_task"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plan_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("plans.plan_id"),
        nullable=False,
        index=True,
    )
    task_id: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="todo")
    done_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    plan = relationship("Plan", back_populates="task_statuses", lazy="raise")
