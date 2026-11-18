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
  isLive?: boolean;
}

export interface LineChartHandle {
  appendPoint: (newX: number, newYs: number[]) => void;
  setData: (newXs: number[], newYs: number[][]) => void;
}

export const LineChart = forwardRef<LineChartHandle, LineChartProps>(
  ({ initialData, options, labels, units, title, disconnectedMessage, isLive = true }, ref) => {
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
    // x value of the first point received; x ticks are shown as seconds since this
    const startXRef = useRef<number | null>(normalizedInitialData[0]?.[0] ?? null);

    /**
     * Reactive render state
     */
    const [hasData, setHasData] = useState(normalizedInitialData[0]?.length > 0);
    const LABEL_HIDE_THRESHOLD = 400;
    const TICK_COUNT = 5; // fixed number of ticks per axis (4 intervals)
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
      const showLabels = dimensions.width >= LABEL_HIDE_THRESHOLD;

      // Evenly spaced ticks across the current range, so the tick count never changes
      const evenSplits = (_u: uPlot, _axisIdx: number, min: number, max: number) =>
        min == null || max == null
          ? []
          : Array.from(
              { length: TICK_COUNT },
              (_, i) => min + ((max - min) * i) / (TICK_COUNT - 1),
            );

      // Seconds since the first point received, e.g. 0.0 -> 20.0
      const elapsedValues = (_u: uPlot, splits: number[]) =>
        splits.map((v) => (v - (startXRef.current ?? v)).toFixed(1));

      // y limits hug the data (10% padding) so they move with the points
      const followRange = (_u: uPlot, min: number, max: number): uPlot.Range.MinMax => {
        if (min == null || max == null) return [0, 1];
        const pad = (max - min) * 0.1 || Math.abs(max) * 0.1 || 1;
        return [min - pad, max + pad];
      };

      const oneDecimalValues = (_u: uPlot, splits: number[]) => splits.map((v) => v.toFixed(1));

      const seriesConfig: uPlot.Series[] = [
        {},
        ...labels.slice(1).map((label, i) => ({
          label: showLabels ? label : '',
          stroke: i === 0 ? 'red' : 'blue',
          width: 2,
        })),
      ];

      uplotRef.current = new uPlot(
        {
          title: hasData ? title : undefined,
          width: dimensions.width,
          height: dimensions.height,
          legend: { show: !isLive && hasData },
          cursor: { show: !isLive && hasData },
          scales: {
            x: { time: false },
            y: { auto: true, range: followRange },
          },
          axes: [
            {
              label: units[0] ? `${labels[0] ?? 'X'} (${units[0]})` : (labels[0] ?? 'X'),
              labelSize: 12,
              stroke: textColor,
              labelFont: '10px Arial',
              splits: evenSplits,
              values: elapsedValues,
              ticks: { stroke: textColor },
              grid: { show: true, stroke: gridColor },
            },
            {
              label: units[1] ? `${labels[1] ?? 'Y'} (${units[1]})` : (labels[1] ?? 'Y'),
              labelSize: 12,
              stroke: textColor,
              labelFont: '10px Arial',
              splits: evenSplits,
              values: oneDecimalValues,
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
    }, [dimensions, options, labels, units, title, theme, hasData, isLive]);

    /**
     * Imperative API
     */
    useImperativeHandle(ref, () => ({
      appendPoint(newX, newYs) {
        const chart = uplotRef.current;
        if (!chart) return;

        const WINDOW_SECONDS = 10;
        const data = dataRef.current;

        if (startXRef.current === null) startXRef.current = newX;
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

        startXRef.current = newXs[0] ?? null;
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
          width: '90%',
          height: '90%',
          minHeight: 0, // allow flex to control height
          maxHeight: '100%', // prevent overflow
          position: 'relative',
          padding: 2,
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
      </div>
    );
  },
);

LineChart.displayName = 'LineChart';
