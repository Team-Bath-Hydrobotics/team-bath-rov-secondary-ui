import { useCallback } from 'react';
import { useSidebarContent } from '../../hooks/useSidebarContent';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { CameraToggle } from '../../components/Toggles';
import { TelemetryToggle } from '../../components/Toggles';
import { MasonryGrid } from '../../components/MasonryGrid';
import { CameraTile } from '../../components/Tiles/CameraTile';
import { TelemetryTile } from '../../components/Tiles/TelemetryTile';
import { TELEMETRY_FIELDS } from '../../types/constants/telemetryFields';
import { useAppStateContext } from '../../context';
import { Box } from '@mui/material';
import { useMemo } from 'react';
import { DEFAULT_CAMERAS } from '../../types/constants';
/**
 * Main content with inline controls panel and masonry grid.
 */
const CoPilotContent = () => {
  const { state, cameraConfigs } = useAppStateContext();
  const { selectedTelemetry } = state;
  const stableCameraConfigs = useMemo(() => cameraConfigs ?? DEFAULT_CAMERAS, [cameraConfigs]);
  const selectedTelemetryFields = useMemo(
    () => TELEMETRY_FIELDS.filter((f) => selectedTelemetry.includes(f.id)),
    [selectedTelemetry],
  );

  const cameraTiles = useMemo(
    () =>
      stableCameraConfigs.map((camera) => {
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
      }),
    [stableCameraConfigs, state.cameras],
  );

  const telemetryTiles = useMemo(
    () =>
      selectedTelemetryFields.map((field) => (
        <TelemetryTile
          key={field.id}
          fieldId={field.id}
          label={field.label}
          unit={field.unit}
          selected={true}
        />
      )),
    [selectedTelemetryFields],
  );
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <MasonryGrid>
        {cameraTiles}
        {telemetryTiles}
      </MasonryGrid>
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
