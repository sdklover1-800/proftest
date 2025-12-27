from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from typing import Optional

class UserService:
    """
    Service layer for User business logic.
    Coordinates between the API (Schemas) and Data Access (Repository).
    """
    
    async def create_user(self, db: AsyncSession, user_in: UserCreate) -> User:
        """
        Creates a new user.
        TODO: Add password hashing here when implementing auth.
        """
        # We assume validation happens in the API layer or here if needed
        # For now, just passing data to repo
        return await user_repository.create(db, user_in.model_dump())

    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Retrieves a user by email.
        """
        return await user_repository.get_by_email(db, email)

    async def get_user_by_id(self, db: AsyncSession, user_id: int) -> Optional[User]:
        """
        Retrieves a user by ID.
        """
        return await user_repository.get_by_id(db, user_id)

user_service = UserService()
