import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useAppStateContext } from '../../context';
import React from 'react';
/**
 * Camera toggle controls for the sidebar.
 * Displays a checkbox for each camera to enable/disable it.
 */
export interface CameraToggleProps {
  isCopilot: boolean; // Indicates whether this toggle is for CoPilot or Detection
}
export const CameraToggle = React.memo(({ isCopilot }: CameraToggleProps) => {
  const {
    copilotCameraConfigs,
    detectionCameraConfigs,
    state,
    toggleCamera,
    canSelectMoreCameras,
  } = useAppStateContext();
  const cameraConfigs = isCopilot ? copilotCameraConfigs : detectionCameraConfigs;

  return (
    <FormGroup>
      {cameraConfigs.map((camera) => {
        const cameraState = isCopilot
          ? state.camerasCopilot[camera.id]
          : state.camerasDetection[camera.id];
        const isEnabled = cameraState?.enabled ?? false;

        return (
          <FormControlLabel
            key={camera.id}
            control={
              <Checkbox
                checked={isEnabled}
                onChange={() => toggleCamera(camera.id, isCopilot)}
                disabled={!isEnabled && !canSelectMoreCameras(isCopilot)}
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
