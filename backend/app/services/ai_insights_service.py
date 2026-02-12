import asyncio
import json
import re
import time
from collections import OrderedDict
from typing import Any

import httpx

from app.core.config import settings


def _language_label(lang: str | None) -> str:
    if not lang:
        return "English"
    normalized = lang.split("-")[0].lower()
    if normalized == "ru":
        return "Russian"
    if normalized == "kz":
        return "Kazakh"
    if normalized == "en":
        return "English"
    return "English"


def _coerce_list(value: Any, max_items: int) -> list[str]:
    if isinstance(value, list):
        items = [str(item).strip() for item in value if str(item).strip()]
        return items[:max_items]
    if isinstance(value, str) and value.strip():
        return [value.strip()][:max_items]
    return []


def _normalize_payload(payload: Any) -> dict[str, Any] | None:
    if not isinstance(payload, dict):
        return None

    summary = str(payload.get("summary", "")).strip()
    strengths = _coerce_list(payload.get("strengths"), 5)
    growth_areas = _coerce_list(payload.get("growth_areas"), 5)
    recommended_paths = _coerce_list(payload.get("recommended_paths"), 5)
    next_steps = _coerce_list(payload.get("next_steps"), 6)
    weekly_plan = _coerce_weekly_plan(payload.get("weekly_plan"))
    module_explanations = _coerce_module_explanations(payload.get("module_explanations"))

    if not summary and not (
        strengths
        or growth_areas
        or recommended_paths
        or next_steps
        or weekly_plan
        or module_explanations
    ):
        return None

    return {
        "summary": summary,
        "strengths": strengths,
        "growth_areas": growth_areas,
        "recommended_paths": recommended_paths,
        "next_steps": next_steps,
        "weekly_plan": weekly_plan,
        "module_explanations": module_explanations,
    }


def _extract_json(content: str) -> str | None:
    if not content:
        return None
    fenced = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
    if fenced:
        return fenced.group(1)
    start = content.find("{")
    end = content.rfind("}")
    if start >= 0 and end > start:
        return content[start:end + 1]
    return None


def _try_parse_json(content: str) -> dict[str, Any] | None:
    try:
        return json.loads(content)
    except Exception:
        candidate = _extract_json(content)
        if not candidate:
            return None
        try:
            return json.loads(candidate)
        except Exception:
            return None


def _coerce_weekly_plan(value: Any) -> list[dict[str, Any]]:
    if not value:
        return []

    items: list[dict[str, Any]] = []

    def parse_task(raw: Any) -> dict[str, str] | None:
        if not isinstance(raw, dict):
            return None
        task = str(raw.get("task", "")).strip()
        why = str(raw.get("why", "")).strip()
        how = str(raw.get("how", "")).strip()
        if not task and not why and not how:
            return None
        return {"task": task, "why": why, "how": how}

    def parse_item(raw: Any) -> dict[str, Any] | None:
        if not isinstance(raw, dict):
            return None
        week_raw = raw.get("week")
        try:
            week = int(week_raw)
        except Exception:
            return None
        if week < 1 or week > 4:
            return None
        title = str(raw.get("title", "")).strip()
        goal = str(raw.get("goal", "")).strip()
        tasks_raw = raw.get("tasks", [])
        tasks: list[dict[str, str]] = []
        if isinstance(tasks_raw, list):
            for task in tasks_raw:
                parsed = parse_task(task)
                if parsed:
                    tasks.append(parsed)
        return {
            "week": week,
            "title": title,
            "goal": goal,
            "tasks": tasks,
        }

    if isinstance(value, list):
        for raw in value:
            parsed = parse_item(raw)
            if parsed:
                items.append(parsed)
    elif isinstance(value, dict):
        # Support { "week1": {...}, "week2": {...} } style
        for key, raw in value.items():
            if isinstance(raw, dict) and "week" not in raw:
                try:
                    raw = {**raw, "week": int(str(key).replace("week", "").strip())}
                except Exception:
                    pass
            parsed = parse_item(raw)
            if parsed:
                items.append(parsed)

    items.sort(key=lambda x: x["week"])
    return items


def _coerce_module_explanations(value: Any) -> dict[str, dict[str, str]]:
    if not isinstance(value, dict):
        return {}

    result: dict[str, dict[str, str]] = {}
    for key in ("RIASEC", "BIG5", "COGNITIVE", "SJT"):
        raw = value.get(key)
        if isinstance(raw, str) and raw.strip():
            result[key] = {"meaning": raw.strip(), "how_to_use": ""}
            continue
        if not isinstance(raw, dict):
            continue
        meaning = str(raw.get("meaning", "")).strip()
        how_to_use = str(raw.get("how_to_use", "")).strip()
        if meaning or how_to_use:
            result[key] = {"meaning": meaning, "how_to_use": how_to_use}
    return result


