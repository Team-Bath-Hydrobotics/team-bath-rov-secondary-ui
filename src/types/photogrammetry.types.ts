/**
 * Types for the Photogrammetry feature.
 * MATE ROV 2026 Competition Task 1.2 - Coral garden 3D modeling.
 */

/**
 * Reconstruction processing status.
 */
export type ReconstructionStatus = 'idle' | 'processing' | 'complete' | 'error';

/**
 * State for the Photogrammetry page.
 */
export interface PhotogrammetryState {
  /** Array of uploaded image files from the folder upload */
  uploadedImages: File[];
  /** Display path of the uploaded folder */
  folderPath: string;
  /** Estimated coral height in cm (from reconstruction) */
  estimatedCoralHeight: number | null;
  /** True coral length in cm as provided by the judge */
  trueCoralLength: number | null;
  /** Scale adjustment multiplier (0.1 to 5.0, default 1.0) */
  modelScale: number;
  /** Current status of 3D reconstruction */
  reconstructionStatus: ReconstructionStatus;
}

/** Job status enum matching the backend JobStatus. */
export type JobStatus =
  | 'pending'
  | 'uploading'
  | 'reconstructing'
  | 'meshing'
  | 'scaling'
  | 'complete'
  | 'error';

/** Response from GET/POST /api/jobs endpoints. */
export interface JobResponse {
  id: string;
  status: JobStatus;
  progress: number;
  stage: string | null;
  created_at: string;
  output_url: string | null;
  estimated_height_cm: number | null;
  error: string | null;
}

/** Response from POST /api/upload. */
export interface UploadResponse {
  job_id: string;
  file_count: number;
  total_size_mb: number;
}

/** Response from POST /api/photogrammetry/run. */
export interface RunResponse {
  job_id: string;
  status: string;
  message: string;
}

/** Response from POST /api/scaling/estimate. */
export interface ScaleResponse {
  job_id: string;
  estimated_height_cm: number;
  scale_factor: number;
  bounding_box: {
    width: number;
    height: number;
    depth: number;
  };
}

/** Response from POST /api/manual-cad/generate. */
export interface ManualCADResponse {
  job_id: string;
  output_url: string;
  message: string;
}

/** Typed API error thrown by the photogrammetry client. */
export interface ApiError extends Error {
  status: number;
}

export function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  return error;
}
