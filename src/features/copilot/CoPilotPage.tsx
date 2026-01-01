import { Box } from '@mui/material';
import { CoPilotProvider, useCoPilot } from './context';
import { Sidebar } from './components/Sidebar';
import { MasonryGrid } from './components/MasonryGrid';
import { CameraTile } from './components/CameraTile';
import { TelemetryTile } from './components/TelemetryTile';
import { TELEMETRY_FIELDS } from './constants';

const DRAWER_WIDTH = 280;

/**
 * Inner content that uses the CoPilot context.
 * Separated from CoPilotPage so it can access context values.
 */
const CoPilotContent = () => {
  const { state, cameraConfigs } = useCoPilot();
  const { sidebarOpen, selectedTelemetry } = state;

  // Get full metadata for selected telemetry fields
  const selectedTelemetryFields = TELEMETRY_FIELDS.filter((f) => selectedTelemetry.includes(f.id));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      {/* Main content area - shifts when sidebar opens */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: 'margin-left 0.3s',
        }}
      >
        <MasonryGrid>
          {/* Camera tiles */}
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

          {/* Telemetry tiles (only selected ones) */}
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
 * CoPilot page with camera grid and telemetry displays.
 * Wraps content in CoPilotProvider for state management.
 */
export const CoPilotPage = () => {
  return (
    <CoPilotProvider>
      <CoPilotContent />
    </CoPilotProvider>
  );
};
