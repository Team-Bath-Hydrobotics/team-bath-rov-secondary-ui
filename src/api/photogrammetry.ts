import type {
  JobResponse,
  UploadResponse,
  RunResponse,
  ScaleResponse,
  ManualCADResponse,
} from '../types/photogrammetry.types';
import { createApiError } from '../types/api.types';
async function request<T>(baseUrl: string, url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${url}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw createApiError(res.status, body.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function createJob(baseUrl: string): Promise<JobResponse> {
  return request<JobResponse>(baseUrl, '/api/jobs', { method: 'POST' });
}

export async function getJob(baseUrl: string, jobId: string): Promise<JobResponse> {
  return request<JobResponse>(baseUrl, `/api/jobs/${jobId}`);
}

export async function listJobs(baseUrl: string): Promise<JobResponse[]> {
  return request<JobResponse[]>(baseUrl, '/api/jobs');
}

export async function uploadImages(
  baseUrl: string,
  jobId: string,
  files: File[],
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('job_id', jobId);
  for (const file of files) {
    formData.append('files', file);
  }
  return request<UploadResponse>(baseUrl, '/api/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function runPhotogrammetry(baseUrl: string, jobId: string): Promise<RunResponse> {
  return request<RunResponse>(baseUrl, '/api/photogrammetry/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId }),
  });
}

export async function estimateScale(
  baseUrl: string,
  jobId: string,
  trueCoralLengthCm: number,
): Promise<ScaleResponse> {
  return request<ScaleResponse>(baseUrl, '/api/scaling/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, true_coral_length_cm: trueCoralLengthCm }),
  });
}

export async function generateManualCAD(
  baseUrl: string,
  jobId: string,
  heightCm: number,
  lengthCm: number,
): Promise<ManualCADResponse> {
  return request<ManualCADResponse>(baseUrl, '/api/manual-cad/generate', {
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
