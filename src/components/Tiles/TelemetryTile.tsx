import { Paper, Box, Typography } from '@mui/material';
import { useRef, useEffect } from 'react';
import { LineChart, type LineChartHandle } from '../Charts/LineChart';
import React from 'react';
import type { TelemetryDataPoint } from '../../types/constants';

interface TelemetryTileProps {
  fieldId: string;
  label: string;
  selected: boolean;
  disconnectedMessage: string;
  data?: TelemetryDataPoint | TelemetryDataPoint[];
  isLive?: boolean;
}

export const TelemetryTile = React.memo(
  ({ label, selected, disconnectedMessage, data, isLive = true }: TelemetryTileProps) => {
    const chartRef = useRef<LineChartHandle>(null);
    const prevValue = useRef<TelemetryDataPoint | null>(null);

    useEffect(() => {
      if (!data) return;

      if (isLive) {
        const point = Array.isArray(data) ? data[data.length - 1] : data;
        const numericValue =
          typeof point.value === 'number' ? point.value : parseFloat(point.value as string);
        if (isNaN(numericValue)) {
          console.warn(`[TelemetryTile] Non-numeric telemetry value received: ${point.value}`);
          return;
        }

        if (
          prevValue.current?.value !== numericValue ||
          prevValue.current?.timestamp !== point.timestamp
        ) {
          chartRef.current?.appendPoint(point.timestamp, [numericValue]);
          prevValue.current = point;
        }
      } else {
        const pointsArray = Array.isArray(data) ? data : [data];

        const timestamps: number[] = [];
        const yValues: number[] = [];

        pointsArray.forEach((point) => {
          const numericValue =
            typeof point.value === 'number' ? point.value : parseFloat(point.value as string);

          if (!isNaN(numericValue)) {
            timestamps.push(point.timestamp);
            yValues.push(numericValue);
          }
        });

        chartRef.current?.setData(timestamps, [yValues]);
      }
    }, [data, isLive]);

    return (
      <Paper
        elevation={2}
        sx={{
          position: 'relative',
          width: '100%',
          height: 0,
          paddingTop: '56.25%', // 16:9 aspect ratio
          minHeight: 250,
          maxHeight: 500,
          borderRadius: '8px',
          overflow: 'hidden', // important to clip uPlot
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'primary.dark',
          }}
        >
          <LineChart
            ref={chartRef}
            initialData={undefined}
            labels={['Time', label]}
            units={['s', Array.isArray(data) ? (data[0]?.unit ?? 'N/A') : (data?.unit ?? 'N/A')]}
            title={label}
            disconnectedMessage={disconnectedMessage}
            isLive={isLive}
          />
        </Box>

        {!selected && (
          <Typography variant="caption" color="grey.500" sx={{ mt: 1 }}>
            Not selected
          </Typography>
        )}
      </Paper>
    );
  },
);
