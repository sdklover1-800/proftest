"""
Admin test configuration endpoints.
Protected by superuser authentication.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.config import TestConfig
from app.models.user import User
from app.schemas.config import TestConfigOut, TestConfigUpdate

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


@router.get("/config", response_model=TestConfigOut)
async def get_config(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Get current active test configuration."""
    return await get_active_config(db)


@router.post("/config", response_model=TestConfigOut)
async def update_config(
    config_in: TestConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    """Update test configuration. Ensures only one active config exists."""
    result = await db.execute(
        select(TestConfig).where(TestConfig.is_active == True).order_by(TestConfig.id.desc())
    )
    config = result.scalars().first()

    if not config:
        config = TestConfig(
            riasec_limit=config_in.riasec_limit,
            big5_limit=config_in.big5_limit,
            sjt_limit=config_in.sjt_limit,
            cognitive_limit=config_in.cognitive_limit,
            is_active=True,
        )
        db.add(config)
        await db.flush()
    else:
        config.riasec_limit = config_in.riasec_limit
        config.big5_limit = config_in.big5_limit
        config.sjt_limit = config_in.sjt_limit
        config.cognitive_limit = config_in.cognitive_limit
        config.is_active = True

    await db.execute(
        update(TestConfig)
        .where(TestConfig.id != config.id)
        .values(is_active=False)
    )
    await db.commit()
    await db.refresh(config)
    return config
