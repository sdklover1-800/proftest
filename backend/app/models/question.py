import enum
from sqlalchemy import String, Integer, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ModuleEnum(str, enum.Enum):
    RIASEC = "RIASEC"
    BIG5 = "BIG5"
    COGNITIVE = "COGNITIVE"

class QuestionTypeEnum(str, enum.Enum):
    scale = "scale"
    choice = "choice"

class Question(Base):
    """
    Represents a single assessment question.
    Can be part of RIASEC, BIG5, or COGNITIVE modules.
    """
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Unique code (e.g., 'R1') to identify questions across versions
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    module: Mapped[ModuleEnum] = mapped_column(Enum(ModuleEnum), nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=True)
    text_ru: Mapped[str] = mapped_column(String, nullable=True)
    text_kz: Mapped[str] = mapped_column(String, nullable=True)
    text_en: Mapped[str] = mapped_column(String, nullable=True)
    type: Mapped[QuestionTypeEnum] = mapped_column(Enum(QuestionTypeEnum), nullable=False)
    is_reverse: Mapped[bool] = mapped_column(Boolean, default=False)
