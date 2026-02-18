import json
from pathlib import Path
from typing import Annotated, Any
from urllib.parse import urlparse

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SECRET_KEY = "changethis-to-a-secure-secret-key-in-production"
DEFAULT_DEV_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
DEFAULT_DEV_TRUSTED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "testserver",
]


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "proftest"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin@localhost:5432/proftest"
    SYNC_DATABASE_URL: str | None = None

    # Security
    SECRET_KEY: str = DEFAULT_SECRET_KEY
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
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = DEFAULT_DEV_CORS_ORIGINS
    BACKEND_CORS_ORIGIN_REGEX: str | None = None
    BACKEND_CORS_ALLOW_CREDENTIALS: bool = False
    BACKEND_TRUSTED_HOSTS: Annotated[list[str], NoDecode] = DEFAULT_DEV_TRUSTED_HOSTS

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
        return list(DEFAULT_DEV_CORS_ORIGINS)

    @field_validator("BACKEND_TRUSTED_HOSTS", mode="before")
    @classmethod
    def parse_trusted_hosts(cls, value: Any) -> list[str]:
        def normalize_host(raw_value: str) -> str:
            value_str = raw_value.strip()
            if not value_str:
                return ""
            if value_str == "*":
                return value_str
            if "://" in value_str:
                parsed = urlparse(value_str)
                if parsed.hostname:
                    return parsed.hostname.strip()
            if ":" in value_str:
                return value_str.split(":", 1)[0].strip()
            return value_str

        if isinstance(value, str):
            raw = value.strip()
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        hosts = [normalize_host(str(item)) for item in parsed]
                        return [item for item in hosts if item]
                except Exception:
                    pass
            hosts = [normalize_host(item) for item in raw.split(",")]
            return [item for item in hosts if item]
        if isinstance(value, list):
            hosts = [normalize_host(str(item)) for item in value]
            return [item for item in hosts if item]
        return list(DEFAULT_DEV_TRUSTED_HOSTS)

    @staticmethod
    def _normalize_async_db_url_value(url: str) -> str:
        if url.startswith("postgresql+asyncpg://"):
            return url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @staticmethod
    def _normalize_sync_db_url_value(url: str) -> str:
        if url.startswith("postgresql+psycopg2://"):
            return url
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        return url

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_async_db_url(cls, value: Any) -> Any:
        if not isinstance(value, str):
            return value
        return cls._normalize_async_db_url_value(value.strip())

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def normalize_sync_db_url(cls, value: Any) -> Any:
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        url = value.strip()
        if not url:
            return None
        return cls._normalize_sync_db_url_value(url)

    @model_validator(mode="after")
    def finalize(self) -> "Settings":
        if not self.SYNC_DATABASE_URL:
            self.SYNC_DATABASE_URL = self._normalize_sync_db_url_value(self.DATABASE_URL)

        environment = self.ENVIRONMENT.strip().lower()
        if environment in {"production", "prod"}:
            if self.SECRET_KEY == DEFAULT_SECRET_KEY or len(self.SECRET_KEY.strip()) < 32:
                raise ValueError(
                    "SECRET_KEY must be set to a strong value (at least 32 chars) in production."
                )
            if "*" in self.BACKEND_CORS_ORIGINS:
                raise ValueError(
                    "BACKEND_CORS_ORIGINS cannot contain '*' in production."
                )
            if not self.BACKEND_CORS_ORIGINS:
                raise ValueError(
                    "BACKEND_CORS_ORIGINS must be configured in production."
                )
            if any(not origin.startswith("https://") for origin in self.BACKEND_CORS_ORIGINS):
                raise ValueError(
                    "BACKEND_CORS_ORIGINS must use https:// URLs in production."
                )
            if "*" in self.BACKEND_TRUSTED_HOSTS:
                raise ValueError(
                    "BACKEND_TRUSTED_HOSTS cannot contain '*' in production."
                )
            if not self.BACKEND_TRUSTED_HOSTS:
                raise ValueError(
                    "BACKEND_TRUSTED_HOSTS must be configured in production."
                )
        return self

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
