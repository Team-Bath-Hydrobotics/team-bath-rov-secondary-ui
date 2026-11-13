import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Hurricane } from './index';
import { predictNext, readObservations, SAMPLE_OBSERVATIONS, STORAGE_KEY } from './model';

vi.mock('../../layouts/MainContentLayout', () => ({
  MainContentLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Hurricane workflow', () => {
  it('requires an image and a completed result before saving, then carries it into tracking', async () => {
    vi.useFakeTimers();
    render(<Hurricane />);
    expect(screen.getByRole('button', { name: 'Detect eye' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add to track' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Detect eye' }));
    expect(screen.getByRole('button', { name: 'Add to track' })).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to track' }));
    expect(screen.getByRole('button', { name: 'Added to track' })).toBeDisabled();
    fireEvent.click(screen.getByRole('tab', { name: 'Hurricane track' }));
    expect(screen.getByRole('table', { name: 'Hurricane observations' })).toHaveTextContent(
      '20.00°',
    );
    expect(readObservations()).toHaveLength(1);
  });

  it('requires two positions for prediction and invalidates it when observations are removed', async () => {
    vi.useFakeTimers();
    render(<Hurricane />);
    fireEvent.click(screen.getByRole('tab', { name: 'AI prediction' }));
    expect(screen.getByRole('button', { name: 'Generate prediction' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Load sample track' }));
    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'Review this track' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate prediction' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen
        .getByRole('img', { name: 'Hurricane track map' })
        .querySelector('[data-testid=predicted-path]'),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove observation 4' }));
    expect(
      screen
        .getByRole('img', { name: 'Hurricane track map' })
        .querySelector('[data-testid=predicted-path]'),
    ).toBeNull();
  });

  it('rejects unsupported files without starting analysis', () => {
    render(<Hurricane />);
    fireEvent.change(screen.getByLabelText('Upload hurricane image'), {
      target: { files: [new File(['text'], 'map.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a PNG, JPEG or WebP');
    expect(screen.getByRole('button', { name: 'Detect eye' })).toBeDisabled();
  });

  it('ignores malformed stored observations', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        null,
        { id: 'x', source: 'x', latitude: 100, longitude: 0 },
        ...SAMPLE_OBSERVATIONS,
      ]),
    );
    expect(readObservations()).toEqual(SAMPLE_OBSERVATIONS);
    localStorage.setItem(STORAGE_KEY, 'broken');
    expect(readObservations()).toEqual([]);
  });

  it('handles longitude wrap and insufficient positions', () => {
    expect(predictNext([])).toBeNull();
    expect(
      predictNext([
        { ...SAMPLE_OBSERVATIONS[0], longitude: 178 },
        { ...SAMPLE_OBSERVATIONS[1], longitude: -179 },
      ])?.longitude,
    ).toBe(-176);
  });
});

describe('Backend-driven presentation', () => {
  it('renders returned eye and coordinates instead of demo constants', async () => {
    const { demoService } = await import('./service');
    render(
      <Hurricane
        service={{
          ...demoService,
          detect: async () => ({
            status: 'found',
            eye: { x: 0.8, y: 0.2 },
            position: { latitude: -12, longitude: 130 },
          }),
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Detect eye' }));
    });
    expect(screen.getByRole('heading', { name: '12.00° S' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '130.00° E' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add to track' }));
    expect(readObservations()[0]).toMatchObject({ latitude: -12, longitude: 130 });
  });

  it('does not save a located eye when geographic coordinates are unavailable', async () => {
    const { demoService } = await import('./service');
    render(
      <Hurricane
        service={{
          ...demoService,
          detect: async () => ({ status: 'found', eye: { x: 0.5, y: 0.5 }, position: null }),
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Detect eye' }));
    });
    expect(screen.getByRole('button', { name: 'Add to track' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Geographic coordinates are unavailable');
  });

  it('ignores a late response after cancellation and allows retry', async () => {
    const { demoService } = await import('./service');
    let resolve!: (value: import('./service').DetectionResult) => void;
    render(
      <Hurricane
        service={{
          ...demoService,
          detect: () =>
            new Promise((r) => {
              resolve = r;
            }),
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Detect eye' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await act(async () =>
      resolve({
        status: 'found',
        eye: { x: 0.5, y: 0.5 },
        position: { latitude: 1, longitude: 2 },
      }),
    );
    expect(screen.getByRole('button', { name: 'Add to track' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Detect eye' })).toBeEnabled();
  });
});

describe('Uploads and recovery', () => {
  function mockImages() {
    const images: {
      onload: () => void;
      onerror: () => void;
      naturalWidth: number;
      naturalHeight: number;
      src: string;
    }[] = [];
    vi.stubGlobal(
      'Image',
      class {
        onload = () => {};
        onerror = () => {};
        naturalWidth = 320;
        naturalHeight = 200;
        src = '';
        constructor() {
          images.push(this);
        }
      },
    );
    const create = vi.fn().mockImplementation(() => `blob:image-${images.length}`);
    const revoke = vi.fn();
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }),
    );
    return { images, create, revoke };
  }
  const upload = (file = new File(['image'], 'crop.png', { type: 'image/png' })) => {
    fireEvent.change(screen.getByLabelText('Upload hurricane image'), {
      target: { files: [file] },
    });
    return file;
  };

  it('uploads a regional image with original dimensions and releases resources on replacement and unmount', async () => {
    const { demoService } = await import('./service');
    const { images, revoke } = mockImages();
    const detect = vi.fn().mockResolvedValue({ status: 'not_found' });
    const { unmount } = render(<Hurricane service={{ ...demoService, mode: 'backend', detect }} />);
    expect(screen.queryByText('Try an example')).not.toBeInTheDocument();
    const input = screen.getByLabelText('Upload hurricane image');
    const click = vi.spyOn(input, 'click');
    screen.getAllByRole('button', { name: 'Choose image' }).forEach((b) => fireEvent.click(b));
    expect(click).toHaveBeenCalledTimes(2);
    fireEvent.change(input, { target: { files: [] } });
    const file = upload();
    act(() => images[0].onload());
    expect(screen.getByRole('img', { name: 'Hurricane source image' })).toHaveAttribute(
      'viewBox',
      '0 0 320 200',
    );
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Detect eye' })));
    expect(detect).toHaveBeenCalledWith(
      expect.objectContaining({ file, width: 320, height: 200 }),
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('status')).toHaveTextContent('No eye found');
    fireEvent.click(screen.getByRole('button', { name: 'Replace image' }));
    upload();
    act(() => images[1].onload());
    expect(revoke).toHaveBeenCalledWith('blob:image-0');
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:image-1');
  });

  it('ignores stale image loads and errors, and reports a corrupt current image', () => {
    const { images, revoke } = mockImages();
    render(<Hurricane />);
    upload();
    upload();
    act(() => images[0].onload());
    expect(revoke).toHaveBeenCalledWith('blob:image-0');
    act(() => images[0].onerror());
    expect(screen.queryByRole('alert')).toBeNull();
    act(() => images[1].onerror());
    expect(screen.getByRole('alert')).toHaveTextContent('could not be opened');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('alert')).toBeNull();
    upload();
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
    act(() => images[2].onload());
    expect(screen.getByText('Example hurricane map')).toBeInTheDocument();
  });

  it('rejects oversized images before allocating a preview', () => {
    const { create } = mockImages();
    render(<Hurricane />);
    const file = new File(['x'], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 + 1 });
    upload(file);
    expect(screen.getByRole('alert')).toHaveTextContent('15 MB');
    expect(create).not.toHaveBeenCalled();
  });

  it.each([new Error('Offline'), 'unknown'])(
    'allows retry after detection failure %#',
    async (error) => {
      const { demoService } = await import('./service');
      render(<Hurricane service={{ ...demoService, detect: vi.fn().mockRejectedValue(error) }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Detect eye' })));
      expect(screen.getByRole('alert')).toHaveTextContent(
        error instanceof Error ? 'Offline' : 'Detection failed',
      );
      expect(screen.getByRole('button', { name: 'Detect eye' })).toBeEnabled();
    },
  );

  it('ignores detection rejection after cancellation', async () => {
    const { demoService } = await import('./service');
    let reject!: (error: Error) => void;
    render(
      <Hurricane
        service={{
          ...demoService,
          detect: () =>
            new Promise((_, r) => {
              reject = r;
            }),
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Detect eye' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await act(async () => reject(new Error('Cancelled')));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Tracking, prediction and exports', () => {
  const stage = (name = 'Hurricane track') => fireEvent.click(screen.getByRole('tab', { name }));
  const load = () => fireEvent.click(screen.getByRole('button', { name: 'Load sample track' }));

  it('builds once, reuses the returned track for prediction and shows graphic-only results', async () => {
    const { demoService } = await import('./service');
    const track = {
      points: [
        { latitude: 1, longitude: 2 },
        { latitude: 3, longitude: 4 },
      ],
    };
    const buildTrack = vi.fn().mockResolvedValue(track);
    const predict = vi.fn().mockResolvedValue({
      points: [],
      graphicUrl: 'https://example.org/map.png',
      assumptions: ['Constant speed'],
    });
    render(<Hurricane service={{ ...demoService, buildTrack, predict }} />);
    stage();
    load();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Build track' })));
    expect(screen.getByRole('status')).toHaveTextContent('Track ready');
    fireEvent.click(screen.getByRole('button', { name: 'Continue to prediction' }));
    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'Use these positions' } });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Generate prediction' })),
    );
    expect(buildTrack).toHaveBeenCalledTimes(1);
    expect(predict).toHaveBeenCalledWith(track, 'Use these positions', expect.any(AbortSignal));
    expect(screen.getByText('Constant speed')).toBeInTheDocument();
    fireEvent.error(screen.getByAltText('Generated hurricane prediction'));
    expect(screen.getByRole('alert')).toHaveTextContent('graphic could not be loaded');
    stage();
    fireEvent.click(screen.getByRole('button', { name: 'Clear observations' }));
    expect(readObservations()).toEqual([]);
    expect(screen.getByRole('button', { name: 'Build track' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Add observation' }));
    expect(screen.getByText('Add a hurricane image')).toBeInTheDocument();
  });

  it.each([new Error('Offline'), 'unknown'])('recovers from path failure %#', async (error) => {
    const { demoService } = await import('./service');
    render(
      <Hurricane service={{ ...demoService, buildTrack: vi.fn().mockRejectedValue(error) }} />,
    );
    stage();
    load();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Build track' })));
    expect(screen.getByRole('alert')).toHaveTextContent(
      error instanceof Error ? 'Offline' : 'Path generation failed',
    );
    expect(screen.getByRole('button', { name: 'Build track' })).toBeEnabled();
  });

  it.each(['cancel', 'edit', 'remove', 'reject'])(
    'discards stale prediction after %s',
    async (action) => {
      const { demoService } = await import('./service');
      let resolve!: (value: import('./service').PredictionResult) => void;
      let reject!: (error: Error) => void;
      let signal!: AbortSignal;
      render(
        <Hurricane
          service={{
            ...demoService,
            buildTrack: async () => ({ points: SAMPLE_OBSERVATIONS }),
            predict: (_t, _p, s) => {
              signal = s;
              return new Promise((a, b) => {
                resolve = a;
                reject = b;
              });
            },
          }}
        />,
      );
      stage('AI prediction');
      load();
      await act(async () =>
        fireEvent.click(screen.getByRole('button', { name: 'Generate prediction' })),
      );
      if (action === 'edit')
        fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'New prompt' } });
      else if (action === 'remove')
        fireEvent.click(screen.getByRole('button', { name: 'Remove observation 1' }));
      else fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(signal.aborted).toBe(true);
      await act(async () => {
        if (action === 'reject') reject(new Error('Cancelled'));
        else resolve({ points: [{ latitude: 1, longitude: 1 }] });
      });
      expect(screen.queryByTestId('predicted-path')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByRole('button', { name: 'Generate prediction' })).toBeEnabled();
    },
  );

  it('does not start prediction when track generation is cancelled', async () => {
    const { demoService } = await import('./service');
    let resolve!: (value: import('./service').TrackResult) => void;
    const predict = vi.fn();
    render(
      <Hurricane
        service={{
          ...demoService,
          buildTrack: () =>
            new Promise((r) => {
              resolve = r;
            }),
          predict,
        }}
      />,
    );
    stage('AI prediction');
    load();
    fireEvent.click(screen.getByRole('button', { name: 'Generate prediction' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await act(async () => resolve({ points: SAMPLE_OBSERVATIONS }));
    expect(predict).not.toHaveBeenCalled();
  });

  it('reports storage failure while retaining observations for export', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Full');
    });
    render(<Hurricane />);
    stage();
    load();
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    expect(screen.getAllByRole('button', { name: /Remove observation/ })).toHaveLength(4);
  });

  it('exports CSV, a standalone SVG and the edited prompt, releasing download URLs', async () => {
    vi.useFakeTimers();
    const blobs: Blob[] = [],
      links: HTMLAnchorElement[] = [];
    const create = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return `blob:export-${blobs.length}`;
    });
    const revoke = vi.fn();
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }),
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      links.push(this);
    });
    render(<Hurricane />);
    stage();
    load();
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export map' }));
    stage('AI prediction');
    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'Custom prompt' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export prompt' }));
    expect(links.map((l) => l.download)).toEqual([
      'hurricane-observations.csv',
      'hurricane-track.svg',
      'hurricane-prompt.txt',
    ]);
    expect(blobs.map((b) => b.type)).toEqual(['text/csv', 'image/svg+xml', 'text/plain']);
    expect(blobs.every((b) => b.size > 0)).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(revoke).toHaveBeenCalledTimes(3);
    click.mockRestore();
  });
});

describe('Restoring observations', () => {
  it('loads only observations belonging to the current service mode', async () => {
    const { demoService } = await import('./service');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        ...SAMPLE_OBSERVATIONS,
        { ...SAMPLE_OBSERVATIONS[0], id: 'backend', method: 'backend', source: 'Detected image' },
        { ...SAMPLE_OBSERVATIONS[1], id: 'demo', method: 'demo' },
      ]),
    );
    const { unmount } = render(<Hurricane service={{ ...demoService, mode: 'backend' }} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Hurricane track' }));
    expect(screen.getAllByRole('button', { name: /Remove observation/ })).toHaveLength(1);
    expect(screen.getByText('Detected image')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load sample track' })).toBeNull();
    unmount();
    render(<Hurricane />);
    fireEvent.click(screen.getByRole('tab', { name: 'Hurricane track' }));
    expect(screen.getAllByRole('button', { name: /Remove observation/ })).toHaveLength(5);
    expect(screen.queryByText('Detected image')).toBeNull();
  });
});
