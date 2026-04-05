import { Paper, Box, Typography, IconButton, CircularProgress } from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import { RecordingStatus } from '../Status';
import React, { useCallback, useEffect, useRef } from 'react';
import { useVideoStreamContext } from '../../context/VideoStreamContext';
import { useAppStateContext } from '../../context';
import { useCanvasRecorder } from '../../hooks/useCanvasRecorder';

interface CameraTileProps {
  cameraId: number;
  name: string;
  enabled: boolean;
  isRecording: boolean;
}

/**
 * Camera tile displaying live video feed from WebSocket stream.
 * Shows greyed-out state when disabled, recording indicator when active.
 */
export const CameraTile = React.memo(
  ({ cameraId, name, enabled, isRecording }: CameraTileProps) => {
    const { registerCamera } = useVideoStreamContext();
    const { state, setCameraRecording } = useAppStateContext();
    const cameraStatus = state.cameras[cameraId]?.connectionStatus || 'disconnected';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isProcessing, startRecording, stopRecording } = useCanvasRecorder(name);
    const isConnected = cameraStatus === 'connected';

    useEffect(() => {
      if (enabled && canvasRef.current) {
        registerCamera(cameraId, canvasRef.current);
      }

      return () => {
        registerCamera(cameraId, null);
      };
    }, [cameraId, enabled, registerCamera]);

    // TODO: Remove — test pattern for development without a live camera stream.
    // Uses a separate overlay canvas because JSMpeg claims a WebGL context on
    // canvasRef, making getContext('2d') return null on the same element.
    const testCanvasRef = useRef<HTMLCanvasElement>(null);
    const showTestCanvas = enabled && !isConnected;
    const animateTestPattern = showTestCanvas && !isProcessing;

    useEffect(() => {
      if (!animateTestPattern || !testCanvasRef.current) return;

      const canvas = testCanvasRef.current;
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frame = 0;
      const intervalId = setInterval(() => {
        frame++;
        ctx.fillStyle = `hsl(${(frame * 3) % 360}, 70%, 40%)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`TEST — ${name}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px monospace';
        ctx.fillText(`Frame ${frame}`, canvas.width / 2, canvas.height / 2 + 20);

        // Timestamp
        ctx.font = '14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(new Date().toLocaleTimeString(), canvas.width - 12, canvas.height - 12);
      }, 100);

      return () => clearInterval(intervalId);
    }, [animateTestPattern, name]);

    const handleRecordToggle = useCallback(async () => {
      if (isRecording) {
        await stopRecording();
        setCameraRecording(cameraId, false);
      } else {
        // TODO: Restore to just `canvasRef.current` after removing test pattern
        const canvas = testCanvasRef.current ?? canvasRef.current;
        if (canvas) {
          startRecording(canvas);
          setCameraRecording(cameraId, true);
        }
      }
    }, [isRecording, cameraId, setCameraRecording, startRecording, stopRecording]);

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
        {/* TODO: Remove — test pattern overlay canvas */}
        {showTestCanvas && (
          <canvas
            ref={testCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          />
        )}

        {}
        {cameraStatus === 'failed' && !showTestCanvas && (
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
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000',
            }}
          />
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

        {/* Recording status overlay */}
        {enabled && <RecordingStatus isRecording={isRecording} />}

        {/* Record / Stop button */}
        {enabled && (
          <IconButton
            onClick={handleRecordToggle}
            // TODO: Restore to `disabled={!isConnected || isProcessing}` after testing
            disabled={isProcessing}
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
      </Paper>
    );
  },
);
