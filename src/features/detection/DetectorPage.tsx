import { Box } from '@mui/material';
import { CrabCounter, CaptureButton, DetectorFeed } from '../../components/Detection';
import { DetectorProvider, useDetectorContext } from '../../context/DetectorContext';

const DetectorContent = () => {
  // We grab the REAL count from the context, NOT a local state
  const { crabCount } = useDetectorContext();
  const handleCapture = () => {
    // This only handles the "Camera" action, it doesn't touch the count

    console.log('Saving frame to disk...');
    // on capture send encoded screenshot over mqtt to ai consumer to get prediction
  };

  const detectFrame = async (frameBlob: Blob) => {
    const formData = new FormData();
    formData.append('frame', frameBlob);

    const response = await fetch('http://ml-api:5000/detect', {
      method: 'POST',
      body: formData,
    });

    return response.json(); // Get results immediately
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, p: 1 }}>
      {/* Now using the dedicated Video Component */}
      <DetectorFeed detectFrame={detectFrame} />

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
