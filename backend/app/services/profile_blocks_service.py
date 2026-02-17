from __future__ import annotations

from statistics import mean
from typing import Any

from app.services.versioning import as_dict


def _round_score(value: float | int | None) -> int:
    if value is None:
        return 0
    try:
        return int(round(float(value)))
    except Exception:
        return 0


def _score_level(score: int) -> str:
    if score >= 80:
        return "Advanced"
    if score >= 65:
        return "Intermediate+"
    if score >= 50:
        return "Intermediate"
    return "Beginner"


def _status_from_score(score: int) -> str:
    if score >= 75:
        return "good"
    if score >= 55:
        return "medium"
    return "risk"


def _average_from_mapping(values: dict[str, Any] | None) -> int:
    if not isinstance(values, dict):
        return 0
    numeric_values = [
        _round_score(value)
        for value in values.values()
        if isinstance(value, (int, float))
    ]
    if not numeric_values:
        return 0
    return _round_score(mean(numeric_values))


def compute_readiness_score(scores: dict[str, Any] | None) -> int:
    if not isinstance(scores, dict):
        return 0

    parts: list[int] = []
    riasec_avg = _average_from_mapping(scores.get("RIASEC"))
    big5_avg = _average_from_mapping(scores.get("BIG5"))
    sjt_avg = _average_from_mapping(scores.get("SJT"))
    cognitive_total = _round_score((scores.get("COGNITIVE") or {}).get("total_score"))

    if riasec_avg > 0:
        parts.append(riasec_avg)
    if big5_avg > 0:
        parts.append(big5_avg)
    if sjt_avg > 0:
        parts.append(sjt_avg)
    if cognitive_total > 0:
        parts.append(cognitive_total)

    if not parts:
        return 0
    return _round_score(mean(parts))


