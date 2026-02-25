import type {
  JobResponse,
  UploadResponse,
  RunResponse,
  ScaleResponse,
  ManualCADResponse,
} from '../types/photogrammetry.types';
import { createApiError } from '../types/photogrammetry.types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw createApiError(res.status, body.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function createJob(): Promise<JobResponse> {
  return request<JobResponse>('/api/jobs', { method: 'POST' });
}

export async function getJob(jobId: string): Promise<JobResponse> {
  return request<JobResponse>(`/api/jobs/${jobId}`);
}

export async function listJobs(): Promise<JobResponse[]> {
  return request<JobResponse[]>('/api/jobs');
}

export async function uploadImages(jobId: string, files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('job_id', jobId);
  for (const file of files) {
    formData.append('files', file);
  }
  return request<UploadResponse>('/api/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function runPhotogrammetry(jobId: string): Promise<RunResponse> {
  return request<RunResponse>('/api/photogrammetry/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId }),
  });
}

export async function estimateScale(
  jobId: string,
  trueCoralLengthCm: number,
): Promise<ScaleResponse> {
  return request<ScaleResponse>('/api/scaling/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, true_coral_length_cm: trueCoralLengthCm }),
  });
}

export async function generateManualCAD(
  jobId: string,
  heightCm: number,
  lengthCm: number,
): Promise<ManualCADResponse> {
  return request<ManualCADResponse>('/api/manual-cad/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: jobId,
      estimated_height_cm: heightCm,
      true_coral_length_cm: lengthCm,
    }),
  });
}

export function getModelUrl(jobId: string): string {
  return `/api/jobs/${jobId}/model`;
}
