from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.config import settings
from app.models.job import JobStatus
from app.services.job_manager import job_manager

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/tiff", "image/webp"}


@router.post("/upload")
async def upload_images(
    job_id: str = Form(...),
    files: list[UploadFile] = File(...),
):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    for f in files:
        if f.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {f.content_type}. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
            )

    job_manager.update_job(job_id, status=JobStatus.UPLOADING)

    upload_dir = settings.UPLOAD_DIR / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    total_size = 0
    for f in files:
        content = await f.read()
        total_size += len(content)
        file_path = upload_dir / f.filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)

    job_manager.update_job(job_id, status=JobStatus.PENDING)

    return {
        "job_id": job_id,
        "file_count": len(files),
        "total_size_mb": round(total_size / (1024 * 1024), 2),
    }
