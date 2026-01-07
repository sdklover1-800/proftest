"""
Admin analytics endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/analytics")
async def get_analytics(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """
    Get aggregated analytics data for the dashboard.
    Includes:
    - Daily user activity (last N days)
    - Session drop-off stats
    - Conversion rates
    """
    daily_activity = await AnalyticsService.get_daily_activity(db, days)
    drop_off = await AnalyticsService.get_drop_off_stats(db)
    conversion = await AnalyticsService.get_conversion_rate(db)

    return {
        "daily_activity": daily_activity,
        "drop_off": drop_off,
        "conversion": conversion,
    }
