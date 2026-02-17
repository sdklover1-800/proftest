from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.planning import Plan, PlanTaskStatus
from app.services.versioning import (
    LLM_TEXT_VERSION,
    RULESET_VERSION,
    SCORING_MODEL_VERSION,
    as_dict,
)


PLAN_STATUS_VALUES = {"todo", "in_progress", "done"}


RFC_TEMPLATE = """# RFC: <Title>

## 0. TL;DR (3-5 bullets)
- Problem: ...
- Proposal: ...
- Impact: ...
- Risks: ...
- Rollout: ...

## 1. Context
- Current state:
- Constraints:
- Non-goals:

## 2. Problem statement
What is broken / slow / risky? Provide 1-2 examples with numbers if possible.

## 3. Proposal
### 3.1 Design overview
- Components:
- Data flow:
- Failure modes:

### 3.2 Key decisions
- Decision A: <what> - because <why>
- Decision B: ...

### 3.3 Alternatives considered
- Alt 1: pros/cons
- Alt 2: pros/cons
Why rejected.

## 4. Metrics & SLO
- Success metrics (measurable):
- SLO/SLI (if relevant):
- Alerting (minimal):

## 5. Rollout plan
- Step 1:
- Step 2:
- Rollback:

## 6. Risks & mitigations
- Risk:
- Mitigation:

## 7. Open questions
- Q1:
- Q2:
"""


TASK_CATALOG: list[dict[str, Any]] = [
    {
        "task_id": "t_ci_setup",
        "title": "Add CI workflow: lint + tests + build gate",
        "category": "testing_ci",
        "estimated_minutes": 60,
        "output": "repo:.github/workflows/ci.yml",
    },
    {
        "task_id": "t_coverage_gate",
        "title": "Add coverage report + critical threshold gate",
        "category": "testing_ci",
        "estimated_minutes": 45,
        "output": "metrics:coverage_critical",
    },
    {
        "task_id": "t_integration_harness",
        "title": "Set integration test harness with test DB/container",
        "category": "testing_ci",
        "estimated_minutes": 90,
        "output": "repo:tests/integration/",
    },
    {
        "task_id": "t_itest_10",
        "title": "Write 10 integration tests for two critical flows",
        "category": "testing_ci",
        "estimated_minutes": 120,
        "output": "metrics:integration_tests_count",
    },
    {
        "task_id": "t_flake_fix",
        "title": "Eliminate flaky tests and stabilize runtime",
        "category": "testing_ci",
        "estimated_minutes": 75,
        "output": "metrics:flaky_rate",
    },
    {
        "task_id": "t_contract_tests",
        "title": "Add contract tests for one external API integration",
        "category": "testing_ci",
        "estimated_minutes": 90,
        "output": "repo:tests/contracts/",
    },
    {
        "task_id": "t_test_pyramid_doc",
        "title": "Write one-page test pyramid strategy",
        "category": "testing_ci",
        "estimated_minutes": 45,
        "output": "repo:docs/testing-strategy.md",
    },
    {
        "task_id": "t_mutation_check",
        "title": "Run mutation/fault checks for assert quality",
        "category": "testing_ci",
        "estimated_minutes": 60,
        "output": "repo:reports/mutation-check.md",
    },
    {
        "task_id": "t_structured_logs",
        "title": "Add structured logs with correlation/request IDs",
        "category": "observability",
        "estimated_minutes": 60,
        "output": "repo:app/logging.py",
    },
    {
        "task_id": "t_red_metrics",
        "title": "Implement RED metrics for two key endpoints",
        "category": "observability",
        "estimated_minutes": 75,
        "output": "metrics:red_endpoint",
    },
    {
        "task_id": "t_tracing_baseline",
        "title": "Set OpenTelemetry tracing baseline for critical flow",
        "category": "observability",
        "estimated_minutes": 90,
        "output": "repo:app/tracing.py",
    },
    {
        "task_id": "t_retry_policy",
        "title": "Add retry policy with exponential backoff + jitter",
        "category": "observability",
        "estimated_minutes": 60,
        "output": "repo:app/retry.py",
    },
    {
        "task_id": "t_idempotency_key",
        "title": "Implement idempotency key for one write operation",
        "category": "observability",
        "estimated_minutes": 90,
        "output": "repo:app/idempotency.py",
    },
    {
        "task_id": "t_rollback_doc",
        "title": "Create release rollback plan with feature flag strategy",
        "category": "observability",
        "estimated_minutes": 45,
        "output": "repo:docs/release-rollback.md",
    },
    {
        "task_id": "t_perf_profile",
        "title": "Profile p95 and identify top 3 hotspots",
        "category": "performance",
        "estimated_minutes": 90,
        "output": "repo:reports/perf-hotspots.md",
    },
    {
        "task_id": "t_db_indexes",
        "title": "Optimize top two queries with index + explain analysis",
        "category": "performance",
        "estimated_minutes": 90,
        "output": "repo:migrations/index-optimization.sql",
    },
    {
        "task_id": "t_cache_layer",
        "title": "Add cache-aside for expensive read path",
        "category": "performance",
        "estimated_minutes": 90,
        "output": "repo:app/cache.py",
    },
    {
        "task_id": "t_load_test",
        "title": "Run load test baseline and capture p95/p99/error rate",
        "category": "performance",
        "estimated_minutes": 75,
        "output": "repo:perf/load-test.js",
    },
    {
        "task_id": "t_rfc_scaling",
        "title": "Write RFC on scaling strategy with trade-offs",
        "category": "communication",
        "estimated_minutes": 60,
        "output": "repo:docs/rfc-scaling.md",
    },
    {
        "task_id": "t_arch_diagram",
        "title": "Create C4 L1/L2 architecture + data flow diagram",
        "category": "communication",
        "estimated_minutes": 60,
        "output": "repo:docs/architecture-diagram",
    },
]


