from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

class UserResponseBase(BaseModel):
    session_id: int
    question_id: int
    value: int = Field(..., ge=1, le=5, description="Response value between 1 and 5")
    reaction_time_ms: int = Field(..., gt=0, description="Reaction time in milliseconds")

    @validator('value')
    def validate_value(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Value must be between 1 and 5')
        return v

class UserResponseCreate(UserResponseBase):
    pass

class UserResponseUpdate(BaseModel):
    value: Optional[int] = Field(None, ge=1, le=5)
    reaction_time_ms: Optional[int] = Field(None, gt=0)

class UserResponseInDBBase(UserResponseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserResponseInDBBase):
    pass

class UserResponseInDB(UserResponseInDBBase):
    pass
