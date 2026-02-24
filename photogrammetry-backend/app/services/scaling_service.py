from pathlib import Path

import trimesh

from app.config import settings
from app.models.scaling import BoundingBox, ScaleResponse


class ScalingService:
    def estimate_height(self, job_id: str, true_length_cm: float) -> ScaleResponse:
        model_path = settings.OUTPUT_DIR / job_id / "model.glb"
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}")

        scene = trimesh.load(str(model_path), file_type="glb")

        if isinstance(scene, trimesh.Scene):
            mesh = scene.dump(concatenate=True)
        else:
            mesh = scene

        bounds = mesh.bounding_box.extents
        width, height, depth = float(bounds[0]), float(bounds[1]), float(bounds[2])

        longest_horizontal = max(width, depth)
        scale_factor = true_length_cm / longest_horizontal
        estimated_height_cm = height * scale_factor

        return ScaleResponse(
            job_id=job_id,
            estimated_height_cm=round(estimated_height_cm, 2),
            scale_factor=round(scale_factor, 4),
            bounding_box=BoundingBox(
                width=round(width, 4),
                height=round(height, 4),
                depth=round(depth, 4),
            ),
        )
