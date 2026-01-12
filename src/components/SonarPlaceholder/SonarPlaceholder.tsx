import { Box, Typography, Button } from '@mui/material';
import RadarIcon from '@mui/icons-material/Radar';

/**
 * Placeholder component for SonarView integration.
 * SonarView is a separate desktop application that cannot be embedded.
 */
export const SonarPlaceholder = () => {
  const handleLaunchSonar = () => {
    // In Electron, this would use: window.electron.shell.openExternal('path/to/SonarView')
    // For now, just show an alert since we're in a web browser
    alert(
      'SonarView is a separate desktop application.\n\n' +
        'To use it:\n' +
        '1. Open SonarView from the desktop\n' +
        '2. Connect to the sonar hardware\n' +
        '3. Configure scan settings as needed',
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
        minHeight: 200,
      }}
    >
      <RadarIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
      <Typography variant="h6" color="text.secondary">
        SonarView Integration
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 300 }}>
        SonarView is a separate application for analyzing sonar data. Launch it from the desktop to
        view sonar imagery.
      </Typography>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<RadarIcon />}
        onClick={handleLaunchSonar}
      >
        Launch SonarView Info
      </Button>
    </Box>
  );
};
