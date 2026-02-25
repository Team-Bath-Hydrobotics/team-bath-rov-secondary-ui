interface DetectionResult {
  detections?: Array<{
    class: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }>;
  message?: string;
}
export type { DetectionResult };
