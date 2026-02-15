from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from app.models.job import JobStatus
from app.services.job_manager import job_manager
from app.services.manual_cad_service import ManualCADService

router = APIRouter()
cad_service = ManualCADService()


class ManualCADRequest(BaseModel):
    job_id: str
    estimated_height_cm: float
    true_coral_length_cm: float


@router.post("/manual-cad/generate")
async def generate_manual_cad(request: ManualCADRequest):
    job = job_manager.get_job(request.job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    cad_service.generate(
        job_id=request.job_id,
        height_cm=request.estimated_height_cm,
        length_cm=request.true_coral_length_cm,
    )

    output_url = f"/api/jobs/{request.job_id}/model"
    job_manager.update_job(
        request.job_id, status=JobStatus.COMPLETE, output_url=output_url
    )

    return {
        "job_id": request.job_id,
        "output_url": output_url,
        "message": "Manual CAD model generated",
    }
