import { MainContentLayout } from '../../layouts/MainContentLayout';
import { useSidebarContent } from '../../hooks/useSidebarContent';
import { useCallback } from 'react';
import { Box } from '@mui/material';
import { MasonryGrid } from '../../components/MasonryGrid';
import { TelemetryTile } from '../../components/Tiles/TelemetryTile';
import { TELEMETRY_FIELDS } from '../../types/constants/telemetryFields';
import { useAppStateContext } from '../../context';
import { useMemo } from 'react';
import { ToggleLayout } from '../../layouts/ToggleLayout';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import React from 'react';
import { TelemetryToggle } from '../../components/Toggles';
import { MAX_TELEMETRY_SELECTIONS } from '../../types/constants/telemetryFields';
/**
 * Main content with inline controls panel and masonry grid.
 */
const TelemetryContent = () => {
  const { state } = useAppStateContext();
  const { selectedTelemetry } = state;

  const selectedTelemetryFields = useMemo(
    () => TELEMETRY_FIELDS.filter((f) => selectedTelemetry.includes(f.id)),
    [selectedTelemetry],
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
      <MasonryGrid>{telemetryTiles}</MasonryGrid>
    </Box>
  );
};

interface TelemetrySidebarNavProps {
  title: string;
}
const TelemetrySidebarNav = React.memo(({ title }: TelemetrySidebarNavProps) => {
  return (
    <>
      <ToggleLayout title={title} icon={<ShowChartIcon fontSize="small" />}>
        <TelemetryToggle />
      </ToggleLayout>
    </>
  );
});
export const Telemetry = () => {
  const { state } = useAppStateContext();
  const telemetryTitle = `Telemetry (${state.selectedTelemetry.length}/${MAX_TELEMETRY_SELECTIONS})`;

  const sidebarFactory = useCallback(
    () => <TelemetrySidebarNav title={telemetryTitle} />,
    [telemetryTitle],
  );
  useSidebarContent(sidebarFactory);

  return (
    <MainContentLayout name="Telemetry">
      <TelemetryContent />
    </MainContentLayout>
  );
};
