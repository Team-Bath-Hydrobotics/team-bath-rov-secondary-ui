import { type ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { VideoStreamContext } from '../context/VideoStreamContext';
import { useAppStateContext } from '../context/AppStateContext';
import JSMpeg from '@cycjimmy/jsmpeg-player';

interface VideoStreamProviderProps {
  children: ReactNode;
}

export const VideoStreamProvider = ({ children }: VideoStreamProviderProps) => {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = useRef(new Map<string, any>());
  const isInitializing = useRef(new Set<string>());
  const { state, updateCameraStatus } = useAppStateContext();
  const updateCameraStatusRef = useRef(updateCameraStatus);
  const stateCopilotCamerasRef = useRef(state.camerasCopilot);
  const stateDetectionCamerasRef = useRef(state.camerasDetection);
  const isMounted = useRef(true);
  const frameCallbacks = useRef(new Map<string, (canvas: HTMLCanvasElement) => void>());

  useEffect(() => {
    updateCameraStatusRef.current = updateCameraStatus;
    stateCopilotCamerasRef.current = state.camerasCopilot;
    stateDetectionCamerasRef.current = state.camerasDetection;
  }, [updateCameraStatus, state.camerasCopilot, state.camerasDetection]);

  const wsBaseUrlRef = useRef(state.settings.networkSettings.wsBaseUrl);

  useEffect(() => {
    wsBaseUrlRef.current = state.settings.networkSettings.wsBaseUrl;
  }, [state.settings.networkSettings.wsBaseUrl]);

  const registerFrameCallback = useCallback(
    (
      cameraId: number,
      isCopilot: boolean,
      callback: ((canvas: HTMLCanvasElement) => void) | null,
    ) => {
      const key = `${isCopilot ? 'copilot' : 'detection'}_${cameraId}`;
      if (callback) {
        frameCallbacks.current.set(key, callback);
      } else {
        frameCallbacks.current.delete(key);
      }
    },
    [],
  );

  const registerCamera = useCallback(
    (cameraId: number, canvas: HTMLCanvasElement | null, isCopilot: boolean) => {
      const key = `${isCopilot ? 'copilot' : 'detection'}_${cameraId}`;
      try {
        if (!canvas) {
          // Camera is being unregistered - check if it's disabled
          const cameraMap = isCopilot
            ? stateCopilotCamerasRef.current
            : stateDetectionCamerasRef.current;
          const camera = cameraMap[cameraId];
          if (camera && !camera.enabled) {
            // Camera is disabled - destroy the WebSocket connection
            const player = players.current.get(key);
            if (player && typeof player.destroy === 'function') {
              try {
                // Check if WebSocket is still open before stopping
                if (player.source && player.source.socket) {
                  const socketState = player.source.socket.readyState;
                  // Only stop if WebSocket is open or connecting (0 or 1)
                  if (socketState <= 1 && typeof player.stop === 'function') {
                    player.stop();
                  }
                } else if (typeof player.stop === 'function') {
                  player.stop();
                }

                player.destroy();
              } catch {
                // Silently ignore errors from destroying already-closed connections
                console.warn(
                  `[VideoStreamProvider] Camera ${key} cleanup (connection may already be closed)`,
                );
              }
            }
            players.current.delete(key);
            updateCameraStatusRef.current(cameraId, 'disconnected', isCopilot);
            console.warn(`[VideoStreamProvider] Camera ${key} disabled - connection closed`);
          }
          // If camera is still enabled, just unregister the canvas and keep connection alive
          canvasRefs.current.delete(key);
          return;
        }
        if (!isMounted.current) {
          return;
        }

        const currentCanvasRef = canvasRefs.current.get(key);
        if (currentCanvasRef === canvas) {
          // Already registered to this canvas
          return;
        }

        if (isInitializing.current.has(key)) {
          return;
        }

        // Check if we already have a player for this camera
        const existingPlayer = players.current.get(key);
        if (existingPlayer && typeof existingPlayer.destroy === 'function') {
          const existingCanvas = canvasRefs.current.get(key);

          if (existingCanvas === canvas) {
            // Same canvas, player already set up
            return;
          }

          // Different canvas - destroy old player and create new one
          // This happens during page navigation or if camera got stuck
          try {
            // Cancel any pending connection timeouts
            isInitializing.current.delete(key);

            // Force close the WebSocket if it's still pending
            if (existingPlayer.source && existingPlayer.source.socket) {
              try {
                existingPlayer.source.socket.close();
              } catch {
                // Ignore
              }
            }

            if (typeof existingPlayer.stop === 'function') {
              existingPlayer.stop();
            }
            existingPlayer.destroy();
          } catch (error) {
            console.warn(`[VideoStreamProvider] Error cleaning up camera ${key}:`, error);
          }
          players.current.delete(key);
          console.warn(`[VideoStreamProvider] Camera ${key} canvas changed - recreating player`);
        }

        // Create a new player
        isInitializing.current.add(key);
        canvasRefs.current.set(key, canvas);
        const basePort = parseInt(wsBaseUrlRef.current.split(':').pop() || '8081', 10);
        const wsUrl = `ws://localhost:${basePort + cameraId}`;

        updateCameraStatusRef.current(cameraId, 'connecting', isCopilot);

        // Suppress jsmpeg WebSocket connection errors and track if we've seen errors
        const originalError = console.error;
        let statusUpdated = false;
        console.error = (...args: unknown[]) => {
          const message = String(args[0]);
          if (message.includes('WebSocket connection')) {
            // Don't immediately fail - let the player attempt reconnection
            // The onPlay callback will confirm success, or timeout will fail it
            return;
          }
          originalError(...args);
        };

        try {
          const player = new JSMpeg.Player(wsUrl, {
            canvas: canvas,
            autoplay: true,
            audio: false,
            loop: false,
            webgl: true, // Copilot stream may have more decoding issues - disable WebGL for better compatibility at cost of performance
            videoBufferSize: 512 * 1024,
            preserveDrawingBuffer: true,
            onPlay: () => {
              // Always update to connected if video is actually playing
              // This overrides any earlier error messages we suppressed
              if (!statusUpdated) {
                statusUpdated = true;
                console.error = originalError;
                console.warn(`[VideoStreamProvider] Camera ${key} connected`);
                updateCameraStatusRef.current(cameraId, 'connected', isCopilot);
                isInitializing.current.delete(key);
                clearTimeout(connectionTimeoutId);
              }
            },
            onSourceEstablished: () => {
              if (!statusUpdated) {
                console.error = originalError;
              }
            },
            onVideoDecode: () => {
              const cb = frameCallbacks.current.get(key);
              if (cb && canvas) {
                cb(canvas);
              }
            },
          });

          // Set connection timeout - fail if no successful connection within 12 seconds
          const connectionTimeoutId = setTimeout(() => {
            if (!statusUpdated && isMounted.current) {
              statusUpdated = true;
              console.error = originalError;
              console.warn(`[VideoStreamProvider] Camera ${key} connection timeout`);
              updateCameraStatusRef.current(cameraId, 'failed', isCopilot);
              isInitializing.current.delete(key);
              try {
                if (typeof player.stop === 'function') {
                  player.stop();
                }
                player.destroy();
              } catch {
                // Ignore
              }
              players.current.delete(key);
            }
          }, 12000);

          if (player.source && player.source.socket) {
            player.source.socket.addEventListener('error', () => {
              // Only mark as failed if we haven't already successfully connected
              if (!statusUpdated) {
                statusUpdated = true;
                console.error = originalError;
                console.warn(`[VideoStreamProvider] Camera ${key} WebSocket error`);
                updateCameraStatusRef.current(cameraId, 'failed', isCopilot);
                isInitializing.current.delete(key);
                clearTimeout(connectionTimeoutId);
                // Remove from map so a fresh player can be created
                players.current.delete(key);
              }
              try {
                if (typeof player.stop === 'function') {
                  player.stop();
                }
                player.destroy();
              } catch {
                // Ignore
              }
            });
            player.source.socket.addEventListener('close', () => {
              console.error = originalError;
              clearTimeout(connectionTimeoutId);
              if (!statusUpdated) {
                // Socket closed before successful connection
                // Mark as failed so timeout doesn't try to clean up again
                statusUpdated = true;
                updateCameraStatusRef.current(cameraId, 'failed', isCopilot);
                // Remove from map to allow fresh reconnection
                players.current.delete(key);
              } else {
                // Socket closed after successful connection - update to disconnected
                updateCameraStatusRef.current(cameraId, 'disconnected', isCopilot);
                // Keep player in map in case it auto-reconnects
              }
              isInitializing.current.delete(key);
            });
          }

          players.current.set(key, player);

          setTimeout(() => {
            isInitializing.current.delete(key);
          }, 1000);
        } catch {
          console.error = originalError;
          console.warn(`[VideoStreamProvider] Error creating player for camera ${key}`);
          updateCameraStatusRef.current(cameraId, 'failed', isCopilot);
          isInitializing.current.delete(key);
        }
      } catch (error) {
        console.error(`Unexpected error in registerCamera for camera ${key}:`, error);
        isInitializing.current.delete(key);
      }
    },
    [],
  );

  useEffect(() => {
    // Cleanup only when provider unmounts (entire app shutdown)
    // Capture refs at effect time to avoid stale closure in cleanup
    const playersSnapshot = players.current;
    const canvasRefsSnapshot = canvasRefs.current;

    return () => {
      try {
        isMounted.current = false;
        playersSnapshot.forEach((player, cameraId) => {
          try {
            if (player && typeof player.destroy === 'function') {
              if (typeof player.stop === 'function') {
                player.stop();
              }
              player.destroy();
            }
          } catch (error) {
            console.error(`Error destroying player for camera ${cameraId}:`, error);
          }
        });
        playersSnapshot.clear();
        canvasRefsSnapshot.clear();
      } catch (error) {
        console.error('Error during provider cleanup:', error);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({ registerCamera, registerFrameCallback }),
    [registerCamera, registerFrameCallback],
  );

  return <VideoStreamContext.Provider value={contextValue}>{children}</VideoStreamContext.Provider>;
};
