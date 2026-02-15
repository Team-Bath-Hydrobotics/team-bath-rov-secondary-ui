from fastapi import APIRouter, HTTPException

from app.models.job import Job
from app.services.job_manager import job_manager

router = APIRouter()


@router.post("/jobs", response_model=Job)
async def create_job():
    return job_manager.create_job()


@router.get("/jobs", response_model=list[Job])
async def list_jobs():
    return job_manager.list_jobs()


@router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
