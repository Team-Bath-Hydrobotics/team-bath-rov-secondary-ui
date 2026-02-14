import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useMemo } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useTheme } from '@mui/material/styles';

interface LineChartProps {
  initialData?: (number | null)[][];
  options?: Partial<uPlot.Options>;
  labels: string[];
  units: string[];
  title: string;
  disconnectedMessage: string;
}

export interface LineChartHandle {
  appendPoint: (newX: number, newYs: number[]) => void;
  setData: (newXs: number[], newYs: number[][]) => void;
}

export const LineChart = forwardRef<LineChartHandle, LineChartProps>(
  ({ initialData, options, labels, units, title, disconnectedMessage }, ref) => {
    const theme = useTheme();
    const chartRef = useRef<HTMLDivElement>(null);
    const uplotRef = useRef<uPlot | null>(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 200 });

    /**
     * Normalize initial data safely
     */
    const normalizedInitialData = useMemo<(number | null)[][]>(() => {
      if (!initialData || initialData.length === 0) {
        return [[], []];
      }
      return initialData.map((series) => series.map((v) => v ?? null));
    }, [initialData]);

    const dataRef = useRef<(number | null)[][]>(normalizedInitialData);

    /**
     * Reactive render state
     */
    const [hasData, setHasData] = useState(normalizedInitialData[0]?.length > 0);

    /**
     * Observe container size
     */
    useEffect(() => {
      if (!chartRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      });

      resizeObserver.observe(chartRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    /**
     * Create / update chart
     */
    useEffect(() => {
      if (!chartRef.current) return;

      if (uplotRef.current) {
        uplotRef.current.destroy();
      }

      const textColor = theme.palette.text.primary;
      const gridColor = theme.palette.divider;

      const seriesConfig: uPlot.Series[] = [
        {},
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
          legend: { show: false },
          cursor: { show: false },
          scales: {
            x: { time: hasData },
            y: { auto: true },
          },
          axes: [
            {
              label: units[0] ? `${labels[0] ?? 'X'} (${units[0]})` : (labels[0] ?? 'X'),
              labelSize: 12,
              stroke: textColor,
              labelFont: '10px Arial',
              ticks: { stroke: textColor },
              grid: { show: true, stroke: gridColor },
            },
            {
              label: units[1] ? `${labels[1] ?? 'Y'} (${units[1]})` : (labels[1] ?? 'Y'),
              labelSize: 12,
              stroke: textColor,
              labelFont: '10px Arial',
              ticks: { stroke: textColor },
              grid: { show: true, stroke: gridColor },
            },
          ],
          series: seriesConfig,
          ...options,
        },
        dataRef.current as unknown as uPlot.AlignedData,
        chartRef.current,
      );

      return () => uplotRef.current?.destroy();
    }, [dimensions, options, labels, units, title, theme, hasData]);

    /**
     * Imperative API
     */
    useImperativeHandle(ref, () => ({
      appendPoint(newX, newYs) {
        const chart = uplotRef.current;
        if (!chart) return;

        const WINDOW_SECONDS = 10;
        const data = dataRef.current;

        data[0].push(newX);

        newYs.forEach((y, i) => {
          if (!data[i + 1]) data[i + 1] = [];
          data[i + 1].push(y ?? null);
        });

        while (data[0].length && data[0][0]! < newX - WINDOW_SECONDS) {
          for (let i = 0; i < data.length; i++) {
            data[i].shift();
          }
        }

        if (!hasData) {
          setHasData(true);
        }

        chart.setData(data as unknown as uPlot.AlignedData);
      },

      setData(newXs, newYs) {
        const chart = uplotRef.current;
        if (!chart) return;

        const alignedData: (number | null)[][] = [newXs, ...newYs];

        dataRef.current = alignedData.map((series) => series.map((v) => v ?? null));

        setHasData(newXs.length > 0);

        chart.setData(dataRef.current as unknown as uPlot.AlignedData);
      },
    }));

    return (
      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 200,
          position: 'relative',
        }}
      >
        {!hasData && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.text.secondary,
              fontSize: 14,
              fontWeight: 500,
              pointerEvents: 'none',
            }}
          >
            {disconnectedMessage}
          </div>
        )}

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
