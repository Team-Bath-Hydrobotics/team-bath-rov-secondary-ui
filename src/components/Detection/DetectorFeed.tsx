import { Box, IconButton, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useRef, useState } from 'react';
import { type DetectionResult } from '../../types';
interface DetectorFeedProps {
  detectFrame: (frameBlob: Blob) => Promise<DetectionResult>;
}

export const DetectorFeed = ({ detectFrame }: DetectorFeedProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleCaptureAndDetect = async () => {
    if (!imgRef.current) return;

    setIsDetecting(true);
    try {
      // Create canvas to capture current frame
      const canvas = document.createElement('canvas');
      const img = imgRef.current;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      // Draw current image frame to canvas
      ctx.drawImage(img, 0, 0);

      // Convert canvas to blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            return;
          }

          try {
            const result = await detectFrame(blob);
            console.log('Detection result:', result);
            // TODO: Display bounding boxes or results on UI
          } catch (error) {
            console.error('Detection failed:', error);
          } finally {
            setIsDetecting(false);
          }
        },
        'image/jpeg',
        0.95,
      );
    } catch (error) {
      console.error('Frame capture failed:', error);
      setIsDetecting(false);
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: 'black',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Video feed */}
      <img
        ref={imgRef}
        src="actual source of the video feed"
        alt="Live Detection Feed"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />

      {/* Capture button overlay */}
      <IconButton
        onClick={handleCaptureAndDetect}
        disabled={isDetecting}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': { bgcolor: 'primary.dark' },
          '&:disabled': { bgcolor: 'action.disabledBackground' },
        }}
      >
        {isDetecting ? <CircularProgress size={24} color="inherit" /> : <CameraAltIcon />}
      </IconButton>
    </Box>
  );
};
