import { Paper, Box, Typography } from '@mui/material';
import { useRef, useEffect } from 'react';
import { LineChart, type LineChartHandle } from '../Charts/LineChart';
import React from 'react';
interface TelemetryTileProps {
  fieldId: string;
  label: string;
  unit: string;
  selected: boolean;
}

export const TelemetryTile = React.memo(({ label, unit, selected }: TelemetryTileProps) => {
  // REF TO THE CHART HANDLE, NOT uPlot
  const chartRef = useRef<LineChartHandle>(null);

  // Add a new point every second (simulated telemetry)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const timestamp = (Date.now() - startTime) / 1000;
      const newValues = [Math.random() * 10, Math.random() * 10];
      chartRef.current?.appendPoint(timestamp, newValues);
    }, 50);
    return () => clearInterval(interval);
  }, []);

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
          units={['s', unit]}
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
