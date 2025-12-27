from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.question_repository import question_repository
from app.models.question import Question

class QuestionService:
    async def get_all(self, db: AsyncSession) -> List[Question]:
        return await question_repository.get_all_questions(db)

question_service = QuestionService()
