from pydantic import BaseModel


class BoundingBox(BaseModel):
    width: float
    height: float
    depth: float


class ScaleRequest(BaseModel):
    job_id: str
    true_coral_length_cm: float


class ScaleResponse(BaseModel):
    job_id: str
    estimated_height_cm: float
    scale_factor: float
    bounding_box: BoundingBox
