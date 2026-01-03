import { useCallback } from 'react';
import { Box } from '@mui/material';
import { useSidebarContent } from '../../hooks/useSidebarContent';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { CameraToggle } from '../../components/CameraToggle';
import { TelemetryToggle } from '../../components/TelemetryToggle';
import { MasonryGrid } from '../../components/MasonryGrid';
import { CameraTile } from '../../components/CameraTile';
import { TelemetryTile } from '../../components/TelemetryTile/TelemetryTile';
import { TELEMETRY_FIELDS } from '../../types/constants/telemetryFields';
import { useAppStateContext } from '../../context';

/**
 * Main content with inline controls panel and masonry grid.
 */
const CoPilotContent = () => {
  const { state, cameraConfigs } = useAppStateContext();
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
      ></Box>

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

const CoPilotSidebarNav = () => {
  return (
    <>
      {' '}
      <CameraToggle />
      <TelemetryToggle />
    </>
  );
};

/**
 * CoPilot page - camera grid with telemetry displays.
 */
export const CoPilot = () => {
  // Empty sidebar - controls are in the main content area
  const sidebarFactory = useCallback(() => <CoPilotSidebarNav />, []);
  useSidebarContent(sidebarFactory);

  return (
    <MainContentLayout name="Co-Pilot">
      <CoPilotContent />
    </MainContentLayout>
  );
};
