from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.assessment_service import assessment_service
from app.models.assessment import AssessmentSession

router = APIRouter()

@router.post("/assessment/{session_id}/finish", response_model=dict)
async def finish_assessment_session(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Finalizes the assessment session:
    - Calculates scores (RIASEC/Big5)
    - Updates the session status to 'completed'
    - Returns the calculated results
    """
    try:
        session = await assessment_service.finish_assessment(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session.raw_scores
    except Exception as e:
        # In a real app we'd log this
        raise HTTPException(
            status_code=500, 
            detail=f"Error calculating results: {str(e)}"
        )

@router.get("/assessment/{session_id}/results", response_model=dict)
async def get_assessment_results(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the results for a completed assessment session.
    """
    session = await assessment_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.raw_scores:
        raise HTTPException(status_code=400, detail="Assessment not yet completed")
        
    return session.raw_scores
