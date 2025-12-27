from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "proftest"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin@localhost:5432/proftest"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:admin@localhost:5432/proftest"
    
    # CORS
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    class Config:
        # env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
