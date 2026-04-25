import { createContext, useContext } from 'react';

interface VideoStreamContextValue {
  registerCamera: (cameraId: number, canvas: HTMLCanvasElement | null, isCopilot: boolean) => void;
  registerFrameCallback: (
    cameraId: number,
    isCopilot: boolean,
    callback: ((canvas: HTMLCanvasElement) => void) | null,
  ) => void;
}

export const VideoStreamContext = createContext<VideoStreamContextValue | undefined>(undefined);

export const useVideoStreamContext = () => {
  const context = useContext(VideoStreamContext);
  if (!context) {
    throw new Error('useVideoStreamContext must be used within VideoStreamProvider');
  }
  return context;
};
