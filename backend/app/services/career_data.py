"""
What each line of work asks for.

The knowledge base behind career matching. A career is described by the scales
that actually distinguish it, each with a weight saying how much it matters —
not by every scale that happens to correlate. Keeping this as data means the
matching stays explainable: a result can always name the scales it rested on.

`weight` is relative within one career and needs no normalising; the matcher
does that. Positive weight means "more is better for this work"; a negative
weight means the opposite, which is how a career says what it is *not*.
"""

from typing import TypedDict


class Requirement(TypedDict):
    module: str
    scale: str
    weight: float
    label: str


class Career(TypedDict):
    career_id: str
    title: str
    summary: str
    requirements: list[Requirement]


CAREERS: list[Career] = [
    {
        "career_id": "engineer_technologist",
        "title": "Инженер-технолог",
        "summary": "Наладка процессов и оборудования: разобраться в устройстве и довести до стабильного результата.",
        "requirements": [
            {"module": "RIASEC", "scale": "Realistic", "weight": 3.0, "label": "Практические интересы"},
            {"module": "RIASEC", "scale": "Investigative", "weight": 2.5, "label": "Исследовательские интересы"},
            {"module": "COGNITIVE", "scale": "logic", "weight": 2.0, "label": "Логическое мышление"},
            {"module": "SJT", "scale": "self_organization", "weight": 1.5, "label": "Самоорганизация"},
            {"module": "RIASEC", "scale": "Social", "weight": -1.0, "label": "Социальные интересы"},
        ],
    },
    {
        "career_id": "data_analyst",
        "title": "Аналитик данных",
        "summary": "Извлечь из данных то, чего в них не видно с первого взгляда, и объяснить это словами.",
        "requirements": [
            {"module": "RIASEC", "scale": "Investigative", "weight": 3.5, "label": "Исследовательские интересы"},
            {"module": "COGNITIVE", "scale": "logic", "weight": 2.5, "label": "Логическое мышление"},
            {"module": "COGNITIVE", "scale": "working_memory", "weight": 2.0, "label": "Рабочая память"},
            {"module": "RIASEC", "scale": "Conventional", "weight": 1.5, "label": "Работа со структурой"},
            {"module": "BIG5", "scale": "Openness", "weight": 1.0, "label": "Открытость новому"},
        ],
    },
    {
        "career_id": "industrial_designer",
        "title": "Промышленный дизайнер",
        "summary": "Придумать вещь, которой удобно пользоваться, и довести её до состояния, в котором её можно произвести.",
        "requirements": [
            {"module": "RIASEC", "scale": "Artistic", "weight": 3.0, "label": "Творческие интересы"},
            {"module": "RIASEC", "scale": "Realistic", "weight": 2.5, "label": "Практические интересы"},
            {"module": "BIG5", "scale": "Openness", "weight": 2.0, "label": "Открытость новому"},
            {"module": "COGNITIVE", "scale": "attention", "weight": 1.0, "label": "Внимание к деталям"},
        ],
    },
    {
        "career_id": "software_developer",
        "title": "Разработчик программного обеспечения",
        "summary": "Строить работающие системы из формальных правил и держать их понятными для других.",
        "requirements": [
            {"module": "RIASEC", "scale": "Investigative", "weight": 3.0, "label": "Исследовательские интересы"},
            {"module": "COGNITIVE", "scale": "logic", "weight": 3.0, "label": "Логическое мышление"},
            {"module": "RIASEC", "scale": "Realistic", "weight": 1.5, "label": "Практические интересы"},
            {"module": "SJT", "scale": "learning", "weight": 1.5, "label": "Стратегии обучения"},
        ],
    },
    {
        "career_id": "teacher",
        "title": "Преподаватель",
        "summary": "Объяснять так, чтобы человек понял, и замечать, когда он не понял.",
        "requirements": [
            {"module": "RIASEC", "scale": "Social", "weight": 3.5, "label": "Социальные интересы"},
            {"module": "SJT", "scale": "learning", "weight": 2.0, "label": "Стратегии обучения"},
            {"module": "BIG5", "scale": "Agreeableness", "weight": 1.5, "label": "Доброжелательность"},
            {"module": "SJT", "scale": "teamwork", "weight": 1.5, "label": "Командность"},
            {"module": "RIASEC", "scale": "Realistic", "weight": -1.0, "label": "Практические интересы"},
        ],
    },
    {
        "career_id": "sales_manager",
        "title": "Менеджер по продажам",
        "summary": "Понять, что нужно человеку напротив, и довести договорённость до сделки.",
        "requirements": [
            {"module": "RIASEC", "scale": "Enterprising", "weight": 3.5, "label": "Предпринимательские интересы"},
            {"module": "BIG5", "scale": "Extraversion", "weight": 2.5, "label": "Экстраверсия"},
            {"module": "RIASEC", "scale": "Social", "weight": 2.0, "label": "Социальные интересы"},
            {"module": "SJT", "scale": "initiative", "weight": 1.5, "label": "Инициативность"},
            {"module": "RIASEC", "scale": "Investigative", "weight": -1.0, "label": "Исследовательские интересы"},
        ],
    },
    {
        "career_id": "hr_specialist",
        "title": "Специалист по персоналу",
        "summary": "Собирать команды и разбираться в том, что мешает людям работать вместе.",
        "requirements": [
            {"module": "RIASEC", "scale": "Social", "weight": 3.0, "label": "Социальные интересы"},
            {"module": "RIASEC", "scale": "Enterprising", "weight": 2.0, "label": "Предпринимательские интересы"},
            {"module": "SJT", "scale": "teamwork", "weight": 2.0, "label": "Командность"},
            {"module": "BIG5", "scale": "Agreeableness", "weight": 1.5, "label": "Доброжелательность"},
        ],
    },
    {
        "career_id": "accountant",
        "title": "Бухгалтер",
        "summary": "Держать цифры в порядке там, где ошибка стоит дорого.",
        "requirements": [
            {"module": "RIASEC", "scale": "Conventional", "weight": 3.5, "label": "Работа со структурой"},
            {"module": "BIG5", "scale": "Conscientiousness", "weight": 2.5, "label": "Добросовестность"},
            {"module": "COGNITIVE", "scale": "attention", "weight": 2.0, "label": "Внимание"},
            {"module": "SJT", "scale": "self_organization", "weight": 1.5, "label": "Самоорганизация"},
            {"module": "RIASEC", "scale": "Artistic", "weight": -1.0, "label": "Творческие интересы"},
        ],
    },
    {
        "career_id": "project_manager",
        "title": "Руководитель проектов",
        "summary": "Довести общую работу до срока, договариваясь на каждом шаге.",
        "requirements": [
            {"module": "RIASEC", "scale": "Enterprising", "weight": 3.0, "label": "Предпринимательские интересы"},
            {"module": "SJT", "scale": "self_organization", "weight": 2.5, "label": "Самоорганизация"},
            {"module": "SJT", "scale": "teamwork", "weight": 2.0, "label": "Командность"},
            {"module": "SJT", "scale": "stress", "weight": 1.5, "label": "Стрессоустойчивость"},
            {"module": "BIG5", "scale": "Conscientiousness", "weight": 1.5, "label": "Добросовестность"},
        ],
    },
    {
        "career_id": "researcher",
        "title": "Научный сотрудник",
        "summary": "Задавать вопросы, на которые пока нет ответа, и выдерживать долгий путь к нему.",
        "requirements": [
            {"module": "RIASEC", "scale": "Investigative", "weight": 4.0, "label": "Исследовательские интересы"},
            {"module": "BIG5", "scale": "Openness", "weight": 2.0, "label": "Открытость новому"},
            {"module": "COGNITIVE", "scale": "logic", "weight": 2.0, "label": "Логическое мышление"},
            {"module": "SJT", "scale": "learning", "weight": 1.5, "label": "Стратегии обучения"},
            {"module": "RIASEC", "scale": "Enterprising", "weight": -1.0, "label": "Предпринимательские интересы"},
        ],
    },
]
