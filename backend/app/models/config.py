from sqlalchemy import Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TestConfig(Base):
    """
    Configuration for limiting the number of questions per module.
    Only one row should be active at a time.
    """

    __tablename__ = "test_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    riasec_limit: Mapped[int] = mapped_column(Integer, default=10)
    big5_limit: Mapped[int] = mapped_column(Integer, default=10)
    sjt_limit: Mapped[int] = mapped_column(Integer, default=10)
    cognitive_limit: Mapped[int] = mapped_column(Integer, default=10)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
