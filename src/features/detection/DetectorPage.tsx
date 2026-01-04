import { Box } from '@mui/material';
import { CrabCounter, CaptureButton, DetectorFeed } from './components';
import { DetectorProvider, useDetector } from './context';

const DetectorContent = () => {
  // We grab the REAL count from the context, NOT a local state
  const { crabCount } = useDetector();

  const handleCapture = () => {
    // This only handles the "Camera" action, it doesn't touch the count
    console.log('Saving frame to disk...');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, p: 1 }}>
      {/* Now using the dedicated Video Component */}
      <DetectorFeed />

      <Box sx={{ display: 'flex', gap: 2, height: 100 }}>
        <CrabCounter count={crabCount} />
        <CaptureButton onCapture={handleCapture} />
      </Box>
    </Box>
  );
};

export const DetectorPage = () => (
  <DetectorProvider>
    <DetectorContent />
  </DetectorProvider>
);
