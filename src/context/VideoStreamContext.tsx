import { createContext, useContext } from 'react';

interface VideoStreamContextValue {
  registerCamera: (cameraId: number, canvas: HTMLCanvasElement | null) => void;
}

export const VideoStreamContext = createContext<VideoStreamContextValue | undefined>(undefined);

export const useVideoStreamContext = () => {
  const context = useContext(VideoStreamContext);
  if (!context) {
    throw new Error('useVideoStreamContext must be used within VideoStreamProvider');
  }
  return context;
};
