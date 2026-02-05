"""Import questions from Proftest.docx into backend/data/questions.csv.

Parses:
- RIASEC (Block A)
- BIG5 (Block B)
- COGNITIVE (Block C) with deterministic formats
- SJT (Block C/D) with A-D options
- Self-report (Block D) as SJT scale items
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from docx import Document

ROOT = Path(r"C:\proftest")
DOCX_PATH = ROOT / "Proftest.docx"
EXTRACTED_PATH = ROOT / "Proftest_extracted.txt"
CSV_PATH = ROOT / "backend" / "data" / "questions.csv"


@dataclass
class QuestionRow:
    code: str
    module: str
    category: str
    text_ru: str
    text_kz: str | None
    text_en: str | None
    qtype: str
    is_reverse: bool
    options: str | None


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def load_lines() -> list[str]:
    if not EXTRACTED_PATH.exists():
        doc = Document(DOCX_PATH)
        paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        EXTRACTED_PATH.write_text("\n".join(paras), encoding="utf-8")
    return [line.strip() for line in EXTRACTED_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]


def load_existing() -> tuple[list[dict[str, str]], set[tuple[str, str, str]], set[str]]:
    rows: list[dict[str, str]] = []
    key_set: set[tuple[str, str, str]] = set()
    code_set: set[str] = set()
    with CSV_PATH.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if None in row:
                row.pop(None, None)
            rows.append(row)
            key = (row["module"], row["category"], row["text_ru"].strip())
            key_set.add(key)
            code_set.add(row["code"])
    return rows, key_set, code_set


def code_for(module: str, category: str, counters: dict[tuple[str, str], int], existing_codes: set[str]) -> str:
    abbr = {
        "RIASEC": "RIA",
        "BIG5": "B5",
        "COGNITIVE": "COG",
        "SJT": "SJT",
    }[module]
    cat = re.sub(r"[^A-Za-z0-9]+", "_", category).strip("_")
    key = (module, category)
    counters[key] = counters.get(key, 0) + 1
    code = f"{abbr}_{cat}_{counters[key]:03d}"
    while code in existing_codes:
        counters[key] += 1
        code = f"{abbr}_{cat}_{counters[key]:03d}"
    existing_codes.add(code)
    return code


def add_question(rows: list[dict[str, str]], key_set: set[tuple[str, str, str]],
                 existing_codes: set[str], counters: dict[tuple[str, str], int],
                 module: str, category: str, text_ru: str, qtype: str,
                 options: list[dict[str, object]] | None = None,
                 is_reverse: bool = False) -> None:
    text_ru = normalize_spaces(text_ru)
    key = (module, category, text_ru)
    if key in key_set:
        return
    key_set.add(key)
    code = code_for(module, category, counters, existing_codes)
    rows.append({
        "code": code,
        "module": module,
        "category": category,
        "text_ru": text_ru,
        "text_kz": "",
        "text_en": "",
        "type": qtype,
        "is_reverse": "FALSE" if not is_reverse else "TRUE",
        "options": json.dumps(options, ensure_ascii=False) if options else "",
    })


def collect_after(lines: list[str], start_index: int, stop_pred) -> tuple[list[str], int]:
    collected = []
    i = start_index
    while i < len(lines) and not stop_pred(lines[i]):
        collected.append(lines[i])
        i += 1
    return collected, i


def parse_riasec(lines: list[str]) -> dict[str, list[str]]:
    categories = {
        "R": re.compile(r"^R\s*[—-]\s*REALISTIC", re.IGNORECASE),
        "I": re.compile(r"Investigative\s*\(I\)", re.IGNORECASE),
        "A": re.compile(r"Artistic\s*\(A\)", re.IGNORECASE),
        "S": re.compile(r"Social\s*\(S\)", re.IGNORECASE),
        "E": re.compile(r"Enterprising\s*\(E\)", re.IGNORECASE),
        "C": re.compile(r"Conventional\s*\(C\)", re.IGNORECASE),
    }

    results: dict[str, list[str]] = {k: [] for k in categories}
    i = 0
    while i < len(lines):
        line = lines[i]
        matched = next((k for k, p in categories.items() if p.search(line)), None)
        if matched:
            while i < len(lines) and lines[i] != "100 утверждений":
                i += 1
            if i < len(lines) and lines[i] == "100 утверждений":
                i += 1
                def stop_pred(l: str) -> bool:
                    if l.startswith("Блок "):
                        return True
                    if any(p.search(l) for p in categories.values()):
                        return True
                    if l.startswith("Big Five") or l.startswith("Открытость опыту"):
                        return True
                    return False
                statements, i = collect_after(lines, i, stop_pred)
                for st in statements:
                    if st and not st.startswith("100 утверждений"):
                        results[matched].append(st)
            continue
        i += 1
    return results


def parse_big5(lines: list[str]) -> dict[str, list[str]]:
    categories = {
        "Openness": re.compile(r"Открытость опыту|\(Openness\)", re.IGNORECASE),
        "Conscientiousness": re.compile(r"Добросовестност", re.IGNORECASE),
        "Extraversion": re.compile(r"Экстраверси", re.IGNORECASE),
        "Agreeableness": re.compile(r"Доброжелательност", re.IGNORECASE),
        "Neuroticism": re.compile(r"Нейротизм", re.IGNORECASE),
    }

    results: dict[str, list[str]] = {k: [] for k in categories}
    i = 0
    while i < len(lines):
        line = lines[i]
        matched = next((k for k, p in categories.items() if p.search(line)), None)
        if matched:
            while i < len(lines) and lines[i] != "100 утверждений":
                i += 1
            if i < len(lines) and lines[i] == "100 утверждений":
                i += 1
                def stop_pred(l: str) -> bool:
                    if l.startswith("Блок C"):
                        return True
                    if any(p.search(l) for p in categories.values()):
                        return True
                    return False
                statements, i = collect_after(lines, i, stop_pred)
                for st in statements:
                    if st:
                        results[matched].append(st)
            continue
        i += 1
    return results


def parse_self_report(lines: list[str]) -> dict[str, list[str]]:
    categories = {
        "self_organization": re.compile(r"Самоорганизация и ответственность", re.IGNORECASE),
        "teamwork": re.compile(r"Командность и коммуникация", re.IGNORECASE),
        "initiative": re.compile(r"Инициативность", re.IGNORECASE),
        "stress": re.compile(r"Стрессоустойчивость", re.IGNORECASE),
        "learning_strategy": re.compile(r"Учебные стратегии", re.IGNORECASE),
    }

    results: dict[str, list[str]] = {k: [] for k in categories}
    i = 0
    while i < len(lines):
        line = lines[i]
        if "Блок D — Самоотчёт" in line:
            i += 1
            continue
        matched = next((k for k, p in categories.items() if p.search(line)), None)
        if matched and re.search(r"\(\d+–\d+\)", line):
            i += 1
            def stop_pred(l: str) -> bool:
                if re.match(r"\d+\.", l):
                    return True
                if any(p.search(l) and re.search(r"\(\d+–\d+\)", l) for p in categories.values()):
                    return True
                if l.startswith("Блок "):
                    return True
                return False
            statements, i = collect_after(lines, i, stop_pred)
            for st in statements:
                if not st or st.startswith("Экран:") or st.startswith("Ответ:") or st.startswith("📌"):
                    continue
                if re.fullmatch(r"[1-5](\s+[1-5]){4}", st):
                    continue
                results[matched].append(st)
            continue
        i += 1
    return results


def parse_sjt(lines: list[str]) -> list[tuple[str, str, list[dict[str, object]]]]:
    category_map = {
        "Самоорганизация / сроки": "self_organization",
        "Командное взаимодействие": "teamwork",
        "Инициативность": "initiative",
        "Стресс и саморегуляция": "stress",
        "Самоорганизация и ответственность": "self_organization",
        "Командность и коммуникация": "teamwork",
        "Инициативность / предпринимательность": "initiative",
        "Стрессоустойчивость и саморегуляция": "stress",
    }

    results: list[tuple[str, str, list[dict[str, object]]]] = []
    current_category = None
    i = 0
    while i < len(lines):
        line = lines[i]
        heading = next((k for k in category_map if k in line), None)
        if heading:
            current_category = category_map[heading]
            i += 1
            continue

        if current_category and (line.endswith("?") or line.endswith(".")):
            question = line
            options = []
            j = i + 1
            while j < len(lines) and re.match(r"^[ABCD]\.\s+", lines[j]):
                option_text = re.sub(r"^[ABCD]\.\s+", "", lines[j]).strip()
                is_correct = "✅" in option_text
                option_text = option_text.replace("✅", "").strip()
                options.append({"text": option_text, "value": 2 if is_correct else 0})
                j += 1
            if len(options) >= 3:
                if not any(opt["value"] == 2 for opt in options):
                    for idx, opt in enumerate(options):
                        opt["value"] = 2 if idx == 0 else (1 if idx == 1 else 0)
                results.append((current_category, question, options))
                i = j
                continue
        i += 1
    return results


def parse_processing_speed(lines: list[str]) -> list[tuple[str, str, list[dict[str, object]]]]:
    results = []
    # Format A
    try:
        start = lines.index("Формат A — Сравнение символов (1–30)") + 1
    except ValueError:
        start = -1
    if start != -1:
        def stop_pred(l: str) -> bool:
            return l.startswith("Формат B —")
        items, _ = collect_after(lines, start, stop_pred)
        items = [i for i in items if i and not i.startswith("Инструкция") and not i.startswith("Ответ")]
        for pair in items:
            if " " not in pair:
                continue
            symbols = pair.split()
            if len(symbols) != 2:
                continue
            same = symbols[0] == symbols[1]
            options = [
                {"text": "Совпадают", "value": 1 if same else 0},
                {"text": "Не совпадают", "value": 0 if same else 1},
            ]
            results.append(("processing_speed", f"Совпадают ли символы? {pair}", options))

    # Format B
    try:
        start = lines.index("Формат B — Поиск целевого символа (31–55)") + 1
    except ValueError:
        start = -1
    target = "★"
    if start != -1:
        if lines[start].startswith("Инструкция"):
            start += 1
        if lines[start].startswith("Цель"):
            m = re.search(r"Цель, например: (.+)", lines[start])
            if m:
                target = m.group(1).strip()
            start += 1
        def stop_pred(l: str) -> bool:
            return l.startswith("Ответ:") or l.startswith("Формат C —")
        items, _ = collect_after(lines, start, stop_pred)
        for seq in items:
            if not seq or seq.startswith("Инструкция"):
                continue
            present = target in seq
            options = [
                {"text": "Есть", "value": 1 if present else 0},
                {"text": "Нет", "value": 0 if present else 1},
            ]
            results.append(("processing_speed", f"Есть ли целевой символ {target}: {seq}", options))

    # Format C
    try:
        start = lines.index("Формат C — Сравнение чисел и букв (56–75)") + 1
    except ValueError:
        start = -1
    if start != -1:
        def stop_pred(l: str) -> bool:
            return l.startswith("Ответ") or l.startswith("Формат D —")
        items, _ = collect_after(lines, start, stop_pred)
        for item in items:
            if "—" not in item:
                continue
            left, right = [p.strip() for p in item.split("—")]
            try:
                lval = float(left)
                rval = float(right)
            except ValueError:
                lval = left
                rval = right
            if lval == rval:
                correct = "Одинаковы"
            elif lval > rval:
                correct = "Левый"
            else:
                correct = "Правый"
            options = [
                {"text": "Левый", "value": 1 if correct == "Левый" else 0},
                {"text": "Правый", "value": 1 if correct == "Правый" else 0},
                {"text": "Одинаковы", "value": 1 if correct == "Одинаковы" else 0},
            ]
            results.append(("processing_speed", f"Что больше или одинаково? {item}", options))

    # Format D
    try:
        start = lines.index("Формат D — Соответствие образцу (76–100)") + 1
    except ValueError:
        start = -1
    if start != -1:
        def stop_pred(l: str) -> bool:
            return l.startswith("Ответ:") or l.startswith("Рабочая память")
        items, _ = collect_after(lines, start, stop_pred)
        for item in items:
            if "Образец:" not in item or "варианты" not in item:
                continue
            m = re.search(r"Образец: (.+?) → варианты: (.+)", item)
            if not m:
                continue
            sample = m.group(1).strip()
            options_list = m.group(2).split()
            options = [
                {"text": opt, "value": 1 if opt == sample else 0}
                for opt in options_list
            ]
            results.append(("processing_speed", f"Какой вариант совпадает с образцом {sample}?", options))

    return results


def parse_working_memory(lines: list[str]) -> list[tuple[str, str, list[dict[str, object]]]]:
    results = []
    # Format 1: lines with → ✅ / ❌
    try:
        start = lines.index("Примеры заданий:") + 1
    except ValueError:
        return results

    def stop_pred(l: str) -> bool:
        return l.startswith("Ответ:")

    items, _ = collect_after(lines, start, stop_pred)
    for item in items:
        if "→" not in item or ("✅" not in item and "❌" not in item):
            continue
        parts = [p.strip() for p in item.split("→")]
        if len(parts) < 3:
            continue
        sequence = parts[0]
        probe = parts[1]
        is_yes = "✅" in item
        options = [
            {"text": "Да", "value": 1 if is_yes else 0},
            {"text": "Нет", "value": 0 if is_yes else 1},
        ]
        results.append(("working_memory", f"Этот символ был среди предыдущих? {sequence} → {probe}", options))
    return results


def parse_gonogo(lines: list[str]) -> list[tuple[str, str, list[dict[str, object]]]]:
    results = []
    try:
        start = lines.index("Последовательность стимулов") + 1
    except ValueError:
        return results
    i = start
    while i < len(lines):
        line = lines[i]
        if line.startswith("Подсчёт") or line.startswith("Индекс контроля"):
            break
        if line in {"🟢", "🔴"}:
            is_go = line == "🟢"
            options = [
                {"text": "Нажать", "value": 1 if is_go else 0},
                {"text": "НЕ нажимать", "value": 0 if is_go else 1},
            ]
            results.append(("attention", f"Стимул: {line}", options))
        i += 1
    return results


def parse_logic(lines: list[str]) -> list[tuple[str, str, list[dict[str, object]]]]:
    results = []

    def parse_with_answers(start_label: str, stop_label: str) -> list[tuple[str, str]]:
        try:
            start = lines.index(start_label) + 1
        except ValueError:
            return []
        def stop_pred(l: str) -> bool:
            return l.startswith(stop_label)
        items, _ = collect_after(lines, start, stop_pred)
        parsed = []
        for item in items:
            m = re.search(r"\(([^)]+)\)$", item)
            if not m:
                continue
            answer = m.group(1).strip()
            question = item[: item.rfind("(")].strip()
            parsed.append((question, answer))
        return parsed

    # Continue series
    series_items = parse_with_answers("🟦 Формат 1 — Продолжи ряд (1–40)", "🟦 Формат 2 — Матрицы 2×2 (41–70)")
    series_answers = [a for _, a in series_items]

    def options_from_pool(correct: str, pool: list[str]) -> list[dict[str, object]]:
        distractors = [p for p in pool if p != correct]
        choices = [correct] + distractors[:3]
        return [
            {"text": choice, "value": 1 if choice == correct else 0}
            for choice in choices
        ]

    for question, answer in series_items:
        options = options_from_pool(answer, series_answers)
        results.append(("logic", f"Продолжи ряд: {question}", options))

    # Matrices 2x2
    matrix_items = parse_with_answers("🟦 Формат 2 — Матрицы 2×2 (41–70)", "🟦 Формат 3 — Найди лишний элемент (71–85)")
    matrix_answers = [a for _, a in matrix_items]
    for question, answer in matrix_items:
        options = options_from_pool(answer, matrix_answers)
        results.append(("logic", f"Матрица 2×2: {question}", options))

    # Odd one out
    try:
        start = lines.index("🟦 Формат 3 — Найди лишний элемент (71–85)") + 1
    except ValueError:
        start = -1
    if start != -1:
        def stop_pred(l: str) -> bool:
            return l.startswith("🟦 Формат 4 — Соответствие по правилу (86–100)")
        items, _ = collect_after(lines, start, stop_pred)
        for item in items:
            m = re.search(r"лишний: (.+)$", item)
            if not m:
                continue
            answer = m.group(1).strip()
            options = [
                {"text": answer, "value": 1},
            ]
            # Add distractors from the item if possible
            tokens = [t for t in re.split(r"[\s,]+", item) if t and t not in {"→", "лишний:", answer}]
            for tok in tokens:
                if tok != answer and len(options) < 4:
                    options.append({"text": tok, "value": 0})
            results.append(("logic", f"Найди лишний элемент: {item.split('→')[0].strip()}", options))

    # Rule matching
    rule_items = parse_with_answers("🟦 Формат 4 — Соответствие по правилу (86–100)", "SJT — 100 ситуационных заданий")
    rule_answers = [a for _, a in rule_items]
    for question, answer in rule_items:
        options = options_from_pool(answer, rule_answers)
        results.append(("logic", f"Соответствие по правилу: {question}", options))

    return results


def main() -> None:
    lines = load_lines()
    rows, key_set, existing_codes = load_existing()
    counters: dict[tuple[str, str], int] = {}

    # RIASEC
    for category, statements in parse_riasec(lines).items():
        for statement in statements:
            add_question(rows, key_set, existing_codes, counters, "RIASEC", category, statement, "scale")

    # BIG5
    for category, statements in parse_big5(lines).items():
        for statement in statements:
            add_question(rows, key_set, existing_codes, counters, "BIG5", category, statement, "scale")

    # Self-report (as SJT scale)
    for category, statements in parse_self_report(lines).items():
        for statement in statements:
            add_question(rows, key_set, existing_codes, counters, "SJT", category, statement, "scale")

    # SJT scenarios
    for category, question, options in parse_sjt(lines):
        add_question(rows, key_set, existing_codes, counters, "SJT", category, question, "choice", options=options)

    # Cognitive blocks
    for category, question, options in parse_processing_speed(lines):
        add_question(rows, key_set, existing_codes, counters, "COGNITIVE", category, question, "choice", options=options)

    for category, question, options in parse_working_memory(lines):
        add_question(rows, key_set, existing_codes, counters, "COGNITIVE", category, question, "choice", options=options)

    for category, question, options in parse_gonogo(lines):
        add_question(rows, key_set, existing_codes, counters, "COGNITIVE", category, question, "choice", options=options)

    for category, question, options in parse_logic(lines):
        add_question(rows, key_set, existing_codes, counters, "COGNITIVE", category, question, "choice", options=options)

    # Write CSV
    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "code",
                "module",
                "category",
                "text_ru",
                "text_kz",
                "text_en",
                "type",
                "is_reverse",
                "options",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Updated CSV: {CSV_PATH}")
    print(f"Total questions: {len(rows)}")


if __name__ == "__main__":
    main()
