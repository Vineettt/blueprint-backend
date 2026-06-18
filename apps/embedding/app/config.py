from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    EMBEDDING_HOST: str = "0.0.0.0"
    EMBEDDING_PORT: int = 8000
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    ENVIRONMENT: str = "production"  # Set to "production" or "development"

    model_config = SettingsConfigDict(
        env_file=str(ROOT_ENV),
        extra="ignore",
    )


settings = Settings()
