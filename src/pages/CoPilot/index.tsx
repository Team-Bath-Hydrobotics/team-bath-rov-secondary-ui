import { useCallback } from 'react';
import { Box } from '@mui/material';
import { useSidebarContent } from '../../hooks/useSidebarContent';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { CoPilotProvider, useCoPilot } from '../../features/copilot';
import { CameraControls, TelemetryControls } from '../../features/copilot/components/Sidebar';
import { MasonryGrid } from '../../features/copilot/components/MasonryGrid';
import { CameraTile } from '../../features/copilot/components/CameraTile';
import { TelemetryTile } from '../../features/copilot/components/TelemetryTile';
import { TELEMETRY_FIELDS } from '../../features/copilot/constants';

/**
 * Main content with inline controls panel and masonry grid.
 */
const CoPilotContent = () => {
  const { state, cameraConfigs } = useCoPilot();
  const { selectedTelemetry } = state;

  const selectedTelemetryFields = TELEMETRY_FIELDS.filter((f) => selectedTelemetry.includes(f.id));

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Controls panel (inside provider, so context works) */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          overflowY: 'auto',
          p: 2,
        }}
      >
        <CameraControls />
        <Box sx={{ my: 2 }} />
        <TelemetryControls />
      </Box>

      {/* Masonry grid */}
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
        <MasonryGrid>
          {cameraConfigs.map((camera) => {
            const cameraState = state.cameras[camera.id];
            return (
              <CameraTile
                key={camera.id}
                cameraId={camera.id}
                name={camera.name}
                enabled={cameraState?.enabled ?? false}
                isRecording={cameraState?.isRecording ?? false}
              />
            );
          })}

          {selectedTelemetryFields.map((field) => (
            <TelemetryTile
              key={field.id}
              fieldId={field.id}
              label={field.label}
              unit={field.unit}
              selected={true}
            />
          ))}
        </MasonryGrid>
      </Box>
    </Box>
  );
};

/**
 * CoPilot page - camera grid with telemetry displays.
 */
export const CoPilot = () => {
  // Empty sidebar - controls are in the main content area
  const sidebarFactory = useCallback(() => null, []);
  useSidebarContent(sidebarFactory);

  return (
    <CoPilotProvider>
      <MainContentLayout name="Co-Pilot">
        <CoPilotContent />
      </MainContentLayout>
    </CoPilotProvider>
  );
};
