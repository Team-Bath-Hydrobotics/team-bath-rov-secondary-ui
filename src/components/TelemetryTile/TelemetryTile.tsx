import { Paper, Box, Typography } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useRef, useEffect } from 'react';
import { LineChart, type LineChartHandle } from '../Charts/LineChart';

interface TelemetryTileProps {
  fieldId: string;
  label: string;
  unit: string;
  selected: boolean;
}

export const TelemetryTile = ({ label, unit, selected }: TelemetryTileProps) => {
  // REF TO THE CHART HANDLE, NOT uPlot
  const chartRef = useRef<LineChartHandle>(null);

  // Add a new point every second (simulated telemetry)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const timestamp = (Date.now() - startTime) / 1000;
      const newValues = [Math.random() * 10, Math.random() * 10];
      console.log('Appending point', timestamp, newValues);
      chartRef.current?.appendPoint(timestamp, newValues);
    }, 10);
    return () => clearInterval(interval);
  }, []);

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        minHeight: 150,
        width: '1000px',
        opacity: selected ? 1 : 0.5,
        backgroundColor: selected ? 'background.paper' : 'grey.200',
        transition: 'opacity 0.3s, background-color 0.3s',
      }}
    >
      <Box
        sx={{
          width: '1000px',
          height: '100%',
          minHeight: 1050,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 2,
        }}
      >
        <ShowChartIcon sx={{ fontSize: 36, color: selected ? 'primary.main' : 'grey.400' }} />
        <Typography
          variant="subtitle1"
          fontWeight={500}
          color={selected ? 'text.primary' : 'grey.500'}
        >
          {label}
        </Typography>
        {unit && (
          <Typography variant="caption" color={selected ? 'text.secondary' : 'grey.400'}>
            ({unit})
          </Typography>
        )}

        <LineChart
          ref={chartRef}
          initialData={[[0], [0], [0]]} // start at 0
          options={{
            width: 100,
            height: 300,
          }}
        />

        {!selected && (
          <Typography variant="caption" color="grey.500" sx={{ mt: 1 }}>
            Not selected
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