RECOMMENDATION_TASK_MAP: dict[str, list[str]] = {
    "rec_ci_baseline": ["t1_ci_setup", "t5_coverage_gate"],
    "rec_integration_suite": [
        "t2_test_harness",
        "t2_first_itest",
        "t3_itest_2_4",
        "t5_itest_5_10",
        "t6_flake_fix",
    ],
    "rec_observability_baseline": ["t4_structured_logs"],
    "rec_reliability_core": ["t5_itest_5_10", "t6_flake_fix"],
    "rec_perf_baseline": ["t7_reassess"],
    "rec_communication_signal": ["t7_rfc"],
}


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _task(
    task_id: str,
    title: str,
    task_type: str,
    estimated_minutes: int,
    instructions: list[str],
    outputs: list[dict[str, str]],
    tags: list[str],
    expected_impact: dict[str, int],
) -> dict[str, Any]:
    return {
        "task_id": task_id,
        "title": title,
        "type": task_type,
        "estimated_minutes": estimated_minutes,
        "instructions": instructions,
        "outputs": outputs,
        "tags": tags,
        "expected_impact": expected_impact,
        "status": "todo",
    }


def default_week_plan_days() -> list[dict[str, Any]]:
    return [
        {
            "day_index": 1,
            "title": "Baseline & CI",
            "estimated_minutes": 75,
            "tasks": [
                _task(
                    task_id="t1_ci_setup",
                    title="Add CI pipeline (lint + tests + build)",
                    task_type="setup",
                    estimated_minutes=45,
                    instructions=[
                        "Create GitHub Actions workflow.",
                        "Run unit tests on push and pull requests.",
                        "Fail build on lint and test errors.",
                    ],
                    outputs=[{"kind": "artifact", "label": "ci.yml", "ref": "repo:.github/workflows/ci.yml"}],
                    tags=["ci", "testing"],
                    expected_impact={"testing": 6, "reliability": 4},
                ),
                _task(
                    task_id="t1_smoke_tests",
                    title="Define two critical flows for integration tests",
                    task_type="planning",
                    estimated_minutes=30,
                    instructions=[
                        "Pick two critical user/business flows.",
                        "Write expected steps and outcomes checklist.",
                    ],
                    outputs=[{"kind": "note", "label": "Critical flows list", "ref": "plan:notes/critical_flows.md"}],
                    tags=["testing"],
                    expected_impact={"testing": 3},
                ),
            ],
        },
        {
            "day_index": 2,
            "title": "Test harness",
            "estimated_minutes": 75,
            "tasks": [
                _task(
                    task_id="t2_test_harness",
                    title="Set up integration test harness",
                    task_type="build",
                    estimated_minutes=60,
                    instructions=[
                        "Add test DB or container setup.",
                        "Create test client helper utilities.",
                        "Ensure tests run in CI.",
                    ],
                    outputs=[{"kind": "artifact", "label": "integration test base", "ref": "repo:tests/integration/"}],
                    tags=["testing", "docker"],
                    expected_impact={"testing": 7, "reliability": 2},
                ),
                _task(
                    task_id="t2_first_itest",
                    title="Write first integration test (happy path)",
                    task_type="build",
                    estimated_minutes=15,
                    instructions=[
                        "Implement one happy-path integration test for flow #1.",
                        "Assert output and DB side effects.",
                    ],
                    outputs=[{"kind": "artifact", "label": "itest_01", "ref": "repo:tests/integration/test_flow1.py"}],
                    tags=["testing"],
                    expected_impact={"testing": 3},
                ),
            ],
        },
        {
            "day_index": 3,
            "title": "Scale integration coverage",
            "estimated_minutes": 75,
            "tasks": [
                _task(
                    task_id="t3_itest_2_4",
                    title="Add three more integration tests (flow #1 variants)",
                    task_type="build",
                    estimated_minutes=75,
                    instructions=[
                        "Add two negative tests (validation/auth).",
                        "Add one edge-case test.",
                        "Keep tests deterministic.",
                    ],
                    outputs=[{"kind": "metric", "label": "integration_tests", "ref": "metrics:integration_tests_count"}],
                    tags=["testing"],
                    expected_impact={"testing": 6},
                ),
            ],
        },
        {
            "day_index": 4,
            "title": "Observability baseline",
            "estimated_minutes": 60,
            "tasks": [
                _task(
                    task_id="t4_structured_logs",
                    title="Add structured logs and correlation ID",
                    task_type="improve",
                    estimated_minutes=60,
                    instructions=[
                        "Switch logging to JSON output.",
                        "Add request_id or correlation_id context.",
                        "Log key fields on errors.",
                    ],
                    outputs=[{"kind": "artifact", "label": "logging config", "ref": "repo:app/logging.py"}],
                    tags=["observability"],
                    expected_impact={"observability": 8, "debugging": 3},
                ),
            ],
        },
        {
            "day_index": 5,
            "title": "Finish 10 tests and coverage",
            "estimated_minutes": 90,
            "tasks": [
                _task(
                    task_id="t5_itest_5_10",
                    title="Reach 10 integration tests total",
                    task_type="build",
                    estimated_minutes=75,
                    instructions=[
                        "Cover flow #2 happy and negative scenarios.",
                        "Add one idempotency or retry scenario if applicable.",
                    ],
                    outputs=[{"kind": "metric", "label": "integration_tests", "ref": "metrics:integration_tests_count"}],
                    tags=["testing"],
                    expected_impact={"testing": 10, "reliability": 3},
                ),
                _task(
                    task_id="t5_coverage_gate",
                    title="Add coverage report and threshold gate",
                    task_type="setup",
                    estimated_minutes=15,
                    instructions=[
                        "Generate coverage report in CI.",
                        "Set threshold for critical modules.",
                    ],
                    outputs=[{"kind": "metric", "label": "coverage", "ref": "metrics:coverage_critical"}],
                    tags=["testing", "ci"],
                    expected_impact={"testing": 5},
                ),
            ],
        },
        {
            "day_index": 6,
            "title": "Quality pass",
            "estimated_minutes": 75,
            "tasks": [
                _task(
                    task_id="t6_flake_fix",
                    title="Eliminate flakiness and reduce runtime variance",
                    task_type="improve",
                    estimated_minutes=75,
                    instructions=[
                        "Remove sleep/time dependencies.",
                        "Use fixed seeds and deterministic fixtures.",
                        "Optimize DB setup and teardown.",
                    ],
                    outputs=[{"kind": "metric", "label": "tests_flaky_rate", "ref": "metrics:flaky_rate"}],
                    tags=["testing"],
                    expected_impact={"testing": 4, "reliability": 2},
                ),
            ],
        },
        {
            "day_index": 7,
            "title": "Demonstrate senior signal",
            "estimated_minutes": 90,
            "tasks": [
                _task(
                    task_id="t7_rfc",
                    title="Write short RFC: testing strategy and release gate",
                    task_type="document",
                    estimated_minutes=45,
                    instructions=[
                        "Describe problem, constraints and solution.",
                        "Add trade-offs and alternatives.",
                        "Define rollout and rollback plan.",
                    ],
                    outputs=[{"kind": "artifact", "label": "RFC", "ref": "repo:docs/rfc-testing.md"}],
                    tags=["comms", "testing"],
                    expected_impact={"comms": 6, "testing": 3, "ownership": 3},
                ),
                _task(
                    task_id="t7_reassess",
                    title="Re-run assessment and compare deltas",
                    task_type="measure",
                    estimated_minutes=45,
                    instructions=[
                        "Trigger new assessment run.",
                        "Store skill and insight deltas.",
                    ],
                    outputs=[{"kind": "artifact", "label": "delta report", "ref": "assessment:delta"}],
                    tags=["progress"],
                    expected_impact={"readiness": 2},
                ),
            ],
        },
    ]


