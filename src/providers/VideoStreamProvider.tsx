import { type ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { VideoStreamContext } from '../context/VideoStreamContext';
import { useAppStateContext } from '../context/AppStateContext';

interface VideoStreamProviderProps {
  children: ReactNode;
}

type WSHandle = {
  socket: WebSocket;
  ctx: CanvasRenderingContext2D;
};

export const VideoStreamProvider = ({ children }: VideoStreamProviderProps) => {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  const sockets = useRef(new Map<string, WSHandle>());
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
      existing.socket.close();
    } catch {
      console.warn(`Error closing socket for ${key}`);
    }

    sockets.current.delete(key);
    updateCameraStatusRef.current(cameraId, 'disconnected', isCopilot);
  };

  const startConnection = useCallback(
    (key: string, cameraId: number, canvas: HTMLCanvasElement, isCopilot: boolean) => {
      if (isInitializing.current.has(key)) return;
      isInitializing.current.add(key);

      canvasRefs.current.set(key, canvas);

      cleanupSocket(key, cameraId, isCopilot);

      const basePort = parseInt(wsBaseUrlRef.current.split(':').pop() || '8081', 10);

      const wsUrl = `ws://localhost:${basePort + cameraId - 1}`;

      updateCameraStatusRef.current(cameraId, 'connecting', isCopilot);

      const socket = new WebSocket(wsUrl);
      socket.binaryType = 'arraybuffer';

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.warn('No 2D context for canvas', key);
        isInitializing.current.delete(key);
        return;
      }

      sockets.current.set(key, { socket, ctx });

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

      socket.onopen = markConnected;
      socket.onerror = markFailed;

      socket.onclose = () => {
        if (!statusUpdated) markFailed();
        else updateCameraStatusRef.current(cameraId, 'disconnected', isCopilot);

        isInitializing.current.delete(key);
      };

      socket.onmessage = (event) => {
        const canvasRef = canvasRefs.current.get(key);
        if (!canvasRef) return;

        const handle = sockets.current.get(key);
        if (!handle) return;

        const blob = new Blob([event.data], { type: 'image/jpeg' });

        createImageBitmap(blob)
          .then((bitmap) => {
            handle.ctx.drawImage(bitmap, 0, 0, canvasRef.width, canvasRef.height);
          })
          .catch((err) => console.warn('decode failed', err));
      };

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

  const registerFrameCallback = useCallback(() => {
    // unchanged (not relevant to bug)
  }, []);

  const contextValue = useMemo(
    () => ({ registerCamera, registerFrameCallback }),
    [registerCamera, registerFrameCallback],
  );

  return <VideoStreamContext.Provider value={contextValue}>{children}</VideoStreamContext.Provider>;
};
