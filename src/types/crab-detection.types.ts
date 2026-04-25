export type APIStatus = 'alive' | 'down';

/** Response from POST /api/detect endpoint. */
export interface DetectionResponse {
  processed_frame: string; // Base64-encoded image with detections drawn
  detections: CrabDetection[];
  count: number;
}

export interface CrabDetection {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  confidence: number;
  type: string;
}

/** Response from GET /api/model endpoint. */
export interface ModelResponse {
  app_name: string;
  app_version: string;
  framework: string;
  model: string;
}
