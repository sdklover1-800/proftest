from sqlalchemy.ext.asyncio import AsyncSession
from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.repositories.base import BaseRepository

class AssessmentRepository(BaseRepository[AssessmentSession]):
    def __init__(self):
        super().__init__(AssessmentSession)

    async def update_results(self, db: AsyncSession, session_id: int, results: dict) -> AssessmentSession:
        """
        Updates the session with calculated results and marks it as completed.
        """
        session = await self.get_by_id(db, session_id)
        if session:
            session.raw_scores = results
            session.status = AssessmentStatusEnum.completed
            await db.commit()
            await db.refresh(session)
        return session

assessment_repository = AssessmentRepository()
