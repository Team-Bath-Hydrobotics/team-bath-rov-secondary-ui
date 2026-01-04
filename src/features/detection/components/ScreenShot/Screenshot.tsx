import { Box, Button } from '@mui/material';

export const ScreenshotButton = () => {
  const handleCapture = () => {};

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24, // Spacing from bottom
        right: 24, // Spacing from right
        zIndex: 1200, // Ensures it stays on top of video tiles
      }}
    >
      <Button variant="contained" color="primary" onClick={handleCapture} size="large">
        Capture Screenshot
      </Button>
    </Box>
  );
};
