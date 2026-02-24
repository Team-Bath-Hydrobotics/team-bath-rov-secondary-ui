from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.config import settings
from app.routers import health, jobs, manual_cad, scaling, upload, photogrammetry
from app.services.job_manager import job_manager
from app.utils.file_utils import ensure_data_dirs


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_data_dirs()
    yield


app = FastAPI(title="Photogrammetry Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(manual_cad.router, prefix="/api")
app.include_router(scaling.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(photogrammetry.router, prefix="/api")


@app.get("/api/jobs/{job_id}/model")
async def serve_model(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    model_path = settings.OUTPUT_DIR / job_id / "model.glb"
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model not found")

    return FileResponse(
        path=str(model_path),
        media_type="model/gltf-binary",
        filename="model.glb",
    )
