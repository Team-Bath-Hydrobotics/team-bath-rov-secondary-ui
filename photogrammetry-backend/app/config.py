from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 8100
    UPLOAD_DIR: Path = Path("data/uploads")
    OUTPUT_DIR: Path = Path("data/outputs")
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_prefix": ""}


settings = Settings()
