
from pydantic import BaseModel, ConfigDict

from app.models.question import ModuleEnum, QuestionTypeEnum


class QuestionBase(BaseModel):
    code: str
    module: ModuleEnum
    category: str | None = None
    text_ru: str | None = None
    text_kz: str | None = None
    text_en: str | None = None
    type: QuestionTypeEnum
    is_reverse: bool = False


class QuestionCreate(QuestionBase):
    pass


class Question(QuestionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
