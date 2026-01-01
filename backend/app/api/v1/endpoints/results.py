from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.services.assessment_service import assessment_service

router = APIRouter()


@router.post("/assessment/{session_id}/finish", response_model=dict)
async def finish_assessment_session(
    session_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Finalizes the assessment session.
    Delegates calculation and recommendation generation to service layer.
    """
    # 1. Finish (calculate scores)
    session = await assessment_service.finish_assessment(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2. Get results + recommendations (delegated to service logic)
    results = await assessment_service.get_session_results_with_recommendations(
        db, session_id
    )

    return {"scores": results["scores"], "recommendations": results["recommendations"]}


@router.get("/assessment/{session_id}/results", response_model=dict)
async def get_assessment_results(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Retrieves the results for a completed assessment session.
    Thin router: delegates retrieval and auth check logic can also be centered if complex,
    but we'll keep the simple auth check here while delegating data retrieval.
    """
    results = await assessment_service.get_session_results_with_recommendations(
        db, session_id
    )

    if not results:
        raise HTTPException(status_code=404, detail="Session not found")

    if results["user_id"] != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to view these results"
        )

    if not results["scores"]:
        raise HTTPException(status_code=400, detail="Assessment not yet completed")

    return {"scores": results["scores"], "recommendations": results["recommendations"]}
