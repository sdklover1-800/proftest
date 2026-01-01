
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate


class UserService:
    """
    Service layer for User business logic.
    Coordinates between the API (Schemas) and Data Access (Repository).
    """

    async def create_user(self, db: AsyncSession, user_in: UserCreate) -> User:
        """
        Creates a new user with hashed password.
        """
        from app.core.security import get_password_hash

        user_data = user_in.model_dump()
        user_data["hashed_password"] = get_password_hash(user_in.password)
        del user_data["password"]  # Remove plain password

        return await user_repository.create(db, user_data)

    async def get_user_by_email(self, db: AsyncSession, email: str) -> User | None:
        """
        Retrieves a user by email.
        """
        return await user_repository.get_by_email(db, email)

    async def get_user_by_id(self, db: AsyncSession, user_id: int) -> User | None:
        """
        Retrieves a user by ID.
        """
        return await user_repository.get_by_id(db, user_id)


user_service = UserService()
