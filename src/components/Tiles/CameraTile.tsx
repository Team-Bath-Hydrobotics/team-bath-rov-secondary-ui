import { Paper, Box, Typography } from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { RecordingStatus } from '../Status';
import React, { useEffect, useRef } from 'react';
import { useVideoStreamContext } from '../../context/VideoStreamContext';
import { useAppStateContext } from '../../context';

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
    const { state } = useAppStateContext();
    const cameraStatus = state.cameras[cameraId]?.connectionStatus || 'disconnected';
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (enabled && canvasRef.current) {
        registerCamera(cameraId, canvasRef.current);
      }

      return () => {
        registerCamera(cameraId, null);
      };
    }, [cameraId, enabled, registerCamera]);

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
        {}
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
      </Paper>
    );
  },
);
