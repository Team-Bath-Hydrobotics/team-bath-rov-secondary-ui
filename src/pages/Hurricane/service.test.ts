import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpService, parseDetection } from './service';
import { SAMPLE_OBSERVATIONS } from './model';

const found = {
  status: 'found',
  eye: { x: 0.8, y: 0.2 },
  position: { latitude: -12, longitude: 130 },
};
const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Hurricane HTTP adapter', () => {
  it('uploads the original image as multipart data and reads the returned position', async () => {
    const fetch = vi.fn().mockResolvedValue(response(found));
    vi.stubGlobal('fetch', fetch);
    const file = new File(['image'], 'regional-map.png', { type: 'image/png' });
    const signal = new AbortController().signal;
    const result = await createHttpService('/hurricane-api').detect(
      { file, width: 300, height: 200 },
      signal,
    );
    expect(result).toEqual(found);
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe('/hurricane-api/detect');
    expect(request.body.get('image')).toBe(file);
    expect(request.headers).toBeUndefined();
  });

  it('keeps image localisation separate from unknown geographic coordinates', () => {
    expect(parseDetection({ ...found, position: null })).toMatchObject({
      position: null,
      eye: found.eye,
    });
    expect(parseDetection({ status: 'not_found' })).toEqual({ status: 'not_found' });
    expect(() => parseDetection({ ...found, eye: { x: 300, y: 200 } })).toThrow();
    expect(() => parseDetection({ ...found, position: { latitude: 100, longitude: 0 } })).toThrow();
  });

  it('sends observations, then the returned track and edited prompt', async () => {
    const track = {
      points: [
        { latitude: 4, longitude: 5 },
        { latitude: 6, longitude: 7 },
      ],
    };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(track))
      .mockResolvedValueOnce(
        response({
          points: [
            { latitude: 8, longitude: 9 },
            { latitude: 10, longitude: 11 },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetch);
    const api = createHttpService('/hurricane-api'),
      signal = new AbortController().signal;
    const result = await api.buildTrack(SAMPLE_OBSERVATIONS, signal);
    const prediction = await api.predict(result, 'Edited prompt', signal);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ observations: SAMPLE_OBSERVATIONS });
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ track, prompt: 'Edited prompt' });
    expect(prediction.points).toHaveLength(2);
  });

  it('accepts a generated graphic without inventing forecast coordinates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          graphicUrl: 'assets/forecast.png',
          assumptions: ['No observation times supplied'],
        }),
      ),
    );
    const result = await createHttpService('/hurricane-api').predict(
      { points: [] },
      'prompt',
      new AbortController().signal,
    );
    expect(result.points).toEqual([]);
    expect(result.graphicUrl).toContain('/hurricane-api/assets/forecast.png');
  });

  it('polls a queued job until completion', async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ jobId: 'job-1' }, 202))
      .mockResolvedValueOnce(response({ status: 'running' }))
      .mockResolvedValueOnce(response({ status: 'succeeded', result: found }));
    vi.stubGlobal('fetch', fetch);
    const pending = createHttpService('/hurricane-api').detect(
      { file: new File(['x'], 'x.png'), width: 1, height: 1 },
      new AbortController().signal,
    );
    await vi.advanceTimersByTimeAsync(2100);
    expect(await pending).toEqual(found);
    expect(fetch.mock.calls[1][0]).toBe('/hurricane-api/jobs/job-1');
  });

  it('cancels polling without issuing more requests', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValue(response({ jobId: 'job-1' }, 202));
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const pending = createHttpService('/hurricane-api').buildTrack(
      SAMPLE_OBSERVATIONS,
      controller.signal,
    );
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await rejected;
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports timeouts and backend failures rather than returning demo data', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ jobId: 'job-1' }, 202)));
    const pending = createHttpService('/hurricane-api', 20).buildTrack(
      SAMPLE_OBSERVATIONS,
      new AbortController().signal,
    );
    const rejected = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(30);
    await rejected;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 503)));
    await expect(
      createHttpService('/hurricane-api').buildTrack(
        SAMPLE_OBSERVATIONS,
        new AbortController().signal,
      ),
    ).rejects.toThrow('503');
  });
});

