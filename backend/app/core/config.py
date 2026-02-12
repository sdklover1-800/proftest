import json
from pathlib import Path
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    PROJECT_NAME: str = "proftest"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin@localhost:5432/proftest"
    SYNC_DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:admin@localhost:5432/proftest"
    )

    # CORS
    # Security
    SECRET_KEY: str = "changethis-to-a-secure-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # OpenAI
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TIMEOUT_SECONDS: int = 60
    OPENAI_MAX_TOKENS: int = 900
    OPENAI_CACHE_TTL_SECONDS: int = 60 * 60 * 24 * 7
    OPENAI_CACHE_MAX_ITEMS: int = 2000

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    BACKEND_CORS_ORIGIN_REGEX: str | None = None
    BACKEND_CORS_ALLOW_CREDENTIALS: bool = False

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            raw = value.strip()
            if raw == "*":
                return ["*"]
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [item.strip() for item in raw.split(",") if item.strip()]
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        return ["*"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_async_db_url(cls, value: Any) -> Any:
        if not isinstance(value, str):
            return value
        url = value.strip()
        if url.startswith("postgresql+asyncpg://"):
            return url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def normalize_sync_db_url(cls, value: Any) -> Any:
        if not isinstance(value, str):
            return value
        url = value.strip()
        if url.startswith("postgresql+psycopg2://"):
            return url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        return url

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