class ProfileBlocksService:
    _SKILL_LABELS: dict[str, str] = {
        "processing_speed": "Processing speed",
        "working_memory": "Working memory",
        "attention": "Attention control",
        "logic": "Logic",
        "math": "Math reasoning",
        "teamwork": "Teamwork",
        "stress": "Stress tolerance",
        "initiative": "Initiative",
        "self_organization": "Self-organization",
        "learning_strategy": "Learning strategy",
    }

    _METRIC_EXPLAINERS: dict[str, str] = {
        "readiness_score": "Estimated readiness for target role/level based on latest assessment modules.",
        "confidence": "How complete and consistent the available signals are.",
        "cognitive_score": "Composite of speed, memory, attention and logic tasks.",
        "soft_skills_score": "Behavioral score from situational judgement responses.",
    }

    @classmethod
    def _skill_label(cls, raw_key: str) -> str:
        if raw_key in cls._SKILL_LABELS:
            return cls._SKILL_LABELS[raw_key]
        return raw_key.replace("_", " ").title()

    @staticmethod
    def _build_skill_note(score: int, label: str, target_score: int) -> str:
        if score >= target_score:
            return f"You are above target in {label}."
        gap = target_score - score
        if gap <= 10:
            return f"You are near target in {label}. Focused practice should close the gap."
        return f"{label} is below target. Prioritize it for the highest growth impact."

    @staticmethod
    def _build_progress_items(progress: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
        if not progress:
            return []
        items: list[dict[str, Any]] = []
        for event in progress:
            date = str(event.get("date", "")).strip()
            label = str(event.get("label", "")).strip()
            delta = _round_score(event.get("delta"))
            if not date and not label:
                continue
            items.append(
                {
                    "date": date,
                    "label": label or "Assessment run",
                    "delta": delta,
                }
            )
        return items

    @staticmethod
    def _bucket_id_by_week(week: int) -> str:
        if week <= 1:
            return "quick_wins"
        if week <= 3:
            return "core_upgrades"
        return "long_term"

    @staticmethod
    def _bucket_title(bucket_id: str) -> str:
        if bucket_id == "quick_wins":
            return "Quick wins (1-3 days)"
        if bucket_id == "core_upgrades":
            return "Core upgrades (1-3 weeks)"
        return "Long-term (1-2 months)"

    @staticmethod
    def _effort_for_bucket(bucket_id: str) -> str:
        if bucket_id == "quick_wins":
            return "S"
        if bucket_id == "core_upgrades":
            return "M"
        return "L"

    @staticmethod
    def _impact_for_bucket(bucket_id: str) -> int:
        if bucket_id == "quick_wins":
            return 16
        if bucket_id == "core_upgrades":
            return 24
        return 14

    def build_dashboard(
        self,
        session_id: int,
        scores: dict[str, Any] | None,
        recommendations: list[dict[str, Any]] | None,
        ai_insights: dict[str, Any] | None,
        target_role: str,
        target_level: str,
        progress: list[dict[str, Any]] | None = None,
        evidence_refs: dict[str, list[str]] | None = None,
    ) -> dict[str, Any]:
        scores = scores or {}
        recommendations = recommendations or []
        ai_insights = ai_insights or {}
        evidence_refs = evidence_refs or {}
        target_level_normalized = (target_level or "Senior").strip() or "Senior"

        target_baseline = 75 if target_level_normalized.lower() == "senior" else 65

        riasec_avg = _average_from_mapping(scores.get("RIASEC"))
        big5_avg = _average_from_mapping(scores.get("BIG5"))
        cognitive_total = _round_score((scores.get("COGNITIVE") or {}).get("total_score"))
        sjt_avg = _average_from_mapping(scores.get("SJT"))
        readiness_score = compute_readiness_score(scores)

        confidence = 0.55
        if ai_insights:
            confidence += 0.12
        if recommendations:
            confidence += 0.05
        confidence += min(len((scores.get("COGNITIVE") or {}).get("details", {}) or {}), 5) * 0.03
        confidence = max(0.45, min(0.95, confidence))

        skill_items: list[dict[str, Any]] = []

        cognitive_details = (scores.get("COGNITIVE") or {}).get("details") or {}
        if isinstance(cognitive_details, dict):
            for raw_key, value in cognitive_details.items():
                skill_score = _round_score(value)
                label = self._skill_label(str(raw_key))
                skill_items.append(
                    {
                        "skill_id": str(raw_key),
                        "label": label,
                        "score": skill_score,
                        "level": _score_level(skill_score),
                        "target_hint": f"Typical {target_level_normalized} level: {target_baseline}%",
                        "status": _status_from_score(skill_score),
                        "ai_note": self._build_skill_note(skill_score, label, target_baseline),
                        "cta": {
                            "text": "Generate tasks",
                            "action": "open_skill_plan",
                            "params": {"skill_id": str(raw_key)},
                        },
                    }
                )

        sjt_scores = scores.get("SJT") or {}
        if isinstance(sjt_scores, dict):
            for raw_key, value in sjt_scores.items():
                skill_score = _round_score(value)
                label = self._skill_label(str(raw_key))
                skill_items.append(
                    {
                        "skill_id": str(raw_key),
                        "label": label,
                        "score": skill_score,
                        "level": _score_level(skill_score),
                        "target_hint": f"Typical {target_level_normalized} level: {target_baseline}%",
                        "status": _status_from_score(skill_score),
                        "ai_note": self._build_skill_note(skill_score, label, target_baseline),
                        "cta": {
                            "text": "Generate tasks",
                            "action": "open_skill_plan",
                            "params": {"skill_id": str(raw_key)},
                        },
                    }
                )

        skill_items.sort(key=lambda item: item["score"], reverse=True)
        top_skill = skill_items[0] if skill_items else None
        low_skill = skill_items[-1] if skill_items else None

        summary_bullets = []
        strengths = ai_insights.get("strengths") or []
        growth_areas = ai_insights.get("growth_areas") or []
        next_steps = ai_insights.get("next_steps") or []

        if top_skill:
            summary_bullets.append(f"Best area: {top_skill['label']} ({top_skill['score']}%)")
        if low_skill:
            summary_bullets.append(
                f"Biggest gap: {low_skill['label']} ({low_skill['score']}%)"
            )
        if next_steps:
            summary_bullets.append(f"Highest leverage: {next_steps[0]}")
        elif growth_areas:
            summary_bullets.append(f"Highest leverage: {growth_areas[0]}")

        if len(summary_bullets) < 3 and strengths:
            summary_bullets.append(str(strengths[0]))
        summary_bullets = summary_bullets[:3]

        analysis_strengths = [str(item) for item in strengths[:3]] or (
            [f"Strongest skill right now: {top_skill['label']}"] if top_skill else []
        )
        analysis_weaknesses = [str(item) for item in growth_areas[:3]] or (
            [f"Main growth zone: {low_skill['label']}"] if low_skill else []
        )
        analysis_recommendations = [str(item) for item in next_steps[:3]]
        if not analysis_recommendations:
            analysis_recommendations = [str(item.get("text", "")).strip() for item in recommendations[:3]]
            analysis_recommendations = [item for item in analysis_recommendations if item]

        insight_items = []
        if analysis_strengths:
            insight_items.append(
                {
                    "severity": "info",
                    "text_short": analysis_strengths[0],
                    "why": "Strong signals in recent assessment scores.",
                    "evidence_refs": evidence_refs.get("strengths", []),
                }
            )
        if analysis_weaknesses:
            insight_items.append(
                {
                    "severity": "warn",
                    "text_short": analysis_weaknesses[0],
                    "why": "This area is below target baseline for desired level.",
                    "evidence_refs": evidence_refs.get("weaknesses", []),
                }
            )
        if analysis_recommendations:
            insight_items.append(
                {
                    "severity": "info",
                    "text_short": analysis_recommendations[0],
                    "why": "High-impact action selected from rule-based recommendations.",
                    "evidence_refs": evidence_refs.get("recommendations", []),
                }
            )

        radar_axes = []
        for item in skill_items[:6]:
            radar_axes.append(
                {
                    "id": item["skill_id"],
                    "label": item["label"],
                    "value": item["score"],
                }
            )
        if not radar_axes:
            radar_axes = [
                {"id": "riasec", "label": "Interests", "value": riasec_avg},
                {"id": "big5", "label": "Personality", "value": big5_avg},
                {"id": "cognitive", "label": "Cognitive", "value": cognitive_total},
                {"id": "sjt", "label": "Soft skills", "value": sjt_avg},
            ]

        radar_benchmark_values = {
            axis["id"]: target_baseline for axis in radar_axes
        }

        recommendation_buckets: dict[str, list[dict[str, Any]]] = {
            "quick_wins": [],
            "core_upgrades": [],
            "long_term": [],
        }
        for rec in recommendations:
            week = _round_score(rec.get("week") or 1)
            week = 1 if week <= 0 else week
            bucket_id = self._bucket_id_by_week(week)
            rec_key = str(rec.get("key", f"rec_{len(recommendation_buckets[bucket_id]) + 1}"))
            text = str(rec.get("text", "")).strip()
            tags = rec.get("tags") or []
            tag_list = [str(tag).strip() for tag in tags if str(tag).strip()]
            if not text:
                continue
            recommendation_buckets[bucket_id].append(
                {
                    "rec_id": rec_key,
                    "title": text,
                    "impact": self._impact_for_bucket(bucket_id),
                    "effort": self._effort_for_bucket(bucket_id),
                    "rationale": ", ".join(tag_list) if tag_list else "Personalized recommendation",
                    "estimated_impact": (
                        "High impact on readiness"
                        if bucket_id != "long_term"
                        else "Long-term compounding impact"
                    ),
                    "evidence_refs": evidence_refs.get("recommendations", []),
                    "cta": {
                        "text": "Add to plan",
                        "action": "add_to_plan",
                        "params": {"rec_id": rec_key},
                    },
                }
            )

        recommendation_bucket_items = []
        for bucket_id in ("quick_wins", "core_upgrades", "long_term"):
            items = recommendation_buckets[bucket_id]
            if not items:
                continue
            recommendation_bucket_items.append(
                {
                    "bucket_id": bucket_id,
                    "title": self._bucket_title(bucket_id),
                    "items": items[:6],
                }
            )

        progress_items = self._build_progress_items(progress)

        return {
            "run_id": f"session_{session_id}",
            "model_version": "rules_v1.1+ai-insights-v1",
            "versions": as_dict(),
            "overall": {
                "readiness_score": readiness_score,
                "target_role": target_role,
                "target_level": target_level_normalized,
                "confidence": round(confidence, 2),
            },
            "blocks": [
                {
                    "block_id": "verdict",
                    "type": "summary_card",
                    "title": "AI Verdict",
                    "content": {
                        "headline": (
                            str(ai_insights.get("summary", "")).strip()
                            or (
                                f"Strong trajectory for {target_role}. "
                                f"Focus areas can unlock {target_level_normalized} readiness."
                            )
                        ),
                        "bullets": summary_bullets,
                        "cta": {
                            "text": "Start 7-day plan",
                            "action": "open_plan",
                            "params": {"mode": "week"},
                        },
                    },
                },
                {
                    "block_id": "analysis",
                    "type": "analysis_card",
                    "title": "AI Analysis",
                    "content": {
                        "strengths": analysis_strengths,
                        "weaknesses": analysis_weaknesses,
                        "recommendations": analysis_recommendations,
                    },
                },
                {
                    "block_id": "insights",
                    "type": "insight_list",
                    "title": "Key Insights",
                    "content": {
                        "items": insight_items,
                    },
                },
                {
                    "block_id": "radar",
                    "type": "radar",
                    "title": "Capability Map",
                    "content": {
                        "axes": radar_axes,
                        "benchmark": {
                            "label": f"{target_level_normalized} baseline",
                            "values": radar_benchmark_values,
                        },
                        "ai_note": (
                            f"Strongest area: {top_skill['label']}."
                            if top_skill
                            else "Use this map to prioritize the biggest gap first."
                        )
                        + (
                            f" Biggest growth unlock: {low_skill['label']}."
                            if low_skill
                            else ""
                        ),
                    },
                },
                {
                    "block_id": "skills",
                    "type": "skill_bars",
                    "title": "Skills",
                    "content": {"items": skill_items[:10]},
                },
                {
                    "block_id": "metrics",
                    "type": "metrics",
                    "title": "Key Metrics",
                    "content": {
                        "items": [
                            {
                                "metric_id": "readiness_score",
                                "label": "Readiness",
                                "value": readiness_score,
                                "status": _status_from_score(readiness_score),
                                "hint": self._METRIC_EXPLAINERS["readiness_score"],
                                "evidence_refs": evidence_refs.get("metrics", []),
                            },
                            {
                                "metric_id": "confidence",
                                "label": "Confidence",
                                "value": _round_score(confidence * 100),
                                "status": _status_from_score(_round_score(confidence * 100)),
                                "hint": self._METRIC_EXPLAINERS["confidence"],
                                "evidence_refs": evidence_refs.get("metrics", []),
                            },
                            {
                                "metric_id": "cognitive_score",
                                "label": "Cognitive",
                                "value": cognitive_total,
                                "status": _status_from_score(cognitive_total),
                                "hint": self._METRIC_EXPLAINERS["cognitive_score"],
                                "evidence_refs": evidence_refs.get("metrics", []),
                            },
                            {
                                "metric_id": "soft_skills_score",
                                "label": "Soft skills",
                                "value": sjt_avg,
                                "status": _status_from_score(sjt_avg),
                                "hint": self._METRIC_EXPLAINERS["soft_skills_score"],
                                "evidence_refs": evidence_refs.get("metrics", []),
                            },
                        ]
                    },
                },
                {
                    "block_id": "recommendations",
                    "type": "recommendation_buckets",
                    "title": "Recommendations",
                    "content": {"buckets": recommendation_bucket_items},
                },
                {
                    "block_id": "progress",
                    "type": "progress_timeline",
                    "title": "Progress",
                    "content": {
                        "ai_note": "Weekly deltas keep your profile alive and measurable.",
                        "items": progress_items,
                        "evidence_refs": evidence_refs.get("progress", []),
                    },
                },
                {
                    "block_id": "action",
                    "type": "action_card",
                    "title": "Next Best Action",
                    "content": {
                        "headline": "Generate growth plan",
                        "description": "Build a personalized plan for your weakest areas with estimated impact.",
                        "cta": {
                            "text": "Improve my weak areas",
                            "action": "open_plan",
                            "params": {"mode": "impact"},
                        },
                    },
                },
            ],
            "explainers": self._METRIC_EXPLAINERS,
        }


profile_blocks_service = ProfileBlocksService()
