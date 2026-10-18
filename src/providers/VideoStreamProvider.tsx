import { type ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { VideoStreamContext } from '../context/VideoStreamContext';
import { useAppStateContext } from '../context/AppStateContext';
import JSMpeg from '@cycjimmy/jsmpeg-player';

interface VideoStreamProviderProps {
  children: ReactNode;
}

type WSHandle = {
  player: { destroy: () => void };
};

export const VideoStreamProvider = ({ children }: VideoStreamProviderProps) => {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  const sockets = useRef(new Map<string, WSHandle>());
  const frameCallbacks = useRef(new Map<string, (canvas: HTMLCanvasElement) => void>());
  const isInitializing = useRef(new Set<string>());

  const pendingCanvas = useRef(new Map<string, HTMLCanvasElement>());

  const { state, updateCameraStatus } = useAppStateContext();
  const updateCameraStatusRef = useRef(updateCameraStatus);

  const stateCopilotCamerasRef = useRef(state.camerasCopilot);
  const stateDetectionCamerasRef = useRef(state.camerasDetection);

  const wsBaseUrlRef = useRef(state.settings.networkSettings.wsBaseUrl);

  const isMounted = useRef(true);

  useEffect(() => {
    updateCameraStatusRef.current = updateCameraStatus;
    stateCopilotCamerasRef.current = state.camerasCopilot;
    stateDetectionCamerasRef.current = state.camerasDetection;
  }, [updateCameraStatus, state.camerasCopilot, state.camerasDetection]);

  useEffect(() => {
    wsBaseUrlRef.current = state.settings.networkSettings.wsBaseUrl;
  }, [state.settings.networkSettings.wsBaseUrl]);

  const cleanupSocket = (key: string, cameraId: number, isCopilot: boolean) => {
    const existing = sockets.current.get(key);
    if (!existing) return;

    try {
      existing.player.destroy();
    } catch {
      console.warn(`Error destroying player for ${key}`);
    }

    sockets.current.delete(key);
    frameCallbacks.current.delete(key);
    updateCameraStatusRef.current(cameraId, 'disconnected', isCopilot);
  };

  const startConnection = useCallback(
    (key: string, cameraId: number, canvas: HTMLCanvasElement, isCopilot: boolean) => {
      if (isInitializing.current.has(key)) return;
      isInitializing.current.add(key);

      canvasRefs.current.set(key, canvas);

      cleanupSocket(key, cameraId, isCopilot);

      const basePort = parseInt(wsBaseUrlRef.current.split(':').pop() || '8081', 10);

      // The video processor assigns stream ports as base_port + stream_id.
      // Camera IDs are the stream IDs (1-based), so camera 1 uses base + 1.
      const wsUrl = `ws://localhost:${basePort + cameraId}`;

      updateCameraStatusRef.current(cameraId, 'connecting', isCopilot);

      let statusUpdated = false;

      const markConnected = () => {
        if (statusUpdated) return;
        statusUpdated = true;

        updateCameraStatusRef.current(cameraId, 'connected', isCopilot);
        isInitializing.current.delete(key);
      };

      const markFailed = () => {
        if (statusUpdated) return;
        statusUpdated = true;

        updateCameraStatusRef.current(cameraId, 'failed', isCopilot);
        cleanupSocket(key, cameraId, isCopilot);
        isInitializing.current.delete(key);
      };

      try {
        const player = new JSMpeg.Player(wsUrl, {
          canvas,
          autoplay: true,
          audio: false,
          preserveDrawingBuffer: true,
          videoBufferSize: 512 * 1024,
          onSourceEstablished: markConnected,
          onSourceCompleted: () => {
            if (!statusUpdated) markFailed();
            else updateCameraStatusRef.current(cameraId, 'disconnected', isCopilot);
            isInitializing.current.delete(key);
          },
          onVideoDecode: () => {
            const callback = frameCallbacks.current.get(key);
            if (callback) callback(canvas);
          },
        });

        sockets.current.set(key, { player });
      } catch (error) {
        console.warn(`Failed to start MPEG-TS player for ${key}`, error);
        markFailed();
      }

      setTimeout(() => {
        isInitializing.current.delete(key);
      }, 1500);
    },
    [],
  );

  const registerCamera = useCallback(
    (cameraId: number, canvas: HTMLCanvasElement | null, isCopilot: boolean) => {
      const key = `${isCopilot ? 'copilot' : 'detection'}_${cameraId}`;

      // CASE 1: canvas becomes available → start connection
      if (canvas) {
        console.log(`[registerCamera] bind canvas ${key}`);
        startConnection(key, cameraId, canvas, isCopilot);
        return;
      }

      // CASE 2: transient null → ignore unless we already had a connection
      const existingCanvas = canvasRefs.current.get(key);
      if (!existingCanvas) return;

      console.log(`[registerCamera] teardown canvas ${key}`);

      canvasRefs.current.delete(key);
      pendingCanvas.current.delete(key);

      cleanupSocket(key, cameraId, isCopilot);
    },
    [startConnection],
  );

  useEffect(() => {
    const socketsMap = sockets.current;
    const canvasMap = canvasRefs.current;

    return () => {
      isMounted.current = false;

      socketsMap.forEach((_, key) => {
        const parts = key.split('_');
        const cameraId = Number(parts[1]);
        const isCopilot = parts[0] === 'copilot';

        cleanupSocket(key, cameraId, isCopilot);
      });

      socketsMap.clear();
      canvasMap.clear();
    };
  }, [startConnection]);

  const registerFrameCallback = useCallback(
    (
      cameraId: number,
      isCopilot: boolean,
      callback: ((canvas: HTMLCanvasElement) => void) | null,
    ) => {
      const key = `${isCopilot ? 'copilot' : 'detection'}_${cameraId}`;
      if (callback) frameCallbacks.current.set(key, callback);
      else frameCallbacks.current.delete(key);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ registerCamera, registerFrameCallback }),
    [registerCamera, registerFrameCallback],
  );

  return <VideoStreamContext.Provider value={contextValue}>{children}</VideoStreamContext.Provider>;
};
