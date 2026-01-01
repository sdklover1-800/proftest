from enum import Enum as PyEnum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import relationship

from ..db.base import Base


class ModuleType(PyEnum):
    RIASEC = "RIASEC"
    BIG5 = "BIG5"
    COGNITIVE = "COGNITIVE"


class QuestionType(PyEnum):
    SCALE = "scale"
    CHOICE = "choice"


class AssessmentStatus(PyEnum):
    STARTED = "started"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Relationships
    assessment_sessions = relationship("AssessmentSession", back_populates="user")


class Question(Base):
    __tablename__ = "questions"

    code = Column(String(10), unique=True, index=True, nullable=False)
    module = Column(Enum(ModuleType), nullable=False)
    category = Column(String(100), nullable=False)
    text_ru = Column(String(500), nullable=False)
    text_kz = Column(String(500), nullable=True)
    text_en = Column(String(500), nullable=True)
    type = Column(Enum(QuestionType), nullable=False)
    is_reverse = Column(Boolean, default=False)

    # Relationships
    responses = relationship("UserResponse", back_populates="question")


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum(AssessmentStatus), default=AssessmentStatus.STARTED, nullable=False
    )
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    raw_scores = Column(JSON, nullable=True)
    results = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="assessment_sessions")
    responses = relationship("UserResponse", back_populates="session")


class UserResponse(Base):
    __tablename__ = "user_responses"

    session_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    value = Column(Integer, nullable=False)  # The actual response value
    reaction_time_ms = Column(
        Integer, nullable=False
    )  # Time taken to respond in milliseconds

    # Relationships
    session = relationship("AssessmentSession", back_populates="responses")
    question = relationship("Question", back_populates="responses")
