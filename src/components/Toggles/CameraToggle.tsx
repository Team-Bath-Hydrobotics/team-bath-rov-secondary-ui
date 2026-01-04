import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useAppStateContext } from '../../context';
import React from 'react';
/**
 * Camera toggle controls for the sidebar.
 * Displays a checkbox for each camera to enable/disable it.
 */
export const CameraToggle = React.memo(() => {
  const { cameraConfigs, state, toggleCamera } = useAppStateContext();

  return (
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
                sx={{
                  '&.Mui-checked': {
                    color: 'success.main',
                  },
                }}
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
  );
});
