import { predictNext } from './model';
import type { Observation } from './model';

export interface Position {
  latitude: number;
  longitude: number;
  timestamp?: string;
}
export type DetectionResult =
  | { status: 'not_found' }
  | {
      status: 'found';
      eye: { x: number; y: number };
      position: Position | null;
      confidence?: number;
      model?: string;
    };
export interface TrackResult {
  points: Position[];
}
export interface PredictionResult {
  points: Position[];
  graphicUrl?: string;
  assumptions?: string[];
}
export interface DetectionInput {
  file?: File;
  width: number;
  height: number;
}
export interface HurricaneService {
  mode: 'demo' | 'backend';
  detect(input: DetectionInput, signal: AbortSignal): Promise<DetectionResult>;
  buildTrack(observations: Observation[], signal: AbortSignal): Promise<TrackResult>;
  predict(track: TrackResult, prompt: string, signal: AbortSignal): Promise<PredictionResult>;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid hurricane service response.');
  return value as Record<string, unknown>;
}
function number(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error('Invalid coordinate in hurricane service response.');
  return value;
}
function position(value: unknown): Position {
  const p = record(value);
  if (
    p.timestamp !== undefined &&
    (typeof p.timestamp !== 'string' || !Number.isFinite(Date.parse(p.timestamp)))
  )
    throw new Error('Invalid observation time.');
  return {
    latitude: number(p.latitude, -90, 90),
    longitude: number(p.longitude, -180, 180),
    ...(p.timestamp ? { timestamp: p.timestamp as string } : {}),
  };
}
function points(value: unknown): Position[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10000)
    throw new Error('The hurricane service returned an invalid path.');
  return value.map(position);
}
export function parseDetection(value: unknown): DetectionResult {
  const v = record(value);
  if (v.status === 'not_found') return { status: 'not_found' };
  if (v.status !== 'found') throw new Error('Invalid detection status.');
  const eye = record(v.eye);
  if (v.model !== undefined && typeof v.model !== 'string')
    throw new Error('Invalid model identifier.');
  return {
    status: 'found',
    eye: { x: number(eye.x, 0, 1), y: number(eye.y, 0, 1) },
    position: v.position === null ? null : position(v.position),
    ...(v.confidence !== undefined ? { confidence: number(v.confidence, 0, 1) } : {}),
    ...(typeof v.model === 'string' ? { model: v.model } : {}),
  };
}

export function createHttpService(baseUrl: string, timeoutMs = 120000): HurricaneService {
  async function post(
    path: string,
    body: FormData | object,
    signal: AbortSignal,
  ): Promise<unknown> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal.aborted) controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const multipart = body instanceof FormData;
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method: 'POST',
        signal: controller.signal,
        ...(multipart ? {} : { headers: { 'Content-Type': 'application/json' } }),
        body: multipart ? body : JSON.stringify(body),
      });
      if (!response.ok)
        throw new Error(`Hurricane service request failed (${response.status}). Please retry.`);
      const initial: unknown = await response.json();
      if (response.status !== 202) return initial;
      const job = record(initial);
      if (typeof job.jobId !== 'string' || !job.jobId)
        throw new Error('Invalid hurricane job identifier.');
      while (!controller.signal.aborted) {
        await wait(controller.signal, 1000);
        const update = await fetch(
          `${baseUrl.replace(/\/$/, '')}/jobs/${encodeURIComponent(job.jobId)}`,
          { signal: controller.signal },
        );
        if (!update.ok)
          throw new Error(`Hurricane job request failed (${update.status}). Please retry.`);
        const state = record(await update.json());
        if (state.status === 'succeeded') return state.result;
        if (state.status === 'failed')
          throw new Error(
            typeof state.message === 'string'
              ? state.message
              : 'Hurricane processing failed. Please retry.',
          );
        if (state.status !== 'queued' && state.status !== 'running')
          throw new Error('Invalid hurricane job status.');
      }
      throw new DOMException('Cancelled', 'AbortError');
    } catch (error) {
      if (timedOut) throw new Error('Hurricane service timed out. Please retry.');
      throw error;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    }
  }
  return {
    mode: 'backend',
    async detect(input, signal) {
      if (!input.file) throw new Error('Upload an image before running detection.');
      const body = new FormData();
      body.append('image', input.file);
      return parseDetection(await post('/detect', body, signal));
    },
    async buildTrack(observations, signal) {
      const result = record(await post('/track', { observations }, signal));
      return { points: points(result.points) };
    },
    async predict(track, prompt, signal) {
      const result = record(await post('/predict', { track, prompt }, signal));
      if (
        result.assumptions !== undefined &&
        (!Array.isArray(result.assumptions) ||
          !result.assumptions.every((x) => typeof x === 'string'))
      )
        throw new Error('Invalid prediction assumptions.');
      let graphicUrl: string | undefined;
      if (result.graphicUrl !== undefined) {
        if (typeof result.graphicUrl !== 'string' || !result.graphicUrl)
          throw new Error('Invalid prediction graphic URL.');
        const resolved = new URL(
          result.graphicUrl,
          new URL(baseUrl.replace(/\/$/, '') + '/', window.location.origin),
        );
        if (!['http:', 'https:'].includes(resolved.protocol))
          throw new Error('Invalid prediction graphic URL.');
        graphicUrl = resolved.href;
      }
      const path =
        Array.isArray(result.points) && result.points.length === 0 && graphicUrl
          ? []
          : result.points === undefined && graphicUrl
            ? []
            : points(result.points);
      return {
        points: path,
        graphicUrl,
        assumptions: result.assumptions as string[] | undefined,
      };
    },
  };
}

function wait(signal: AbortSignal, durationMs = 350): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Cancelled', 'AbortError'));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, durationMs);
    signal.addEventListener('abort', abort, { once: true });
  });
}
export const demoService: HurricaneService = {
  mode: 'demo',
  async detect(_input, signal) {
    await wait(signal);
    return {
      status: 'found',
      eye: { x: 1 / 3, y: 0.39 },
      position: { latitude: 20, longitude: -60 },
      model: 'demo',
    };
  },
  async buildTrack(observations, signal) {
    await wait(signal);
    return {
      points: observations.map(({ latitude, longitude, timestamp }) => ({
        latitude,
        longitude,
        timestamp,
      })),
    };
  },
  async predict(track, _prompt, signal) {
    await wait(signal);
    const next = predictNext(track.points.map((p, i) => ({ ...p, id: String(i), source: 'demo' })));
    if (!next) throw new Error('At least two positions are required.');
    return { points: [next] };
  },
};
export const hurricaneService =
  import.meta.env.VITE_HURRICANE_MODE === 'backend'
    ? createHttpService(import.meta.env.VITE_HURRICANE_API_URL || '/hurricane-api')
    : demoService;