describe('Response validation and failure recovery', () => {
  it.each([
    null,
    [],
    'invalid',
    {},
    { ...found, model: 3 },
    { ...found, eye: null },
    { ...found, eye: { x: NaN, y: 0 } },
    { ...found, eye: { x: -0.1, y: 0 } },
    { ...found, confidence: 2 },
    { ...found, position: { latitude: 0, longitude: '1' } },
    { ...found, position: { latitude: 0, longitude: Infinity } },
    { ...found, position: { latitude: 0, longitude: -181 } },
    { ...found, position: { latitude: 0, longitude: 0, timestamp: 1 } },
    { ...found, position: { latitude: 0, longitude: 0, timestamp: 'yesterday' } },
  ])('rejects malformed detection %#', (value) => {
    expect(() => parseDetection(value)).toThrow();
  });

  it('preserves timestamp, confidence and model at valid coordinate boundaries', () => {
    const value = {
      ...found,
      eye: { x: 0, y: 1 },
      confidence: 0,
      model: 'eye-v1',
      position: { latitude: -90, longitude: 180, timestamp: '2026-11-09T12:00:00Z' },
    };
    expect(parseDetection(value)).toEqual(value);
  });

  it('requires an uploaded file before making an HTTP request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(
      createHttpService('/api').detect({ width: 1, height: 1 }, new AbortController().signal),
    ).rejects.toThrow('Upload');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([undefined, [], {}, Array(10001).fill({ latitude: 0, longitude: 0 })])(
    'rejects invalid track %#',
    async (points) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ points })));
      await expect(
        createHttpService('/api').buildTrack([], new AbortController().signal),
      ).rejects.toThrow('invalid path');
    },
  );

  it.each([
    { assumptions: 'text' },
    { assumptions: [1] },
    { graphicUrl: 1 },
    { graphicUrl: '' },
    { graphicUrl: 'javascript:alert(1)' },
    { points: [] },
    {},
  ])('rejects invalid prediction %#', async (value) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(value)));
    await expect(
      createHttpService('/api').predict({ points: [] }, '', new AbortController().signal),
    ).rejects.toThrow();
  });

  it('accepts an empty coordinate path with an HTTPS graphic', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(response({ points: [], graphicUrl: 'https://example.org/path.png' })),
    );
    await expect(
      createHttpService('/api/').predict({ points: [] }, '', new AbortController().signal),
    ).resolves.toMatchObject({ points: [], graphicUrl: 'https://example.org/path.png' });
  });

  it.each([{}, { jobId: '' }, { jobId: 1 }])(
    'rejects missing job identifiers %#',
    async (value) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(value, 202)));
      await expect(
        createHttpService('/api').buildTrack([], new AbortController().signal),
      ).rejects.toThrow('job identifier');
    },
  );

  it.each([
    [{ status: 'failed', message: 'Model unavailable' }, 200, 'Model unavailable'],
    [{ status: 'failed' }, 200, 'processing failed'],
    [{ status: 'unknown' }, 200, 'job status'],
    [{}, 502, '502'],
  ])('reports job failure %#', async (value, status, message) => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ jobId: 'a/b' }, 202))
        .mockResolvedValueOnce(response(value, status as number)),
    );
    const check = expect(
      createHttpService('/api/').buildTrack([], new AbortController().signal),
    ).rejects.toThrow(message as string);
    await vi.advanceTimersByTimeAsync(1000);
    await check;
    expect(fetch).toHaveBeenLastCalledWith('/api/jobs/a%2Fb', expect.anything());
    expect(vi.getTimerCount()).toBe(0);
  });

  it('continues polling a queued job', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ jobId: '1' }, 202))
        .mockResolvedValueOnce(response({ status: 'queued' }))
        .mockResolvedValueOnce(
          response({ status: 'succeeded', result: { points: [{ latitude: 0, longitude: 0 }] } }),
        ),
    );
    const pending = createHttpService('/api').buildTrack([], new AbortController().signal);
    await vi.advanceTimersByTimeAsync(2000);
    expect((await pending).points).toHaveLength(1);
  });

  it('forwards cancellation to fetch, including a previously cancelled request', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetch = vi.fn((_url, options) => {
      expect(options.signal.aborted).toBe(true);
      return Promise.reject(new DOMException('Cancelled', 'AbortError'));
    });
    vi.stubGlobal('fetch', fetch);
    await expect(createHttpService('/api').buildTrack([], controller.signal)).rejects.toMatchObject(
      { name: 'AbortError' },
    );
  });

  it('rejects invalid JSON without masking the error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
      }),
    );
    await expect(
      createHttpService('/api').buildTrack([], new AbortController().signal),
    ).rejects.toThrow('Invalid JSON');
  });

  it('cancels demo work and rejects predictions with too few positions', async () => {
    const { demoService } = await import('./service');
    const controller = new AbortController();
    controller.abort();
    await expect(
      demoService.detect({ width: 1, height: 1 }, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    vi.useFakeTimers();
    const check = expect(
      demoService.predict({ points: [] }, '', new AbortController().signal),
    ).rejects.toThrow('two positions');
    await vi.advanceTimersByTimeAsync(350);
    await check;
  });
});

describe('Service configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  it.each([undefined, '/custom-api'])(
    'selects the configured backend endpoint %s',
    async (base) => {
      vi.resetModules();
      vi.stubEnv('VITE_HURRICANE_MODE', 'backend');
      vi.stubEnv('VITE_HURRICANE_API_URL', base);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(response({ points: [{ latitude: 0, longitude: 0 }] })),
      );
      const { hurricaneService } = await import('./service');
      expect(hurricaneService.mode).toBe('backend');
      await hurricaneService.buildTrack([], new AbortController().signal);
      expect(fetch).toHaveBeenCalledWith(`${base ?? '/hurricane-api'}/track`, expect.anything());
    },
  );

  it('stops if cancellation arrives with the initial job response', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 202,
        json: async () => {
          controller.abort();
          return { jobId: '1' };
        },
      }),
    );
    await expect(createHttpService('/api').buildTrack([], controller.signal)).rejects.toMatchObject(
      { name: 'AbortError' },
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
