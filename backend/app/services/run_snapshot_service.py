from __future__ import annotations

import hashlib
import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.planning import AssessmentRunSnapshot
from app.services.versioning import as_dict


def _stable_json_hash(value: dict[str, Any]) -> str:
    canonical = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class RunSnapshotService:
    async def upsert_snapshot(
        self,
        db: AsyncSession,
        run_id: int,
        user_id: int | None,
        input_payload: dict[str, Any],
        overall_score: int,
        confidence: float,
    ) -> dict[str, Any]:
        input_hash = _stable_json_hash(input_payload)

        row = await db.get(AssessmentRunSnapshot, run_id)
        versions = as_dict()
        if row:
            row.user_id = user_id
            row.input_hash = input_hash
            row.versions_json = versions
            row.overall_score = overall_score
            row.confidence = confidence
        else:
            row = AssessmentRunSnapshot(
                run_id=run_id,
                user_id=user_id,
                input_hash=input_hash,
                versions_json=versions,
                overall_score=overall_score,
                confidence=confidence,
            )
            db.add(row)

        await db.commit()
        return {
            "run_id": run_id,
            "input_hash": input_hash,
            "versions": versions,
        }


run_snapshot_service = RunSnapshotService()
