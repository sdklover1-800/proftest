"""
What the cognitive item codes mean.

Go/no-go trials are the one place where doing nothing is itself an answer, so
both answer handling and scoring need to agree on which stimulus is which.
Keeping the rule here stops the two from drifting apart.
"""

import re

from app.models.question import Question

GO_NO_GO_PREFIX = "COG_GO_"
SPEED_PREFIXES = ("COG_A_", "COG_B_", "COG_C_", "COG_D_")
MEMORY_PREFIX = "COG_MEM_"

_NO_GO_MARKERS = re.compile(r"🔴|red|красн|қызыл", re.IGNORECASE)
_HOLD_OPTION = re.compile(r"skip|пропус|өткіз", re.IGNORECASE)


def is_go_no_go(question: Question) -> bool:
    return bool(question.code) and question.code.startswith(GO_NO_GO_PREFIX)


def is_no_go_stimulus(question: Question) -> bool:
    """A red stimulus: the correct response is to hold back."""
    text = " ".join(
        filter(None, [question.text_ru, question.text_kz, question.text_en])
    )
    return bool(_NO_GO_MARKERS.search(text))


def hold_option_index(question: Question) -> int | None:
    """Position of the 'skip' option, i.e. what not reacting amounts to."""
    for index, option in enumerate(question.options or []):
        if isinstance(option, dict) and _HOLD_OPTION.search(str(option.get("text", ""))):
            return index
    return None
