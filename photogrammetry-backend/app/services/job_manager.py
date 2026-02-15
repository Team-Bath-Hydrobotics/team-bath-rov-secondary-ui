import threading
from typing import Any

from app.models.job import Job


class JobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()

    def create_job(self) -> Job:
        job = Job()
        with self._lock:
            self._jobs[job.id] = job
        return job

    def get_job(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def list_jobs(self) -> list[Job]:
        return list(self._jobs.values())

    def update_job(self, job_id: str, **fields: Any) -> Job | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            updated = job.model_copy(update=fields)
            self._jobs[job_id] = updated
            return updated


job_manager = JobManager()
