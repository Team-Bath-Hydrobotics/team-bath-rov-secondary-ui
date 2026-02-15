from pathlib import Path

import numpy as np
import trimesh

from app.config import settings


class ManualCADService:
    def generate(self, job_id: str, height_cm: float, length_cm: float) -> str:
        """Generate a 3-prism coral model and save as GLB."""
        output_dir = settings.OUTPUT_DIR / job_id
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / "model.glb"

        prisms = []
        for i, (h_scale, x_offset, rotation_deg) in enumerate(
            [
                (1.0, 0.0, 0.0),
                (0.7, length_cm * 0.3, 15.0),
                (0.85, -length_cm * 0.25, -10.0),
            ]
        ):
            prism = self._create_triangular_prism(
                height=height_cm * h_scale,
                base_width=length_cm * 0.3,
                base_depth=length_cm * 0.25,
            )

            rotation = trimesh.transformations.rotation_matrix(
                np.radians(rotation_deg), [0, 0, 1]
            )
            prism.apply_transform(rotation)
            prism.apply_translation([x_offset, 0, 0])

            color = [
                [255, 127, 80, 255],  # coral
                [255, 99, 71, 255],  # tomato
                [233, 150, 122, 255],  # dark salmon
            ][i]
            prism.visual.vertex_colors = np.tile(color, (len(prism.vertices), 1))
            prisms.append(prism)

        scene = trimesh.Scene(prisms)
        scene.export(str(output_path), file_type="glb")
        return str(output_path)

    def _create_triangular_prism(
        self, height: float, base_width: float, base_depth: float
    ) -> trimesh.Trimesh:
        """Create a triangular prism (extruded triangle) along the Z axis."""
        hw = base_width / 2
        vertices = np.array(
            [
                # bottom triangle (z=0)
                [-hw, -base_depth / 2, 0],
                [hw, -base_depth / 2, 0],
                [0, base_depth / 2, 0],
                # top triangle (z=height)
                [-hw, -base_depth / 2, height],
                [hw, -base_depth / 2, height],
                [0, base_depth / 2, height],
            ]
        )
        faces = np.array(
            [
                # bottom
                [0, 2, 1],
                # top
                [3, 4, 5],
                # sides
                [0, 1, 4],
                [0, 4, 3],
                [1, 2, 5],
                [1, 5, 4],
                [2, 0, 3],
                [2, 3, 5],
            ]
        )
        return trimesh.Trimesh(vertices=vertices, faces=faces)