class AIInsightsService:
    def __init__(self) -> None:
        self._cache: "OrderedDict[str, tuple[float, dict[str, Any]]]" = OrderedDict()
        self._lock = asyncio.Lock()
        self._cache_version = "v2"

    async def _get_cached(self, key: str) -> dict[str, Any] | None:
        now = time.time()
        async with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            ts, value = entry
            if now - ts > settings.OPENAI_CACHE_TTL_SECONDS:
                self._cache.pop(key, None)
                return None
            self._cache.move_to_end(key)
            return value

    async def _set_cached(self, key: str, value: dict[str, Any]) -> None:
        now = time.time()
        async with self._lock:
            self._cache[key] = (now, value)
            self._cache.move_to_end(key)
            while len(self._cache) > settings.OPENAI_CACHE_MAX_ITEMS:
                self._cache.popitem(last=False)

    async def generate(
        self,
        session_id: int | None,
        scores: dict | None,
        context_data: dict | None,
        recommendations: list[dict] | None,
        lang: str | None,
    ) -> dict[str, Any] | None:
        if not scores:
            return None

        cache_key = None
        if session_id is not None:
            cache_key = f"{self._cache_version}:{session_id}:{lang or 'en'}"
            cached = await self._get_cached(cache_key)
            if cached:
                return cached

        if not settings.OPENAI_API_KEY:
            print("[AI] OPENAI_API_KEY is missing")
            return None

        language_label = _language_label(lang)

        system_prompt = (
            "You are a senior career assessment analyst. "
            "Use the provided assessment scores and context to write professional, specific guidance. "
            "Explain what the results mean and how to act on them. "
            "Avoid medical or diagnostic claims. "
            f"Respond in {language_label}. "
            "Output JSON only with keys: "
            "summary (2-4 sentences), strengths (3-5 items), "
            "growth_areas (2-4 items), recommended_paths (3-5 items), "
            "next_steps (3-5 items), weekly_plan (array of 4 items), "
            "module_explanations (object with keys RIASEC, BIG5, COGNITIVE, SJT). "
            "Each module_explanations item has: meaning (1-3 sentences) and how_to_use (1-3 sentences). "
            "weekly_plan item schema: {week: 1-4, title, goal, tasks}. "
            "tasks is an array of 3-5 items with: {task, why, how}. "
            "Make each week align to themes: "
            "Week 1 Exploration, Week 2 Practice, Week 3 Networking, Week 4 Planning. "
            "Keep each task/why/how concise (1 sentence each). Prefer 3 tasks per week. "
            "Use minimal lengths to fit the token budget: strengths=3 items, growth_areas=2 items, "
            "recommended_paths=3 items, next_steps=3 items. "
            "Keep each task/why/how under ~18 words. Keep module explanations to 1-2 sentences each."
        )

        user_payload = {
            "scores": scores,
            "context_data": context_data,
            "rule_based_recommendations": recommendations,
        }

        json_schema = {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "summary": {"type": "string"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "growth_areas": {"type": "array", "items": {"type": "string"}},
                "recommended_paths": {"type": "array", "items": {"type": "string"}},
                "next_steps": {"type": "array", "items": {"type": "string"}},
                "weekly_plan": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "week": {"type": "integer", "enum": [1, 2, 3, 4]},
                            "title": {"type": "string"},
                            "goal": {"type": "string"},
                            "tasks": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "additionalProperties": False,
                                    "properties": {
                                        "task": {"type": "string"},
                                        "why": {"type": "string"},
                                        "how": {"type": "string"},
                                    },
                                    "required": ["task", "why", "how"],
                                },
                            },
                        },
                        "required": ["week", "title", "goal", "tasks"],
                    },
                },
                "module_explanations": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "RIASEC": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "meaning": {"type": "string"},
                                "how_to_use": {"type": "string"},
                            },
                            "required": ["meaning", "how_to_use"],
                        },
                        "BIG5": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "meaning": {"type": "string"},
                                "how_to_use": {"type": "string"},
                            },
                            "required": ["meaning", "how_to_use"],
                        },
                        "COGNITIVE": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "meaning": {"type": "string"},
                                "how_to_use": {"type": "string"},
                            },
                            "required": ["meaning", "how_to_use"],
                        },
                        "SJT": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "meaning": {"type": "string"},
                                "how_to_use": {"type": "string"},
                            },
                            "required": ["meaning", "how_to_use"],
                        },
                    },
                    "required": ["RIASEC", "BIG5", "COGNITIVE", "SJT"],
                },
            },
            "required": [
                "summary",
                "strengths",
                "growth_areas",
                "recommended_paths",
                "next_steps",
                "weekly_plan",
                "module_explanations",
            ],
        }

        def build_request(temperature: float, mode: str) -> dict[str, Any]:
            payload: dict[str, Any] = {
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": "Create the JSON now. Data:\n"
                        + json.dumps(user_payload, ensure_ascii=False),
                    },
                ],
                "temperature": temperature,
                "max_tokens": settings.OPENAI_MAX_TOKENS,
            }

            if mode == "response_format":
                payload["response_format"] = {"type": "json_object"}
            elif mode == "tools":
                payload["tools"] = [
                    {
                        "type": "function",
                        "function": {
                            "name": "submit_insights",
                            "description": "Return the structured AI insights.",
                            "parameters": json_schema,
                        },
                    }
                ]
                payload["tool_choice"] = {
                    "type": "function",
                    "function": {"name": "submit_insights"},
                }
            return payload

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }

        async def call_openai(payload: dict[str, Any]) -> dict[str, Any] | None:
            try:
                async with httpx.AsyncClient(
                    timeout=settings.OPENAI_TIMEOUT_SECONDS
                ) as client:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code if exc.response else "unknown"
                body = ""
                try:
                    body = exc.response.text[:400] if exc.response else ""
                except Exception:
                    body = ""
                print(f"[AI] OpenAI HTTP error {status}: {body}")
                return None
            except httpx.RequestError as exc:
                print(f"[AI] OpenAI request error: {exc.__class__.__name__} {repr(exc)}")
                return None
            except Exception as exc:
                print(f"[AI] Failed to call OpenAI: {exc.__class__.__name__} {repr(exc)}")
                return None

        def parse_response(data: dict[str, Any]) -> tuple[dict[str, Any] | None, dict[str, Any]]:
            choice = data.get("choices", [{}])[0] if isinstance(data, dict) else {}
            message = choice.get("message", {}) if isinstance(choice, dict) else {}
            tool_calls = message.get("tool_calls") if isinstance(message, dict) else None
            function_call = (
                message.get("function_call") if isinstance(message, dict) else None
            )
            content = message.get("content", "") if isinstance(message, dict) else ""
            preview_source = ""

            parsed: dict[str, Any] | None = None
            if tool_calls and isinstance(tool_calls, list):
                for call in tool_calls:
                    try:
                        args = call.get("function", {}).get("arguments", "")
                        if isinstance(args, dict):
                            parsed = args
                        else:
                            if isinstance(args, str) and not preview_source:
                                preview_source = args
                            parsed = _try_parse_json(args)
                    except Exception:
                        parsed = None
                    if parsed:
                        break

            if not parsed and isinstance(function_call, dict):
                try:
                    args = function_call.get("arguments", "")
                    if isinstance(args, dict):
                        parsed = args
                    else:
                        if isinstance(args, str) and not preview_source:
                            preview_source = args
                        parsed = _try_parse_json(args)
                except Exception:
                    parsed = None

            if not parsed:
                if isinstance(content, str) and content and not preview_source:
                    preview_source = content
                parsed = _try_parse_json(content)

            meta = {
                "finish_reason": choice.get("finish_reason") if isinstance(choice, dict) else None,
                "message_keys": list(message.keys()) if isinstance(message, dict) else [],
                "tool_calls_len": len(tool_calls) if isinstance(tool_calls, list) else 0,
                "preview": (preview_source or "")[:400],
            }
            return parsed, meta

        parsed = None
        last_meta: dict[str, Any] | None = None
        attempts = [
            ("response_format", 0.2),
            ("tools", 0.1),
        ]

        for mode, temperature in attempts:
            data = await call_openai(build_request(temperature, mode))
            if not data:
                continue
            parsed, last_meta = parse_response(data)
            if parsed:
                break

        if not parsed:
            if last_meta:
                print(
                    "[AI] Invalid JSON from OpenAI after retry. "
                    f"finish_reason={last_meta['finish_reason']} "
                    f"message_keys={last_meta['message_keys']} "
                    f"tool_calls={last_meta['tool_calls_len']} "
                    f"preview={last_meta['preview']!r}"
                )
            return None

        normalized = _normalize_payload(parsed)
        if normalized and cache_key:
            await self._set_cached(cache_key, normalized)
        return normalized


ai_insights_service = AIInsightsService()
