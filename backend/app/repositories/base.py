from typing import Generic, TypeVar, Type, Optional, List, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    """
    Base Repository class containing common CRUD operations.
    Abstracts direct DB access from the Service layer.
    """
    def __init__(self, model: Type[ModelType]):
        """
        Initialize the repository.
        :param model: The SQLAlchemy model class.
        """
        self.model = model

    async def get_by_id(self, db: AsyncSession, id: int) -> Optional[ModelType]:
        """
        Fetch a single record by its ID.
        :return: The record object or None if not found.
        """
        query = select(self.model).filter(self.model.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> Sequence[ModelType]:
        """
        Fetch all records with pagination.
        """
        query = select(self.model).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj_in: dict) -> ModelType:
        """
        Create a new record.
        """
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
