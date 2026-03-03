import { useCallback, useRef, useState, useEffect } from 'react';
import JSZip from 'jszip';

interface UseCanvasRecorderOptions {
  /** Interval between captured frames in ms (default: 2000) */
  frameIntervalMs?: number;
  /** JPEG quality 0–1 (default: 0.95) */
  jpegQuality?: number;
}

/**
 * Hook that captures JPEG frames from a canvas at regular intervals
 * during recording, then downloads them as a ZIP on stop.
 */
export function useCanvasRecorder(cameraName: string, options?: UseCanvasRecorderOptions) {
  const { frameIntervalMs = 2000, jpegQuality = 0.95 } = options ?? {};

  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    canvasRef.current = null;
    framesRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) framesRef.current.push(blob);
      },
      'image/jpeg',
      jpegQuality,
    );
  }, [jpegQuality]);

  const startRecording = useCallback(
    (canvas: HTMLCanvasElement) => {
      framesRef.current = [];
      canvasRef.current = canvas;

      // Capture first frame immediately, then at intervals
      captureFrame();
      intervalRef.current = setInterval(captureFrame, frameIntervalMs);
    },
    [captureFrame, frameIntervalMs],
  );

  const stopRecording = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const frames = framesRef.current;
    if (frames.length === 0) {
      cleanup();
      return;
    }

    setIsProcessing(true);

    try {
      const zip = new JSZip();
      frames.forEach((frameBlob, i) => {
        const name = `frame_${String(i + 1).padStart(4, '0')}.jpg`;
        zip.file(name, frameBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(zipBlob, `${cameraName}_${timestamp}.zip`);
    } finally {
      cleanup();
      setIsProcessing(false);
    }
  }, [cameraName, cleanup]);

  return { isProcessing, startRecording, stopRecording } as const;
}

/** Trigger a browser download for a Blob. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
