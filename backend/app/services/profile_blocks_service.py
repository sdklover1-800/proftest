from __future__ import annotations

from statistics import mean
from typing import Any

from app.services.psychometrics_service import compute_adjusted_readiness
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
    _SKILL_LABELS: dict[str, dict[str, str]] = {
        "en": {
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
        },
        "ru": {
            "processing_speed": "Скорость обработки",
            "working_memory": "Рабочая память",
            "attention": "Контроль внимания",
            "logic": "Логика",
            "math": "Математическое мышление",
            "teamwork": "Командная работа",
            "stress": "Стрессоустойчивость",
            "initiative": "Инициативность",
            "self_organization": "Самоорганизация",
            "learning_strategy": "Стратегия обучения",
        },
        "kz": {
            "processing_speed": "Өңдеу жылдамдығы",
            "working_memory": "Жұмыс жады",
            "attention": "Назарды бақылау",
            "logic": "Логика",
            "math": "Математикалық ойлау",
            "teamwork": "Командалық жұмыс",
            "stress": "Стресске төзімділік",
            "initiative": "Бастамашылдық",
            "self_organization": "Өзін-өзі ұйымдастыру",
            "learning_strategy": "Оқу стратегиясы",
        },
    }

    _I18N: dict[str, dict[str, str]] = {
        "en": {
            "level_advanced": "Advanced",
            "level_intermediate_plus": "Intermediate+",
            "level_intermediate": "Intermediate",
            "level_beginner": "Beginner",
            "target_hint": "Typical {level} level: {score}%",
            "skill_note_above": "You are above target in {label}.",
            "skill_note_near": "You are near target in {label}. Focused practice should close the gap.",
            "skill_note_below": "{label} is below target. Prioritize it for the highest growth impact.",
            "cta_generate_tasks": "Generate tasks",
            "summary_best_area": "Best area: {label} ({score}%)",
            "summary_biggest_gap": "Biggest gap: {label} ({score}%)",
            "summary_highest_leverage": "Highest leverage: {text}",
            "analysis_strongest_skill": "Strongest skill right now: {label}",
            "analysis_main_growth": "Main growth zone: {label}",
            "insight_why_strength": "Strong signals in recent assessment scores.",
            "insight_why_weakness": "This area is below target baseline for desired level.",
            "insight_why_recommendation": "High-impact action selected from rule-based recommendations.",
            "radar_interests": "Interests",
            "radar_personality": "Personality",
            "radar_cognitive": "Cognitive",
            "radar_soft_skills": "Soft skills",
            "baseline_label": "{level} baseline",
            "radar_note_default": "Use this map to prioritize the biggest gap first.",
            "radar_note_strongest": "Strongest area: {label}.",
            "radar_note_unlock": " Biggest growth unlock: {label}.",
            "bucket_quick_wins": "Quick wins (1-3 days)",
            "bucket_core_upgrades": "Core upgrades (1-3 weeks)",
            "bucket_long_term": "Long-term (1-2 months)",
            "recommendation_fallback_title": "Priority recommendation #{index}",
            "rationale_default": "Personalized recommendation",
            "impact_high": "High impact on readiness",
            "impact_long": "Long-term compounding impact",
            "cta_add_to_plan": "Add to plan",
            "verdict_title": "AI Verdict",
            "verdict_fallback": "Strong trajectory for {role}. Focus areas can unlock {level} readiness.",
            "cta_start_plan": "Start 7-day plan",
            "analysis_title": "AI Analysis",
            "insights_title": "Key Insights",
            "radar_title": "Capability Map",
            "skills_title": "Skills",
            "metrics_title": "Key Metrics",
            "metrics_readiness": "Readiness",
            "metrics_confidence": "Confidence",
            "metrics_cognitive": "Cognitive",
            "metrics_soft_skills": "Soft skills",
            "metrics_stability": "Stability",
            "metric_hint_readiness": "Estimated readiness for target role/level based on latest assessment modules.",
            "metric_hint_confidence": "How complete and consistent the available signals are.",
            "metric_hint_cognitive": "Composite of speed, memory, attention and logic tasks.",
            "metric_hint_soft_skills": "Behavioral score from situational judgement responses.",
            "metric_hint_stability": "How stable your profile remains across recent completed assessments.",
            "recommendations_title": "Recommendations",
            "progress_title": "Progress",
            "progress_note": "Weekly deltas keep your profile alive and measurable.",
            "action_title": "Next Best Action",
            "action_headline": "Generate growth plan",
            "action_description": "Build a personalized plan for your weakest areas with estimated impact.",
            "action_cta": "Improve my weak areas",
            "assessment_run": "Assessment run",
        },
        "ru": {
            "level_advanced": "Продвинутый",
            "level_intermediate_plus": "Уверенный средний",
            "level_intermediate": "Средний",
            "level_beginner": "Начальный",
            "target_hint": "Типичный уровень {level}: {score}%",
            "skill_note_above": "Вы выше целевого уровня по навыку «{label}».",
            "skill_note_near": "Вы близки к целевому уровню по навыку «{label}». Точечная практика закроет разрыв.",
            "skill_note_below": "Навык «{label}» ниже целевого. Это приоритетная зона роста.",
            "cta_generate_tasks": "Сгенерировать задачи",
            "summary_best_area": "Сильная сторона: {label} ({score}%)",
            "summary_biggest_gap": "Основной разрыв: {label} ({score}%)",
            "summary_highest_leverage": "Наибольший эффект: {text}",
            "analysis_strongest_skill": "Самый сильный навык сейчас: {label}",
            "analysis_main_growth": "Главная зона роста: {label}",
            "insight_why_strength": "Сильные сигналы в последних результатах оценки.",
            "insight_why_weakness": "Показатель ниже целевой планки для выбранного уровня.",
            "insight_why_recommendation": "Высокоэффективное действие из рекомендаций.",
            "radar_interests": "Интересы",
            "radar_personality": "Личность",
            "radar_cognitive": "Когнитивные",
            "radar_soft_skills": "Софт-скиллы",
            "baseline_label": "Базовый уровень {level}",
            "radar_note_default": "Используйте карту, чтобы приоритизировать самый большой разрыв.",
            "radar_note_strongest": "Самая сильная зона: {label}.",
            "radar_note_unlock": " Главный рычаг роста: {label}.",
            "bucket_quick_wins": "Быстрые шаги (1-3 дня)",
            "bucket_core_upgrades": "Ключевые улучшения (1-3 недели)",
            "bucket_long_term": "Долгосрочно (1-2 месяца)",
            "recommendation_fallback_title": "Приоритетная рекомендация №{index}",
            "rationale_default": "Персональная рекомендация",
            "impact_high": "Высокое влияние на готовность",
            "impact_long": "Долгосрочный накопительный эффект",
            "cta_add_to_plan": "Добавить в план",
            "verdict_title": "Вердикт ИИ",
            "verdict_fallback": "Хорошая траектория для роли {role}. Фокусные зоны помогут выйти на уровень {level}.",
            "cta_start_plan": "Запустить план на 7 дней",
            "analysis_title": "AI Анализ",
            "insights_title": "Ключевые инсайты",
            "radar_title": "Карта компетенций",
            "skills_title": "Навыки",
            "metrics_title": "Ключевые метрики",
            "metrics_readiness": "Готовность",
            "metrics_confidence": "Надежность",
            "metrics_cognitive": "Когнитивные",
            "metrics_soft_skills": "Софт-скиллы",
            "metrics_stability": "Стабильность",
            "metric_hint_readiness": "Оценка готовности к целевой роли и уровню по последним модулям.",
            "metric_hint_confidence": "Насколько полны и согласованы доступные сигналы.",
            "metric_hint_cognitive": "Сводный результат по скорости, памяти, вниманию и логике.",
            "metric_hint_soft_skills": "Поведенческий результат на основе situational judgement.",
            "metric_hint_stability": "Насколько стабильно профиль сохраняется в последних завершенных оценках.",
            "recommendations_title": "Рекомендации",
            "progress_title": "Прогресс",
            "progress_note": "Еженедельные изменения делают профиль живым и измеримым.",
            "action_title": "Следующее лучшее действие",
            "action_headline": "Сформировать план роста",
            "action_description": "Постройте персональный план по слабым зонам с ожидаемым эффектом.",
            "action_cta": "Улучшить слабые зоны",
            "assessment_run": "Оценка",
        },
        "kz": {
            "level_advanced": "Жоғары",
            "level_intermediate_plus": "Ортадан жоғары",
            "level_intermediate": "Орта",
            "level_beginner": "Бастапқы",
            "target_hint": "{level} үшін әдеттегі деңгей: {score}%",
            "skill_note_above": "\"{label}\" дағдысы бойынша сіз мақсаттан жоғарысыз.",
            "skill_note_near": "\"{label}\" дағдысы бойынша мақсатқа жақынсыз. Нақты тәжірибе айырманы жабады.",
            "skill_note_below": "\"{label}\" дағдысы мақсаттан төмен. Бұл өсу үшін басты бағыт.",
            "cta_generate_tasks": "Тапсырма құру",
            "summary_best_area": "Күшті аймақ: {label} ({score}%)",
            "summary_biggest_gap": "Негізгі алшақтық: {label} ({score}%)",
            "summary_highest_leverage": "Ең жоғары әсер: {text}",
            "analysis_strongest_skill": "Қазір ең мықты дағды: {label}",
            "analysis_main_growth": "Негізгі өсу аймағы: {label}",
            "insight_why_strength": "Соңғы бағалау нәтижелерінде күшті сигналдар бар.",
            "insight_why_weakness": "Бұл аймақ таңдалған деңгейдің мақсатынан төмен.",
            "insight_why_recommendation": "Жоғары әсер беретін әрекет ұсыныстардан таңдалды.",
            "radar_interests": "Қызығушылықтар",
            "radar_personality": "Тұлға",
            "radar_cognitive": "Когнитивтік",
            "radar_soft_skills": "Икемді дағдылар",
            "baseline_label": "{level} базалық деңгейі",
            "radar_note_default": "Ең үлкен алшақтықты басымдыққа қою үшін картаны пайдаланыңыз.",
            "radar_note_strongest": "Ең мықты аймақ: {label}.",
            "radar_note_unlock": " Негізгі өсу драйвері: {label}.",
            "bucket_quick_wins": "Жылдам қадамдар (1-3 күн)",
            "bucket_core_upgrades": "Негізгі жақсартулар (1-3 апта)",
            "bucket_long_term": "Ұзақ мерзім (1-2 ай)",
            "recommendation_fallback_title": "Басым ұсыныс №{index}",
            "rationale_default": "Жеке ұсыныс",
            "impact_high": "Дайындыққа жоғары әсер",
            "impact_long": "Ұзақ мерзімді жинақталатын әсер",
            "cta_add_to_plan": "Жоспарға қосу",
            "verdict_title": "AI Қорытынды",
            "verdict_fallback": "{role} бағыты бойынша траектория жақсы. Фокус аймақтары {level} деңгейіне жеткізеді.",
            "cta_start_plan": "7 күндік жоспарды бастау",
            "analysis_title": "AI Талдау",
            "insights_title": "Негізгі инсайттар",
            "radar_title": "Қабілет картасы",
            "skills_title": "Дағдылар",
            "metrics_title": "Негізгі метрикалар",
            "metrics_readiness": "Дайындық",
            "metrics_confidence": "Сенімділік",
            "metrics_cognitive": "Когнитивтік",
            "metrics_soft_skills": "Икемді дағдылар",
            "metrics_stability": "Тұрақтылық",
            "metric_hint_readiness": "Соңғы модульдер негізінде рөл/деңгейге дайындық бағасы.",
            "metric_hint_confidence": "Сигналдардың толықтығы мен бірізділігі.",
            "metric_hint_cognitive": "Жылдамдық, жады, назар және логика бойынша жиынтық нәтиже.",
            "metric_hint_soft_skills": "Жағдаяттық пайымдау жауаптарына негізделген мінез-құлық нәтижесі.",
            "metric_hint_stability": "Соңғы аяқталған бағалауларда профиліңіздің қаншалықты тұрақты екенін көрсетеді.",
            "recommendations_title": "Ұсыныстар",
            "progress_title": "Прогресс",
            "progress_note": "Апталық өзгерістер профиліңізді «тірі» және өлшенетін етеді.",
            "action_title": "Келесі ең жақсы әрекет",
            "action_headline": "Өсу жоспарын құру",
            "action_description": "Әлсіз аймақтарға арналған жеке жоспарды күтілетін әсерімен жасаңыз.",
            "action_cta": "Әлсіз аймақтарды жақсарту",
            "assessment_run": "Бағалау",
        },
    }

    @classmethod
    def _normalize_lang(cls, lang: str | None) -> str:
        if not lang:
            return "en"
        normalized = lang.strip().split("-")[0].lower()
        if normalized in {"ru", "kz", "en"}:
            return normalized
        return "en"

    @classmethod
    def _t(cls, lang: str, key: str) -> str:
        return cls._I18N.get(lang, cls._I18N["en"]).get(key, cls._I18N["en"].get(key, key))

    @classmethod
    def _score_level(cls, score: int, lang: str) -> str:
        if score >= 80:
            return cls._t(lang, "level_advanced")
        if score >= 65:
            return cls._t(lang, "level_intermediate_plus")
        if score >= 50:
            return cls._t(lang, "level_intermediate")
        return cls._t(lang, "level_beginner")

    @classmethod
    def _skill_label(cls, raw_key: str, lang: str) -> str:
        localized = cls._SKILL_LABELS.get(lang, {}).get(raw_key)
        if localized:
            return localized
        english = cls._SKILL_LABELS["en"].get(raw_key)
        if english:
            return english
        return raw_key.replace("_", " ").title()

    @classmethod
    def _build_skill_note(cls, score: int, label: str, target_score: int, lang: str) -> str:
        if score >= target_score:
            return cls._t(lang, "skill_note_above").format(label=label)
        gap = target_score - score
        if gap <= 10:
            return cls._t(lang, "skill_note_near").format(label=label)
        return cls._t(lang, "skill_note_below").format(label=label)

    @classmethod
    def _build_progress_items(cls, progress: list[dict[str, Any]] | None, lang: str) -> list[dict[str, Any]]:
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
                    "label": label or cls._t(lang, "assessment_run"),
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

    @classmethod
    def _bucket_title(cls, bucket_id: str, lang: str) -> str:
        if bucket_id == "quick_wins":
            return cls._t(lang, "bucket_quick_wins")
        if bucket_id == "core_upgrades":
            return cls._t(lang, "bucket_core_upgrades")
        return cls._t(lang, "bucket_long_term")

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

    @classmethod
    def _metric_explainers(cls, lang: str) -> dict[str, str]:
        return {
            "readiness_score": cls._t(lang, "metric_hint_readiness"),
            "confidence": cls._t(lang, "metric_hint_confidence"),
            "cognitive_score": cls._t(lang, "metric_hint_cognitive"),
            "soft_skills_score": cls._t(lang, "metric_hint_soft_skills"),
            "stability_score": cls._t(lang, "metric_hint_stability"),
        }

    def build_dashboard(
        self,
        session_id: int,
        scores: dict[str, Any] | None,
        recommendations: list[dict[str, Any]] | None,
        ai_insights: dict[str, Any] | None,
        target_role: str,
        target_level: str,
        lang: str | None = None,
        progress: list[dict[str, Any]] | None = None,
        evidence_refs: dict[str, list[str]] | None = None,
    ) -> dict[str, Any]:
        lang_code = self._normalize_lang(lang)
        scores = scores or {}
        recommendations = recommendations or []
        ai_insights = ai_insights or {}
        evidence_refs = evidence_refs or {}
        metric_explainers = self._metric_explainers(lang_code)
        target_level_normalized = (target_level or "Senior").strip() or "Senior"

        target_baseline = 75 if target_level_normalized.lower() == "senior" else 65

        riasec_avg = _average_from_mapping(scores.get("RIASEC"))
        big5_avg = _average_from_mapping(scores.get("BIG5"))
        cognitive_total = _round_score((scores.get("COGNITIVE") or {}).get("total_score"))
        sjt_avg = _average_from_mapping(scores.get("SJT"))
        raw_readiness_score = compute_readiness_score(scores)

        quality_payload = scores.get("QUALITY") or {}
        if not isinstance(quality_payload, dict):
            quality_payload = {}
        stability_score = _round_score(quality_payload.get("stability_score"))
        quality_confidence = _round_score(quality_payload.get("measurement_confidence"))

        readiness_score = compute_adjusted_readiness(
            raw_readiness_score,
            float(stability_score) if stability_score > 0 else None,
        )

        if quality_confidence > 0:
            confidence = max(0.30, min(0.98, quality_confidence / 100.0))
        else:
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
                label = self._skill_label(str(raw_key), lang_code)
                skill_items.append(
                    {
                        "skill_id": str(raw_key),
                        "label": label,
                        "score": skill_score,
                        "level": self._score_level(skill_score, lang_code),
                        "target_hint": self._t(lang_code, "target_hint").format(
                            level=target_level_normalized,
                            score=target_baseline,
                        ),
                        "status": _status_from_score(skill_score),
                        "ai_note": self._build_skill_note(
                            skill_score,
                            label,
                            target_baseline,
                            lang_code,
                        ),
                        "cta": {
                            "text": self._t(lang_code, "cta_generate_tasks"),
                            "action": "open_skill_plan",
                            "params": {"skill_id": str(raw_key)},
                        },
                    }
                )

        sjt_scores = scores.get("SJT") or {}
        if isinstance(sjt_scores, dict):
            for raw_key, value in sjt_scores.items():
                skill_score = _round_score(value)
                label = self._skill_label(str(raw_key), lang_code)
                skill_items.append(
                    {
                        "skill_id": str(raw_key),
                        "label": label,
                        "score": skill_score,
                        "level": self._score_level(skill_score, lang_code),
                        "target_hint": self._t(lang_code, "target_hint").format(
                            level=target_level_normalized,
                            score=target_baseline,
                        ),
                        "status": _status_from_score(skill_score),
                        "ai_note": self._build_skill_note(
                            skill_score,
                            label,
                            target_baseline,
                            lang_code,
                        ),
                        "cta": {
                            "text": self._t(lang_code, "cta_generate_tasks"),
                            "action": "open_skill_plan",
                            "params": {"skill_id": str(raw_key)},
                        },
                    }
                )

        skill_items.sort(key=lambda item: item["score"], reverse=True)
        top_skill = skill_items[0] if skill_items else None
        low_skill = skill_items[-1] if skill_items else None

        summary_bullets = []
        strengths = [
            str(item).strip()
            for item in (ai_insights.get("strengths") or [])
            if str(item).strip()
        ]
        growth_areas = [
            str(item).strip()
            for item in (ai_insights.get("growth_areas") or [])
            if str(item).strip()
        ]
        next_steps = [
            str(item).strip()
            for item in (ai_insights.get("next_steps") or [])
            if str(item).strip()
        ]

        localized_rec_candidates: list[str] = []
        weekly_plan = ai_insights.get("weekly_plan") or []
        if isinstance(weekly_plan, list):
            for week_item in weekly_plan:
                if not isinstance(week_item, dict):
                    continue
                tasks = week_item.get("tasks") or []
                if not isinstance(tasks, list):
                    continue
                for task_item in tasks:
                    if not isinstance(task_item, dict):
                        continue
                    task_text = str(task_item.get("task", "")).strip()
                    if task_text and task_text not in localized_rec_candidates:
                        localized_rec_candidates.append(task_text)

        for step in next_steps:
            if step and step not in localized_rec_candidates:
                localized_rec_candidates.append(step)

        if top_skill:
            summary_bullets.append(
                self._t(lang_code, "summary_best_area").format(
                    label=top_skill["label"],
                    score=top_skill["score"],
                )
            )
        if low_skill:
            summary_bullets.append(
                self._t(lang_code, "summary_biggest_gap").format(
                    label=low_skill["label"],
                    score=low_skill["score"],
                )
            )
        if next_steps:
            summary_bullets.append(
                self._t(lang_code, "summary_highest_leverage").format(
                    text=next_steps[0],
                )
            )
        elif growth_areas:
            summary_bullets.append(
                self._t(lang_code, "summary_highest_leverage").format(
                    text=growth_areas[0],
                )
            )

        if len(summary_bullets) < 3 and strengths:
            summary_bullets.append(str(strengths[0]))
        summary_bullets = summary_bullets[:3]

        analysis_strengths: list[str] = []
        if top_skill:
            analysis_strengths.append(
                self._t(lang_code, "summary_best_area").format(
                    label=top_skill["label"],
                    score=top_skill["score"],
                )
            )
        if top_skill and len(analysis_strengths) < 2:
            analysis_strengths.append(
                self._t(lang_code, "analysis_strongest_skill").format(
                    label=top_skill["label"],
                )
            )
        for item in strengths:
            if item and item not in analysis_strengths:
                analysis_strengths.append(str(item))
            if len(analysis_strengths) >= 3:
                break

        analysis_weaknesses: list[str] = []
        if low_skill:
            analysis_weaknesses.append(
                self._t(lang_code, "summary_biggest_gap").format(
                    label=low_skill["label"],
                    score=low_skill["score"],
                )
            )
            if len(analysis_weaknesses) < 2:
                analysis_weaknesses.append(
                    self._t(lang_code, "analysis_main_growth").format(
                        label=low_skill["label"],
                    )
                )
        for item in growth_areas:
            if item and item not in analysis_weaknesses:
                analysis_weaknesses.append(str(item))
            if len(analysis_weaknesses) >= 3:
                break

        analysis_recommendations: list[str] = []
        first_action = next_steps[0] if next_steps else ""
        if not first_action and localized_rec_candidates:
            first_action = localized_rec_candidates[0]
        if not first_action and recommendations:
            first_action = str(recommendations[0].get("text", "")).strip()
        if first_action:
            analysis_recommendations.append(
                self._t(lang_code, "summary_highest_leverage").format(
                    text=first_action,
                )
            )
        for item in next_steps:
            if item and item not in analysis_recommendations:
                analysis_recommendations.append(str(item))
            if len(analysis_recommendations) >= 3:
                break

        if not analysis_recommendations:
            analysis_recommendations = localized_rec_candidates[:3]
        if not analysis_recommendations:
            analysis_recommendations = [
                str(item.get("text", "")).strip() for item in recommendations[:3]
            ]
            analysis_recommendations = [item for item in analysis_recommendations if item]
        analysis_strengths = analysis_strengths[:3]
        analysis_weaknesses = analysis_weaknesses[:3]
        analysis_recommendations = analysis_recommendations[:3]

        insight_items = []
        if analysis_strengths:
            insight_items.append(
                {
                    "severity": "info",
                    "text_short": analysis_strengths[0],
                    "why": self._t(lang_code, "insight_why_strength"),
                    "evidence_refs": evidence_refs.get("strengths", []),
                }
            )
        if analysis_weaknesses:
            insight_items.append(
                {
                    "severity": "warn",
                    "text_short": analysis_weaknesses[0],
                    "why": self._t(lang_code, "insight_why_weakness"),
                    "evidence_refs": evidence_refs.get("weaknesses", []),
                }
            )
        if analysis_recommendations:
            insight_items.append(
                {
                    "severity": "info",
                    "text_short": analysis_recommendations[0],
                    "why": self._t(lang_code, "insight_why_recommendation"),
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
                {"id": "riasec", "label": self._t(lang_code, "radar_interests"), "value": riasec_avg},
                {"id": "big5", "label": self._t(lang_code, "radar_personality"), "value": big5_avg},
                {"id": "cognitive", "label": self._t(lang_code, "radar_cognitive"), "value": cognitive_total},
                {"id": "sjt", "label": self._t(lang_code, "radar_soft_skills"), "value": sjt_avg},
            ]

        radar_benchmark_values = {
            axis["id"]: target_baseline for axis in radar_axes
        }

        recommendation_buckets: dict[str, list[dict[str, Any]]] = {
            "quick_wins": [],
            "core_upgrades": [],
            "long_term": [],
        }
        for rec_idx, rec in enumerate(recommendations):
            week = _round_score(rec.get("week") or 1)
            week = 1 if week <= 0 else week
            bucket_id = self._bucket_id_by_week(week)
            rec_key = str(rec.get("key", f"rec_{len(recommendation_buckets[bucket_id]) + 1}"))
            text = str(rec.get("text", "")).strip()
            localized_title = (
                localized_rec_candidates[rec_idx]
                if lang_code != "en" and rec_idx < len(localized_rec_candidates)
                else ""
            )
            if localized_title:
                title = localized_title
            elif lang_code != "en":
                title = self._t(lang_code, "recommendation_fallback_title").format(
                    index=rec_idx + 1,
                )
            else:
                title = text
            tags = rec.get("tags") or []
            tag_list = [str(tag).strip() for tag in tags if str(tag).strip()]
            if not title:
                continue
            recommendation_buckets[bucket_id].append(
                {
                    "rec_id": rec_key,
                    "title": title,
                    "impact": self._impact_for_bucket(bucket_id),
                    "effort": self._effort_for_bucket(bucket_id),
                    "rationale": (
                        ", ".join(tag_list)
                        if lang_code == "en" and tag_list
                        else self._t(lang_code, "rationale_default")
                    ),
                    "estimated_impact": (
                        self._t(lang_code, "impact_high")
                        if bucket_id != "long_term"
                        else self._t(lang_code, "impact_long")
                    ),
                    "evidence_refs": evidence_refs.get("recommendations", []),
                    "cta": {
                        "text": self._t(lang_code, "cta_add_to_plan"),
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
                    "title": self._bucket_title(bucket_id, lang_code),
                    "items": items[:6],
                }
            )

        progress_items = self._build_progress_items(progress, lang_code)
        metric_items = [
            {
                "metric_id": "readiness_score",
                "label": self._t(lang_code, "metrics_readiness"),
                "value": readiness_score,
                "status": _status_from_score(readiness_score),
                "hint": metric_explainers["readiness_score"],
                "evidence_refs": evidence_refs.get("metrics", []),
            },
            {
                "metric_id": "confidence",
                "label": self._t(lang_code, "metrics_confidence"),
                "value": _round_score(confidence * 100),
                "status": _status_from_score(_round_score(confidence * 100)),
                "hint": metric_explainers["confidence"],
                "evidence_refs": evidence_refs.get("metrics", []),
            },
            {
                "metric_id": "cognitive_score",
                "label": self._t(lang_code, "metrics_cognitive"),
                "value": cognitive_total,
                "status": _status_from_score(cognitive_total),
                "hint": metric_explainers["cognitive_score"],
                "evidence_refs": evidence_refs.get("metrics", []),
            },
            {
                "metric_id": "soft_skills_score",
                "label": self._t(lang_code, "metrics_soft_skills"),
                "value": sjt_avg,
                "status": _status_from_score(sjt_avg),
                "hint": metric_explainers["soft_skills_score"],
                "evidence_refs": evidence_refs.get("metrics", []),
            },
        ]
        if stability_score > 0:
            metric_items.append(
                {
                    "metric_id": "stability_score",
                    "label": self._t(lang_code, "metrics_stability"),
                    "value": stability_score,
                    "status": _status_from_score(stability_score),
                    "hint": metric_explainers["stability_score"],
                    "evidence_refs": evidence_refs.get("metrics", []),
                }
            )

        return {
            "run_id": f"session_{session_id}",
            "model_version": "rules_v1.1+ai-insights-v1",
            "versions": as_dict(),
            "overall": {
                "readiness": round(readiness_score / 100.0, 2),
                "readiness_score": readiness_score,
                "raw_readiness_score": raw_readiness_score,
                "target_role": target_role,
                "target_level": target_level_normalized,
                "confidence": round(confidence, 2),
                "stability_score": stability_score,
            },
            "blocks": [
                {
                    "block_id": "verdict",
                    "type": "summary_card",
                    "title": self._t(lang_code, "verdict_title"),
                    "content": {
                        "headline": (
                            str(ai_insights.get("summary", "")).strip()
                            or (
                                self._t(lang_code, "verdict_fallback").format(
                                    role=target_role,
                                    level=target_level_normalized,
                                )
                            )
                        ),
                        "bullets": summary_bullets,
                        "cta": {
                            "text": self._t(lang_code, "cta_start_plan"),
                            "action": "open_plan",
                            "params": {"mode": "week"},
                        },
                    },
                },
                {
                    "block_id": "analysis",
                    "type": "analysis_card",
                    "title": self._t(lang_code, "analysis_title"),
                    "content": {
                        "strengths": analysis_strengths,
                        "weaknesses": analysis_weaknesses,
                        "recommendations": analysis_recommendations,
                    },
                },
                {
                    "block_id": "insights",
                    "type": "insight_list",
                    "title": self._t(lang_code, "insights_title"),
                    "content": {
                        "items": insight_items,
                    },
                },
                {
                    "block_id": "radar",
                    "type": "radar",
                    "title": self._t(lang_code, "radar_title"),
                    "content": {
                        "axes": radar_axes,
                        "benchmark": {
                            "label": self._t(lang_code, "baseline_label").format(
                                level=target_level_normalized,
                            ),
                            "values": radar_benchmark_values,
                        },
                        "ai_note": (
                            self._t(lang_code, "radar_note_strongest").format(
                                label=top_skill["label"],
                            )
                            if top_skill
                            else self._t(lang_code, "radar_note_default")
                        )
                        + (
                            self._t(lang_code, "radar_note_unlock").format(
                                label=low_skill["label"],
                            )
                            if low_skill
                            else ""
                        ),
                    },
                },
                {
                    "block_id": "skills",
                    "type": "skill_bars",
                    "title": self._t(lang_code, "skills_title"),
                    "content": {"items": skill_items[:10]},
                },
                {
                    "block_id": "metrics",
                    "type": "metrics",
                    "title": self._t(lang_code, "metrics_title"),
                    "content": {"items": metric_items},
                },
                {
                    "block_id": "recommendations",
                    "type": "recommendation_buckets",
                    "title": self._t(lang_code, "recommendations_title"),
                    "content": {"buckets": recommendation_bucket_items},
                },
                {
                    "block_id": "progress",
                    "type": "progress_timeline",
                    "title": self._t(lang_code, "progress_title"),
                    "content": {
                        "ai_note": self._t(lang_code, "progress_note"),
                        "items": progress_items,
                        "evidence_refs": evidence_refs.get("progress", []),
                    },
                },
                {
                    "block_id": "action",
                    "type": "action_card",
                    "title": self._t(lang_code, "action_title"),
                    "content": {
                        "headline": self._t(lang_code, "action_headline"),
                        "description": self._t(lang_code, "action_description"),
                        "cta": {
                            "text": self._t(lang_code, "action_cta"),
                            "action": "open_plan",
                            "params": {"mode": "impact"},
                        },
                    },
                },
            ],
            "explainers": metric_explainers,
        }


profile_blocks_service = ProfileBlocksService()
