import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  JobResponse,
  UploadResponse,
  RunResponse,
  ScaleResponse,
  ManualCADResponse,
} from '../types/photogrammetry.types';
import type { ApiError } from '../types/api.types';
import {
  createJob,
  getJob,
  listJobs,
  uploadImages,
  runPhotogrammetry,
  estimateScale,
  generateManualCAD,
  getModelUrl,
} from './photogrammetry';

const BASE = 'http://backend.test';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const makeJob = (overrides: Partial<JobResponse> = {}): JobResponse => ({
  id: 'job-1',
  status: 'pending',
  progress: 0,
  stage: null,
  created_at: '2026-11-09T10:00:00Z',
  output_url: null,
  estimated_height_cm: null,
  error: null,
  ...overrides,
});

const makeImage = (name: string) => new File(['img'], name, { type: 'image/jpeg' });

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init };
};

const lastJsonBody = () => JSON.parse(lastCall().init?.body as string);

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request error handling', () => {
  it('throws an ApiError using the detail from a JSON error body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Job not found' }, { status: 404 }));

    const error = (await getJob(BASE, 'missing').catch((e) => e)) as ApiError;

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Job not found');
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>oops</html>', { status: 502, statusText: 'Bad Gateway' }),
    );

    await expect(getJob(BASE, 'job-1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      message: 'Bad Gateway',
    });
  });

  it('falls back to the status text when the JSON error body has no detail', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'something' }, { status: 500, statusText: 'Internal Server Error' }),
    );

    await expect(getJob(BASE, 'job-1')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    });
  });

  it('falls back to the status text when detail is null', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: null }, { status: 500, statusText: 'Internal Server Error' }),
    );

    await expect(getJob(BASE, 'job-1')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    });
  });

  it.each([400, 404, 422, 500])('propagates HTTP status %i on the thrown error', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'failed' }, { status }));

    await expect(getJob(BASE, 'job-1')).rejects.toMatchObject({ status, message: 'failed' });
  });

  it('keeps the 422 status for FastAPI request-validation errors', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { detail: [{ loc: ['body', 'job_id'], msg: 'Field required', type: 'missing' }] },
        { status: 422 },
      ),
    );

    await expect(runPhotogrammetry(BASE, 'job-1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
    });
  });

  it.fails('uses the validation message from a FastAPI 422 detail array', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { detail: [{ loc: ['body', 'job_id'], msg: 'Field required', type: 'missing' }] },
        { status: 422 },
      ),
    );

    await expect(runPhotogrammetry(BASE, 'job-1')).rejects.toMatchObject({
      message: 'Field required',
    });
  });

  it('propagates network failures unchanged', async () => {
    const networkError = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(networkError);

    await expect(getJob(BASE, 'job-1')).rejects.toBe(networkError);
  });

  it('rejects with a parse error (not an ApiError) when a 2xx body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 200 }));

    const error = await getJob(BASE, 'job-1').catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SyntaxError');
    expect(error).not.toHaveProperty('status');
  });
});

describe('createJob', () => {
  it('POSTs to the jobs endpoint and resolves with the new job', async () => {
    const job = makeJob();
    fetchMock.mockResolvedValue(jsonResponse(job));

    await expect(createJob(BASE)).resolves.toEqual(job);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/api/jobs`);
    expect(init).toEqual({ method: 'POST' });
  });
});

describe('getJob', () => {
  it('GETs the job by id and resolves with it', async () => {
    const job = makeJob({ id: 'abc-123', status: 'reconstructing', progress: 42 });
    fetchMock.mockResolvedValue(jsonResponse(job));

    await expect(getJob(BASE, 'abc-123')).resolves.toEqual(job);

    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/api/jobs/abc-123`);
    expect(init).toBeUndefined();
  });
});

