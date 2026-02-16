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
