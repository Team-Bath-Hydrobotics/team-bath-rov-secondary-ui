import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useTheme } from '@mui/material/styles';

interface LineChartProps {
  initialData: (number | null)[][];
  options?: Partial<uPlot.Options>;
  labels: string[];
  units: string[];
  title: string;
}

export interface LineChartHandle {
  appendPoint: (newX: number, newYs: number[]) => void;
}

export const LineChart = forwardRef<LineChartHandle, LineChartProps>(
  ({ initialData, options, labels, units, title }, ref) => {
    const theme = useTheme();
    const chartRef = useRef<HTMLDivElement>(null);
    const uplotRef = useRef<uPlot | null>(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 200 });

    const dataRef = useRef<(number | null)[][]>(
      initialData.map((series) => series.map((v) => v ?? null)),
    );

    // Observe container size
    useEffect(() => {
      if (!chartRef.current) return;
      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      });

      resizeObserver.observe(chartRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    // Create/update chart
    useEffect(() => {
      if (!chartRef.current) return;

      if (uplotRef.current) {
        uplotRef.current.destroy();
      }
      const textColor = theme.palette.text.primary;
      const gridColor = theme.palette.divider;
      // Build series config dynamically based on data
      const seriesConfig = [
        {}, // x-axis
        ...labels.slice(1).map((label, i) => ({
          label,
          stroke: i === 0 ? 'red' : 'blue',
          width: 2,
        })),
      ];

      uplotRef.current = new uPlot(
        {
          title: title || undefined,
          width: dimensions.width,
          height: dimensions.height,
          legend: {
            show: false,
          },
          cursor: {
            show: false,
          },
          scales: {
            x: { time: false },
            y: { auto: true },
          },
          axes: [
            {
              label: units[0] ? `Time (${units[0]})` : 'N/A',
              labelSize: 12,
              stroke: textColor,
              labelFont: '10px Arial',
              ticks: {
                stroke: textColor,
              },
              grid: {
                show: true,
                stroke: gridColor,
              },
            },
            {
              label: units[1] ? `Value (${units[1]})` : 'N/A',
              labelSize: 12,
              stroke: textColor,
              labelFont: '10px Arial',
              ticks: {
                stroke: textColor,
              },
              grid: {
                show: true,
                stroke: gridColor,
              },
            },
          ],
          series: seriesConfig,
          ...options,
        },
        dataRef.current as unknown as uPlot.AlignedData,
        chartRef.current,
      );

      return () => uplotRef.current?.destroy();
    }, [dimensions.width, dimensions.height, options, labels, units, title, theme]);

    useImperativeHandle(ref, () => ({
      appendPoint(newX, newYs) {
        const chart = uplotRef.current;
        const WINDOW_SECONDS = 10;
        if (!chart) return;

        const data = dataRef.current;

        data[0].push(newX);
        newYs.forEach((y, i) => {
          if (data[i + 1]) {
            data[i + 1].push(y);
          }
        });

        while (data[0].length && data[0][0]! < newX - WINDOW_SECONDS) {
          for (let i = 0; i < data.length; i++) {
            data[i].shift();
          }
        }

        chart.setData(data as unknown as uPlot.AlignedData);
      },
    }));

    return (
      <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: 200 }}>
        <style>{`
          .u-title {
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            margin-bottom: -20px;
          }
        `}</style>
      </div>
    );
  },
);

LineChart.displayName = 'LineChart';
