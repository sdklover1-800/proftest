from sqlalchemy import select
from app.models.question import Question
from app.repositories.base import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession

class QuestionRepository(BaseRepository[Question]):
    def __init__(self):
        super().__init__(Question)
        
    async def get_all_questions(self, db: AsyncSession):
        # We might want to order by ID or Code
        query = select(Question).order_by(Question.id)
        result = await db.execute(query)
        return result.scalars().all()

question_repository = QuestionRepository()
