
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.models.assessment import UserResponse as DBUserResponse
from app.models.question import Question
from app.repositories.assessment_repository import assessment_repository
from app.schemas.assessment import (
    AnswerCreate,
    AssessmentSessionCreate,
    SessionSummary,
)
from app.services.answer_validation import resolve_answer_value
from app.services.recommendation_service import recommendation_service
from app.services.scoring_service import calculate_score


class AssessmentService:
    """
    Service layer for Assessment business logic.
    """

    async def finish_assessment(
        self, db: AsyncSession, session_id: int
    ) -> AssessmentSession:
        """
        Calculates scores and finalizes the assessment session.
        """
        # 1. Calculate scores
        results = await calculate_score(session_id, db)

        # 2. Update session with results and status
        session = await assessment_repository.update_results(db, session_id, results)
        return session

    async def create_session(
        self,
        db: AsyncSession,
        session_in: AssessmentSessionCreate,
        user_id: int | None = None,
    ) -> AssessmentSession:
        data = session_in.model_dump(exclude_unset=True)
        if user_id:
            data["user_id"] = user_id
        return await assessment_repository.create(db, data)

    async def get_session(self, db: AsyncSession, session_id: int) -> AssessmentSession:
        return await assessment_repository.get_by_id(db, session_id)

    async def get_all_questions(self, db: AsyncSession) -> list[Question]:
        """
        Fetches all questions sorted by ID.
        """
        query = select(Question).order_by(Question.id)
        result = await db.execute(query)
        return result.scalars().all()

    async def record_answer(
        self, db: AsyncSession, answer_in: AnswerCreate, user_id: int
    ) -> DBUserResponse:
        """
        Saves one answer on behalf of `user_id`.

        Answering is only allowed inside the caller's own unfinished session,
        and only with a value the target question can actually take. Answering
        the same question twice overwrites the earlier answer instead of
        stacking duplicates, which would otherwise skew scoring.

        For choice questions the caller sends the position it picked; the
        weight that position is worth is resolved here and never travels back.
        """
        session = await self.get_session(db, answer_in.session_id)
        # A session that does not exist and a session owned by somebody else
        # are answered the same way, so session ids cannot be probed.
        if session is None or session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to answer in this session.",
            )
        if session.status == AssessmentStatusEnum.completed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Assessment session is already completed.",
            )

        question = await db.get(Question, answer_in.question_id)
        if question is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found.",
            )

        # The stored value is the score, not the position the client sent:
        # scoring reads this column directly.
        scored_value = resolve_answer_value(
            question, answer_in.value, answer_in.timed_out
        )

        existing = await db.execute(
            select(DBUserResponse).where(
                DBUserResponse.session_id == answer_in.session_id,
                DBUserResponse.question_id == answer_in.question_id,
            )
        )
        db_answer = existing.scalars().first()
        if db_answer is None:
            db_answer = DBUserResponse(
                session_id=answer_in.session_id,
                question_id=answer_in.question_id,
            )
            db.add(db_answer)

        db_answer.value = scored_value
        db_answer.reaction_time_ms = answer_in.reaction_time_ms

        await db.commit()
        await db.refresh(db_answer)
        return db_answer

    async def get_user_history(
        self, db: AsyncSession, user_id: int
    ) -> list[AssessmentSession]:
        """
        Fetches all assessment sessions for a specific user, ordered by most recent.
        """
        query = (
            select(AssessmentSession)
            .filter(AssessmentSession.user_id == user_id)
            .order_by(AssessmentSession.start_time.desc())
        )
        result = await db.execute(query)
        return result.scalars().all()

    async def get_user_history_summaries(
        self, db: AsyncSession, user_id: int
    ) -> list[SessionSummary]:
        """
        Fetches user history and transforms it into SessionSummary objects.
        This follows the 'Thin Router' pattern by moving transformation logic here.
        """
        sessions = await self.get_user_history(db, user_id)

        summaries = []
        for session in sessions:
            summary = SessionSummary(
                id=session.id,
                date=session.start_time,
                status=session.status,
                top_result=self._get_top_result(session.raw_scores),
            )
            summaries.append(summary)

        return summaries

    def _get_top_result(self, raw_scores: dict | None) -> str | None:
        """
        Internal helper to extract the top scoring category from raw_scores.
        """
        if not raw_scores:
            return None

        # Check RIASEC first (primary interest type), then Big5
        riasec_scores = raw_scores.get("RIASEC", {})
        if riasec_scores:
            top_category = max(riasec_scores.items(), key=lambda x: x[1])
            return f"{top_category[0]} - {top_category[1]}"

        big5_scores = raw_scores.get("BIG5", {})
        if big5_scores:
            top_category = max(big5_scores.items(), key=lambda x: x[1])
            return f"{top_category[0]} - {top_category[1]}"

        return None

    async def get_session_results_with_recommendations(
        self, db: AsyncSession, session_id: int
    ) -> dict:
        """
        Retrieves session results and generates recommendations in one go.
        This thins the router by moving orchestration to the service.
        """
        session = await self.get_session(db, session_id)
        if not session:
            return None

        if not session.raw_scores:
            return {"scores": None, "recommendations": [], "user_id": session.user_id}

        recommendations = recommendation_service.generate_recommendations(
            session.raw_scores
        )

        return {
            "scores": session.raw_scores,
            "recommendations": recommendations,
            "user_id": session.user_id,
            "context_data": session.context_data,
        }


assessment_service = AssessmentService()
