from pydantic import BaseModel, ConfigDict
from app.models.question import ModuleEnum, QuestionTypeEnum
from typing import Optional

class QuestionBase(BaseModel):
    code: str
    module: ModuleEnum
    category: Optional[str] = None
    text_ru: Optional[str] = None
    text_kz: Optional[str] = None
    text_en: Optional[str] = None
    type: QuestionTypeEnum
    is_reverse: bool = False

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
