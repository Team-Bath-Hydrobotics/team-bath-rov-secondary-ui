export interface Observation {
  id: string;
  latitude: number;
  longitude: number;
  source: string;
  timestamp?: string;
  method?: 'demo' | 'backend';
  model?: string;
}

export const STORAGE_KEY = 'bath-hurricane-observations-v1';

export function readObservations(): Observation[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(
      (p): p is Observation =>
        p !== null &&
        typeof p === 'object' &&
        typeof p.id === 'string' &&
        typeof p.source === 'string' &&
        typeof p.latitude === 'number' &&
        Number.isFinite(p.latitude) &&
        Math.abs(p.latitude) <= 90 &&
        typeof p.longitude === 'number' &&
        Number.isFinite(p.longitude) &&
        Math.abs(p.longitude) <= 180 &&
        (p.method === undefined || p.method === 'demo' || p.method === 'backend') &&
        (p.timestamp === undefined ||
          (typeof p.timestamp === 'string' && Number.isFinite(Date.parse(p.timestamp)))) &&
        (p.model === undefined || typeof p.model === 'string'),
    );
  } catch {
    return [];
  }
}

export const SAMPLE_OBSERVATIONS: Observation[] = [
  { id: 'sample-1', latitude: 12, longitude: -45, source: 'Sample 01' },
  { id: 'sample-2', latitude: 14, longitude: -50, source: 'Sample 02' },
  { id: 'sample-3', latitude: 17, longitude: -55, source: 'Sample 03' },
  { id: 'sample-4', latitude: 20, longitude: -60, source: 'Sample 04' },
];

export function predictNext(points: Observation[]) {
  if (points.length < 2) return null;
  const a = points[points.length - 2],
    b = points[points.length - 1];
  const delta = ((b.longitude - a.longitude + 540) % 360) - 180;
  return {
    latitude: Math.max(-90, Math.min(90, b.latitude * 2 - a.latitude)),
    longitude: ((b.longitude + delta + 540) % 360) - 180,
  };
}

export function makePrompt(points: Observation[]) {
  return `Plot these observed hurricane eye positions in order (latitude, longitude): ${points.map((p) => `(${p.latitude}, ${p.longitude})${p.timestamp ? ` at ${p.timestamp}` : ' (time unavailable)'}`).join('; ')}. Distinguish observed movement from the predicted path and state assumptions. Use only supplied observation times.`;
}

export function observationsCsv(points: Observation[]) {
  return (
    'observation,latitude,longitude,method\n' +
    points
      .map(
        (p, i) =>
          `${i + 1},${p.latitude},${p.longitude},${p.method === 'backend' ? 'Detection' : 'Simulated'}`,
      )
      .join('\n')
  );
}

export function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
