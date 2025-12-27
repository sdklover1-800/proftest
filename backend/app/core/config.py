from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "proftest"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin@localhost:5432/proftest"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:admin@localhost:5432/proftest"
    
    # CORS
    # Security
    SECRET_KEY: str = "changethis-to-a-secure-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    class Config:
        # env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
