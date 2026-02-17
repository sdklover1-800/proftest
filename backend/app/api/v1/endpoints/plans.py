from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.services.assessment_service import assessment_service
from app.services.evidence_service import evidence_service
from app.services.profile_blocks_service import compute_readiness_score
from app.services.weekly_plan_service import (
    weekly_plan_service,
)
from app.services.versioning import as_dict

router = APIRouter()


class PlanCreateRequest(BaseModel):
    run_id: int = Field(..., ge=1)
    title: str | None = None
    goal: str | None = None
    selected_rec_ids: list[str] = Field(default_factory=list)


class TaskStatusRequest(BaseModel):
    task_id: str
    status: str


def _flatten_scores(scores: dict[str, Any] | None) -> dict[str, int]:
    scores = scores or {}
    flat: dict[str, int] = {}

    for module_key in ("RIASEC", "BIG5", "SJT"):
        module = scores.get(module_key)
        if not isinstance(module, dict):
            continue
        for key, value in module.items():
            if isinstance(value, (int, float)):
                flat[f"{module_key.lower()}.{str(key).lower()}"] = int(round(float(value)))

    cognitive = scores.get("COGNITIVE") or {}
    if isinstance(cognitive, dict):
        total_score = cognitive.get("total_score")
        if isinstance(total_score, (int, float)):
            flat["cognitive.total_score"] = int(round(float(total_score)))
        details = cognitive.get("details")
        if isinstance(details, dict):
            for key, value in details.items():
                if isinstance(value, (int, float)):
                    flat[f"cognitive.{str(key).lower()}"] = int(round(float(value)))

    flat["overall.readiness"] = compute_readiness_score(scores)
    return flat


async def _get_user_run(
    db: AsyncSession,
    run_id: int,
    current_user: User,
) -> dict[str, Any]:
    run_data = await assessment_service.get_session_results_with_recommendations(db, run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail="Run not found")
    if run_data.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this run")
    if not run_data.get("scores"):
        raise HTTPException(status_code=400, detail="Run is not completed yet")
    return run_data


@router.post("/plans", response_model=dict)
async def create_plan(
    payload: PlanCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    run_data = await _get_user_run(db, payload.run_id, current_user)
    evidence_refs = await evidence_service.register_assessment_evidence(
        db=db,
        user_id=current_user.id,
        run_id=payload.run_id,
        scores=run_data.get("scores"),
        context_data=run_data.get("context_data"),
        recommendations=run_data.get("recommendations"),
    )

    plan = await weekly_plan_service.create_plan(
        db=db,
        user_id=current_user.id,
        run_id=payload.run_id,
        title=payload.title,
        goal=payload.goal,
        selected_rec_ids=payload.selected_rec_ids,
        evidence_refs=evidence_refs,
    )
    return plan


@router.get("/plans/{plan_id}", response_model=dict)
async def get_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    plan = await weekly_plan_service.get_plan(db, plan_id, current_user.id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/plans/{plan_id}/task-status", response_model=dict)
async def update_task_status(
    plan_id: str,
    payload: TaskStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    try:
        task = await weekly_plan_service.set_task_status(
            db=db,
            user_id=current_user.id,
            plan_id=plan_id,
            task_id=payload.task_id,
            status=payload.status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if not task:
        raise HTTPException(status_code=404, detail="Plan or task not found")
    progress = await weekly_plan_service.get_progress(db, plan_id, current_user.id)
    return {"task": task, "progress": progress}


@router.get("/plans/{plan_id}/progress", response_model=dict)
async def get_plan_progress(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    progress = await weekly_plan_service.get_progress(db, plan_id, current_user.id)
    if not progress:
        raise HTTPException(status_code=404, detail="Plan not found")
    return progress


@router.get("/plans/templates/rfc", response_model=dict)
async def get_rfc_template(
    current_user: User = Depends(deps.get_current_user),
):
    _ = current_user
    return {
        "template_id": "rfc_one_page_v1",
        "title": "One-page RFC template",
        "markdown": weekly_plan_service.get_rfc_template(),
    }


@router.get("/plans/tasks/catalog", response_model=dict)
async def get_task_catalog(
    current_user: User = Depends(deps.get_current_user),
):
    _ = current_user
    return {"tasks": weekly_plan_service.get_task_catalog()}


@router.get("/evidence", response_model=list[dict])
async def get_evidence_batch(
    ids: str = Query(..., description="Comma-separated evidence IDs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    parsed_ids = [item.strip() for item in ids.split(",") if item.strip()]
    if len(parsed_ids) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many IDs requested. Maximum is 50.",
        )
    if not parsed_ids:
        return []
    return await evidence_service.get_many(db, current_user.id, parsed_ids)


@router.get("/evidence/{evidence_id}", response_model=dict)
async def get_evidence_item(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    item = await evidence_service.get_one(db, current_user.id, evidence_id)
    if not item:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return item


@router.get("/assessments/{run_id}/delta", response_model=dict)
async def get_assessment_delta(
    run_id: int,
    prev_run_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    current_run = await _get_user_run(db, run_id, current_user)

    previous_run_id = prev_run_id
    if previous_run_id is None:
        history = await assessment_service.get_user_history(db, current_user.id)
        for session in history:
            if session.id == run_id:
                continue
            if session.raw_scores:
                previous_run_id = session.id
                break

    if previous_run_id is None:
        return {
            "run_id": run_id,
            "prev_run_id": None,
            "delta": [],
            "summary": {
                "readiness_current": compute_readiness_score(current_run.get("scores")),
                "readiness_previous": None,
                "readiness_delta": None,
            },
        }

    previous_run = await _get_user_run(db, previous_run_id, current_user)
    current_flat = _flatten_scores(current_run.get("scores"))
    previous_flat = _flatten_scores(previous_run.get("scores"))

    all_keys = sorted(set(current_flat.keys()) | set(previous_flat.keys()))
    delta_items = []
    for key in all_keys:
        current_value = current_flat.get(key, 0)
        previous_value = previous_flat.get(key, 0)
        delta_value = current_value - previous_value
        delta_items.append(
            {
                "skill_id": key,
                "current": current_value,
                "previous": previous_value,
                "delta": delta_value,
            }
        )

    delta_items.sort(key=lambda item: abs(item["delta"]), reverse=True)
    readiness_current = current_flat.get("overall.readiness", 0)
    readiness_previous = previous_flat.get("overall.readiness", 0)

    return {
        "run_id": run_id,
        "prev_run_id": previous_run_id,
        "delta": delta_items,
        "summary": {
            "readiness_current": readiness_current,
            "readiness_previous": readiness_previous,
            "readiness_delta": readiness_current - readiness_previous,
            "changed_metrics": len([item for item in delta_items if item["delta"] != 0]),
        },
        "versions": as_dict(),
    }


@router.get("/rules/version", response_model=dict)
async def get_rule_versions(
    current_user: User = Depends(deps.get_current_user),
):
    _ = current_user
    versions = as_dict()
    return {
        "ruleset_version": versions["ruleset_version"],
        "scoring_model_version": versions["scoring_model_version"],
        "llm_text_version": versions["llm_text_version"],
        "supported_operators": [
            "lt",
            "lte",
            "gt",
            "gte",
            "eq",
            "neq",
            "in",
            "exists",
            "all",
            "any",
        ],
    }
