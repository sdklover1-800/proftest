from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.models.assessment import AssessmentStatusEnum
from app.models.question import QuestionTypeEnum, ModuleEnum

# Question DTO
class QuestionDTO(BaseModel):
    id: int
    code: str
    text_ru: str
    type: QuestionTypeEnum
    module: ModuleEnum
    category: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# Session Schemas
class AssessmentSessionBase(BaseModel):
    user_id: Optional[int] = None # Optional for MVP as requested
    status: AssessmentStatusEnum = AssessmentStatusEnum.started
    raw_scores: Dict[str, Any] = {}

class AssessmentSessionCreate(AssessmentSessionBase):
    pass

class AssessmentSession(AssessmentSessionBase):
    id: int
    start_time: datetime
    model_config = ConfigDict(from_attributes=True)

# Answer/Response Schemas
class AnswerCreate(BaseModel):
    session_id: int
    question_id: int
    value: int
    reaction_time_ms: Optional[int] = None

class UserResponse(AnswerCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
