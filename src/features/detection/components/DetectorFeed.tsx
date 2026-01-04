import { Box } from '@mui/material';

export const DetectorFeed = () => {
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
        position: 'relative', // Necessary for bounding box overlays
      }}
    >
      {/* This is where the actual video tag would be integrated */}
      <img
        src="actual source of the video feed"
        alt="Live Detection Feed"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </Box>
  );
};
