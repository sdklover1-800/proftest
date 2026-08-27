"""
Putting a score next to everyone else's.

A raw percentage is not a result. "Realistic 66" means nothing until you know
that half the comparison group scores below 55 — only then does 66 become
"above average". Every number the app reports is positioned this way.

The reference values below are PROVISIONAL: they are reasonable starting
distributions, not norms measured on this app's own population. Each answer
says which it is, so the interface can be honest about it, and so that
swapping in real collected norms later is a data change rather than a
rewrite.
"""

from dataclasses import dataclass
from enum import StrEnum
from math import erf, sqrt


class NormSource(StrEnum):
    """Where the comparison distribution came from."""

    #: Starting values, not measured on this app's users.
    provisional = "provisional"
    #: Derived from runs collected by this app.
    sample = "sample"
    #: No reference exists for this scale.
    none = "none"


@dataclass(frozen=True)
class Positioned:
    """A score placed against its reference distribution."""

    raw: int
    percentile: int | None
    median: int | None
    source: NormSource


# median and spread (standard deviation) per scale, on the 0..100 reporting
# scale the scoring service produces.
_PROVISIONAL: dict[str, dict[str, tuple[int, int]]] = {
    "RIASEC": {
        "Realistic": (55, 16),
        "Investigative": (52, 16),
        "Artistic": (58, 16),
        "Social": (61, 15),
        "Enterprising": (57, 16),
        "Conventional": (53, 16),
    },
    "BIG5": {
        "Openness": (62, 15),
        "Conscientiousness": (58, 16),
        "Extraversion": (54, 17),
        "Agreeableness": (64, 14),
        "Neuroticism": (48, 17),
    },
    "COGNITIVE": {
        "total_score": (55, 18),
        "processing_speed": (54, 18),
        "working_memory": (56, 19),
        "attention": (57, 18),
        "logic": (55, 19),
    },
    "SJT": {
        "self_organization": (60, 15),
        "teamwork": (64, 14),
        "initiative": (56, 16),
        "stress": (57, 16),
        "learning": (61, 15),
        # The self-report half of block D reports under its own category name.
        "self_org": (60, 15),
    },
}

#: Headline values that summarise other scales in the same module.
AGGREGATE_SCALES = {"total_score"}

#: Percentiles are never reported as 0 or 100 — no finite sample justifies
#: claiming somebody is beyond everyone.
_MIN_PERCENTILE = 1
_MAX_PERCENTILE = 99


def _normal_percentile(raw: float, median: float, spread: float) -> int:
    """Share of the reference group scoring below `raw`, as a whole percent."""
    if spread <= 0:
        return 50
    z = (raw - median) / spread
    share = 0.5 * (1.0 + erf(z / sqrt(2.0)))
    return max(_MIN_PERCENTILE, min(_MAX_PERCENTILE, round(share * 100)))


def percentile_for(module: str, scale: str, raw: float) -> Positioned:
    """Place one score against its reference distribution."""
    reference = _PROVISIONAL.get(module, {}).get(scale)
    if reference is None:
        return Positioned(raw=int(raw), percentile=None, median=None, source=NormSource.none)

    median, spread = reference
    return Positioned(
        raw=int(raw),
        percentile=_normal_percentile(raw, median, spread),
        median=median,
        source=NormSource.provisional,
    )


def percentiles_for_profile(scores: dict) -> dict[str, dict[str, dict]]:
    """
    Position every scale of a finished run.

    Returns `{module: {scale: {raw, percentile, median, source}}}`, skipping
    scales with no reference so the caller never shows a made-up comparison.
    """
    positioned: dict[str, dict[str, dict]] = {}

    for module, values in (scores or {}).items():
        if not isinstance(values, dict):
            continue

        # COGNITIVE reports a headline plus a details block. The headline is an
        # average of the details, so listing it beside them reads as one more
        # skill and counts the same evidence twice.
        details = values.get("details")
        has_details = isinstance(details, dict) and details

        flat: dict[str, float] = {}
        for key, value in values.items():
            if key == "details" and isinstance(value, dict):
                flat.update({k: v for k, v in value.items() if isinstance(v, (int, float))})
            elif key in AGGREGATE_SCALES and has_details:
                continue
            elif isinstance(value, (int, float)):
                flat[key] = value

        module_result: dict[str, dict] = {}
        for scale, raw in flat.items():
            placed = percentile_for(module, scale, raw)
            if placed.percentile is None:
                continue
            module_result[scale] = {
                "raw": placed.raw,
                "percentile": placed.percentile,
                "median": placed.median,
                "source": placed.source.value,
            }

        if module_result:
            positioned[module] = module_result

    return positioned
