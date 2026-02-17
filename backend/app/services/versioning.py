RULESET_VERSION = "ruleset@2026-02-17"
SCORING_MODEL_VERSION = "scoring@v1.1"
LLM_TEXT_VERSION = "llm-text@v1.0"


def as_dict() -> dict[str, str]:
    return {
        "ruleset_version": RULESET_VERSION,
        "scoring_model_version": SCORING_MODEL_VERSION,
        "llm_text_version": LLM_TEXT_VERSION,
    }
