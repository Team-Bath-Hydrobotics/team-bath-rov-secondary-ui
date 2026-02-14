import type { TelemetryDataPoint } from '../types/constants';

export const parseCsvToDataPoints = async (file: File): Promise<TelemetryDataPoint[]> => {
  const text = await file.text(); // read file content as text
  const lines = text.split(/\r?\n/); // split by newline

  const dataPoints: TelemetryDataPoint[] = [];

  for (const line of lines) {
    if (!line.trim()) continue; // skip empty lines

    // Split by common delimiters: comma, semicolon, or tab
    const values = line.split(/[,;\t]/).map((v) => v.trim());

    // Extract numeric values only
    const numericValues = values.map((v) => parseFloat(v)).filter((v) => !isNaN(v));

    if (numericValues.length === 0) continue;

    let depth: number | null = null;
    let timestamp: number | null = null;

    // Heuristic: assume the smaller number is depth (in meters), larger is timestamp (possibly Unix)
    if (numericValues.length === 1) {
      // Only one number on the line, could be depth or timestamp
      depth = parseFloat(numericValues[0].toFixed(2));
      timestamp = 0; // fallback
    } else {
      // Pick min as depth, max as timestamp
      const sorted = [...numericValues].sort((a, b) => a - b);
      depth = parseFloat(sorted[0].toFixed(2));
      timestamp = sorted[sorted.length - 1];
    }
    const dataPoint = {
      timestamp,
      value: depth,
      unit: 'm',
    } as TelemetryDataPoint;

    dataPoints.push(dataPoint);
  }

  return dataPoints;
};
