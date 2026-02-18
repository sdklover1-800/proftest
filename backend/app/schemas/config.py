from typing import Literal

from pydantic import BaseModel, Field

from app.core.test_config_limits import (
    DEFAULT_LIMIT_BY_FIELD,
    get_limits_meta,
)

QualityPrediction = Literal["good", "acceptable", "too_short", "fatigue_risk"]


class TestConfigBase(BaseModel):
    # Total question/scenario/task budgets per module.
    riasec_limit: int = Field(default=DEFAULT_LIMIT_BY_FIELD["riasec_limit"], ge=0)
    big5_limit: int = Field(default=DEFAULT_LIMIT_BY_FIELD["big5_limit"], ge=0)
    sjt_limit: int = Field(default=DEFAULT_LIMIT_BY_FIELD["sjt_limit"], ge=0)
    cognitive_limit: int = Field(default=DEFAULT_LIMIT_BY_FIELD["cognitive_limit"], ge=0)


class TestConfigUpdate(TestConfigBase):
    pass


class TestConfigOut(TestConfigBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class ModuleLimitMeta(BaseModel):
    hard_min: int
    recommended_min: int
    recommended_max: int
    optimal_min: int
    optimal_max: int
    default: int
    hard_max: int
    avg_seconds_per_item: int


class TestConfigResponse(TestConfigOut):
    limits_meta: dict[str, ModuleLimitMeta] = Field(default_factory=get_limits_meta)
    warnings: list[str] = Field(default_factory=list)
    estimated_total_minutes: int = 0
    quality_prediction: QualityPrediction = "acceptable"
