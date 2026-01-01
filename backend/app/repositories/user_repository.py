
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Repository specifically for User model operations.
    """

    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        """
        Fetch a user by their email address.
        Used for authentication and duplicate checks.
        """
        query = select(User).filter(User.email == email)
        result = await db.execute(query)
        return result.scalars().first()


user_repository = UserRepository()
