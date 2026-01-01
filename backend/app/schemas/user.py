from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    """
    Shared properties for User models.
    """

    email: EmailStr
    age: int | None = None


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
