import asyncio
import os
import tempfile
import unittest
from collections.abc import Coroutine
from typing import Any, TypeVar

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

import app.models  # noqa: F401
from app.api import deps
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from main import app

T = TypeVar("T")


class ApiTestCase(unittest.TestCase):
    """
    Base case for endpoint tests that need a real database.

    Uses a file-backed SQLite database with NullPool so connections are never
    reused across event loops (TestClient runs the app in its own loop).
    """

    def setUp(self) -> None:
        handle, self._db_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(handle)
        self.engine = create_async_engine(
            f"sqlite+aiosqlite:///{self._db_path}",
            poolclass=NullPool,
        )
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        self.await_(self._create_tables())

        async def override_db():
            async with self.session_factory() as session:
                yield session

        app.dependency_overrides[get_db] = override_db
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()
        self.await_(self.engine.dispose())
        os.unlink(self._db_path)

    @staticmethod
    def await_(coro: Coroutine[Any, Any, T]) -> T:
        """Run a coroutine outside the app's event loop (setup/seed helpers)."""
        return asyncio.run(coro)

    async def _create_tables(self) -> None:
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    def authenticate_as(self, user: User) -> None:
        """Force endpoints to see `user` as the caller."""

        async def override_current_user() -> User:
            return user

        app.dependency_overrides[deps.get_current_user] = override_current_user

    def authenticate_as_nobody(self) -> None:
        """Drop the auth override so real token checks apply."""
        app.dependency_overrides.pop(deps.get_current_user, None)
