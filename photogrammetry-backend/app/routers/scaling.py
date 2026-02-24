from fastapi import APIRouter, HTTPException

from app.models.scaling import ScaleRequest, ScaleResponse
from app.services.job_manager import job_manager
from app.services.scaling_service import ScalingService

router = APIRouter()
scaling_service = ScalingService()


@router.post("/scaling/estimate", response_model=ScaleResponse)
async def estimate_scale(request: ScaleRequest):
    job = job_manager.get_job(request.job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        result = scaling_service.estimate_height(
            job_id=request.job_id,
            true_length_cm=request.true_coral_length_cm,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found for this job")

    job_manager.update_job(
        request.job_id, estimated_height_cm=result.estimated_height_cm
    )

    return result
