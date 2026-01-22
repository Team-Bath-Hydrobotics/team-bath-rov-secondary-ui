import { type ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { VideoStreamContext } from '../context/VideoStreamContext';
import { useAppStateContext } from '../context/AppStateContext';
import JSMpeg from '@cycjimmy/jsmpeg-player';

interface VideoStreamProviderProps {
  children: ReactNode;
}

export const VideoStreamProvider = ({ children }: VideoStreamProviderProps) => {
  const canvasRefs = useRef(new Map<number, HTMLCanvasElement>());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = useRef(new Map<number, any>());
  const isInitializing = useRef(new Set<number>());
  const { state } = useAppStateContext();

  const wsBaseUrlRef = useRef(state.settings.networkSettings.wsBaseUrl);

  useEffect(() => {
    wsBaseUrlRef.current = state.settings.networkSettings.wsBaseUrl;
  }, [state.settings.networkSettings.wsBaseUrl]);

  const registerCamera = useCallback((cameraId: number, canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      // Cleanup player
      const player = players.current.get(cameraId);
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (error) {
          console.warn(`Error destroying player for camera ${cameraId}:`, error);
        }
      }
      players.current.delete(cameraId);

      canvasRefs.current.delete(cameraId);
      isInitializing.current.delete(cameraId);
      return;
    }

    // Prevent duplicate initialization
    if (canvasRefs.current.get(cameraId) === canvas) {
      console.log(`Camera ${cameraId} already registered`);
      return;
    }

    if (isInitializing.current.has(cameraId)) {
      console.log(`Camera ${cameraId} is already initializing`);
      return;
    }

    console.log(`Registering camera ${cameraId}`);
    isInitializing.current.add(cameraId);

    // Clean up existing player
    const existingPlayer = players.current.get(cameraId);
    if (existingPlayer && typeof existingPlayer.destroy === 'function') {
      try {
        existingPlayer.destroy();
      } catch (error) {
        console.warn(`Error destroying existing player for camera ${cameraId}:`, error);
      }
    }

    canvasRefs.current.set(cameraId, canvas);
    const basePort = parseInt(wsBaseUrlRef.current.split(':').pop() || '8081', 10);
    const wsUrl = `ws://localhost:${basePort + cameraId}`;

    console.log(`Connecting to video stream: ${wsUrl}`);

    try {
      const player = new JSMpeg.Player(wsUrl, {
        canvas: canvas,
        autoplay: true,
        audio: false,
        loop: false,
        videoBufferSize: 512 * 1024,
        onPlay: () => {
          console.log(`Camera ${cameraId} started playing`);
          isInitializing.current.delete(cameraId);
        },
        onSourceEstablished: () => {
          console.log(`Camera ${cameraId} source established`);
        },
      });

      players.current.set(cameraId, player);
      console.log(`Camera ${cameraId} player created`);

      setTimeout(() => {
        isInitializing.current.delete(cameraId);
      }, 1000);
    } catch (error) {
      console.error(`Failed to create player for camera ${cameraId}:`, error);
      isInitializing.current.delete(cameraId);
    }
  }, []);

  useEffect(() => {
    const currentPlayers = players.current;
    const currentCanvasRefs = canvasRefs.current;

    return () => {
      console.log('VideoStreamProvider unmounting');
      currentPlayers.forEach((player, cameraId) => {
        console.log(`Destroying player for camera ${cameraId}`);
        if (player && typeof player.destroy === 'function') {
          try {
            player.destroy();
          } catch (error) {
            console.warn(`Error during cleanup for camera ${cameraId}:`, error);
          }
        }
      });
      currentPlayers.clear();
      currentCanvasRefs.clear();
    };
  }, []);

  const contextValue = useMemo(() => ({ registerCamera }), [registerCamera]);

  return <VideoStreamContext.Provider value={contextValue}>{children}</VideoStreamContext.Provider>;
};
