import { Box, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useCoPilot } from '../../context';

/**
 * Camera toggle controls for the sidebar.
 * Displays a checkbox for each camera to enable/disable it.
 */
export const CameraControls = () => {
  const { cameraConfigs, state, toggleCamera } = useCoPilot();

  return (
    <Box>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <VideocamIcon fontSize="small" />
        Cameras
      </Typography>
      <FormGroup>
        {cameraConfigs.map((camera) => {
          const cameraState = state.cameras[camera.id];
          const isEnabled = cameraState?.enabled ?? false;

          return (
            <FormControlLabel
              key={camera.id}
              control={
                <Checkbox
                  checked={isEnabled}
                  onChange={() => toggleCamera(camera.id)}
                  size="small"
                />
              }
              label={camera.name}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
                },
              }}
            />
          );
        })}
      </FormGroup>
    </Box>
  );
};
