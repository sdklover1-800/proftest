"""
Analytics Service for Admin Dashboard.
Calculates user activity, conversion rates, and session drop-off statistics.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any

from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import AssessmentSession, AssessmentStatusEnum, UserResponse


class AnalyticsService:
    @staticmethod
    async def get_daily_activity(db: AsyncSession, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get daily session counts for the last N days.
        Returns: [{ date: "2026-01-07", count: 5 }, ...]
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # SQLite uses func.date() differently, but for PostgreSQL usually func.date_trunc or cast is used.
        # Assuming standard SQL or ensuring compatibility.
        # For simplicity and compatibility, we can group by date(start_time).
        
        stmt = (
            select(
                func.date(AssessmentSession.start_time).label("date"),
                func.count(AssessmentSession.id).label("count")
            )
            .where(AssessmentSession.start_time >= start_date)
            .group_by("date")
            .order_by("date")
        )
        
        result = await db.execute(stmt)
        return [{"date": str(row.date), "count": row.count} for row in result.fetchall()]

    @staticmethod
    async def get_drop_off_stats(db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Analyze where users drop off in incomplete sessions.
        Groups by number of answered questions.
        """
        # Select sessions that are NOT completed
        # We need to count responses for each of these sessions.
        
        # Subquery to count responses per session
        response_counts = (
            select(
                UserResponse.session_id,
                func.count(UserResponse.id).label("response_count")
            )
            .group_by(UserResponse.session_id)
            .subquery()
        )

        # Join sessions with response counts
        stmt = (
            select(
                func.coalesce(response_counts.c.response_count, 0).label("answered_count"),
                func.count(AssessmentSession.id).label("session_count")
            )
            .select_from(AssessmentSession)
            .outerjoin(response_counts, AssessmentSession.id == response_counts.c.session_id)
            .where(AssessmentSession.status == AssessmentStatusEnum.started)
            .group_by("answered_count")
            .order_by("answered_count")
        )

        result = await db.execute(stmt)
        
        # Group into ranges for better visualization
        ranges = {
            "0 questions": 0,
            "1-5 questions": 0,
            "6-15 questions": 0,
            "16-30 questions": 0,
            "30+ questions": 0
        }
        
        for row in result.fetchall():
            count = row.answered_count
            num_sessions = row.session_count
            
            if count == 0:
                ranges["0 questions"] += num_sessions
            elif 1 <= count <= 5:
                ranges["1-5 questions"] += num_sessions
            elif 6 <= count <= 15:
                ranges["6-15 questions"] += num_sessions
            elif 16 <= count <= 30:
                ranges["16-30 questions"] += num_sessions
            else:
                ranges["30+ questions"] += num_sessions

        return [{"range": k, "count": v} for k, v in ranges.items() if v > 0]

    @staticmethod
    async def get_conversion_rate(db: AsyncSession) -> Dict[str, Any]:
        """
        Calculate conversion rate (Completed / Total).
        """
        total_stmt = select(func.count(AssessmentSession.id))
        completed_stmt = select(func.count(AssessmentSession.id)).where(
            AssessmentSession.status == AssessmentStatusEnum.completed
        )

        total_result = await db.execute(total_stmt)
        completed_result = await db.execute(completed_stmt)

        total = total_result.scalar() or 0
        completed = completed_result.scalar() or 0

        rate = round((completed / total * 100), 1) if total > 0 else 0

        return {
            "total_sessions": total,
            "completed_sessions": completed,
            "conversion_rate": rate
        }
