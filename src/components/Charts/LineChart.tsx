import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

interface LineChartProps {
  initialData: (number | null)[][];
  options?: Partial<uPlot.Options>;
}

export interface LineChartHandle {
  appendPoint: (newX: number, newYs: number[]) => void;
}

export const LineChart = forwardRef<LineChartHandle, LineChartProps>(
  ({ initialData, options }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const uplotRef = useRef<uPlot | null>(null);

    const dataRef = useRef<(number | null)[][]>(
      initialData.map((series) => series.map((v) => v ?? null)),
    );

    useEffect(() => {
      if (!chartRef.current) return;

      uplotRef.current = new uPlot(
        {
          width: 1000,
          height: 300,
          scales: { x: { time: false }, y: { auto: true } },
          series: [{}, { label: 'Stream 1', stroke: 'red' }, { label: 'Stream 2', stroke: 'blue' }],
          ...options,
        },
        dataRef.current as unknown as uPlot.AlignedData,
        chartRef.current,
      );

      return () => uplotRef.current?.destroy();
    }, []);

    useImperativeHandle(ref, () => ({
      appendPoint(newX, newYs) {
        const chart = uplotRef.current;
        const WINDOW_SECONDS = 10;
        if (!chart) return;

        const data = dataRef.current;

        // Append new point
        data[0].push(newX);
        newYs.forEach((y, i) => {
          data[i + 1].push(y);
        });

        while (data[0].length && data[0][0]! < newX - WINDOW_SECONDS) {
          for (let i = 0; i < data.length; i++) {
            data[i].shift();
          }
        }

        chart.setData(data as unknown as uPlot.AlignedData);
      },
    }));

    return <div ref={chartRef} />;
  },
);
