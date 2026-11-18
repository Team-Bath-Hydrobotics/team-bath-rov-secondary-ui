import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// JSZip is mocked so the tests can assert exactly what is zipped and control
// when (and whether) zip generation finishes.
const { JSZipMock, fileMock, generateAsyncMock } = vi.hoisted(() => {
  const fileMock = vi.fn<(name: string, data: Blob) => void>();
  const generateAsyncMock = vi.fn<(options: { type: string }) => Promise<Blob>>();
  // A regular function (not an arrow) so the mock can be called with `new`.
  const JSZipMock = vi.fn(function () {
    return { file: fileMock, generateAsync: generateAsyncMock };
  });
  return { JSZipMock, fileMock, generateAsyncMock };
});

vi.mock('jszip', () => ({ default: JSZipMock }));

import { useCanvasRecorder } from './useCanvasRecorder';

const CAMERA_NAME = 'Front Camera';
const OBJECT_URL = 'blob:mock-zip';
const zipBlob = new Blob(['zip'], { type: 'application/zip' });

// jsdom has no canvas backend, so toBlob is replaced with a mock that hands
// back a new "frame" on every call (or null to simulate a failed capture).
const makeCanvas = (options: { failCapture?: boolean } = {}) => {
  const frames: Blob[] = [];
  const canvas = document.createElement('canvas');
  const toBlob = vi.fn<HTMLCanvasElement['toBlob']>((callback) => {
    if (options.failCapture) {
      callback(null);
      return;
    }
    const frame = new Blob([`frame-${frames.length + 1}`], { type: 'image/jpeg' });
    frames.push(frame);
    callback(frame);
  });
  canvas.toBlob = toBlob;
  return { canvas, toBlob, frames };
};

interface Download {
  href: string;
  filename: string;
  attachedToDocument: boolean;
}