describe('listJobs', () => {
  it('GETs all jobs and resolves with the list', async () => {
    const jobs = [makeJob({ id: 'a' }), makeJob({ id: 'b', status: 'complete', progress: 100 })];
    fetchMock.mockResolvedValue(jsonResponse(jobs));

    await expect(listJobs(BASE)).resolves.toEqual(jobs);

    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/api/jobs`);
    expect(init).toBeUndefined();
  });

  it('resolves with an empty array when there are no jobs', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(listJobs(BASE)).resolves.toEqual([]);
  });
});

describe('uploadImages', () => {
  const uploadResponse: UploadResponse = { job_id: 'job-1', file_count: 2, total_size_mb: 0.01 };

  it('POSTs multipart form data to the upload endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(uploadResponse));

    await expect(
      uploadImages(BASE, 'job-1', [makeImage('a.jpg'), makeImage('b.jpg')]),
    ).resolves.toEqual(uploadResponse);

    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/api/upload`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);
    // Content-Type must be left to the browser so it can set the multipart boundary
    expect(init?.headers).toBeUndefined();
  });

  it('includes the job id and one files entry per file with its name', async () => {
    fetchMock.mockResolvedValue(jsonResponse(uploadResponse));

    await uploadImages(BASE, 'job-1', [makeImage('coral_01.jpg'), makeImage('coral_02.jpg')]);

    const body = lastCall().init?.body as FormData;
    expect(body.get('job_id')).toBe('job-1');
    const files = body.getAll('files') as File[];
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.name)).toEqual(['coral_01.jpg', 'coral_02.jpg']);
  });

  it('preserves each file MIME type (backend rejects non-image content types)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(uploadResponse));
    const png = new File(['img'], 'coral.png', { type: 'image/png' });

    await uploadImages(BASE, 'job-1', [makeImage('coral.jpg'), png]);

    const files = (lastCall().init?.body as FormData).getAll('files') as File[];
    expect(files.map((f) => f.type)).toEqual(['image/jpeg', 'image/png']);
  });

  it('sends only the job id when no files are given', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...uploadResponse, file_count: 0 }));

    await uploadImages(BASE, 'job-1', []);

    const body = lastCall().init?.body as FormData;
    expect(body.get('job_id')).toBe('job-1');
    expect(body.getAll('files')).toEqual([]);
  });
});

describe('runPhotogrammetry', () => {
  const runResponse: RunResponse = {
    job_id: 'job-1',
    status: 'reconstructing',
    message: 'Started',
  };

  it('POSTs the job id as JSON to the run endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(runResponse));

    await expect(runPhotogrammetry(BASE, 'job-1')).resolves.toEqual(runResponse);

    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/api/photogrammetry/run`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(lastJsonBody()).toEqual({ job_id: 'job-1' });
  });

  it('includes skip_undistort when skipUndistort is true', async () => {
    fetchMock.mockResolvedValue(jsonResponse(runResponse));

    await runPhotogrammetry(BASE, 'job-1', { skipUndistort: true });

    expect(lastJsonBody()).toEqual({ job_id: 'job-1', skip_undistort: true });
  });

  it.each([
    ['skipUndistort is false', { skipUndistort: false }],
    ['options are empty', {}],
    ['options are omitted', undefined],
  ])('omits skip_undistort when %s', async (_name, options) => {
    fetchMock.mockResolvedValue(jsonResponse(runResponse));

    await runPhotogrammetry(BASE, 'job-1', options);

    expect(lastJsonBody()).not.toHaveProperty('skip_undistort');
  });
});

describe('estimateScale', () => {
  const scaleResponse: ScaleResponse = {
    job_id: 'job-1',
    estimated_height_cm: 18.4,
    scale_factor: 2.5,
    bounding_box: { width: 30, height: 18.4, depth: 12 },
  };

  it('POSTs the job id and true coral length as JSON to the scaling endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(scaleResponse));

    await expect(estimateScale(BASE, 'job-1', 30)).resolves.toEqual(scaleResponse);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/api/scaling/estimate`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(lastJsonBody()).toEqual({ job_id: 'job-1', true_coral_length_cm: 30 });
  });

  it('sends fractional lengths unchanged', async () => {
    fetchMock.mockResolvedValue(jsonResponse(scaleResponse));

    await estimateScale(BASE, 'job-1', 27.35);

    expect(lastJsonBody().true_coral_length_cm).toBe(27.35);
  });

  it('rejects with the backend detail when the model has not been built yet', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: 'Model not found for this job' }, { status: 404 }),
    );

    await expect(estimateScale(BASE, 'job-1', 30)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Model not found for this job',
    });
  });
});

describe('generateManualCAD', () => {
  it('POSTs height and length as JSON to the manual CAD endpoint', async () => {
    const cadResponse: ManualCADResponse = {
      job_id: 'job-1',
      output_url: '/api/jobs/job-1/model',
      message: 'Generated',
    };
    fetchMock.mockResolvedValue(jsonResponse(cadResponse));

    await expect(generateManualCAD(BASE, 'job-1', 12.5, 30)).resolves.toEqual(cadResponse);

    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/api/manual-cad/generate`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(lastJsonBody()).toEqual({
      job_id: 'job-1',
      estimated_height_cm: 12.5,
      true_coral_length_cm: 30,
    });
  });
});

describe('getModelUrl', () => {
  it('returns the model path for the job', () => {
    expect(getModelUrl('job-1')).toBe('/api/jobs/job-1/model');
  });

  it('does not make a network request', () => {
    getModelUrl('job-1');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
