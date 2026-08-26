"""
Turning what the person picked into what it is worth.

Scale questions are their own score: a 4 means 4. Choice questions are not —
the option weights are the answer key for cognitive and situational items, so
they never leave the server. The client sends back the position it chose and
this module resolves it, rejecting anything the question cannot be answered
with.
"""

from fastapi import HTTPException, status

from app.models.question import Question, QuestionTypeEnum
from app.services.cognitive_items import hold_option_index, is_go_no_go

SCALE_MIN_VALUE = 1
SCALE_MAX_VALUE = 5

# Nothing was chosen and the question is not one where holding back counts.
NO_ANSWER_WEIGHT = 0


def _option_weight(question: Question, index: int) -> int:
    option = (question.options or [])[index]
    if not isinstance(option, dict) or "value" not in option:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Option {index} of question {question.code} carries no weight.",
        )
    try:
        return int(option["value"])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Option {index} of question {question.code} has a malformed weight.",
        ) from None


def _resolve_choice(question: Question, chosen_index: int, timed_out: bool) -> int:
    options = question.options or []
    if not options:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Question {question.code} offers no options to choose from.",
        )

    if timed_out:
        # Running out of time on a go/no-go trial is a real response: the
        # person did not press. Elsewhere it simply earns nothing.
        if is_go_no_go(question):
            hold_index = hold_option_index(question)
            if hold_index is not None:
                return _option_weight(question, hold_index)
        return NO_ANSWER_WEIGHT

    if not 0 <= chosen_index < len(options):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"Question {question.code} has {len(options)} options; "
                f"position {chosen_index} is not one of them."
            ),
        )
    return _option_weight(question, chosen_index)


def resolve_answer_value(question: Question, value: int, timed_out: bool = False) -> int:
    """
    Score to store for this answer.

    `value` is the rating for a scale question and the chosen option's position
    for a choice question. Raises 422 if the question cannot be answered that way.
    """
    if question.type == QuestionTypeEnum.choice:
        return _resolve_choice(question, value, timed_out)

    if not SCALE_MIN_VALUE <= value <= SCALE_MAX_VALUE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"Scale answers must be between {SCALE_MIN_VALUE} and "
                f"{SCALE_MAX_VALUE}, got {value}."
            ),
        )
    return value
