"""
Admin test configuration endpoints.
Protected by superuser authentication.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser
from app.core.test_config_limits import (
    build_recommendation_warnings,
    enforce_hard_minimums,
    estimate_total_minutes,
    get_limits_meta,
    MIN_LIMIT_BY_FIELD,
    normalize_config_values,
    predict_quality,
    validate_hard_limits_or_422,
)
from app.db.session import get_db
from app.models.config import TestConfig
from app.models.user import User
from app.schemas.config import TestConfigResponse, TestConfigUpdate

router = APIRouter()


async def get_active_config(db: AsyncSession) -> TestConfig:
    result = await db.execute(
        select(TestConfig).where(TestConfig.is_active == True).order_by(TestConfig.id.desc())
    )
    config = result.scalars().first()

    if not config:
        config = TestConfig()
        db.add(config)
        await db.commit()
        await db.refresh(config)
        return config

    # Backward compatibility: normalize legacy rows that were saved
    # with lower module limits (e.g. old RIASEC=20).
    normalized = enforce_hard_minimums(
        {
            "riasec_limit": config.riasec_limit,
            "big5_limit": config.big5_limit,
            "sjt_limit": config.sjt_limit,
            "cognitive_limit": config.cognitive_limit,
        }
    )
    has_changes = any(
        getattr(config, field_key) != normalized[field_key]
        for field_key in MIN_LIMIT_BY_FIELD
    )
    if has_changes:
        config.riasec_limit = normalized["riasec_limit"]
        config.big5_limit = normalized["big5_limit"]
        config.sjt_limit = normalized["sjt_limit"]
        config.cognitive_limit = normalized["cognitive_limit"]
        await db.commit()
        await db.refresh(config)

    return config


def build_config_response(config: TestConfig) -> TestConfigResponse:
    config_values = enforce_hard_minimums(
        {
            "riasec_limit": config.riasec_limit,
            "big5_limit": config.big5_limit,
            "sjt_limit": config.sjt_limit,
            "cognitive_limit": config.cognitive_limit,
        }
    )
    return TestConfigResponse(
        id=config.id,
        is_active=config.is_active,
        riasec_limit=config_values["riasec_limit"],
        big5_limit=config_values["big5_limit"],
        sjt_limit=config_values["sjt_limit"],
        cognitive_limit=config_values["cognitive_limit"],
        limits_meta=get_limits_meta(),
        warnings=build_recommendation_warnings(config_values),
        estimated_total_minutes=estimate_total_minutes(config_values),
        quality_prediction=predict_quality(config_values),
    )


@router.get("/config", response_model=TestConfigResponse)
async def get_config(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Get current active test configuration."""
    config = await get_active_config(db)
    return build_config_response(config)


@router.post("/config", response_model=TestConfigResponse)
async def update_config(
    config_in: TestConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Update test configuration. Ensures only one active config exists."""
    config_values = normalize_config_values(config_in.model_dump())
    validate_hard_limits_or_422(config_values)
    config_values = enforce_hard_minimums(config_values)

    result = await db.execute(
        select(TestConfig).where(TestConfig.is_active == True).order_by(TestConfig.id.desc())
    )
    config = result.scalars().first()

    if not config:
        config = TestConfig(
            riasec_limit=config_values["riasec_limit"],
            big5_limit=config_values["big5_limit"],
            sjt_limit=config_values["sjt_limit"],
            cognitive_limit=config_values["cognitive_limit"],
            is_active=True,
        )
        db.add(config)
        await db.flush()
    else:
        config.riasec_limit = config_values["riasec_limit"]
        config.big5_limit = config_values["big5_limit"]
        config.sjt_limit = config_values["sjt_limit"]
        config.cognitive_limit = config_values["cognitive_limit"]
        config.is_active = True

    await db.execute(
        update(TestConfig)
        .where(TestConfig.id != config.id)
        .values(is_active=False)
    )
    await db.commit()
    await db.refresh(config)
    return build_config_response(config)