describe('useCanvasRecorder', () => {
  const createObjectURLMock = vi.fn<typeof URL.createObjectURL>(() => OBJECT_URL);
  const revokeObjectURLMock = vi.fn<typeof URL.revokeObjectURL>();
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let downloads: Download[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T12:34:56.789Z'));

    JSZipMock.mockClear();
    fileMock.mockReset();
    generateAsyncMock.mockReset();
    generateAsyncMock.mockResolvedValue(zipBlob);

    // jsdom does not implement object URLs.
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;

    // Record each triggered download instead of letting jsdom try to navigate.
    downloads = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push({
        href: this.href,
        filename: this.download,
        attachedToDocument: this.isConnected,
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.useRealTimers();
  });

  it('is not processing initially', () => {
    const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));

    expect(result.current.isProcessing).toBe(false);
  });

  it('keeps the same callbacks across rerenders', () => {
    const { result, rerender } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
    const first = result.current;

    rerender();

    expect(result.current.startRecording).toBe(first.startRecording);
    expect(result.current.stopRecording).toBe(first.stopRecording);
  });

  describe('startRecording', () => {
    it('captures the first frame immediately as a JPEG at 0.95 quality', () => {
      const { canvas, toBlob } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));

      act(() => {
        result.current.startRecording(canvas);
      });

      expect(toBlob).toHaveBeenCalledTimes(1);
      expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.95);
    });

    it('captures another frame every 2 seconds by default', () => {
      const { canvas, toBlob } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));

      act(() => {
        result.current.startRecording(canvas);
      });

      vi.advanceTimersByTime(1999);
      expect(toBlob).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      expect(toBlob).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(4000);
      expect(toBlob).toHaveBeenCalledTimes(4);
    });

    it('uses the frameIntervalMs option', () => {
      const { canvas, toBlob } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME, { frameIntervalMs: 500 }));

      act(() => {
        result.current.startRecording(canvas);
      });
      vi.advanceTimersByTime(1500);

      expect(toBlob).toHaveBeenCalledTimes(4);
    });

    it('uses the jpegQuality option', () => {
      const { canvas, toBlob } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME, { jpegQuality: 0.5 }));

      act(() => {
        result.current.startRecording(canvas);
      });

      expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.5);
    });

    it('keeps the earlier interval running when called twice without stopping', () => {
      // Current behaviour: the first interval is overwritten without being
      // cleared, so frames are captured at double rate and one timer is leaked.
      const { canvas, toBlob } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));

      act(() => {
        result.current.startRecording(canvas);
        result.current.startRecording(canvas);
      });
      expect(toBlob).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(2000);

      expect(toBlob).toHaveBeenCalledTimes(4);
      expect(vi.getTimerCount()).toBe(2);
    });
  });

  describe('stopRecording', () => {
    it('stops capturing frames', async () => {
      const { canvas, toBlob } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });

      await act(async () => {
        await result.current.stopRecording();
      });
      toBlob.mockClear();
      vi.advanceTimersByTime(10_000);

      expect(toBlob).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('does nothing when no recording was started', async () => {
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(JSZipMock).not.toHaveBeenCalled();
      expect(downloads).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
    });

    it('does not create a zip when no frame could be captured', async () => {
      const { canvas } = makeCanvas({ failCapture: true });
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });
      vi.advanceTimersByTime(4000);

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(JSZipMock).not.toHaveBeenCalled();
      expect(downloads).toEqual([]);
    });

    it('zips the captured frames in order with zero-padded names', async () => {
      const { canvas, frames } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });
      vi.advanceTimersByTime(4000);

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(frames).toHaveLength(3);
      expect(JSZipMock).toHaveBeenCalledTimes(1);
      expect(fileMock.mock.calls).toEqual([
        ['frame_0001.jpg', frames[0]],
        ['frame_0002.jpg', frames[1]],
        ['frame_0003.jpg', frames[2]],
      ]);
      expect(generateAsyncMock).toHaveBeenCalledWith({ type: 'blob' });
    });

    it('downloads the zip named after the camera and the current time', async () => {
      const { canvas } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(createObjectURLMock).toHaveBeenCalledWith(zipBlob);
      expect(downloads).toEqual([
        {
          href: OBJECT_URL,
          // ISO timestamp with ':' and '.' replaced so it is a valid filename
          filename: 'Front Camera_2026-11-10T12-34-56-789Z.zip',
          attachedToDocument: true,
        },
      ]);
    });

    it('cleans up the temporary link and object URL after downloading', async () => {
      const { canvas } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(document.querySelector('a')).toBeNull();
      expect(revokeObjectURLMock).toHaveBeenCalledWith(OBJECT_URL);
    });

    it('reports isProcessing while the zip is being generated', async () => {
      let finishZip: (blob: Blob) => void = () => {};
      generateAsyncMock.mockReturnValue(
        new Promise<Blob>((resolve) => {
          finishZip = resolve;
        }),
      );
      const { canvas } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });

      let stopping: Promise<void> = Promise.resolve();
      act(() => {
        stopping = result.current.stopRecording();
      });

      expect(result.current.isProcessing).toBe(true);
      expect(downloads).toEqual([]);

      await act(async () => {
        finishZip(zipBlob);
        await stopping;
      });

      expect(result.current.isProcessing).toBe(false);
      expect(downloads).toHaveLength(1);
    });

    it('rejects and stops processing when zip generation fails', async () => {
      const error = new Error('zip failed');
      generateAsyncMock.mockRejectedValue(error);
      const { canvas } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });

      let caught: unknown;
      await act(async () => {
        caught = await result.current.stopRecording().catch((e: unknown) => e);
      });

      expect(caught).toBe(error);
      expect(result.current.isProcessing).toBe(false);
      expect(downloads).toEqual([]);
    });

    it('discards the frames of a recording whose zip generation failed', async () => {
      generateAsyncMock.mockRejectedValueOnce(new Error('zip failed'));
      const { canvas } = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(canvas);
      });
      await act(async () => {
        await result.current.stopRecording().catch(() => {});
      });
      fileMock.mockClear();

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(fileMock).not.toHaveBeenCalled();
      expect(downloads).toEqual([]);
    });

    it('starts a later recording again from frame_0001', async () => {
      const first = makeCanvas();
      const second = makeCanvas();
      const { result } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
      act(() => {
        result.current.startRecording(first.canvas);
      });
      vi.advanceTimersByTime(2000);
      await act(async () => {
        await result.current.stopRecording();
      });
      fileMock.mockClear();

      act(() => {
        result.current.startRecording(second.canvas);
      });
      await act(async () => {
        await result.current.stopRecording();
      });

      expect(fileMock.mock.calls).toEqual([['frame_0001.jpg', second.frames[0]]]);
      expect(downloads).toHaveLength(2);
    });
  });

  it('stops capturing when the component unmounts', () => {
    const { canvas, toBlob } = makeCanvas();
    const { result, unmount } = renderHook(() => useCanvasRecorder(CAMERA_NAME));
    act(() => {
      result.current.startRecording(canvas);
    });

    unmount();
    toBlob.mockClear();
    vi.advanceTimersByTime(10_000);

    expect(toBlob).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
