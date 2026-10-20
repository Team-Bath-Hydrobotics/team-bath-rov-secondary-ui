import { type ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import { VideoStreamContext } from '../context/VideoStreamContext';
import { useAppStateContext } from '../context/AppStateContext';

interface VideoStreamProviderProps {
  children: ReactNode;
}

type JSMpegPlayer = {
  destroy: () => void;
};

type PlayerHandle = {
  player: JSMpegPlayer;
};

export const VideoStreamProvider = ({ children }: VideoStreamProviderProps) => {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  const players = useRef(new Map<string, PlayerHandle>());
  const isInitializing = useRef(new Set<string>());
  const frameCallbacks = useRef(new Map<string, ((canvas: HTMLCanvasElement) => void) | null>());

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
    const existing = players.current.get(key);
    if (!existing) return;

    try {
      existing.player.destroy();
    } catch {
      console.warn(`Error destroying player for ${key}`);
    }

    players.current.delete(key);
    updateCameraStatusRef.current(cameraId, 'disconnected', isCopilot);
  };

  const startConnection = useCallback(
    (key: string, cameraId: number, canvas: HTMLCanvasElement, isCopilot: boolean) => {
      if (isInitializing.current.has(key)) return;
      isInitializing.current.add(key);

      canvasRefs.current.set(key, canvas);

      cleanupSocket(key, cameraId, isCopilot);

      const configuredUrl = new URL(wsBaseUrlRef.current);
      const basePort = Number(configuredUrl.port || (configuredUrl.protocol === 'wss:' ? 443 : 80));
      configuredUrl.port = String(basePort + cameraId);
      configuredUrl.pathname = '/';
      configuredUrl.search = '';
      configuredUrl.hash = '';
      const wsUrl = configuredUrl.toString();

      updateCameraStatusRef.current(cameraId, 'connecting', isCopilot);

      let statusUpdated = false;

      const markConnected = () => {
        if (statusUpdated) return;
        statusUpdated = true;

        updateCameraStatusRef.current(cameraId, 'connected', isCopilot);
        isInitializing.current.delete(key);
      };

      const player = new JSMpeg.Player(wsUrl, {
        canvas,
        autoplay: true,
        audio: false,
        videoBufferSize: 512 * 1024,
        preserveDrawingBuffer: true,
        onSourceEstablished: markConnected,
        onVideoDecode: () => {
          markConnected();
          frameCallbacks.current.get(key)?.(canvas);
        },
      });

      players.current.set(key, { player });

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
    const playersMap = players.current;
    const canvasMap = canvasRefs.current;

    return () => {
      isMounted.current = false;

      playersMap.forEach((_, key) => {
        const parts = key.split('_');
        const cameraId = Number(parts[1]);
        const isCopilot = parts[0] === 'copilot';

        cleanupSocket(key, cameraId, isCopilot);
      });

      playersMap.clear();
      canvasMap.clear();
      frameCallbacks.current.clear();
    };
  }, [startConnection]);

  const registerFrameCallback = useCallback(
    (
      cameraId: number,
      isCopilot: boolean,
      callback: ((canvas: HTMLCanvasElement) => void) | null,
    ) => {
      const key = `${isCopilot ? 'copilot' : 'detection'}_${cameraId}`;
      frameCallbacks.current.set(key, callback);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ registerCamera, registerFrameCallback }),
    [registerCamera, registerFrameCallback],
  );

  return <VideoStreamContext.Provider value={contextValue}>{children}</VideoStreamContext.Provider>;
};
