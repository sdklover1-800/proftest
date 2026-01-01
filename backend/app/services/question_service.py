
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question
from app.repositories.question_repository import question_repository


class QuestionService:
    async def get_all(self, db: AsyncSession) -> list[Question]:
        return await question_repository.get_all_questions(db)


question_service = QuestionService()
