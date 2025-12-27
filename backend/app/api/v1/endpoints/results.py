from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.assessment_service import assessment_service
from app.models.assessment import AssessmentSession

router = APIRouter()

from app.services.recommendation_service import recommendation_service
from app.models.user import User
from app.api import deps

@router.post("/assessment/{session_id}/finish", response_model=dict)
async def finish_assessment_session(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Finalizes the assessment session:
    - Calculates scores (RIASEC/Big5)
    - Updates the session status to 'completed'
    - Returns the calculated results AND recommendations
    """
    try:
        session = await assessment_service.finish_assessment(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        # Generate recommendations based on the scores
        recommendations = recommendation_service.generate_recommendations(session.raw_scores)
        
        return {
            "scores": session.raw_scores,
            "recommendations": recommendations
        }
    except Exception as e:
        # In a real app we'd log this
        raise HTTPException(
            status_code=500, 
            detail=f"Error calculating results: {str(e)}"
        )

@router.get("/assessment/{session_id}/results", response_model=dict)
async def get_assessment_results(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieves the results for a completed assessment session.
    """
    session = await assessment_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Ensure usage of correct user
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these results")
    
    if not session.raw_scores:
        raise HTTPException(status_code=400, detail="Assessment not yet completed")
        
    # Generate recommendations on the fly (or we could have stored them)
    recommendations = recommendation_service.generate_recommendations(session.raw_scores)

    return {
        "scores": session.raw_scores,
        "recommendations": recommendations
    }

