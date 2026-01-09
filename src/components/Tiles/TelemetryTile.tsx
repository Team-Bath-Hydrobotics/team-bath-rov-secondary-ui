import { Paper, Box, Typography } from '@mui/material';
import { useRef, useEffect } from 'react';
import { LineChart, type LineChartHandle } from '../Charts/LineChart';
import React from 'react';
import type { TelemetryDataPoint } from '../../types/constants';

interface TelemetryTileProps {
  fieldId: string;
  label: string;
  selected: boolean;
  data?: TelemetryDataPoint;
}

export const TelemetryTile = React.memo(({ label, selected, data }: TelemetryTileProps) => {
  const chartRef = useRef<LineChartHandle>(null);
  const prevValue = useRef<TelemetryDataPoint | null>(null);

  useEffect(() => {
    console.log('[TelemetryTile] Received data:', data);
    if (data == null) return;

    const numericValue = typeof data.value === 'number' ? data.value : parseFloat(data.value);
    if (isNaN(numericValue)) {
      console.warn(`[TelemetryTile] Non-numeric telemetry value received: ${data.value}`);
      return;
    }

    // Avoid duplicate points if the value hasn't changed
    if (
      prevValue.current?.value !== numericValue &&
      prevValue.current?.timestamp !== data.timestamp
    ) {
      chartRef.current?.appendPoint(data.timestamp, [numericValue]);
      prevValue.current = data;
    }
  }, [data]);

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        minWidth: 150,
        minHeight: 250,
        aspectRatio: '16/9',
        borderRadius: '8px',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: 'primary.dark',
          minWidth: 150,
          minHeight: 250,
          borderRadius: '8px',
        }}
      >
        <LineChart
          ref={chartRef}
          initialData={[[0], [0]]}
          labels={['Time', 'Value 1']}
          units={['s', data?.unit ?? 'N/A']}
          title={label}
        />
      </Box>

      {!selected && (
        <Typography variant="caption" color="grey.500" sx={{ mt: 1 }}>
          Not selected
        </Typography>
      )}
    </Paper>
  );
});
