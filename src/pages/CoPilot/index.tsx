import { useCallback } from 'react';
import { useSidebarContent } from '../../hooks/useSidebarContent';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { CameraToggle } from '../../components/Toggles';
import { TelemetryToggle } from '../../components/Toggles';
import { MasonryGrid } from '../../components/MasonryGrid';
import { CameraTile } from '../../components/Tiles/CameraTile';
import { TelemetryTile } from '../../components/Tiles/TelemetryTile';
import { MAX_TELEMETRY_SELECTIONS, TELEMETRY_FIELDS } from '../../types/constants/telemetryFields';
import { useAppStateContext } from '../../context';
import { Box } from '@mui/material';
import { useMemo } from 'react';
import { DEFAULT_CAMERAS } from '../../types/constants';
import { ToggleLayout } from '../../layouts/ToggleLayout';
import VideocamIcon from '@mui/icons-material/Videocam';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import React from 'react';
/**
 * Main content with inline controls panel and masonry grid.
 */
const CoPilotContent = () => {
  const { state, cameraConfigs } = useAppStateContext();
  const { selectedTelemetryCopilot, telemetry } = state;

  const stableCameraConfigs = useMemo(() => cameraConfigs ?? DEFAULT_CAMERAS, [cameraConfigs]);
  const selectedTelemetryFields = useMemo(
    () => TELEMETRY_FIELDS.filter((f) => selectedTelemetryCopilot.includes(f.id)),
    [selectedTelemetryCopilot],
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
          selected={true}
          data={telemetry[field.id]}
        />
      )),
    [selectedTelemetryFields, telemetry],
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

interface CoPilotSidebarNavProps {
  title: string;
}
const CoPilotSidebarNav = React.memo(({ title }: CoPilotSidebarNavProps) => {
  return (
    <>
      <ToggleLayout title="Cameras" icon={<VideocamIcon fontSize="small" />}>
        <CameraToggle />
      </ToggleLayout>
      <ToggleLayout title={title} icon={<ShowChartIcon fontSize="small" />}>
        <TelemetryToggle isCopilot={true} />
      </ToggleLayout>
    </>
  );
});

/**
 * CoPilot page - camera grid with telemetry displays.
 */
export const CoPilot = () => {
  const { state } = useAppStateContext();
  const telemetryTitle = `Telemetry (${state.selectedTelemetryCopilot.length}/${MAX_TELEMETRY_SELECTIONS})`;

  const sidebarFactory = useCallback(
    () => <CoPilotSidebarNav title={telemetryTitle} />,
    [telemetryTitle],
  );

  useSidebarContent(sidebarFactory);

  return (
    <MainContentLayout name="Co-Pilot">
      <CoPilotContent />
    </MainContentLayout>
  );
};
