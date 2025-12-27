from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    """
    Shared properties for User models.
    """
    email: EmailStr
    age: Optional[int] = None

class UserCreate(UserBase):
    """
    Properties to receive via API on creation.
    """
    password: str

class UserResponse(UserBase):
    """
    Properties to return to client.
    Excludes sensitive data like password.
    """
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

