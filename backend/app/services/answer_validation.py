"""
Value rules for a submitted answer.

Scoring assumes scale answers sit on the 1..5 Likert range and that choice
answers carry one of the weights declared on the question. Anything else
silently distorts every score derived from the run, so it is rejected at the
edge instead.
"""

from fastapi import HTTPException, status

from app.models.question import Question, QuestionTypeEnum

SCALE_MIN_VALUE = 1
SCALE_MAX_VALUE = 5


def allowed_choice_values(question: Question) -> set[int]:
    """Weights declared on a choice question, ignoring malformed entries."""
    values: set[int] = set()
    for option in question.options or []:
        if not isinstance(option, dict) or "value" not in option:
            continue
        try:
            values.add(int(option["value"]))
        except (TypeError, ValueError):
            continue
    return values


def validate_answer_value(question: Question, value: int) -> None:
    """Raise 422 if `value` is not answerable for `question`."""
    if question.type == QuestionTypeEnum.choice:
        allowed = allowed_choice_values(question)
        # A choice question without usable options cannot constrain anything.
        if allowed and value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=(
                    f"Value {value} is not one of the options offered for "
                    f"question {question.code}."
                ),
            )
        return

    if not SCALE_MIN_VALUE <= value <= SCALE_MAX_VALUE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"Scale answers must be between {SCALE_MIN_VALUE} and "
                f"{SCALE_MAX_VALUE}, got {value}."
            ),
        )
