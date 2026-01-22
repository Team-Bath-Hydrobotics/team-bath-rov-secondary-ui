import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface DetectorContextType {
  crabCount: number; // This comes from the "live" data
  isRecording: boolean;
}

const DetectorContext = createContext<DetectorContextType | undefined>(undefined);

export const DetectorProvider = ({ children }: { children: ReactNode }) => {
  const [crabCount, setCrabCount] = useState(0);

  // Connect to a WebSocket or MQTT
  useEffect(() => {
    const interval = setInterval(() => {
      // Logic: Update count based on what the AI sees in the video
      const liveCountFromAi = 0; // Placeholder for AI detection result
      setCrabCount(liveCountFromAi);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <DetectorContext.Provider value={{ crabCount, isRecording: false }}>
      {children}
    </DetectorContext.Provider>
  );
};

export const useDetectorContext = () => {
  const context = useContext(DetectorContext);
  if (!context) throw new Error('useDetectorContext must be used within DetectorProvider');
  return context;
};
