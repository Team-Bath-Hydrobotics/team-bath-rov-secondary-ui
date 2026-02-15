from pathlib import Path

from app.config import settings


def ensure_data_dirs() -> None:
    """Create upload and output directories if they don't exist."""
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
