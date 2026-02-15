from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    RECONSTRUCTING = "reconstructing"
    MESHING = "meshing"
    SCALING = "scaling"
    COMPLETE = "complete"
    ERROR = "error"


class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: JobStatus = JobStatus.PENDING
    progress: int = 0
    stage: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    output_url: str | None = None
    estimated_height_cm: float | None = None
    error: str | None = None
