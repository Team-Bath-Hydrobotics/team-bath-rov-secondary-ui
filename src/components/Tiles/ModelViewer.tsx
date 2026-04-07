import '@google/model-viewer';
import { useRef, useCallback } from 'react';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import CodeIcon from '@mui/icons-material/Code';
import type { ReconstructionStatus } from '../../types';

interface ModelViewerProps {
  modelUrl: string | null;
  status: ReconstructionStatus;
  estimatedHeight: number | null;
}

export const ModelViewer = ({ modelUrl, status, estimatedHeight }: ModelViewerProps) => {
  const showModel = modelUrl && status === 'complete';
  const viewerRef = useRef<HTMLElement>(null);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const viewer = viewerRef.current as
      | (HTMLElement & {
          getCameraOrbit: () => {
            theta: number;
            phi: number;
            radius: number;
            toString: () => string;
          };
          cameraOrbit: string;
          getMinimumFieldOfView: () => string;
        })
      | null;
    if (!viewer) return;

    const orbit = viewer.getCameraOrbit();
    const factor = direction === 'in' ? 0.75 : 1.33;
    orbit.radius *= factor;
    viewer.cameraOrbit = orbit.toString();
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Upload images and run reconstruction to generate model';
      case 'processing':
        return 'Reconstructing 3D model...';
      case 'complete':
        return '3D model reconstruction complete';
      case 'error':
        return 'Reconstruction failed';
    }
  };

  if (showModel) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 600 }}>
        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          alt="Coral 3D model"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          min-camera-orbit="auto auto 0%"
          max-camera-orbit="auto auto Infinity"
          scroll-sensitivity="3"
          style={{ width: '100%', height: '100%', minHeight: 600 }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          <IconButton
            onClick={() => handleZoom('in')}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            onClick={() => handleZoom('out')}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
          >
            <RemoveIcon />
          </IconButton>
        </Box>
        {estimatedHeight !== null && (
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              position: 'absolute',
              top: 16,
              right: 24,
              color: 'text.primary',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            Height: {estimatedHeight}cm
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 600,
        backgroundColor: 'rgba(128, 128, 128, 0.15)',
        borderRadius: 2,
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
        <ThreeDRotationIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
        <CodeIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
      </Box>

      {estimatedHeight !== null && (
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ position: 'absolute', top: 16, right: 24, color: 'text.primary' }}
        >
          Height: {estimatedHeight}cm
        </Typography>
      )}

      {status === 'processing' ? (
        <CircularProgress size={48} color="warning" />
      ) : (
        <ViewInArIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
      )}
      <Typography variant="h6" color="text.primary" fontWeight={600} sx={{ mt: 2 }}>
        3D Model Viewer
      </Typography>
      <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ mt: 0.5 }}>
        {getStatusText()}
      </Typography>
    </Box>
  );
};
