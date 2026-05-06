from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    NASA_API_KEY: str = "DEMO_KEY"
    CACHE_DIR: Path = Path(".cache")
    CACHE_TTL_SECONDS: int = 21600  # 6 hours
    MAX_RANGE_DAYS: int = 90
    NASA_CONCURRENCY: int = 4
    NASA_BASE_URL: str = "https://api.nasa.gov/neo/rest/v1"


def get_settings() -> Settings:
    return Settings()
