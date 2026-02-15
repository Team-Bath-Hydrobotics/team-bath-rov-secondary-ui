import '@google/model-viewer';
import { Box, Typography, CircularProgress } from '@mui/material';
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
      <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
        <model-viewer
          src={modelUrl}
          alt="Coral 3D model"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          style={{ width: '100%', height: '100%', minHeight: 400 }}
        />
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
        minHeight: 400,
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
