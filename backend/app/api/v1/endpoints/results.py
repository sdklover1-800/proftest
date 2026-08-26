from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.services.assessment_service import assessment_service
from app.services.ai_insights_service import ai_insights_service
from app.services.evidence_service import evidence_service
from app.services.profile_aggregate_service import profile_aggregate_service
from app.services.profile_blocks_service import (
    compute_readiness_score,
    profile_blocks_service,
)
from app.services.recommendation_service import recommendation_service
from app.services.run_snapshot_service import run_snapshot_service

router = APIRouter()


def _build_progress_timeline(sessions: list) -> list[dict]:
    completed_sessions = [session for session in sessions if session.raw_scores]
    completed_sessions = sorted(
        completed_sessions,
        key=lambda session: session.start_time,
    )[-6:]

    timeline = []
    previous_score: int | None = None

    for session in completed_sessions:
        readiness = compute_readiness_score(session.raw_scores)
        if previous_score is None:
            delta = 0
        else:
            delta = readiness - previous_score

        timeline.append(
            {
                "date": session.start_time.date().isoformat(),
                "label": f"Session #{session.id}",
                "delta": delta,
            }
        )
        previous_score = readiness

    return timeline


async def _build_payload(
    session_id: int,
    results: dict,
    lang: str | None,
    target_role: str,
    target_level: str,
    db: AsyncSession,
    user_id: int | None,
    progress: list[dict] | None = None,
) -> dict:
    ai_insights = await ai_insights_service.generate(
        session_id,
        results.get("scores"),
        results.get("context_data"),
        results.get("recommendations"),
        lang,
    )
    evidence_refs: dict[str, list[str]] = {}
    if user_id is not None:
        evidence_refs = await evidence_service.register_assessment_evidence(
            db=db,
            user_id=user_id,
            run_id=session_id,
            scores=results.get("scores"),
            context_data=results.get("context_data"),
            recommendations=results.get("recommendations"),
        )

    blocks = profile_blocks_service.build_dashboard(
        session_id=session_id,
        scores=results.get("scores"),
        recommendations=results.get("recommendations"),
        ai_insights=ai_insights,
        target_role=target_role,
        target_level=target_level,
        lang=lang,
        progress=progress,
        evidence_refs=evidence_refs,
    )

    snapshot = await run_snapshot_service.upsert_snapshot(
        db=db,
        run_id=session_id,
        user_id=user_id,
        input_payload={
            "scores": results.get("scores"),
            "context_data": results.get("context_data"),
            "recommendations": results.get("recommendations"),
            "target_role": target_role,
            "target_level": target_level,
            "lang": lang or "en",
        },
        overall_score=blocks.get("overall", {}).get("readiness_score", 0),
        confidence=float(blocks.get("overall", {}).get("confidence", 0.0) or 0.0),
    )

    return {
        "scores": results["scores"],
        "recommendations": results["recommendations"],
        "context_data": results.get("context_data"),
        "ai_insights": ai_insights,
        "blocks": blocks,
        "evidence_refs": evidence_refs,
        "run_snapshot": snapshot,
    }


