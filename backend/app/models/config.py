from sqlalchemy import Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.test_config_limits import DEFAULT_LIMIT_BY_FIELD
from app.db.base import Base


class TestConfig(Base):
    """
    Configuration for limiting the total number of questions per module.
    Only one row should be active at a time.
    """

    __tablename__ = "test_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Session defaults tuned for a realistic first pass without excessive fatigue.
    riasec_limit: Mapped[int] = mapped_column(Integer, default=DEFAULT_LIMIT_BY_FIELD["riasec_limit"])
    big5_limit: Mapped[int] = mapped_column(Integer, default=DEFAULT_LIMIT_BY_FIELD["big5_limit"])
    sjt_limit: Mapped[int] = mapped_column(Integer, default=DEFAULT_LIMIT_BY_FIELD["sjt_limit"])
    cognitive_limit: Mapped[int] = mapped_column(Integer, default=DEFAULT_LIMIT_BY_FIELD["cognitive_limit"])
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