def _calculate_estimated_total_minutes(days: list[dict[str, Any]]) -> int:
    return sum(int(day.get("estimated_minutes", 0) or 0) for day in days)


def _iter_tasks(days: list[dict[str, Any]]):
    for day in days:
        for task in day.get("tasks", []):
            yield day, task


class WeeklyPlanService:
    async def _get_plan_row(
        self,
        db: AsyncSession,
        plan_id: str,
        user_id: int,
    ) -> Plan | None:
        result = await db.execute(
            select(Plan).where(Plan.plan_id == plan_id, Plan.user_id == user_id)
        )
        return result.scalars().first()

    async def _get_status_rows(
        self,
        db: AsyncSession,
        plan_id: str,
    ) -> list[PlanTaskStatus]:
        result = await db.execute(
            select(PlanTaskStatus).where(PlanTaskStatus.plan_id == plan_id)
        )
        return list(result.scalars().all())

    def _serialize_plan(
        self,
        plan_row: Plan,
        status_rows: list[PlanTaskStatus],
    ) -> dict[str, Any]:
        payload = deepcopy(plan_row.payload_json or {})
        payload["selected_rec_ids"] = list(plan_row.selected_rec_ids_json or [])
        payload["evidence_refs"] = dict(plan_row.evidence_refs_json or {})
        payload["versions"] = dict(plan_row.versions_json or as_dict())
        payload["created_at"] = (
            plan_row.created_at.isoformat() if plan_row.created_at else _now_iso()
        )
        payload["updated_at"] = (
            plan_row.updated_at.isoformat() if plan_row.updated_at else _now_iso()
        )

        status_map = {row.task_id: row for row in status_rows}
        for _, task in _iter_tasks(payload.get("days", [])):
            task_id = str(task.get("task_id", "")).strip()
            if not task_id:
                continue
            status_row = status_map.get(task_id)
            if status_row:
                task["status"] = status_row.status
                if status_row.done_at:
                    task["done_at"] = status_row.done_at.isoformat()

        return payload

    async def create_plan(
        self,
        db: AsyncSession,
        user_id: int,
        run_id: int,
        title: str | None,
        goal: str | None,
        selected_rec_ids: list[str] | None = None,
        evidence_refs: dict[str, list[str]] | None = None,
    ) -> dict[str, Any]:
        days = default_week_plan_days()
        plan_id = f"plan_{uuid4().hex[:20]}"

        selected_rec_ids = selected_rec_ids or []
        evidence_refs = evidence_refs or {}

        recommended_task_ids: set[str] = set()
        for rec_id in selected_rec_ids:
            recommended_task_ids.update(RECOMMENDATION_TASK_MAP.get(rec_id, []))

        if recommended_task_ids:
            for day in days:
                for task in day.get("tasks", []):
                    task["recommended"] = task.get("task_id") in recommended_task_ids

        payload = {
            "plan_id": plan_id,
            "run_id": f"run_{run_id}",
            "title": title or "7-day readiness boost",
            "goal": goal or "Increase Testing + Observability signals with measurable outcomes",
            "estimated_total_minutes": _calculate_estimated_total_minutes(days),
            "success_metrics": [
                {"id": "ci_enabled", "label": "CI pipeline enabled", "target": True},
                {"id": "integration_tests", "label": "Integration tests added", "target": 10},
                {"id": "coverage", "label": "Coverage on critical modules", "target": 0.45},
            ],
            "days": days,
        }

        plan_row = Plan(
            plan_id=plan_id,
            user_id=user_id,
            run_id=run_id,
            title=payload["title"],
            goal=payload["goal"],
            payload_json=payload,
            selected_rec_ids_json=selected_rec_ids,
            evidence_refs_json=evidence_refs,
            versions_json=as_dict(),
        )
        db.add(plan_row)
        await db.commit()
        await db.refresh(plan_row)

        return self._serialize_plan(plan_row, [])

    async def get_plan(
        self,
        db: AsyncSession,
        plan_id: str,
        user_id: int,
    ) -> dict[str, Any] | None:
        plan_row = await self._get_plan_row(db, plan_id, user_id)
        if not plan_row:
            return None
        status_rows = await self._get_status_rows(db, plan_id)
        return self._serialize_plan(plan_row, status_rows)

    async def set_task_status(
        self,
        db: AsyncSession,
        user_id: int,
        plan_id: str,
        task_id: str,
        status: str,
    ) -> dict[str, Any] | None:
        status_normalized = status.strip().lower()
        if status_normalized not in PLAN_STATUS_VALUES:
            raise ValueError("Invalid task status")

        plan_row = await self._get_plan_row(db, plan_id, user_id)
        if not plan_row:
            return None

        payload = deepcopy(plan_row.payload_json or {})
        found_task: dict[str, Any] | None = None
        for _, task in _iter_tasks(payload.get("days", [])):
            if task.get("task_id") == task_id:
                found_task = task
                break

        if not found_task:
            return None

        result = await db.execute(
            select(PlanTaskStatus).where(
                PlanTaskStatus.plan_id == plan_id,
                PlanTaskStatus.task_id == task_id,
            )
        )
        status_row = result.scalars().first()
        now = datetime.now(tz=timezone.utc)

        if not status_row:
            status_row = PlanTaskStatus(
                plan_id=plan_id,
                task_id=task_id,
                status=status_normalized,
                done_at=now if status_normalized == "done" else None,
            )
            db.add(status_row)
        else:
            status_row.status = status_normalized
            if status_normalized == "done" and not status_row.done_at:
                status_row.done_at = now
            if status_normalized != "done":
                status_row.done_at = None

        plan_row.updated_at = now
        await db.commit()
        await db.refresh(status_row)

        found_task["status"] = status_row.status
        if status_row.done_at:
            found_task["done_at"] = status_row.done_at.isoformat()
        else:
            found_task.pop("done_at", None)
        return found_task

    async def get_progress(
        self,
        db: AsyncSession,
        plan_id: str,
        user_id: int,
    ) -> dict[str, Any] | None:
        plan = await self.get_plan(db, plan_id, user_id)
        if not plan:
            return None

        total_tasks = 0
        done_tasks = 0
        in_progress_tasks = 0
        total_minutes_done = 0
        day_progress: list[dict[str, Any]] = []

        for day in plan.get("days", []):
            day_total = 0
            day_done = 0
            for task in day.get("tasks", []):
                day_total += 1
                total_tasks += 1
                task_status = str(task.get("status", "todo"))
                if task_status == "done":
                    done_tasks += 1
                    day_done += 1
                    total_minutes_done += int(task.get("estimated_minutes", 0) or 0)
                elif task_status == "in_progress":
                    in_progress_tasks += 1

            percent = int(round((day_done / day_total) * 100)) if day_total else 0
            day_progress.append(
                {
                    "day_index": day.get("day_index"),
                    "title": day.get("title"),
                    "done_tasks": day_done,
                    "total_tasks": day_total,
                    "percent": percent,
                }
            )

        completion_percent = int(round((done_tasks / total_tasks) * 100)) if total_tasks else 0
        return {
            "plan_id": plan_id,
            "completion_percent": completion_percent,
            "done_tasks": done_tasks,
            "in_progress_tasks": in_progress_tasks,
            "total_tasks": total_tasks,
            "completed_minutes": total_minutes_done,
            "estimated_total_minutes": plan.get("estimated_total_minutes", 0),
            "day_progress": day_progress,
            "is_completed": done_tasks == total_tasks and total_tasks > 0,
            "updated_at": plan.get("updated_at"),
        }

    def get_task_catalog(self) -> list[dict[str, Any]]:
        return deepcopy(TASK_CATALOG)

    def get_rfc_template(self) -> str:
        return RFC_TEMPLATE


weekly_plan_service = WeeklyPlanService()


__all__ = [
    "weekly_plan_service",
    "default_week_plan_days",
    "RECOMMENDATION_TASK_MAP",
    "PLAN_STATUS_VALUES",
    "RULESET_VERSION",
    "SCORING_MODEL_VERSION",
    "LLM_TEXT_VERSION",
]