@router.post("/assessment/{session_id}/finish", response_model=dict)
async def finish_assessment_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    lang: str | None = Query(default=None, description="UI language code (ru/kz/en)"),
    target_role: str = Query(default="Backend Engineer"),
    target_level: str = Query(default="Senior"),
):
    """
    Finalizes the assessment session.
    Delegates calculation and recommendation generation to service layer.
    """
    # 0. Only the owner may finalize a run: finishing computes scores and
    # returns the full profile, and it spends an AI-insight call.
    existing = await assessment_service.get_session(db, session_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if existing.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to finish this session"
        )

    # 1. Finish (calculate scores)
    session = await assessment_service.finish_assessment(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2. Get results + recommendations (delegated to service logic)
    results = await assessment_service.get_session_results_with_recommendations(
        db, session_id
    )

    if not results:
        raise HTTPException(status_code=404, detail="Session not found")
    if not results.get("scores"):
        raise HTTPException(status_code=400, detail="Assessment not yet completed")

    return await _build_payload(
        session_id=session_id,
        results=results,
        lang=lang,
        target_role=target_role,
        target_level=target_level,
        db=db,
        user_id=results.get("user_id"),
    )


@router.get("/assessment/{session_id}/results", response_model=dict)
async def get_assessment_results(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    lang: str | None = Query(default=None, description="UI language code (ru/kz/en)"),
    target_role: str = Query(default="Backend Engineer"),
    target_level: str = Query(default="Senior"),
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

    user_sessions = await assessment_service.get_user_history(db, current_user.id)
    progress = _build_progress_timeline(user_sessions)

    return await _build_payload(
        session_id=session_id,
        results=results,
        lang=lang,
        target_role=target_role,
        target_level=target_level,
        db=db,
        user_id=current_user.id,
        progress=progress,
    )


@router.get("/assessment/{session_id}/blocks", response_model=dict)
async def get_assessment_blocks(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    lang: str | None = Query(default=None, description="UI language code (ru/kz/en)"),
    target_role: str = Query(default="Backend Engineer"),
    target_level: str = Query(default="Senior"),
):
    """
    Returns UI-ready profile blocks for a specific completed assessment run.
    """
    results = await assessment_service.get_session_results_with_recommendations(
        db, session_id
    )
    if not results:
        raise HTTPException(status_code=404, detail="Session not found")
    if results["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this run")
    if not results.get("scores"):
        raise HTTPException(status_code=400, detail="Assessment not yet completed")

    ai_insights = await ai_insights_service.generate(
        session_id,
        results.get("scores"),
        results.get("context_data"),
        results.get("recommendations"),
        lang,
    )
    evidence_refs = await evidence_service.register_assessment_evidence(
        db=db,
        user_id=current_user.id,
        run_id=session_id,
        scores=results.get("scores"),
        context_data=results.get("context_data"),
        recommendations=results.get("recommendations"),
    )
    user_sessions = await assessment_service.get_user_history(db, current_user.id)
    progress = _build_progress_timeline(user_sessions)

    dashboard = profile_blocks_service.build_dashboard(
        session_id=session_id,
        scores=results.get("scores"),
        recommendations=results.get("recommendations"),
        ai_insights=ai_insights,
        target_role=target_role,
        target_level=target_level,
        lang=lang,
        progress=progress,
        evidence_refs=evidence_refs,
    )

    snapshot = await run_snapshot_service.upsert_snapshot(
        db=db,
        run_id=session_id,
        user_id=current_user.id,
        input_payload={
            "scores": results.get("scores"),
            "context_data": results.get("context_data"),
            "recommendations": results.get("recommendations"),
            "target_role": target_role,
            "target_level": target_level,
            "lang": lang or "en",
        },
        overall_score=dashboard.get("overall", {}).get("readiness_score", 0),
        confidence=float(dashboard.get("overall", {}).get("confidence", 0.0) or 0.0),
    )

    dashboard["run_snapshot"] = snapshot
    return dashboard


@router.get("/profile/dashboard", response_model=dict)
async def get_profile_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    lang: str | None = Query(default=None, description="UI language code (ru/kz/en)"),
    target_role: str = Query(default="Backend Engineer"),
    target_level: str = Query(default="Senior"),
):
    """
    Returns dashboard blocks for current user based on aggregate scores
    across all completed assessment sessions.
    """
    sessions = await assessment_service.get_user_history(db, current_user.id)
    completed_sessions = [session for session in sessions if session.raw_scores]

    if not completed_sessions:
        return {"session_id": None, "run_created_at": None, "dashboard": None}

    latest_session = completed_sessions[0]
    aggregate = await profile_aggregate_service.rebuild_user_aggregate(
        db=db,
        user_id=current_user.id,
        sessions=completed_sessions,
    )
    aggregated_scores = aggregate.get("scores") or {}
    if not aggregated_scores:
        return {
            "session_id": latest_session.id,
            "run_created_at": latest_session.start_time.isoformat()
            if latest_session.start_time
            else None,
            "dashboard": None,
        }

    aggregate_recommendations = recommendation_service.generate_recommendations(aggregated_scores)
    latest_context_data = latest_session.context_data if latest_session.context_data else {}

    ai_insights = await ai_insights_service.generate(
        latest_session.id,
        aggregated_scores,
        latest_context_data,
        aggregate_recommendations,
        lang,
    )
    evidence_refs = await evidence_service.register_assessment_evidence(
        db=db,
        user_id=current_user.id,
        run_id=latest_session.id,
        scores=aggregated_scores,
        context_data=latest_context_data,
        recommendations=aggregate_recommendations,
    )
    progress = _build_progress_timeline(sessions)

    dashboard = profile_blocks_service.build_dashboard(
        session_id=latest_session.id,
        scores=aggregated_scores,
        recommendations=aggregate_recommendations,
        ai_insights=ai_insights,
        target_role=target_role,
        target_level=target_level,
        lang=lang,
        progress=progress,
        evidence_refs=evidence_refs,
    )
    dashboard["overall"]["tests_count"] = int(aggregate.get("tests_count", 0) or 0)
    aggregate_quality = aggregate.get("quality") or {}
    if isinstance(aggregate_quality, dict):
        if "measurement_confidence" in aggregate_quality:
            dashboard["overall"]["confidence"] = round(
                float(aggregate_quality.get("measurement_confidence", 0)) / 100.0,
                2,
            )
        if "stability_score" in aggregate_quality:
            dashboard["overall"]["stability_score"] = int(
                aggregate_quality.get("stability_score", 0) or 0
            )
    dashboard["aggregate"] = {
        "tests_count": int(aggregate.get("tests_count", 0) or 0),
        "updated_at": aggregate.get("updated_at"),
        "stability_score": int((aggregate_quality or {}).get("stability_score", 0) or 0),
        "measurement_confidence": int(
            (aggregate_quality or {}).get("measurement_confidence", 0) or 0
        ),
    }

    snapshot = await run_snapshot_service.upsert_snapshot(
        db=db,
        run_id=latest_session.id,
        user_id=current_user.id,
        input_payload={
            "scores": aggregated_scores,
            "context_data": latest_context_data,
            "recommendations": aggregate_recommendations,
            "target_role": target_role,
            "target_level": target_level,
            "lang": lang or "en",
            "aggregate_tests_count": int(aggregate.get("tests_count", 0) or 0),
        },
        overall_score=dashboard.get("overall", {}).get("readiness_score", 0),
        confidence=float(dashboard.get("overall", {}).get("confidence", 0.0) or 0.0),
    )
    dashboard["run_snapshot"] = snapshot

    return {
        "session_id": latest_session.id,
        "run_created_at": latest_session.start_time.isoformat()
        if latest_session.start_time
        else None,
        "dashboard": dashboard,
    }
