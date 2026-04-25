import { Paper, Box, Typography, IconButton, CircularProgress } from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import { RecordingStatus } from '../Status';
import React, { useCallback, useEffect, useRef } from 'react';
import { useVideoStreamContext } from '../../context/VideoStreamContext';
import { useAppStateContext } from '../../context';
import { useCanvasRecorder } from '../../hooks/useCanvasRecorder';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';

interface CameraTileProps {
  cameraId: number;
  name: string;
  enabled: boolean;
  isRecording: boolean;
  isCopilot: boolean; // Indicates whether this tile is for CoPilot or Detection
  /** Optional ref for an overlay canvas drawn on top of the video feed */
  overlayCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  handleDetection?: (frame: string) => Promise<void>;
}

/**
 * Camera tile displaying live video feed from WebSocket stream.
 * Shows greyed-out state when disabled, recording indicator when active.
 */
export const CameraTile = React.memo(
  ({
    cameraId,
    name,
    enabled,
    isRecording,
    isCopilot,
    overlayCanvasRef,
    handleDetection,
  }: CameraTileProps) => {
    const { registerCamera, registerFrameCallback } = useVideoStreamContext();
    const { state, setCameraRecording } = useAppStateContext();
    const cameraStatus = isCopilot
      ? state.camerasCopilot[cameraId]?.connectionStatus
      : state.camerasDetection[cameraId]?.connectionStatus || 'disconnected';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isProcessing, startRecording, stopRecording } = useCanvasRecorder(name);
    const isConnected = cameraStatus === 'connected';

    useEffect(() => {
      if (enabled && canvasRef.current) {
        registerCamera(cameraId, canvasRef.current, isCopilot);
      }

      return () => {
        registerCamera(cameraId, null, isCopilot);
      };
    }, [cameraId, enabled, isCopilot, registerCamera]);

    const lastFrameRef = useRef<string | null>(null);
    useEffect(() => {
      if (!enabled || !handleDetection) return;

      registerFrameCallback(cameraId, isCopilot, (canvas) => {
        // JSMpeg just decoded a frame - capture it while still in CPU memory
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(canvas, 0, 0);
        const dataUrl = offscreen.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        if (base64) lastFrameRef.current = base64;
      });

      return () => {
        registerFrameCallback(cameraId, isCopilot, null);
      };
    }, [cameraId, enabled, isCopilot, registerFrameCallback, overlayCanvasRef, handleDetection]);

    const handleRecordToggle = useCallback(async () => {
      if (isRecording) {
        await stopRecording();
        setCameraRecording(cameraId, false, isCopilot);
      } else {
        const canvas = canvasRef.current;
        if (canvas) {
          startRecording(canvas);
          setCameraRecording(cameraId, true, isCopilot);
        }
      }
    }, [isRecording, cameraId, setCameraRecording, startRecording, stopRecording, isCopilot]);

    const getCurrentFrame = useCallback((): string | null => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

      try {
        // Copy to a fresh 2D canvas to ensure pixel data is readable
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(canvas, 0, 0);

        const dataUrl = offscreen.toDataURL('image/jpeg', 0.8);
        if (dataUrl === 'data:,' || dataUrl === 'data:image/png;base64,') return null;
        const base64 = dataUrl.split(',')[1];
        return base64 ?? null;
      } catch (err) {
        console.warn('[CameraTile] Failed to capture frame:', err);
        return null;
      }
    }, []);

    return (
      <Paper
        elevation={2}
        sx={{
          position: 'relative',
          minWidth: 150,
          minHeight: 250,
          aspectRatio: '16/9',
          overflow: 'hidden',
          opacity: enabled ? 1 : 0.4,
          filter: enabled ? 'none' : 'grayscale(100%)',
          transition: 'opacity 0.3s, filter 0.3s',
        }}
      >
        {cameraStatus === 'failed' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              zIndex: 1,
            }}
          >
            Connection Failed
          </Box>
        )}
        {enabled ? (
          <>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#000',
              }}
            />
            {overlayCanvasRef && (
              <canvas
                ref={overlayCanvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              />
            )}
          </>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.300',
              gap: 1,
            }}
          >
            <VideocamOffIcon sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography variant="body2" color="grey.600">
              {name}
            </Typography>
            <Typography variant="caption" color="grey.500">
              Disabled
            </Typography>
          </Box>
        )}
        {enabled && <RecordingStatus isRecording={isRecording} />}

        {enabled && (
          <IconButton
            onClick={handleRecordToggle}
            disabled={!isConnected || isProcessing}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              zIndex: 2,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              },
            }}
          >
            {isProcessing ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : isRecording ? (
              <StopIcon sx={{ fontSize: 20 }} />
            ) : (
              <FiberManualRecordIcon sx={{ fontSize: 20, color: 'error.main' }} />
            )}
          </IconButton>
        )}
        {enabled && handleDetection && (
          <IconButton
            onClick={() => {
              const frame = getCurrentFrame();
              if (frame && handleDetection) {
                handleDetection(frame);
              }
            }}
            disabled={!isConnected || isProcessing}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              zIndex: 2,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              },
            }}
          >
            {isProcessing ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : isRecording ? (
              <StopIcon sx={{ fontSize: 20 }} />
            ) : (
              <LocationSearchingIcon sx={{ fontSize: 20, color: 'error.main' }} />
            )}
          </IconButton>
        )}
      </Paper>
    );
  },
);
