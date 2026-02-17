from __future__ import annotations

import re
from copy import deepcopy
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.planning import EvidenceItem


def _score_avg(values: dict[str, Any] | None) -> int:
    if not isinstance(values, dict):
        return 0
    nums = [float(v) for v in values.values() if isinstance(v, (int, float))]
    if not nums:
        return 0
    return int(round(sum(nums) / len(nums)))


def _sanitize_snippet(value: str) -> str:
    compact = re.sub(r"\s+", " ", value).strip()
    return compact[:300]


class EvidenceService:
    @staticmethod
    def _build_item(
        evidence_id: str,
        source_type: str,
        locator: dict[str, Any],
        snippet: str,
        confidence: float,
        tags: list[str],
    ) -> dict[str, Any]:
        return {
            "evidence_id": evidence_id,
            "source_type": source_type,
            "locator": locator,
            "snippet": _sanitize_snippet(snippet),
            "confidence": round(max(0.0, min(1.0, confidence)), 2),
            "tags": tags,
        }

    @staticmethod
    def _to_payload(item: EvidenceItem) -> dict[str, Any]:
        return {
            "evidence_id": item.evidence_id,
            "source_type": item.source_type,
            "locator": dict(item.locator_json or {}),
            "snippet": item.snippet,
            "timestamp": item.created_at.isoformat() if item.created_at else None,
            "confidence": item.confidence,
            "tags": list(item.tags_json or []),
        }

    async def register_assessment_evidence(
        self,
        db: AsyncSession,
        user_id: int | None,
        run_id: int,
        scores: dict[str, Any] | None,
        context_data: dict[str, Any] | None,
        recommendations: list[dict[str, Any]] | None,
    ) -> dict[str, list[str]]:
        scores = scores or {}
        context_data = context_data or {}
        recommendations = recommendations or []

        riasec_avg = _score_avg(scores.get("RIASEC"))
        big5_avg = _score_avg(scores.get("BIG5"))
        sjt_avg = _score_avg(scores.get("SJT"))
        cognitive_total = int(
            round(float((scores.get("COGNITIVE") or {}).get("total_score", 0) or 0))
        )

        items = [
            self._build_item(
                evidence_id=f"ev_{run_id}_riasec_avg",
                source_type="quiz",
                locator={"run_id": run_id, "module": "RIASEC"},
                snippet=f"RIASEC average score: {riasec_avg}%",
                confidence=0.78,
                tags=["riasec", "interests"],
            ),
            self._build_item(
                evidence_id=f"ev_{run_id}_big5_avg",
                source_type="quiz",
                locator={"run_id": run_id, "module": "BIG5"},
                snippet=f"BIG5 average score: {big5_avg}%",
                confidence=0.78,
                tags=["big5", "personality"],
            ),
            self._build_item(
                evidence_id=f"ev_{run_id}_sjt_avg",
                source_type="quiz",
                locator={"run_id": run_id, "module": "SJT"},
                snippet=f"SJT average score: {sjt_avg}%",
                confidence=0.74,
                tags=["sjt", "soft_skills"],
            ),
            self._build_item(
                evidence_id=f"ev_{run_id}_cognitive_total",
                source_type="quiz",
                locator={"run_id": run_id, "module": "COGNITIVE"},
                snippet=f"Cognitive total score: {cognitive_total}%",
                confidence=0.82,
                tags=["cognitive"],
            ),
        ]

        if context_data:
            sleep = context_data.get("sleep")
            stress = context_data.get("stress")
            mood = context_data.get("mood")
            items.append(
                self._build_item(
                    evidence_id=f"ev_{run_id}_context",
                    source_type="quiz",
                    locator={"run_id": run_id, "module": "context"},
                    snippet=f"Context factors: sleep={sleep}, stress={stress}, mood={mood}",
                    confidence=0.66,
                    tags=["context"],
                )
            )

        recommendation_refs: list[str] = []
        for idx, rec in enumerate(recommendations[:6], start=1):
            text = str(rec.get("text", "")).strip()
            if not text:
                continue
            evidence_id = f"ev_{run_id}_rec_{idx}"
            recommendation_refs.append(evidence_id)
            items.append(
                self._build_item(
                    evidence_id=evidence_id,
                    source_type="manual",
                    locator={"run_id": run_id, "recommendation_key": rec.get("key")},
                    snippet=text,
                    confidence=0.7,
                    tags=["recommendation"] + [str(tag) for tag in rec.get("tags", [])[:3]],
                )
            )

        for item in items:
            existing = await db.get(EvidenceItem, item["evidence_id"])
            if existing:
                existing.user_id = user_id
                existing.run_id = run_id
                existing.source_type = item["source_type"]
                existing.locator_json = item["locator"]
                existing.snippet = item["snippet"]
                existing.confidence = item["confidence"]
                existing.tags_json = item["tags"]
            else:
                db.add(
                    EvidenceItem(
                        evidence_id=item["evidence_id"],
                        user_id=user_id,
                        run_id=run_id,
                        source_type=item["source_type"],
                        locator_json=item["locator"],
                        snippet=item["snippet"],
                        confidence=item["confidence"],
                        tags_json=item["tags"],
                    )
                )

        await db.commit()

        metric_refs = [
            f"ev_{run_id}_riasec_avg",
            f"ev_{run_id}_big5_avg",
            f"ev_{run_id}_sjt_avg",
            f"ev_{run_id}_cognitive_total",
        ]
        strength_refs = [f"ev_{run_id}_riasec_avg", f"ev_{run_id}_big5_avg"]
        weakness_refs = [f"ev_{run_id}_sjt_avg", f"ev_{run_id}_cognitive_total"]
        if context_data:
            weakness_refs.append(f"ev_{run_id}_context")

        return {
            "summary": metric_refs[:2],
            "strengths": strength_refs,
            "weaknesses": weakness_refs,
            "recommendations": recommendation_refs or metric_refs[:2],
            "metrics": metric_refs,
            "progress": metric_refs[:1],
        }

    async def get_many(
        self,
        db: AsyncSession,
        user_id: int,
        ids: list[str],
    ) -> list[dict[str, Any]]:
        if not ids:
            return []

        limited_ids = ids[:50]
        result = await db.execute(
            select(EvidenceItem).where(
                EvidenceItem.user_id == user_id,
                EvidenceItem.evidence_id.in_(limited_ids),
            )
        )
        rows = list(result.scalars().all())
        by_id = {row.evidence_id: row for row in rows}
        return [
            self._to_payload(by_id[evidence_id])
            for evidence_id in limited_ids
            if evidence_id in by_id
        ]

    async def get_one(
        self,
        db: AsyncSession,
        user_id: int,
        evidence_id: str,
    ) -> dict[str, Any] | None:
        result = await db.execute(
            select(EvidenceItem).where(
                EvidenceItem.evidence_id == evidence_id,
                EvidenceItem.user_id == user_id,
            )
        )
        row = result.scalars().first()
        return deepcopy(self._to_payload(row)) if row else None

    async def get_session_refs(
        self,
        db: AsyncSession,
        user_id: int,
        run_id: int,
    ) -> list[str]:
        result = await db.execute(
            select(EvidenceItem.evidence_id)
            .where(EvidenceItem.user_id == user_id, EvidenceItem.run_id == run_id)
            .order_by(EvidenceItem.evidence_id.asc())
        )
        return [row[0] for row in result.all()]



evidence_service = EvidenceService()
