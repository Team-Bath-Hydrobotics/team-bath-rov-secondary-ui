import type { DetectionResponse, ModelResponse } from '../types/crab-detection.types';
import { createApiError } from '../types/api.types';

async function request<T>(baseUrl: string, url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${url}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw createApiError(res.status, body.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function getDetections(baseUrl: string, frame: string): Promise<DetectionResponse> {
  return request<DetectionResponse>(baseUrl, '/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frame: frame }),
  });
}

export async function getModel(baseUrl: string): Promise<ModelResponse> {
  return request<ModelResponse>(baseUrl, '/model', { method: 'GET' });
}
